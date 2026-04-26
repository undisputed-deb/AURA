from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from pydantic import BaseModel

from app.database import get_db
from app.dependencies import get_current_user
from app.services.stripe_service import create_checkout_session, create_portal_session
from app.services.subscription_service import get_or_create_subscription, get_lifetime_interview_count
from app.config import settings
from app.logging_config import logger

router = APIRouter(prefix="/billing", tags=["Billing"])


class CheckoutRequest(BaseModel):
    price_id: str  # "monthly" or "annual"


@router.get("/status")
async def get_billing_status(
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user)
):
    sub = get_or_create_subscription(current_user.id, db)
    interviews_used = get_lifetime_interview_count(current_user.id, db)
    logger.info(f"Billing status for {current_user.id}: plan={sub.plan} status={sub.status}")

    return {
        "plan": sub.plan,
        "status": sub.status,
        "current_period_end": sub.current_period_end.isoformat() if sub.current_period_end else None,
        "interviews_used": interviews_used,
        "interviews_limit": None if sub.plan == "premium" else 2,
    }


@router.post("/checkout")
async def create_checkout(
    body: CheckoutRequest,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user)
):
    if body.price_id == "monthly":
        price_id = settings.STRIPE_PRICE_ID_MONTHLY
    elif body.price_id == "annual":
        price_id = settings.STRIPE_PRICE_ID_ANNUAL
    else:
        raise HTTPException(status_code=400, detail="Invalid price_id. Use 'monthly' or 'annual'.")

    try:
        url = create_checkout_session(
            user_id=current_user.id,
            email=current_user.email,
            price_id=price_id,
            db=db,
        )
        return {"url": url}
    except Exception as e:
        logger.exception(f"Billing endpoint error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/portal")
async def create_portal(
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user)
):
    try:
        url = create_portal_session(user_id=current_user.id, email=current_user.email, db=db)
        return {"url": url}
    except Exception as e:
        logger.exception(f"Billing endpoint error: {e}")
        raise HTTPException(status_code=500, detail=str(e))
