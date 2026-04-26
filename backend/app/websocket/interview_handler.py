"""
WebSocket event handlers for real-time interview sessions
"""
import socketio
import tempfile
import os
import base64
import asyncio
from typing import Optional
from sqlalchemy.orm import Session
from sqlalchemy.exc import SQLAlchemyError
from app.logging_config import logger

from app.database import get_db, SessionLocal
from app.models.interview import Interview
from app.models.question import Question
from app.models.answer import Answer
from app.models.resume import Resume
from app.services.text_to_speech import text_to_speech_service
from app.services.speech_to_text import speech_to_text_service
from app.services.storage_service import StorageService
from app.services.evaluation_service import evaluate_answer, calculate_overall_score, analyze_speaking_patterns
from app.services.followup_service import should_ask_followup
from app.websocket.session_manager import session_manager
from app.config import settings
from app.clerk_client import verify_clerk_token

cors_origins = settings.ALLOWED_ORIGINS.split(',') if settings.ALLOWED_ORIGINS else []

sio = socketio.AsyncServer(
    async_mode='asgi',
    cors_allowed_origins=cors_origins if cors_origins else '*',
    logger=settings.DEBUG,
    engineio_logger=settings.DEBUG,
    ping_timeout=60,
    ping_interval=25,
    max_http_buffer_size=10 * 1024 * 1024,  # 10MB
    cors_credentials=True,
    compression_threshold=1024,
)


async def precompute_followup(sid: str, question_id: int, transcript: str, question_text: str, question_context: dict):
    """
    Background task: run follow-up analysis during transcript review so the
    result is ready (or nearly ready) by the time the user clicks Confirm.
    """
    try:
        session = session_manager.get_session(sid)
        if not session:
            return
        # Skip if we've already hit the follow-up limit for this question
        if session.followup_counts.get(question_id, 0) >= 1:
            return
        # Skip if a follow-up is already pending (e.g. answering a follow-up)
        if session.pending_followup:
            return

        needs_followup, followup_data = await should_ask_followup(
            question_text=question_text,
            answer_transcript=transcript,
            question_context=question_context
        )

        # Re-fetch session — state may have changed while we were awaiting
        session = session_manager.get_session(sid)
        if not session:
            return

        session.precomputed_followup = {
            'question_id': question_id,
            'needs_followup': needs_followup,
            'followup_data': followup_data,
        }
        session_manager.update_session(sid, session)
        logger.info(f"Pre-computed follow-up for question {question_id}: needs={needs_followup}")
    except Exception as e:
        logger.warning(f"precompute_followup failed (non-critical): {e}")


async def validate_token(token: str) -> Optional[dict]:
    """
    Validate JWT token with Clerk

    Returns:
        User data dict if valid, None otherwise
    """
    try:
        decoded = await verify_clerk_token(token)

        if decoded and decoded.get('sub'):
            return {
                'id': decoded.get('sub'),
                'email': decoded.get('email', decoded.get('primary_email_address', ''))
            }
        return None
    except Exception as e:
        logger.error(f"Token validation error: {e}")
        return None


def generate_welcome_message(interview: Interview) -> str:
    """Generate a personalized welcome message based on interview type and data"""
    interview_type = interview.interview_type

    if interview_type == "company_prep" and interview.target_company:
        company = interview.target_company
        job_title = interview.jd_analysis.get('job_title', 'this position') if interview.jd_analysis else 'this position'
        return f"Welcome! Today we'll be preparing you for your interview at {company} for the {job_title} role. I'm going to ask you questions that are commonly asked at {company} to help you get ready for the real thing. Let's get started when you're ready."

    elif interview_type == "resume_grill":
        return "Welcome to the Resume Grill! I've carefully reviewed your resume, and I'm going to ask you some in-depth questions about your experience, projects, and skills. This is designed to help you articulate your background clearly and confidently. Are you ready to begin?"

    elif interview_type == "standard" and interview.jd_analysis:
        job_title = interview.jd_analysis.get('job_title', 'this position')
        company = interview.jd_analysis.get('company_name', '')

        if company:
            return f"Welcome! Today we'll be conducting a mock interview for the {job_title} position at {company}. I'll be asking you questions based on the job requirements and your resume. Take your time with each answer, and remember - this is practice, so don't worry about being perfect. Let's begin when you're ready."
        else:
            return f"Welcome! Today we'll be conducting a mock interview for the {job_title} position. I'll be asking you questions based on the job requirements and your resume. Take your time with each answer, and remember - this is practice, so don't worry about being perfect. Let's begin when you're ready."

    else:
        return "Welcome to your mock interview! I'll be asking you a series of questions to help you practice your interview skills. Take your time with each answer, and don't hesitate to think before you respond. Let's get started when you're ready."


