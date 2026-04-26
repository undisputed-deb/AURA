"""
Test configuration and fixtures
"""
import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool
from unittest.mock import Mock, patch
import os

# Set test environment variables
os.environ["ENVIRONMENT"] = "test"
os.environ["DATABASE_URL"] = "sqlite:///:memory:"

from app.main import app
from app.database import Base, get_db


# Create in-memory SQLite database for testing
SQLALCHEMY_DATABASE_URL = "sqlite:///:memory:"
engine = create_engine(
    SQLALCHEMY_DATABASE_URL,
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


@pytest.fixture(scope="function")
def db_session():
    """Create a fresh database for each test"""
    Base.metadata.create_all(bind=engine)
    session = TestingSessionLocal()
    try:
        yield session
    finally:
        session.close()
        Base.metadata.drop_all(bind=engine)


@pytest.fixture(scope="function")
def client(db_session):
    """Create a test client with database override"""
    def override_get_db():
        try:
            yield db_session
        finally:
            pass

    app.dependency_overrides[get_db] = override_get_db
    with TestClient(app) as test_client:
        yield test_client
    app.dependency_overrides.clear()


@pytest.fixture
def mock_supabase():
    """Mock Supabase client"""
    with patch('app.supabase_client.get_supabase') as mock:
        supabase_mock = Mock()

        # Mock auth methods
        supabase_mock.auth.sign_up.return_value = Mock(
            user=Mock(id="test-user-id", email="test@example.com"),
            session=Mock(access_token="test-token")
        )
        supabase_mock.auth.sign_in_with_password.return_value = Mock(
            user=Mock(
                id="test-user-id",
                email="test@example.com",
                user_metadata={"full_name": "Test User"}
            ),
            session=Mock(access_token="test-token")
        )
        supabase_mock.auth.get_user.return_value = Mock(
            user=Mock(
                id="test-user-id",
                email="test@example.com",
                created_at="2025-01-01T00:00:00Z",
                user_metadata={"full_name": "Test User"}
            )
        )

        mock.return_value = supabase_mock
        yield supabase_mock


@pytest.fixture
def mock_gemini():
    """Mock Gemini AI service"""
    with patch('app.services.gemini_service.model') as mock:
        # Mock generate_content response
        mock_response = Mock()
        mock_response.text = '{"test": "data"}'
        mock.generate_content.return_value = mock_response
        yield mock


@pytest.fixture
def mock_storage():
    """Mock Supabase Storage service"""
    with patch('app.services.storage_service.StorageService') as mock:
        mock.upload_resume.return_value = "https://example.com/resume.pdf"
        mock.delete_resume.return_value = None
        yield mock


@pytest.fixture
def sample_resume_data():
    """Sample parsed resume data"""
    return {
        "name": "John Doe",
        "email": "john@example.com",
        "phone": "+1234567890",
        "technical_skills": {
            "languages": ["Python", "JavaScript", "Java"],
            "frameworks_libraries": ["React", "FastAPI", "Django"],
            "cloud_databases": ["AWS", "PostgreSQL"],
            "ai_tools": ["TensorFlow"],
            "developer_tools": ["Git", "Docker"]
        },
        "experience": [
            {
                "title": "Software Engineer",
                "company": "Tech Corp",
                "duration": "2023 - Present",
                "responsibilities": ["Built features", "Fixed bugs"]
            }
        ],
        "education": [
            {
                "institution": "University",
                "degree": "BS Computer Science",
                "graduation_date": "2023"
            }
        ]
    }


@pytest.fixture
def sample_jd_analysis():
    """Sample job description analysis"""
    return {
        "job_title": "Software Engineer",
        "company": "Tech Company",
        "experience_level": "Mid-level",
        "required_skills": ["Python", "FastAPI", "PostgreSQL"],
        "responsibilities": ["Build features", "Write tests"],
        "qualifications": ["BS in Computer Science", "3+ years experience"]
    }


@pytest.fixture
def auth_headers():
    """Generate authentication headers"""
    return {"Authorization": "Bearer test-token"}
