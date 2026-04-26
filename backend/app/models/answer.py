from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, JSON, Float
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.database import Base


class Answer(Base):
    __tablename__ = "answers"

    id = Column(Integer, primary_key=True, index=True)
    question_id = Column(Integer, ForeignKey("questions.id"), nullable=False, index=True)
    transcript = Column(String, nullable=False)
    audio_duration_seconds = Column(Float, nullable=True)
    evaluation = Column(JSON, nullable=True)
    score = Column(Float, nullable=True)
    answered_at = Column(DateTime(timezone=True), server_default=func.now())

    # Relationships
    question = relationship("Question", back_populates="answers")  # Changed to 'answers' plural