@sio.event
async def connect(sid, environ, auth):
    """Handle client connection with authentication"""
    logger.info(f"Client attempting to connect: {sid}")

    # Validate authentication token
    if not auth or 'token' not in auth:
        logger.warning(f"Connection rejected for {sid}: No authentication token")
        return False

    token = auth['token']
    user_data = await validate_token(token)

    if not user_data:
        logger.warning(f"Connection rejected for {sid}: Invalid token")
        return False

    logger.info(f"Authenticated connection from {sid} (user: {user_data['email']})")
    await sio.emit('connected', {'sid': sid}, room=sid)
    return True


@sio.event
async def disconnect(sid):
    """Handle client disconnection"""
    logger.info(f"Client disconnected: {sid}")

    session = session_manager.get_session(sid)
    if session:
        session_manager.delete_session(sid)


@sio.event
async def start_interview(sid, data):
    """
    Start an interview session

    Expected data:
    {
        "interview_id": int,
        "user_id": str
    }
    """
    db: Session = SessionLocal()
    try:
        interview_id = data.get('interview_id')
        user_id = data.get('user_id')

        if not interview_id or not user_id:
            await sio.emit('error', {
                'message': 'Missing interview_id or user_id'
            }, room=sid)
            return

        # Check if session already exists (reconnection scenario)
        existing_session = session_manager.get_session(sid)
        if existing_session and existing_session.interview_id == interview_id:
            logger.info(f"Resuming existing session for {sid}, interview {interview_id}")
            # Resume from existing session
            questions = db.query(Question).filter(
                Question.interview_id == interview_id
            ).order_by(Question.order_number).all()

            if not questions:
                await sio.emit('error', {
                    'message': 'No questions found for this interview'
                }, room=sid)
                return

            current_index = existing_session.current_question_index
            if current_index < len(questions):
                current_question = questions[current_index]
                await sio.emit('interview_started', {
                    'interview_id': interview_id,
                    'total_questions': len(questions),
                    'current_question_index': current_index
                }, room=sid)
                await send_question(sid, current_question, current_index, len(questions))
            else:
                await sio.emit('interview_completed', {
                    'interview_id': interview_id,
                    'message': 'Interview already completed!'
                }, room=sid)
            return

        session = session_manager.create_session(sid, interview_id, user_id)

        interview = db.query(Interview).filter(Interview.id == interview_id).first()

        if not interview:
            await sio.emit('error', {
                'message': 'Interview not found'
            }, room=sid)
            session_manager.delete_session(sid)
            return

        questions = db.query(Question).filter(
            Question.interview_id == interview_id
        ).order_by(Question.order_number).all()

        if not questions:
            await sio.emit('error', {
                'message': 'No questions found for this interview'
            }, room=sid)
            session_manager.delete_session(sid)
            return

        first_question = questions[0]

        interview.status = "in_progress"
        db.commit()

        await sio.emit('interview_started', {
            'interview_id': interview_id,
            'total_questions': len(questions),
            'current_question_index': 0
        }, room=sid)

        # Generate personalized welcome message
        welcome_text = generate_welcome_message(interview)

        await sio.emit('welcome_message', {
            'message': welcome_text
        }, room=sid)

        # Generate TTS for welcome message
        try:
            welcome_audio_bytes = await text_to_speech_service.generate_speech(
                text=welcome_text,
                voice="professional_female"
            )
            welcome_audio_b64 = base64.b64encode(welcome_audio_bytes).decode('utf-8')

            await sio.emit('welcome_audio', {
                'audio_data': welcome_audio_b64,
                'format': 'mp3'
            }, room=sid)
        except Exception as tts_error:
            logger.warning(f"TTS failed for welcome message: {tts_error}")

    except SQLAlchemyError as e:
        logger.error(f"Database error starting interview: {e}")
        db.rollback()
        await sio.emit('error', {
            'message': 'Database error starting interview. Please try again.'
        }, room=sid)
    except Exception as e:
        logger.error(f"Error starting interview: {e}")
        await sio.emit('error', {
            'message': f'Error starting interview: {str(e)}'
        }, room=sid)
    finally:
        db.close()


