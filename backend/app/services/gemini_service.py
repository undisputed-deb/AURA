import google.generativeai as genai
from app.config import settings
from tenacity import retry, stop_after_attempt, wait_exponential, retry_if_exception_type
from app.logging_config import logger


genai.configure(api_key=settings.GEMINI_API_KEY)

generation_config = {
    "temperature": 0.3,
    "top_p": 0.8,
    "top_k": 40,
}

model = genai.GenerativeModel(
    'gemini-2.5-flash',
    generation_config=generation_config
)


# Retry decorator for AI service calls
# Retries up to 3 times with exponential backoff: 1s, 2s, 4s
ai_retry = retry(
    stop=stop_after_attempt(3),
    wait=wait_exponential(multiplier=1, min=1, max=10),
    retry=retry_if_exception_type((Exception,)),
    before_sleep=lambda retry_state: logger.warning(
        f"AI service retry attempt {retry_state.attempt_number}/3"
    )
)


@ai_retry
async def test_gemini_connection() -> str:
    try:
        logger.info("Testing Gemini connection")
        response = model.generate_content("Say hello!")
        logger.info("Gemini connection test successful")
        return response.text
    except Exception as e:
        logger.error(f"Gemini API error: {str(e)}")
        raise Exception(f"Gemini API error: {str(e)}")


@ai_retry
async def parse_resume_text(resume_text: str) -> dict:

    logger.info("Parsing resume text with Gemini")
    prompt = f"""
You are a resume parser specialized in technical resumes. Extract the following information from this resume and return it as valid JSON.

Resume text:
{resume_text}

Extract the following fields (use null for missing fields, use empty arrays [] for missing lists):

{{
  "name": "string - Full name of candidate",
  "email": "string - Email address",
  "phone": "string - Phone number if present",
  "linkedin": "string - LinkedIn URL",
  "github": "string - GitHub URL",
  "portfolio": "string - Personal website/portfolio URL",
  "location": "string - City, State",

  "education": [
    {{
      "institution": "string - University/College name",
      "degree": "string - Degree type and major (e.g., Bachelor of Science in Computer Science)",
      "minor": "string - Minor if present",
      "graduation_date": "string - Expected or actual graduation (e.g., May 2027)",
      "location": "string - City, State",
      "gpa": "string - GPA if mentioned",
      "relevant_coursework": ["array of course names"]
    }}
  ],

  "technical_skills": {{
    "languages": ["array of programming languages"],
    "frameworks_libraries": ["array of frameworks and libraries"],
    "cloud_databases": ["array of cloud platforms and databases"],
    "ai_tools": ["array of AI/ML tools"],
    "developer_tools": ["array of development tools"]
  }},

  "experience": [
    {{
      "title": "string - Job title",
      "company": "string - Company name",
      "location": "string - City, State",
      "duration": "string - Start date - End date (e.g., June 2025 - August 2025)",
      "type": "string - Full-time, Intern, Part-time, etc.",
      "responsibilities": ["array of bullet points describing work done"]
    }}
  ],

  "projects": [
    {{
      "name": "string - Project name",
      "technologies": ["array of technologies used"],
      "github_url": "string - GitHub link if present",
      "live_url": "string - Live demo link if present",
      "description": ["array of bullet points describing the project"]
    }}
  ],

  "leadership": [
    {{
      "title": "string - Role/position",
      "organization": "string - Organization name",
      "duration": "string - Time period",
      "description": ["array of accomplishments/responsibilities"]
    }}
  ],

  "certifications": ["array of certifications if any"],
  "awards": ["array of awards/honors if any"]
}}

IMPORTANT:
- Return ONLY valid JSON, no markdown code blocks or extra text
- If a section doesn't exist, use null or empty array []
- Keep bullet points as separate array items
- Preserve technical terms exactly as written
- Extract ALL URLs (LinkedIn, GitHub, portfolio)

Resume:
{resume_text}
"""

    try:
        response = model.generate_content(prompt)
        json_text = response.text.strip()

        if json_text.startswith('```json'):
            json_text = json_text[7:]
        if json_text.startswith('```'):
            json_text = json_text[3:]
        if json_text.endswith('```'):
            json_text = json_text[:-3]

        json_text = json_text.strip()

        import json
        parsed_data = json.loads(json_text)

        logger.info("Resume parsed successfully")
        return parsed_data

    except json.JSONDecodeError as e:
        logger.error(f"Failed to parse Gemini response as JSON: {str(e)}")
        raise Exception(f"Failed to parse Gemini response as JSON: {str(e)}")
    except Exception as e:
        logger.error(f"Resume parsing error: {str(e)}")
        raise Exception(f"Resume parsing error: {str(e)}")
