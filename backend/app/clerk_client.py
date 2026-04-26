import jwt
import httpx
import base64
from typing import Dict, Any
from app.logging_config import logger
from app.config import settings
from jwt.algorithms import RSAAlgorithm


_jwks_cache = None
_jwks_cache_time = 0.0
_JWKS_TTL = 3600  # re-fetch JWKS once per hour


async def get_jwks():
    global _jwks_cache, _jwks_cache_time
    import time
    now = time.monotonic()
    if _jwks_cache is not None and (now - _jwks_cache_time) < _JWKS_TTL:
        return _jwks_cache

    publishable_key = settings.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY or ""

    if publishable_key.startswith("pk_test_"):
        encoded_domain = publishable_key.replace("pk_test_", "")
        try:
            decoded_bytes = base64.b64decode(encoded_domain + "==")
            domain = decoded_bytes.decode('utf-8').rstrip('$')
        except Exception as e:
            logger.error(f"Failed to decode Clerk domain: {e}")
            domain = encoded_domain.rstrip('$')
        jwks_url = f"https://{domain}/.well-known/jwks.json"
    else:
        encoded_domain = publishable_key.replace("pk_live_", "")
        try:
            decoded_bytes = base64.b64decode(encoded_domain + "==")
            domain = decoded_bytes.decode('utf-8').rstrip('$')
        except Exception:
            domain = encoded_domain.rstrip('$')
        jwks_url = f"https://{domain}/.well-known/jwks.json"

    logger.info(f"Fetching JWKS from: {jwks_url}")

    async with httpx.AsyncClient() as client:
        response = await client.get(jwks_url)
        if response.status_code != 200:
            raise ValueError(f"Failed to fetch JWKS: {response.status_code}")

        _jwks_cache = response.json()
        _jwks_cache_time = now
        return _jwks_cache


async def verify_clerk_token(token: str) -> Dict[str, Any]:
    if not settings.CLERK_SECRET_KEY:
        raise ValueError("CLERK_SECRET_KEY not set")

    try:
        unverified_header = jwt.get_unverified_header(token)
        kid = unverified_header.get("kid")

        if not kid:
            raise ValueError("No kid in token header")

        jwks = await get_jwks()
        keys = jwks.get("keys", [])

        signing_key = None
        for key in keys:
            if key.get("kid") == kid:
                signing_key = RSAAlgorithm.from_jwk(key)
                break

        if not signing_key:
            raise ValueError(f"No matching key found for kid: {kid}")

        decoded = jwt.decode(
            token,
            signing_key,
            algorithms=["RS256"],
            options={"verify_signature": True, "verify_aud": False},
            leeway=60  # Allow 60 seconds of clock skew
        )

        logger.info(f"Clerk token verified for user: {decoded.get('sub')}")
        return decoded

    except jwt.ExpiredSignatureError:
        logger.warning("Clerk token has expired")
        raise ValueError("Token has expired")
    except jwt.InvalidTokenError as e:
        logger.warning(f"Invalid Clerk token: {e}")
        raise ValueError(f"Invalid token: {e}")
    except Exception as e:
        logger.error(f"Error verifying Clerk token: {e}")
        raise ValueError(f"Token verification failed: {e}")


async def get_clerk_user(user_id: str) -> Dict[str, Any]:
    clerk_secret_key = settings.CLERK_SECRET_KEY

    if not clerk_secret_key:
        raise ValueError("CLERK_SECRET_KEY not set")

    async with httpx.AsyncClient() as client:
        response = await client.get(
            f"https://api.clerk.com/v1/users/{user_id}",
            headers={"Authorization": f"Bearer {clerk_secret_key}"}
        )

        if response.status_code != 200:
            logger.error(f"Failed to fetch Clerk user: {response.text}")
            raise ValueError(f"Failed to fetch user from Clerk: {response.status_code}")

        return response.json()