async def send_question(sid, question: Question, question_index: int, total_questions: int):
    """Send question to client with audio (with TTS fallback)"""
    try:
        # Store question text/context in session for follow-up pre-computation
        session = session_manager.get_session(sid)
        if session:
            session.current_question_text = question.question_text
            session.current_question_context = question.question_context or {}
            session.precomputed_followup = None  # Clear any stale pre-computed result
            session_manager.update_session(sid, session)

        # Always send the question text first
        await sio.emit('question', {
            'question_id': question.id,
            'question_text': question.question_text,
            'question_number': question_index + 1,
            'total_questions': total_questions,
            'context': question.question_context
        }, room=sid)

        # Try to generate audio, but continue if it fails
        try:
            audio_bytes = await text_to_speech_service.generate_speech(
                text=question.question_text,
                voice="professional_female"
            )

            audio_b64 = base64.b64encode(audio_bytes).decode('utf-8')

            await sio.emit('question_audio', {
                'audio_data': audio_b64,
                'format': 'mp3'
            }, room=sid)
        except Exception as tts_error:
            # Log TTS error but don't fail the entire question delivery
            logger.warning(f"TTS failed for question {question.id}, continuing with text only: {tts_error}")
            await sio.emit('tts_unavailable', {
                'message': 'Audio generation unavailable, please read the question'
            }, room=sid)

    except Exception as e:
        logger.error(f"Error sending question: {e}")
        await sio.emit('error', {
            'message': f'Error sending question: {str(e)}'
        }, room=sid)


@sio.event
async def begin_questions(sid, data):
    """
    User is ready to begin answering questions after welcome message

    Expected data:
    {
        "interview_id": int
    }
    """
    db: Session = SessionLocal()
    try:
        interview_id = data.get('interview_id')

        session = session_manager.get_session(sid)
        if not session:
            await sio.emit('error', {
                'message': 'Session not found'
            }, room=sid)
            return

        questions = db.query(Question).filter(
            Question.interview_id == interview_id
        ).order_by(Question.order_number).all()

        if not questions:
            await sio.emit('error', {
                'message': 'No questions found for this interview'
            }, room=sid)
            return

        first_question = questions[0]
        await send_question(sid, first_question, 0, len(questions))

    except SQLAlchemyError as e:
        logger.error(f"Database error beginning questions: {e}")
        db.rollback()
        await sio.emit('error', {
            'message': 'Database error. Please try again.'
        }, room=sid)
    except Exception as e:
        logger.error(f"Error beginning questions: {e}")
        await sio.emit('error', {
            'message': f'Error beginning questions: {str(e)}'
        }, room=sid)
    finally:
        db.close()


