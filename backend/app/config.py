from pydantic_settings import BaseSettings
from pydantic import field_validator
from typing import List
import warnings


class Settings(BaseSettings):
    """Application settings loaded from environment variables"""

    APP_NAME: str = "Reherse API"
    VERSION: str = "0.1.0"
    ENVIRONMENT: str = "development"
    DEBUG: bool = True

    DATABASE_URL: str

    REDIS_URL: str

    # Clerk Authentication
    CLERK_SECRET_KEY: str | None = None
    NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: str | None = None
    CLERK_WEBHOOK_SECRET: str | None = None

    # JWT Authentication (Legacy)
    JWT_SECRET_KEY: str
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30

    # AI Services
    GEMINI_API_KEY: str
    GROQ_API_KEY: str
    OPENAI_API_KEY: str

    # Stripe
    STRIPE_SECRET_KEY: str = ""
    STRIPE_WEBHOOK_SECRET: str = ""
    STRIPE_PRICE_ID_MONTHLY: str = ""
    STRIPE_PRICE_ID_ANNUAL: str = ""

    # Frontend URL (for Stripe redirect URLs)
    FRONTEND_URL: str = "http://localhost:3000"

    # Supabase
    SUPABASE_URL: str
    SUPABASE_KEY: str
    SUPABASE_SERVICE_KEY: str

    ALLOWED_ORIGINS: str

    @field_validator('JWT_SECRET_KEY')
    @classmethod
    def validate_jwt_secret(cls, v: str, info) -> str:
        """Validate JWT secret is secure"""
        if len(v) < 32:
            raise ValueError("JWT_SECRET_KEY must be at least 32 characters long")
        if v in ['your-secret-key', 'your-secret-key-change-this-in-production', 'secret', 'test']:
            raise ValueError("JWT_SECRET_KEY is using an insecure default value. Generate a secure secret.")
        return v

    @field_validator('REDIS_URL')
    @classmethod
    def validate_redis_url(cls, v: str, info) -> str:
        """Warn if using localhost Redis in production"""
        environment = info.data.get('ENVIRONMENT', 'development')
        if environment == 'production' and 'localhost' in v:
            raise ValueError("Production environment cannot use localhost Redis. Use a production Redis service.")
        return v

    @field_validator('ALLOWED_ORIGINS')
    @classmethod
    def validate_allowed_origins(cls, v: str, info) -> str:
        """Warn if using localhost in production"""
        environment = info.data.get('ENVIRONMENT', 'development')
        if environment == 'production' and ('localhost' in v or '127.0.0.1' in v):
            raise ValueError("Production environment cannot use localhost in ALLOWED_ORIGINS. Set production URLs.")
        return v

    @field_validator('DEBUG')
    @classmethod
    def validate_debug(cls, v: bool, info) -> bool:
        """Ensure DEBUG is False in production"""
        environment = info.data.get('ENVIRONMENT', 'development')
        if environment == 'production' and v is True:
            warnings.warn("DEBUG should be False in production environment", UserWarning)
        return v

    # File Upload
    MAX_UPLOAD_SIZE: int = 10485760
    ALLOWED_EXTENSIONS: str = "pdf"

    # Audio
    MAX_AUDIO_DURATION: int = 300
    AUDIO_FORMAT: str = "wav"

    # Rate Limiting
    RATE_LIMIT_PER_MINUTE: int = 60
    RATE_LIMIT_PER_HOUR: int = 1000

    @property
    def cors_origins(self) -> List[str]:
        """Parse CORS origins from comma-separated string"""
        return [origin.strip() for origin in self.ALLOWED_ORIGINS.split(",")]

    class Config:
        import os
        if os.path.exists("backend/.env"):
            env_file = "backend/.env"
        else:
            env_file = ".env"
        env_file_encoding = 'utf-8'
        case_sensitive = True
        extra = "ignore"


settings = Settings()
