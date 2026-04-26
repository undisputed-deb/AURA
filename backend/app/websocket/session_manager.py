"""
Interview session state management with Redis
"""
import json
import redis
from typing import Optional, Dict, Any
from datetime import datetime
from app.config import settings
from app.logging_config import logger


class InterviewSession:
    """Represents an active interview session"""

    def __init__(self, interview_id: int, user_id: str):
        self.interview_id = interview_id
        self.user_id = user_id
        self.current_question_index = 0
        self.start_time = datetime.utcnow().isoformat()
        self.answers = []
        self.status = "active"
        self.pending_followup = None
        self.followup_counts = {}
        self.current_question_text = ""
        self.current_question_context: dict = {}
        self.precomputed_followup = None

    def to_dict(self) -> Dict[str, Any]:
        """Convert session to dictionary"""
        return {
            "interview_id": self.interview_id,
            "user_id": self.user_id,
            "current_question_index": self.current_question_index,
            "start_time": self.start_time,
            "answers": self.answers,
            "status": self.status,
            "pending_followup": self.pending_followup,
            "followup_counts": self.followup_counts,
            "current_question_text": self.current_question_text,
            "current_question_context": self.current_question_context,
            "precomputed_followup": self.precomputed_followup,
        }

    @classmethod
    def from_dict(cls, data: Dict[str, Any]) -> "InterviewSession":
        """Create session from dictionary"""
        session = cls(
            interview_id=data["interview_id"],
            user_id=data["user_id"]
        )
        session.current_question_index = data["current_question_index"]
        session.start_time = data["start_time"]
        session.answers = data.get("answers", [])
        session.status = data.get("status", "active")
        session.pending_followup = data.get("pending_followup")
        session.followup_counts = data.get("followup_counts", {})
        session.current_question_text = data.get("current_question_text", "")
        session.current_question_context = data.get("current_question_context", {})
        session.precomputed_followup = data.get("precomputed_followup")
        return session


class SessionManager:
    """Manages interview sessions in Redis with in-memory fallback"""

    def __init__(self):
        """Initialize Redis connection with fallback to in-memory storage"""
        self.redis_client = None
        self.memory_store: Dict[str, str] = {}

        try:
            self.redis_client = redis.from_url(
                settings.REDIS_URL,
                decode_responses=True,
                socket_connect_timeout=10,
                socket_timeout=10,
                socket_keepalive=True,
                health_check_interval=30,
                ssl_cert_reqs=None
            )
            # Test connection
            self.redis_client.ping()
            logger.info("✓ Connected to Redis for session management")
        except Exception as e:
            logger.warning(f"⚠ Redis connection failed: {e}")
            logger.warning("⚠ Using in-memory session storage (sessions will not persist across restarts)")
            self.redis_client = None

    def _get_session_key(self, session_id: str) -> str:
        """Get Redis key for session"""
        return f"interview_session:{session_id}"

    def create_session(self, session_id: str, interview_id: int, user_id: str) -> InterviewSession:
        """
        Create a new interview session

        Args:
            session_id: Unique session identifier (usually socket ID)
            interview_id: Database interview ID
            user_id: User ID

        Returns:
            InterviewSession object
        """
        session = InterviewSession(interview_id=interview_id, user_id=user_id)
        key = self._get_session_key(session_id)
        session_data = json.dumps(session.to_dict())

        if self.redis_client:
            try:
                # Store session with 2 hour TTL
                self.redis_client.setex(key, 7200, session_data)
            except redis.ConnectionError as e:
                logger.warning(f"Redis connection error, retrying once: {e}")
                try:
                    # Retry connection
                    self.redis_client.ping()
                    self.redis_client.setex(key, 7200, session_data)
                except Exception as retry_error:
                    logger.warning(f"Redis retry failed, using memory: {retry_error}")
                    self.memory_store[key] = session_data
            except Exception as e:
                logger.warning(f"Redis setex failed, using memory: {e}")
                self.memory_store[key] = session_data
        else:
            # Use in-memory fallback
            self.memory_store[key] = session_data

        return session

    def get_session(self, session_id: str) -> Optional[InterviewSession]:
        """Get session by ID"""
        key = self._get_session_key(session_id)
        data = None

        if self.redis_client:
            try:
                data = self.redis_client.get(key)
            except redis.ConnectionError as e:
                logger.warning(f"Redis connection error, checking memory: {e}")
                data = self.memory_store.get(key)
            except Exception as e:
                logger.warning(f"Redis get failed, using memory: {e}")
                data = self.memory_store.get(key)
        else:
            data = self.memory_store.get(key)

        if data:
            return InterviewSession.from_dict(json.loads(data))

        return None

    def update_session(self, session_id: str, session: InterviewSession):
        """Update session in Redis"""
        key = self._get_session_key(session_id)
        session_data = json.dumps(session.to_dict())

        if self.redis_client:
            try:
                self.redis_client.setex(key, 7200, session_data)
            except redis.ConnectionError as e:
                logger.warning(f"Redis connection error during update, using memory: {e}")
                self.memory_store[key] = session_data
            except Exception as e:
                logger.warning(f"Redis update failed, using memory: {e}")
                self.memory_store[key] = session_data
        else:
            self.memory_store[key] = session_data

    def delete_session(self, session_id: str):
        """Delete session from Redis"""
        key = self._get_session_key(session_id)

        if self.redis_client:
            try:
                self.redis_client.delete(key)
            except Exception as e:
                logger.warning(f"Redis delete failed, using memory: {e}")
                self.memory_store.pop(key, None)
        else:
            self.memory_store.pop(key, None)

    def advance_question(self, session_id: str) -> bool:
        """
        Move to next question

        Args:
            session_id: Session identifier

        Returns:
            True if successful
        """
        session = self.get_session(session_id)
        if session:
            session.current_question_index += 1
            self.update_session(session_id, session)
            return True
        return False

    def add_answer(self, session_id: str, question_id: int, answer_data: Dict[str, Any]) -> bool:
        """
        Add answer to session

        Args:
            session_id: Session identifier
            question_id: Question ID
            answer_data: Answer data (transcript, audio bytes, format)

        Returns:
            True if successful
        """
        session = self.get_session(session_id)
        if session:
            answer_record = {
                "question_id": question_id,
                "timestamp": datetime.utcnow().isoformat(),
                **answer_data
            }
            session.answers.append(answer_record)
            self.update_session(session_id, session)
            return True
        return False

    def complete_session(self, session_id: str) -> bool:
        """
        Mark session as completed

        Args:
            session_id: Session identifier

        Returns:
            True if successful
        """
        session = self.get_session(session_id)
        if session:
            session.status = "completed"
            self.update_session(session_id, session)
            return True
        return False


session_manager = SessionManager()