@sio.event
async def submit_answer(sid, data):
    """
    Handle answer submission

    Expected data:
    {
        "question_id": int,
        "audio_data": str (base64 encoded),
        "format": str (e.g., "webm", "wav")
    }
    """
    try:
        question_id = data.get('question_id')
        audio_data_b64 = data.get('audio_data')
        audio_format = data.get('format', 'webm')

        if not question_id or not audio_data_b64:
            await sio.emit('error', {
                'message': 'Missing question_id or audio_data'
            }, room=sid)
            return

        # Decode base64 audio
        try:
            audio_bytes = base64.b64decode(audio_data_b64)
        except Exception as decode_error:
            logger.error(f"Base64 decode error: {decode_error}")
            await sio.emit('error', {
                'message': 'Invalid audio data format. Please try recording again.'
            }, room=sid)
            return

        # Validate audio size
        audio_size_mb = len(audio_bytes) / (1024 * 1024)

        if len(audio_bytes) < 100:
            logger.warning(f"Audio too small: {len(audio_bytes)} bytes")
            await sio.emit('error', {
                'message': 'Audio file too small. Please record again.'
            }, room=sid)
            return

        # Maximum 10MB to prevent memory issues
        max_size_mb = 10
        if audio_size_mb > max_size_mb:
            logger.warning(f"Audio too large: {audio_size_mb:.2f}MB")
            await sio.emit('error', {
                'message': f'Audio file too large ({audio_size_mb:.1f}MB). Please record a shorter answer (max {max_size_mb}MB).'
            }, room=sid)
            return

        logger.info(f"Processing audio: {audio_size_mb:.2f}MB")

        session = session_manager.get_session(sid)
        if not session:
            await sio.emit('error', {
                'message': 'Session not found'
            }, room=sid)
            return

        # Upload audio to Supabase immediately to avoid memory issues
        audio_url = None
        try:
            storage_service = StorageService()
            file_name = f"answers/{session.interview_id}/q{question_id}_{sid}.{audio_format}"
            audio_url = await storage_service.upload_audio(
                audio_bytes=audio_bytes,
                file_name=file_name
            )
            logger.info(f"Uploaded audio to Supabase: {audio_url}")
        except Exception as upload_error:
            logger.warning(f"Failed to upload audio to Supabase: {upload_error}. Continuing without audio storage.")

        with tempfile.NamedTemporaryFile(
            delete=True,
            suffix=f'.{audio_format}'
        ) as temp_file:
            temp_file.write(audio_bytes)
            temp_file.flush()

            await sio.emit('transcribing', {
                'message': 'Transcribing your answer...'
            }, room=sid)

            try:
                # Increase timeout for longer recordings (up to 60 seconds)
                transcription_result = await speech_to_text_service.transcribe_audio(
                    audio_file_path=temp_file.name,
                    language="en",
                    timeout=60
                )
                transcript = transcription_result['text']

                if not transcript or len(transcript.strip()) < 3:
                    logger.warning(f"Empty or very short transcript: '{transcript}'")
                    await sio.emit('error', {
                        'message': 'Could not understand your response. Please speak clearly and try again.'
                    }, room=sid)
                    return

            except Exception as stt_error:
                error_message = str(stt_error)
                logger.error(f"STT error: {error_message}")

                # Provide specific error messages
                if "timeout" in error_message.lower():
                    await sio.emit('error', {
                        'message': 'Transcription took too long. Your recording may be corrupted. Please try again.'
                    }, room=sid)
                elif "rate limit" in error_message.lower() or "quota" in error_message.lower():
                    await sio.emit('error', {
                        'message': 'Service temporarily unavailable. Please try again in a moment.'
                    }, room=sid)
                else:
                    await sio.emit('error', {
                        'message': 'Failed to transcribe audio. Please try recording again.'
                    }, room=sid)
                return

            await sio.emit('transcript_ready', {
                'question_id': question_id,
                'transcript': transcript,
                'duration': transcription_result.get('duration')
            }, room=sid)

            # Pre-compute follow-up analysis in background while user reviews transcript.
            # By the time they confirm, the result is likely ready — eliminating the wait.
            precompute_session = session_manager.get_session(sid)
            if (precompute_session
                    and not precompute_session.pending_followup
                    and precompute_session.followup_counts.get(question_id, 0) < 1
                    and precompute_session.current_question_text):
                asyncio.create_task(precompute_followup(
                    sid=sid,
                    question_id=question_id,
                    transcript=transcript,
                    question_text=precompute_session.current_question_text,
                    question_context=precompute_session.current_question_context,
                ))

            # Store only transcript and audio URL (not the base64 data)
            session_manager.add_answer(sid, question_id, {
                'transcript': transcript,
                'audio_url': audio_url,
                'format': audio_format,
                'duration': transcription_result.get('duration')
            })

    except ValueError as ve:
        logger.error(f"Invalid input for answer submission: {ve}")
        await sio.emit('error', {
            'message': 'Invalid audio data format'
        }, room=sid)
    except Exception as e:
        logger.error(f"Error submitting answer: {e}")
        await sio.emit('error', {
            'message': f'Error processing answer: {str(e)}'
        }, room=sid)


