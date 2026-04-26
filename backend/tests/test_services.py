"""
Unit tests for service layer functions
"""
import pytest
from unittest.mock import Mock, patch, AsyncMock
import json


class TestGeminiService:
    """Tests for Gemini AI service"""

    @pytest.mark.asyncio
    async def test_parse_resume_text_success(self, mock_gemini, sample_resume_data):
        """Test successful resume parsing"""
        from app.services.gemini_service import parse_resume_text

        # Mock Gemini response
        mock_gemini.generate_content.return_value.text = json.dumps(sample_resume_data)

        result = await parse_resume_text("Sample resume text")

        assert result["name"] == "John Doe"
        assert result["email"] == "john@example.com"
        assert "Python" in result["technical_skills"]["languages"]
        mock_gemini.generate_content.assert_called_once()

    @pytest.mark.asyncio
    async def test_parse_resume_handles_json_in_markdown(self, mock_gemini, sample_resume_data):
        """Test parsing when Gemini returns JSON wrapped in markdown"""
        from app.services.gemini_service import parse_resume_text

        # Mock response with markdown code blocks
        markdown_response = f"```json\n{json.dumps(sample_resume_data)}\n```"
        mock_gemini.generate_content.return_value.text = markdown_response

        result = await parse_resume_text("Sample resume text")

        assert result["name"] == "John Doe"
        assert result is not None

    @pytest.mark.asyncio
    async def test_parse_resume_handles_api_failure(self, mock_gemini):
        """Test handling of Gemini API failures"""
        from app.services.gemini_service import parse_resume_text

        # Mock API failure
        mock_gemini.generate_content.side_effect = Exception("API Error")

        with pytest.raises(Exception) as exc_info:
            await parse_resume_text("Sample resume text")

        assert "Resume parsing error" in str(exc_info.value)

    @pytest.mark.asyncio
    async def test_parse_resume_handles_invalid_json(self, mock_gemini):
        """Test handling of invalid JSON response"""
        from app.services.gemini_service import parse_resume_text

        # Mock invalid JSON response
        mock_gemini.generate_content.return_value.text = "This is not valid JSON"

        with pytest.raises(Exception) as exc_info:
            await parse_resume_text("Sample resume text")

        assert "Failed to parse" in str(exc_info.value)


class TestEvaluationService:
    """Tests for answer evaluation service"""

    @pytest.mark.asyncio
    async def test_evaluate_answer_success(self, mock_gemini, sample_resume_data, sample_jd_analysis):
        """Test successful answer evaluation"""
        from app.services.evaluation_service import evaluate_answer

        # Mock evaluation response
        eval_data = {
            "score": 8,
            "strengths": ["Good example", "Clear communication"],
            "weaknesses": ["Could be more specific"],
            "improvements": ["Add metrics"],
            "feedback": "Good answer overall",
            "evidence_quotes": ["I worked on..."],
            "star_analysis": None,
            "missing_keywords": [],
            "technical_accuracy_notes": ""
        }
        mock_gemini.generate_content.return_value.text = json.dumps(eval_data)

        result = await evaluate_answer(
            question_text="Tell me about a project",
            question_context={"question_type": "behavioral", "difficulty": "medium"},
            answer_transcript="I worked on a project where...",
            resume_data=sample_resume_data,
            jd_analysis=sample_jd_analysis
        )

        assert result["score"] == 8
        assert len(result["strengths"]) == 2
        assert len(result["improvements"]) == 1

    @pytest.mark.asyncio
    async def test_evaluate_answer_clamps_score(self, mock_gemini, sample_resume_data, sample_jd_analysis):
        """Test that scores are clamped to 1-10 range"""
        from app.services.evaluation_service import evaluate_answer

        # Mock response with invalid score
        eval_data = {
            "score": 15,  # Invalid - should be clamped to 10
            "strengths": [],
            "weaknesses": [],
            "improvements": [],
            "feedback": "Test"
        }
        mock_gemini.generate_content.return_value.text = json.dumps(eval_data)

        result = await evaluate_answer(
            question_text="Test question",
            question_context={},
            answer_transcript="Test answer",
            resume_data=sample_resume_data,
            jd_analysis=sample_jd_analysis
        )

        assert result["score"] == 10  # Clamped to max

    @pytest.mark.asyncio
    async def test_evaluate_answer_handles_api_failure(self, mock_gemini, sample_resume_data, sample_jd_analysis):
        """Test graceful degradation on API failure"""
        from app.services.evaluation_service import evaluate_answer

        # Mock API failure
        mock_gemini.generate_content.side_effect = Exception("API Error")

        # Should return default evaluation instead of crashing
        result = await evaluate_answer(
            question_text="Test question",
            question_context={},
            answer_transcript="Test answer",
            resume_data=sample_resume_data,
            jd_analysis=sample_jd_analysis
        )

        assert result["score"] == 5  # Default fallback score
        assert "unable to evaluate" in result["strengths"][0].lower()

    @pytest.mark.asyncio
    async def test_calculate_overall_score(self):
        """Test overall score calculation"""
        from app.services.evaluation_service import calculate_overall_score

        evaluations = [
            {"score": 8},
            {"score": 7},
            {"score": 9}
        ]

        result = await calculate_overall_score(evaluations)
        assert result == 8.0  # Average of 8, 7, 9

    @pytest.mark.asyncio
    async def test_calculate_overall_score_empty_list(self):
        """Test overall score with empty evaluations"""
        from app.services.evaluation_service import calculate_overall_score

        result = await calculate_overall_score([])
        assert result == 0.0


class TestPDFParser:
    """Tests for PDF parsing service"""

    def test_extract_text_from_pdf_success(self):
        """Test successful PDF text extraction"""
        from app.services.pdf_parser import extract_text_from_pdf
        from io import BytesIO

        # Create a simple test PDF (would need actual PDF bytes in real test)
        # For now, we'll skip this as it requires actual PDF generation
        pytest.skip("Requires actual PDF file for testing")

    def test_extract_text_handles_empty_pdf(self):
        """Test handling of empty PDF files"""
        # Would test with an empty PDF
        pytest.skip("Requires actual PDF file for testing")


class TestRetryLogic:
    """Tests for retry logic in AI services"""

    @pytest.mark.asyncio
    async def test_gemini_retries_on_failure(self, mock_gemini):
        """Test that Gemini service retries on failure"""
        from app.services.gemini_service import parse_resume_text

        # Mock: fail twice, then succeed
        mock_gemini.generate_content.side_effect = [
            Exception("Temporary error"),
            Exception("Temporary error"),
            Mock(text='{"name": "Test"}')
        ]

        result = await parse_resume_text("Test resume")
        assert result["name"] == "Test"
        assert mock_gemini.generate_content.call_count == 3

    @pytest.mark.asyncio
    async def test_gemini_fails_after_max_retries(self, mock_gemini):
        """Test that service fails after exhausting retries"""
        from app.services.gemini_service import parse_resume_text

        # Mock: always fail
        mock_gemini.generate_content.side_effect = Exception("Persistent error")

        with pytest.raises(Exception):
            await parse_resume_text("Test resume")

        # Should have tried 3 times (initial + 2 retries)
        assert mock_gemini.generate_content.call_count == 3
