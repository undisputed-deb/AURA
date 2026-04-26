from sqlalchemy.orm import Session
from fastapi import HTTPException, status
from app.models.subscription import Subscription
from app.models.interview import Interview
from app.logging_config import logger


def get_or_create_subscription(user_id: str, db: Session) -> Subscription:
    sub = db.query(Subscription).filter(Subscription.user_id == user_id).first()
    if not sub:
        # Safety net: ensure user row exists before inserting subscription
        from app.models.user import User
        user = db.query(User).filter(User.id == user_id).first()
        if not user:
            logger.warning(f"User {user_id} not in DB — webhook may have been missed. Skipping subscription creation.")
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User account not fully set up yet. Please try again in a moment.",
            )
        sub = Subscription(user_id=user_id, plan="free", status="active")
        db.add(sub)
        db.commit()
        db.refresh(sub)
    return sub


def is_premium(user_id: str, db: Session) -> bool:
    sub = db.query(Subscription).filter(Subscription.user_id == user_id).first()
    return sub is not None and sub.plan == "premium" and sub.status == "active"


def get_lifetime_interview_count(user_id: str, db: Session) -> int:
    return db.query(Interview).filter(Interview.user_id == user_id).count()


def check_interview_limit(user_id: str, db: Session):
    if is_premium(user_id, db):
        return
    count = get_lifetime_interview_count(user_id, db)
    if count >= 2:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail={
                "code": "interview_limit_reached",
                "message": "You've used all 2 free interviews. Upgrade to Pro for unlimited interviews.",
                "upgrade_required": True,
                "interviews_used": count,
                "interviews_limit": 2,
            }
        )


def check_question_limit(num_questions: int, user_id: str, db: Session):
    if is_premium(user_id, db):
        return
    if num_questions > 5:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail={
                "code": "question_limit_reached",
                "message": "Free plan supports up to 5 questions per interview. Upgrade to Pro for up to 15.",
                "upgrade_required": True,
            }
        )


def check_premium_feature(user_id: str, db: Session, feature: str):
    if not is_premium(user_id, db):
        messages = {
            "resume_grill": "Resume Grill is a Pro feature. Upgrade to access deep-dive resume interviews.",
            "company_prep": "Company Prep is a Pro feature. Upgrade to access real interview questions from your target company.",
            "ideal_answer": "Ideal answers are a Pro feature. Upgrade to see example perfect answers.",
            "analytics": "Full analytics is a Pro feature. Upgrade to track your progress over time.",
        }
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail={
                "code": "premium_required",
                "feature": feature,
                "message": messages.get(feature, "This feature requires a Pro subscription."),
                "upgrade_required": True,
            }
        )