@sio.event
async def confirm_answer(sid, data):
    """
    Confirm answer and move to next question

    Expected data:
    {
        "question_id": int,
        "transcript": str (can be edited by user)
    }
    """
    db: Session = SessionLocal()
    try:
        question_id = data.get('question_id')
        transcript = data.get('transcript')

        session = session_manager.get_session(sid)
        if not session:
            await sio.emit('error', {
                'message': 'Session not found'
            }, room=sid)
            return

        answer_data = None
        for ans in session.answers:
            if ans['question_id'] == question_id:
                answer_data = ans
                break

        if not answer_data:
            await sio.emit('error', {
                'message': 'Answer not found in session'
            }, room=sid)
            return

        current_question = db.query(Question).filter(Question.id == question_id).first()

        if not current_question:
            await sio.emit('error', {
                'message': 'Question not found'
            }, room=sid)
            return

        is_answering_followup = (
            session.pending_followup and
            session.pending_followup.get('parent_question_id') == question_id
        )

        if is_answering_followup:
            existing_answer = db.query(Answer).filter(
                Answer.question_id == question_id
            ).first()

            if existing_answer:
                existing_answer.transcript += f"\n\n[Follow-up: {session.pending_followup.get('followup_data', {}).get('followup_question', 'Additional question')}]\n{transcript}"
                db.commit()
                logger.info(f"Appended follow-up answer to question {question_id}")
            else:
                answer = Answer(
                    question_id=question_id,
                    transcript=transcript,
                    audio_duration_seconds=answer_data.get('duration'),
                    score=None,
                    evaluation=None
                )
                db.add(answer)
                db.commit()
        else:
            answer = Answer(
                question_id=question_id,
                transcript=transcript,
                audio_duration_seconds=answer_data.get('duration'),
                score=None,
                evaluation=None
            )
            db.add(answer)
            db.commit()

        if is_answering_followup:
            logger.info(f"User answered follow-up for question {question_id}, moving to next question")
            session.pending_followup = None
            session_manager.update_session(sid, session)
        else:
            # Check if we already asked a follow-up for this question (max 1 per question)
            if not hasattr(session, 'followup_counts'):
                session.followup_counts = {}

            followup_count = session.followup_counts.get(question_id, 0)
            max_followups = 1

            if followup_count >= max_followups:
                logger.info(f"Max follow-ups ({max_followups}) reached for question {question_id}, moving on")
            else:
                # Signal to frontend immediately so it shows a loading state
                await sio.emit('processing_answer', {}, room=sid)

                # Use pre-computed result if available (computed during transcript review)
                precomputed = getattr(session, 'precomputed_followup', None)
                if precomputed and precomputed.get('question_id') == question_id:
                    needs_followup = precomputed['needs_followup']
                    followup_data = precomputed['followup_data']
                    session.precomputed_followup = None
                    session_manager.update_session(sid, session)
                    logger.info(f"Using pre-computed follow-up result for question {question_id}")
                else:
                    # Pre-computation wasn't ready — run synchronously (user confirmed fast)
                    logger.info(f"Pre-computed result not available for question {question_id}, computing now")
                    needs_followup, followup_data = await should_ask_followup(
                        question_text=current_question.question_text,
                        answer_transcript=transcript,
                        question_context=current_question.question_context or {}
                    )

                if needs_followup and followup_data:
                    followup_text = followup_data.get('followup_question', '')

                    if not followup_text:
                        logger.warning("Follow-up generated but no question text found")
                    else:
                        await sio.emit('followup_question', {
                            'question_id': question_id,
                            'followup_text': followup_text,
                            'reason': followup_data.get('reason', ''),
                            'is_followup': True
                        }, room=sid)

                        # Try to generate TTS, but don't fail if it doesn't work
                        try:
                            followup_audio_bytes = await text_to_speech_service.generate_speech(followup_text)
                            followup_audio_base64 = base64.b64encode(followup_audio_bytes).decode('utf-8')

                            await sio.emit('question_audio', {
                                'question_id': question_id,
                                'audio_data': followup_audio_base64,
                                'is_followup': True
                            }, room=sid)
                        except Exception as tts_error:
                            logger.warning(f"TTS failed for follow-up question: {tts_error}")

                        # Increment follow-up count for this question
                        session.followup_counts[question_id] = followup_count + 1

                        session.pending_followup = {
                            'parent_question_id': question_id,
                            'followup_data': followup_data,
                        }
                        session_manager.update_session(sid, session)
                        return

        session.current_question_index += 1
        session_manager.update_session(sid, session)

        question = db.query(Question).filter(
            Question.interview_id == session.interview_id,
            Question.order_number == session.current_question_index
        ).first()

        if question:
            total_questions = db.query(Question).filter(
                Question.interview_id == session.interview_id
            ).count()

            await send_question(sid, question, session.current_question_index, total_questions)
        else:
            await complete_interview(sid, session, db)

    except SQLAlchemyError as e:
        logger.error(f"Database error confirming answer: {e}")
        db.rollback()
        await sio.emit('error', {
            'message': 'Database error. Please try again.'
        }, room=sid)
    except Exception as e:
        logger.error(f"Error confirming answer: {e}")
        await sio.emit('error', {
            'message': f'Error confirming answer: {str(e)}'
        }, room=sid)
    finally:
        db.close()


