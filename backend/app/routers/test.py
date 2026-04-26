from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from app.services.gemini_service import test_gemini_connection, parse_resume_text

router = APIRouter(prefix="/test", tags=["Testing"])


@router.get("/gemini")
async def test_gemini():
    try:
        response = await test_gemini_connection()
        return {
            "status": "success",
            "message": "Gemini API is working!",
            "response": response
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


class ResumeTestRequest(BaseModel):
    resume_text: str


@router.post("/parse-resume")
async def test_parse_resume(request: ResumeTestRequest):
    try:
        parsed_data = await parse_resume_text(request.resume_text)
        return {
            "status": "success",
            "parsed_data": parsed_data
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
