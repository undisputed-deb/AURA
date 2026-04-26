from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session
from sqlalchemy.exc import OperationalError, TimeoutError as SQLTimeoutError
from app.supabase_client import get_supabase
from app.clerk_client import verify_clerk_token, get_clerk_user
from app.database import get_db
from app.models.user import User
from app.logging_config import logger
from app.config import settings

security = HTTPBearer()


class AuthenticatedUser:
    """Wrapper for user with their token"""
    def __init__(self, user, token: str):
        self.user = user
        self.token = token
        # Expose user attributes directly
        self.id = user.id
        self.email = user.email


async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: Session = Depends(get_db)
) -> AuthenticatedUser:
    """
    Verify JWT token from Clerk or Supabase and get current user
    Auto-sync user to local database if not exists

    Supports both Clerk (recommended) and Supabase Auth (legacy) tokens.

    Usage in routes:
        @app.get("/protected")
        async def protected_route(current_user = Depends(get_current_user)):
            return {"user_id": current_user.id, "token": current_user.token}
    """
    token = credentials.credentials
    logger.debug("Authenticating user request")

    clerk_key = settings.CLERK_SECRET_KEY
    logger.info(f"CLERK_SECRET_KEY present: {bool(clerk_key)}")

    # Try Clerk authentication first (if CLERK_SECRET_KEY is set)
    if clerk_key:
        try:
            logger.info("=== Attempting Clerk authentication ===")

            # Verify the JWT token
            jwt_payload = await verify_clerk_token(token)
            clerk_user_id = jwt_payload.get("sub")

            if not clerk_user_id:
                raise ValueError("No user ID in token")

            logger.debug(f"Clerk token verified for user: {clerk_user_id}")

            # Fast path: user already exists in local DB — no Clerk API call needed
            try:
                local_user = db.query(User).filter(User.id == clerk_user_id).first()
                if local_user:
                    logger.debug(f"Local user found: {local_user.email}")
                    return AuthenticatedUser(local_user, token)
            except (OperationalError, SQLTimeoutError) as db_error:
                logger.warning(f"Database unavailable during auth fast path: {db_error}")
                db.rollback()

            # Slow path: user not in local DB — fetch from Clerk to create/migrate
            clerk_user_data = await get_clerk_user(clerk_user_id)

            if not clerk_user_data:
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="User not found in Clerk",
                )

            # Extract email
            email_addresses = clerk_user_data.get("email_addresses", [])
            primary_email = next(
                (e["email_address"] for e in email_addresses if e.get("id") == clerk_user_data.get("primary_email_address_id")),
                email_addresses[0]["email_address"] if email_addresses else None
            )

            logger.info(f"User authenticated via Clerk (new/migrating): {primary_email}")

            class ClerkUserAdapter:
                def __init__(self, user_data):
                    self.id = user_data.get("id")
                    self.email = primary_email
                    self.user_metadata = {
                        "full_name": f"{user_data.get('first_name', '')} {user_data.get('last_name', '')}".strip()
                    }
                    self.created_at = user_data.get("created_at")

            clerk_user_adapted = ClerkUserAdapter(clerk_user_data)

            # Try to sync user to local database
            try:
                # Check if email exists with different user ID (migration case)
                existing_user = db.query(User).filter(User.email == clerk_user_adapted.email).first()

                if existing_user and existing_user.id != clerk_user_adapted.id:
                    # Migrate user data from old Clerk ID to new Clerk ID
                    logger.info(f"Migrating user {clerk_user_adapted.email} from old ID to production Clerk ID")

                    from app.models.resume import Resume
                    from app.models.interview import Interview
                    from app.models.subscription import Subscription

                    old_user_id = existing_user.id
                    existing_user.email = f"migrating_{existing_user.email}"
                    db.flush()

                    local_user = User(
                        id=clerk_user_adapted.id,
                        email=clerk_user_adapted.email,
                        full_name=clerk_user_adapted.user_metadata.get("full_name")
                    )
                    db.add(local_user)
                    db.flush()

                    db.query(Resume).filter(Resume.user_id == old_user_id).update(
                        {Resume.user_id: clerk_user_adapted.id}
                    )
                    db.query(Interview).filter(Interview.user_id == old_user_id).update(
                        {Interview.user_id: clerk_user_adapted.id}
                    )
                    db.query(Subscription).filter(Subscription.user_id == old_user_id).update(
                        {Subscription.user_id: clerk_user_adapted.id}
                    )

                    db.delete(existing_user)
                    db.commit()
                    db.refresh(local_user)
                    logger.info("User migration completed successfully")
                elif existing_user:
                    local_user = existing_user
                else:
                    logger.info(f"Creating new local user from Clerk: {clerk_user_adapted.email}")
                    local_user = User(
                        id=clerk_user_adapted.id,
                        email=clerk_user_adapted.email,
                        full_name=clerk_user_adapted.user_metadata.get("full_name")
                    )
                    db.add(local_user)
                    db.commit()
                    db.refresh(local_user)
                    logger.info("Local user created successfully")

                return AuthenticatedUser(local_user, token)
            except (OperationalError, SQLTimeoutError) as db_error:
                logger.warning(f"Database unavailable during auth (user will be authenticated without local sync): {db_error}")
                db.rollback()
            except Exception as db_error:
                logger.error(f"Unexpected database error during auth: {db_error}")
                db.rollback()

            return AuthenticatedUser(clerk_user_adapted, token)

        except HTTPException:
            raise
        except Exception as clerk_error:
            logger.error(f"Clerk authentication failed: {type(clerk_error).__name__}: {clerk_error}", exc_info=True)
            logger.warning("Falling back to Supabase authentication")

    # Fallback to Supabase authentication (legacy)
    try:
        logger.debug("Attempting Supabase authentication")
        supabase = get_supabase()
        user_response = supabase.auth.get_user(token)

        if not user_response or not user_response.user:
            logger.warning("Invalid token - no user in response")
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid authentication credentials",
            )

        supabase_user = user_response.user
        logger.info(f"User authenticated via Supabase: {supabase_user.email}")

        # Try to sync user to local database if not exists
        try:
            local_user = db.query(User).filter(User.id == supabase_user.id).first()

            if not local_user:
                logger.info(f"Creating new local user from Supabase: {supabase_user.email}")
                local_user = User(
                    id=supabase_user.id,
                    email=supabase_user.email,
                    full_name=supabase_user.user_metadata.get("full_name") if supabase_user.user_metadata else None
                )
                db.add(local_user)
                db.commit()
                db.refresh(local_user)
                logger.info("Local user created successfully")
            else:
                logger.debug(f"Local user found: {local_user.email}")
        except (OperationalError, SQLTimeoutError) as db_error:
            logger.warning(f"Database unavailable during auth (user will be authenticated without local sync): {db_error}")
        except Exception as db_error:
            logger.error(f"Unexpected database error during auth: {db_error}")

        return AuthenticatedUser(supabase_user, token)

    except HTTPException as http_exc:
        logger.warning(f"Authentication failed: {http_exc.detail}")
        raise
    except Exception as e:
        logger.error(f"Authentication error: {type(e).__name__}: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate credentials",
        )