async def evaluate_interview_async(interview_id: int, db: Session):
    """Evaluate all answers in an interview (background task)"""
    try:
        import time
        start_time = time.time()
        logger.info(f"[EVALUATION] Starting evaluation for interview {interview_id}")

        interview = db.query(Interview).filter(Interview.id == interview_id).first()
        if not interview:
            logger.info(f"[EVALUATION] Interview {interview_id} not found")
            return

        resume = db.query(Resume).filter(Resume.id == interview.resume_id).first()
        if not resume:
            logger.info(f"[EVALUATION] Resume not found for interview {interview_id}")
            return

        questions = db.query(Question).filter(
            Question.interview_id == interview_id
        ).order_by(Question.order_number).all()

        total_questions = len(questions)
        logger.info(f"[EVALUATION] Found {total_questions} questions to evaluate")

        evaluations = []

        for idx, question in enumerate(questions, 1):
            question_start = time.time()
            answer = db.query(Answer).filter(Answer.question_id == question.id).first()

            if not answer or not answer.transcript:
                logger.info(f"[EVALUATION] No answer found for question {question.id} ({idx}/{total_questions})")
                continue

            logger.info(f"[EVALUATION] Evaluating question {idx}/{total_questions} (ID: {question.id})...")

            evaluation = await evaluate_answer(
                question_text=question.question_text,
                question_context=question.question_context or {},
                answer_transcript=answer.transcript,
                resume_data=resume.parsed_data or {},
                jd_analysis=interview.jd_analysis or {}
            )

            # Analyze speaking patterns
            speaking_analysis = analyze_speaking_patterns(
                transcript=answer.transcript,
                audio_duration_seconds=answer.audio_duration_seconds
            )
            evaluation['speaking_analysis'] = speaking_analysis

            answer.evaluation = evaluation
            answer.score = evaluation.get('score', 0)
            evaluations.append(evaluation)

            elapsed = time.time() - question_start
            logger.info(f"[EVALUATION] Question {idx}/{total_questions} evaluated in {elapsed:.2f}s - Score: {answer.score}")

        logger.info(f"[EVALUATION] Calculating overall score...")
        overall_score = await calculate_overall_score(evaluations)
        interview.overall_score = overall_score

        db.commit()

        total_elapsed = time.time() - start_time
        logger.info(f"[EVALUATION] ✓ Evaluation completed for interview {interview_id}")
        logger.info(f"[EVALUATION] Overall Score: {overall_score}/10")
        logger.info(f"[EVALUATION] Total time: {total_elapsed:.2f}s ({len(evaluations)} questions)")

    except Exception as e:
        logger.info(f"[EVALUATION] ✗ Error evaluating interview {interview_id}: {e}")
        import traceback
        traceback.print_exc()
        db.rollback()


