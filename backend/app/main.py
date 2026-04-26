from fastapi import FastAPI, Request, status, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from sqlalchemy.orm import Session
import socketio
import time
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded
from app.config import settings
from app.database import get_db
from app.routers import auth, test, resumes, interviews, audio, evaluation, analytics, billing, webhooks
from app.websocket.interview_handler import sio
from app.logging_config import logger

# Initialize rate limiter
limiter = Limiter(key_func=get_remote_address)

# Initialize FastAPI app
fastapi_app = FastAPI(
    title=settings.APP_NAME,
    version=settings.VERSION,
    description="AI Voice Interview Coach Platform API",
    docs_url="/docs",
    redoc_url="/redoc",
)

# Add rate limiter to app state
fastapi_app.state.limiter = limiter
fastapi_app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

# Keep reference to FastAPI app for testing
app = fastapi_app

# Wrap with SocketIO
socket_app = socketio.ASGIApp(sio, fastapi_app)

# Security headers middleware
@app.middleware("http")
async def add_security_headers(request: Request, call_next):
    """Add security headers to all responses"""
    response = await call_next(request)

    response.headers["X-Frame-Options"] = "DENY"
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["X-XSS-Protection"] = "1; mode=block"
    response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"

    if settings.ENVIRONMENT == "production":
        response.headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains"

    csp_directives = [
        "default-src 'self'",
        "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
        "style-src 'self' 'unsafe-inline'",
        "img-src 'self' data: https:",
        "font-src 'self' data:",
        "connect-src 'self' https:",
        "frame-ancestors 'none'",
    ]
    response.headers["Content-Security-Policy"] = "; ".join(csp_directives)

    return response

# Request logging middleware
@app.middleware("http")
async def log_requests(request: Request, call_next):
    """Log all HTTP requests and errors"""
    start_time = time.time()

    # Log incoming request
    logger.info(f"Request: {request.method} {request.url.path}")

    try:
        response = await call_next(request)

        # Calculate request duration
        duration = time.time() - start_time

        # Log response
        logger.info(
            f"Response: {request.method} {request.url.path} "
            f"Status: {response.status_code} Duration: {duration:.2f}s"
        )

        return response
    except Exception as e:
        # Log error with full details
        duration = time.time() - start_time
        logger.error(
            f"Error processing request: {request.method} {request.url.path} "
            f"Duration: {duration:.2f}s Error: {str(e)}",
            exc_info=True
        )

        # Return error response
        return JSONResponse(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            content={"detail": "Internal server error"}
        )

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(test.router)
app.include_router(resumes.router)
app.include_router(interviews.router)
app.include_router(audio.router)
app.include_router(evaluation.router)
app.include_router(analytics.router)
app.include_router(billing.router)
app.include_router(webhooks.router)


@app.on_event("startup")
async def startup_event():
    """Log application startup"""
    logger.info(f"Starting {settings.APP_NAME} v{settings.VERSION}")
    logger.info(f"Environment: {settings.ENVIRONMENT}")
    logger.info(f"API Documentation: /docs")


@app.on_event("shutdown")
async def shutdown_event():
    """Log application shutdown"""
    logger.info(f"Shutting down {settings.APP_NAME}")


@app.get("/")
async def root():
    """Root endpoint"""
    return {
        "message": "Welcome to Reherse API",
        "version": settings.VERSION,
        "docs": "/docs",
    }


@app.get("/health")
async def health_check(db: Session = Depends(get_db)):
    """Health check endpoint for monitoring"""
    from sqlalchemy import text
    from app.websocket.session_manager import session_manager

    health = {
        "status": "healthy",
        "environment": settings.ENVIRONMENT,
        "version": settings.VERSION,
        "services": {}
    }

    try:
        db.execute(text("SELECT 1"))
        health["services"]["database"] = "healthy"
    except Exception as e:
        health["services"]["database"] = f"unhealthy: {str(e)}"
        health["status"] = "degraded"
        logger.error(f"Database health check failed: {e}")

    try:
        if session_manager.redis_client:
            session_manager.redis_client.ping()
            health["services"]["redis"] = "healthy"
        else:
            health["services"]["redis"] = "not configured"
            health["status"] = "degraded"
    except Exception as e:
        health["services"]["redis"] = f"unhealthy: {str(e)}"
        health["status"] = "degraded"
        logger.error(f"Redis health check failed: {e}")

    return health

# For production, use socket_app which wraps FastAPI with SocketIO
# For testing, import 'app' which is the FastAPI instance
# To run: uvicorn app.main:socket_app
__all__ = ["app", "socket_app"]
