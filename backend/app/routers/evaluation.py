"""
Evaluation endpoints for interview answers
"""
from fastapi import APIRouter, HTTPException, Depends, status, BackgroundTasks, Request
from sqlalchemy.orm import Session
from slowapi import Limiter
from slowapi.util import get_remote_address

from app.database import get_db
from app.dependencies import get_current_user
from app.models.interview import Interview
from app.models.question import Question
from app.models.answer import Answer
from app.models.resume import Resume
from app.services.evaluation_service import (
    evaluate_answer,
    calculate_overall_score,
    generate_interview_insights,
    analyze_speaking_patterns,
    aggregate_skill_performance
)
from app.services.interview_service import generate_ideal_answer
from app.services.subscription_service import check_premium_feature

router = APIRouter(prefix="/evaluation", tags=["Evaluation"])
limiter = Limiter(key_func=get_remote_address)


async def evaluate_interview_background(interview_id: int, db: Session):
    """Background task to evaluate all answers in an interview"""
    from app.logging_config import logger

    try:
        logger.info(f"Starting evaluation for interview {interview_id}")

        interview = db.query(Interview).filter(Interview.id == interview_id).first()
        if not interview:
            logger.warning(f"Interview {interview_id} not found")
            return

        resume = db.query(Resume).filter(Resume.id == interview.resume_id).first()
        if not resume:
            logger.warning(f"Resume not found for interview {interview_id}")
            return

        # Get all questions for this interview
        questions = db.query(Question).filter(
            Question.interview_id == interview_id
        ).order_by(Question.order_number).all()

        evaluations = []

        # Evaluate each answer
        for question in questions:
            # Get answer for this question
            answer = db.query(Answer).filter(
                Answer.question_id == question.id
            ).first()

            if not answer or not answer.transcript:
                logger.debug(f"No answer found for question {question.id}")
                continue

            logger.debug(f"Evaluating answer for question {question.id}")

            # Evaluate the answer
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

            # Store evaluation in answer
            answer.evaluation = evaluation
            answer.score = evaluation.get('score', 0)

            # Store question category and skill tags for insights
            evaluation['question_category'] = question.question_context.get('category', 'general')
            evaluation['skill_tags'] = question.question_context.get('skill_tags', [])
            evaluations.append(evaluation)

            logger.debug(f"Question {question.id} evaluated with score: {answer.score}")

        # Calculate overall score
        overall_score = await calculate_overall_score(evaluations)
        interview.overall_score = overall_score

        # Generate insights and skill performance
        insights = await generate_interview_insights(evaluations, interview.jd_analysis or {})
        skill_performance = aggregate_skill_performance(evaluations)

        # Commit all changes
        db.commit()

        logger.info(f"Interview {interview_id} evaluation completed. Overall score: {overall_score}")

    except Exception as e:
        logger.error(f"Error in background evaluation: {e}")
        db.rollback()


@router.post("/interviews/{interview_id}/evaluate")
@limiter.limit("3/minute")
async def trigger_evaluation(
    request: Request,
    interview_id: int,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """
    Trigger evaluation for a completed interview
    """
    # Verify interview exists and belongs to user
    interview = db.query(Interview).filter(
        Interview.id == interview_id,
        Interview.user_id == current_user.id
    ).first()

    if not interview:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Interview not found"
        )

    if interview.status != "COMPLETED":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Interview must be completed before evaluation"
        )

    # Add evaluation task to background
    background_tasks.add_task(evaluate_interview_background, interview_id, db)

    return {
        "message": "Evaluation started",
        "interview_id": interview_id
    }


@router.get("/interviews/{interview_id}/results")
async def get_evaluation_results(
    interview_id: int,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """
    Get evaluation results for an interview
    """
    # Verify interview exists and belongs to user
    interview = db.query(Interview).filter(
        Interview.id == interview_id,
        Interview.user_id == current_user.id
    ).first()

    if not interview:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Interview not found"
        )

    # Get all questions with answers
    questions = db.query(Question).filter(
        Question.interview_id == interview_id
    ).order_by(Question.order_number).all()

    results = []
    for question in questions:
        answer = db.query(Answer).filter(
            Answer.question_id == question.id
        ).first()

        if answer:
            results.append({
                "question_id": question.id,
                "question_number": question.order_number + 1,
                "question_text": question.question_text,
                "question_type": question.question_context.get('question_type', 'general'),
                "question_category": question.question_context.get('category', 'general'),
                "difficulty": question.question_context.get('difficulty', 'medium'),
                "skill_tags": question.question_context.get('skill_tags', []),
                "answer_transcript": answer.transcript,
                "score": answer.score,
                "evaluation": answer.evaluation,
                "has_evaluation": answer.evaluation is not None
            })

    # Calculate skill performance if evaluations exist
    skill_performance = None
    evaluated_results = [r for r in results if r['has_evaluation']]
    if evaluated_results:
        eval_data = []
        for r in evaluated_results:
            eval_data.append({
                'score': r['score'],
                'skill_tags': r['skill_tags']
            })
        skill_performance = aggregate_skill_performance(eval_data)

    return {
        "interview_id": interview_id,
        "status": interview.status,
        "overall_score": interview.overall_score,
        "jd_analysis": interview.jd_analysis,
        "total_questions": len(questions),
        "evaluated_answers": sum(1 for r in results if r['has_evaluation']),
        "skill_performance": skill_performance,
        "results": results
    }


@router.get("/questions/{question_id}/ideal-answer")
async def get_ideal_answer(
    question_id: int,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """
    Generate an ideal answer example for a question
    Uses the user's actual answer for context if available
    """
    check_premium_feature(current_user.id, db, "ideal_answer")

    # Get question
    question = db.query(Question).filter(Question.id == question_id).first()
    if not question:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Question not found"
        )

    # Get interview and verify ownership
    interview = db.query(Interview).filter(
        Interview.id == question.interview_id,
        Interview.user_id == current_user.id
    ).first()

    if not interview:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Interview not found or access denied"
        )

    # Get resume
    resume = db.query(Resume).filter(Resume.id == interview.resume_id).first()

    # Get user's answer for context
    answer = db.query(Answer).filter(Answer.question_id == question_id).first()
    user_answer_text = answer.transcript if answer else None

    # Generate ideal answer with user's context
    ideal_answer = await generate_ideal_answer(
        question_text=question.question_text,
        question_context=question.question_context or {},
        resume_data=resume.parsed_data or {},
        jd_analysis=interview.jd_analysis or {},
        user_answer=user_answer_text
    )

    return {
        "question_id": question_id,
        "question_text": question.question_text,
        "ideal_answer": ideal_answer
    }
