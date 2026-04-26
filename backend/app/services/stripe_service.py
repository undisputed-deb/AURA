import stripe
from sqlalchemy.orm import Session
from app.config import settings
from app.models.subscription import Subscription
from app.logging_config import logger

stripe.api_key = settings.STRIPE_SECRET_KEY


def get_or_create_customer(user_id: str, email: str, db: Session) -> str:
    sub = db.query(Subscription).filter(Subscription.user_id == user_id).first()

    if sub and sub.stripe_customer_id:
        try:
            stripe.Customer.retrieve(sub.stripe_customer_id)
            return sub.stripe_customer_id
        except stripe.error.InvalidRequestError:
            logger.warning(f"Stale stripe_customer_id for user {user_id}, recreating")
            sub.stripe_customer_id = None
            db.commit()

    customer = stripe.Customer.create(email=email, metadata={"user_id": user_id})

    if not sub:
        sub = Subscription(user_id=user_id, stripe_customer_id=customer.id)
        db.add(sub)
    else:
        sub.stripe_customer_id = customer.id

    db.commit()
    return customer.id


def create_checkout_session(user_id: str, email: str, price_id: str, db: Session) -> str:
    customer_id = get_or_create_customer(user_id, email, db)

    session = stripe.checkout.Session.create(
        customer=customer_id,
        payment_method_types=["card"],
        line_items=[{"price": price_id, "quantity": 1}],
        mode="subscription",
        allow_promotion_codes=True,
        success_url=f"{settings.FRONTEND_URL}/billing/success?session_id={{CHECKOUT_SESSION_ID}}",
        cancel_url=f"{settings.FRONTEND_URL}/billing/cancel",
        metadata={"user_id": user_id},
    )
    return session.url


def create_portal_session(user_id: str, email: str, db: Session) -> str:
    customer_id = get_or_create_customer(user_id, email, db)

    session = stripe.billing_portal.Session.create(
        customer=customer_id,
        return_url=f"{settings.FRONTEND_URL}/dashboard",
    )
    return session.url


def handle_webhook_event(payload: bytes, sig_header: str, db: Session):
    try:
        event = stripe.Webhook.construct_event(
            payload, sig_header, settings.STRIPE_WEBHOOK_SECRET
        )
    except stripe.error.SignatureVerificationError:
        raise Exception("Invalid webhook signature")

    event_type = event["type"]
    logger.info(f"Stripe webhook received: {event_type}")

    if event_type == "checkout.session.completed":
        session = event["data"]["object"]
        user_id = session.get("metadata", {}).get("user_id")
        stripe_subscription_id = session.get("subscription")
        stripe_customer_id = session.get("customer")

        if user_id:
            sub = db.query(Subscription).filter(Subscription.user_id == user_id).first()
            if not sub:
                sub = Subscription(user_id=user_id)
                db.add(sub)
            sub.plan = "premium"
            sub.status = "active"
            sub.stripe_customer_id = stripe_customer_id
            sub.stripe_subscription_id = stripe_subscription_id
            db.commit()
            logger.info(f"User {user_id} upgraded to premium")

    elif event_type == "customer.subscription.updated":
        stripe_sub = event["data"]["object"]
        stripe_subscription_id = stripe_sub["id"]
        new_status = stripe_sub["status"]

        sub = db.query(Subscription).filter(
            Subscription.stripe_subscription_id == stripe_subscription_id
        ).first()
        if sub:
            sub.status = "active" if new_status == "active" else new_status
            if stripe_sub.get("current_period_end"):
                from datetime import datetime, timezone
                sub.current_period_end = datetime.fromtimestamp(
                    stripe_sub["current_period_end"], tz=timezone.utc
                )
            db.commit()
            logger.info(f"Subscription {stripe_subscription_id} updated: {new_status}")

    elif event_type == "customer.subscription.deleted":
        stripe_sub = event["data"]["object"]
        stripe_subscription_id = stripe_sub["id"]

        sub = db.query(Subscription).filter(
            Subscription.stripe_subscription_id == stripe_subscription_id
        ).first()
        if sub:
            sub.plan = "free"
            sub.status = "active"
            sub.stripe_subscription_id = None
            sub.current_period_end = None
            db.commit()
            logger.info(f"Subscription {stripe_subscription_id} canceled — downgraded to free")
