from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, JSON, Float, Enum
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
import enum
from app.database import Base


class InterviewStatus(str, enum.Enum):
    PENDING = "pending"
    IN_PROGRESS = "in_progress"
    COMPLETED = "completed"


class InterviewType(str, enum.Enum):
    STANDARD = "standard"  # Regular interview with JD
    RESUME_GRILL = "resume_grill"  # Resume-only grilling
    COMPANY_PREP = "company_prep"  # Company-specific prep


class Interview(Base):
    __tablename__ = "interviews"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(String, ForeignKey("users.id"), nullable=False, index=True)  # UUID string
    resume_id = Column(Integer, ForeignKey("resumes.id"), nullable=False)
    interview_type = Column(Enum(InterviewType), default=InterviewType.STANDARD, nullable=False, index=True)
    job_description = Column(String, nullable=True)  # Nullable for resume_grill type
    jd_analysis = Column(JSON, nullable=True)  # AI-analyzed JD requirements
    target_company = Column(String, nullable=True)  # Target company for prep (e.g., "Google", "Amazon")
    target_role = Column(String, nullable=True)  # Target role for company prep
    status = Column(Enum(InterviewStatus), default=InterviewStatus.PENDING, index=True)
    overall_score = Column(Float, nullable=True)  # Average score across all answers
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    completed_at = Column(DateTime(timezone=True), nullable=True)

    # Relationships
    user = relationship("User", back_populates="interviews")
    resume = relationship("Resume", back_populates="interviews")
    questions = relationship("Question", back_populates="interview", cascade="all, delete-orphan")
