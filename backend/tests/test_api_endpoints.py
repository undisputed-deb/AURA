"""
Integration tests for API endpoints (resumes, interviews, etc.)
"""
import pytest
from fastapi import status
from io import BytesIO


class TestHealthEndpoints:
    """Test health and status endpoints"""

    def test_root_endpoint(self, client):
        """Test root endpoint returns welcome message"""
        response = client.get("/")

        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert "message" in data
        assert "MockMate" in data["message"]

    def test_health_check(self, client):
        """Test health check endpoint"""
        response = client.get("/health")

        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert data["status"] == "healthy"
        assert "environment" in data
        assert "version" in data


class TestResumeEndpoints:
    """Test resume management endpoints"""

    def test_list_resumes_empty(self, client, mock_supabase):
        """Test listing resumes when none exist"""
        # Would need authentication
        pytest.skip("Requires authentication setup")

    def test_upload_resume_invalid_file_type(self, client, mock_supabase):
        """Test uploading non-PDF file"""
        # Would need authentication and multipart form data
        pytest.skip("Requires authentication and file upload setup")

    def test_upload_resume_too_large(self, client, mock_supabase):
        """Test uploading file larger than 10MB"""
        pytest.skip("Requires authentication and file upload setup")

    def test_get_nonexistent_resume(self, client, mock_supabase):
        """Test getting a resume that doesn't exist"""
        pytest.skip("Requires authentication setup")

    def test_delete_resume_cascade(self, client, mock_supabase):
        """Test that deleting resume also deletes associated interviews"""
        pytest.skip("Requires authentication and database setup")


class TestInterviewEndpoints:
    """Test interview management endpoints"""

    def test_list_interviews_empty(self, client, mock_supabase):
        """Test listing interviews when none exist"""
        pytest.skip("Requires authentication setup")

    def test_create_interview_success(self, client, mock_supabase, mock_gemini):
        """Test creating a new interview"""
        pytest.skip("Requires authentication setup")

    def test_create_interview_invalid_resume_id(self, client, mock_supabase):
        """Test creating interview with non-existent resume"""
        pytest.skip("Requires authentication setup")

    def test_get_interview_details(self, client, mock_supabase):
        """Test getting interview details with questions"""
        pytest.skip("Requires authentication setup")

    def test_delete_interview(self, client, mock_supabase):
        """Test deleting an interview"""
        pytest.skip("Requires authentication setup")


class TestAnalyticsEndpoints:
    """Test analytics endpoints"""

    def test_get_analytics_no_interviews(self, client, mock_supabase):
        """Test analytics when user has no interviews"""
        pytest.skip("Requires authentication setup")

    def test_get_analytics_with_completed_interviews(self, client, mock_supabase):
        """Test analytics with completed interviews"""
        pytest.skip("Requires authentication setup")


class TestErrorHandling:
    """Test error handling across all endpoints"""

    def test_404_on_invalid_route(self, client):
        """Test 404 error on non-existent route"""
        response = client.get("/nonexistent/route")
        assert response.status_code == status.HTTP_404_NOT_FOUND

    def test_405_on_wrong_method(self, client):
        """Test 405 error when using wrong HTTP method"""
        # POST to health endpoint which only accepts GET
        response = client.post("/health")
        assert response.status_code == status.HTTP_405_METHOD_NOT_ALLOWED

    def test_422_on_invalid_json(self, client, mock_supabase):
        """Test 422 error on malformed JSON"""
        response = client.post(
            "/auth/login",
            data="this is not json",
            headers={"Content-Type": "application/json"}
        )

        assert response.status_code in [
            status.HTTP_422_UNPROCESSABLE_ENTITY,
            status.HTTP_400_BAD_REQUEST
        ]

    def test_missing_required_fields(self, client, mock_supabase):
        """Test validation of required fields"""
        response = client.post(
            "/auth/signup",
            json={}  # Missing all required fields
        )

        assert response.status_code == status.HTTP_422_UNPROCESSABLE_ENTITY
        data = response.json()
        assert "detail" in data


class TestCORS:
    """Test CORS configuration"""

    def test_cors_headers_present(self, client):
        """Test that CORS headers are present"""
        response = client.options("/")

        # Should have CORS headers
        assert "access-control-allow-origin" in [h.lower() for h in response.headers]

    def test_cors_allows_credentials(self, client):
        """Test that CORS allows credentials"""
        response = client.options("/")

        headers_lower = {k.lower(): v for k, v in response.headers.items()}
        # Should allow credentials
        assert headers_lower.get("access-control-allow-credentials") == "true"