async def complete_interview(sid, session, db: Session):
    """Complete the interview"""
    try:
        interview = db.query(Interview).filter(
            Interview.id == session.interview_id
        ).first()

        if interview:
            from datetime import datetime, timezone
            interview.status = "completed"
            interview.completed_at = datetime.now(timezone.utc)
            db.commit()

        session_manager.complete_session(sid)

        await sio.emit('interview_completed', {
            'interview_id': session.interview_id,
            'message': 'Interview completed! Evaluating your responses...'
        }, room=sid)

        import asyncio
        from app.database import SessionLocal

        async def run_evaluation():
            """Run evaluation with its own database session"""
            eval_db = SessionLocal()
            try:
                await evaluate_interview_async(session.interview_id, eval_db)
            finally:
                eval_db.close()

        asyncio.create_task(run_evaluation())

    except Exception as e:
        logger.error(f"Error completing interview: {e}")
        await sio.emit('error', {
            'message': f'Error completing interview: {str(e)}'
        }, room=sid)


@sio.event
async def skip_question(sid, data):
    """
    Skip current question without answering

    Expected data:
    {
        "question_id": int
    }
    """
    db: Session = SessionLocal()
    try:
        question_id = data.get('question_id')

        session = session_manager.get_session(sid)
        if not session:
            await sio.emit('error', {
                'message': 'Session not found'
            }, room=sid)
            return

        logger.info(f"User skipped question {question_id}")

        # Clear any pending follow-up for this question
        if session.pending_followup:
            session.pending_followup = None
            session_manager.update_session(sid, session)

        # Move to next question
        session.current_question_index += 1
        session_manager.update_session(sid, session)

        question = db.query(Question).filter(
            Question.interview_id == session.interview_id,
            Question.order_number == session.current_question_index
        ).first()

        if question:
            total_questions = db.query(Question).filter(
                Question.interview_id == session.interview_id
            ).count()

            await send_question(sid, question, session.current_question_index, total_questions)
        else:
            await complete_interview(sid, session, db)

    except SQLAlchemyError as e:
        logger.error(f"Database error skipping question: {e}")
        db.rollback()
        await sio.emit('error', {
            'message': 'Database error. Please try again.'
        }, room=sid)
    except Exception as e:
        logger.error(f"Error skipping question: {e}")
        await sio.emit('error', {
            'message': f'Error skipping question: {str(e)}'
        }, room=sid)
    finally:
        db.close()


@sio.event
async def end_interview(sid, data=None):
    """End interview early"""
    db: Session = SessionLocal()
    try:
        session = session_manager.get_session(sid)
        if session:
            await complete_interview(sid, session, db)
    except SQLAlchemyError as e:
        logger.error(f"Database error ending interview: {e}")
        db.rollback()
    except Exception as e:
        logger.error(f"Error ending interview: {e}")
    finally:
        db.close()
