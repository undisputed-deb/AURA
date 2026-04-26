from fastapi import APIRouter, Request, HTTPException
from sqlalchemy.orm import Session
from app.database import SessionLocal
from app.services.stripe_service import handle_webhook_event
from app.logging_config import logger
from app.config import settings

router = APIRouter(prefix="/webhooks", tags=["Webhooks"])


@router.post("/stripe")
async def stripe_webhook(request: Request):
    payload = await request.body()
    sig_header = request.headers.get("stripe-signature")

    if not sig_header:
        raise HTTPException(status_code=400, detail="Missing Stripe signature")

    db: Session = SessionLocal()
    try:
        handle_webhook_event(payload, sig_header, db)
        return {"status": "ok"}
    except Exception as e:
        logger.error(f"Stripe webhook error: {e}")
        raise HTTPException(status_code=400, detail=str(e))
    finally:
        db.close()


@router.post("/clerk")
async def clerk_webhook(request: Request):
    """
    Handles Clerk user lifecycle events.
    - user.created  → insert user row + create Stripe customer + free subscription
    - user.deleted  → clean up user row (cascades to all related data)
    """
    if not settings.CLERK_WEBHOOK_SECRET:
        raise HTTPException(status_code=500, detail="Clerk webhook secret not configured")

    payload = await request.body()

    # Verify Svix signature
    try:
        from svix.webhooks import Webhook, WebhookVerificationError
        wh = Webhook(settings.CLERK_WEBHOOK_SECRET)
        event = wh.verify(payload, dict(request.headers))
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid webhook signature")

    event_type = event.get("type")
    data = event.get("data", {})
    logger.info(f"Clerk webhook received: {event_type}")

    db: Session = SessionLocal()
    try:
        if event_type == "user.created":
            _handle_user_created(data, db)
        elif event_type == "user.deleted":
            _handle_user_deleted(data, db)
    except Exception as e:
        logger.error(f"Clerk webhook handler error ({event_type}): {e}")
        # Return 200 so Clerk doesn't retry — log and move on
    finally:
        db.close()

    return {"status": "ok"}


def _handle_user_created(data: dict, db: Session):
    from app.models.user import User
    from app.models.subscription import Subscription
    import stripe
    from app.config import settings as cfg

    user_id: str = data["id"]
    email_addresses = data.get("email_addresses", [])
    primary_email_id = data.get("primary_email_address_id")

    # Pick primary email, fall back to first available
    email = None
    for e in email_addresses:
        if e.get("id") == primary_email_id:
            email = e.get("email_address")
            break
    if not email and email_addresses:
        email = email_addresses[0].get("email_address")

    if not email:
        logger.error(f"Clerk user.created: no email found for user {user_id}")
        return

    first_name = data.get("first_name") or ""
    last_name = data.get("last_name") or ""
    full_name = f"{first_name} {last_name}".strip() or None

    # Idempotent — skip if user already exists
    existing = db.query(User).filter(User.id == user_id).first()
    if existing:
        logger.info(f"User {user_id} already exists, skipping creation")
        return

    # Insert user row
    user = User(id=user_id, email=email, full_name=full_name)
    db.add(user)
    db.flush()  # write user before creating FK-dependent rows

    # Create Stripe customer
    stripe_customer_id = None
    if cfg.STRIPE_SECRET_KEY:
        try:
            stripe.api_key = cfg.STRIPE_SECRET_KEY
            customer = stripe.Customer.create(
                email=email,
                name=full_name,
                metadata={"user_id": user_id},
            )
            stripe_customer_id = customer.id
            logger.info(f"Created Stripe customer {stripe_customer_id} for user {user_id}")
        except Exception as e:
            logger.error(f"Failed to create Stripe customer for {user_id}: {e}")

    # Create free subscription row
    sub = Subscription(
        user_id=user_id,
        plan="free",
        status="active",
        stripe_customer_id=stripe_customer_id,
    )
    db.add(sub)
    db.commit()
    logger.info(f"User {user_id} created with free subscription")


def _handle_user_deleted(data: dict, db: Session):
    from app.models.user import User

    user_id: str = data.get("id", "")
    if not user_id:
        return

    user = db.query(User).filter(User.id == user_id).first()
    if user:
        db.delete(user)
        db.commit()
        logger.info(f"Deleted user {user_id} and all related data")
