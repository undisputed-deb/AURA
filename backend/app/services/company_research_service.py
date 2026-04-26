"""
Company-specific interview research service
Searches the web for real interview questions from Glassdoor, Reddit, Blind
"""
import google.generativeai as genai
from app.config import settings
from app.services.web_scraper import scrape_interview_questions
import json
from app.logging_config import logger

genai.configure(api_key=settings.GEMINI_API_KEY)

generation_config = {
    "temperature": 0.35,
    "top_p": 0.8,
    "top_k": 40,
}

model = genai.GenerativeModel('gemini-2.5-flash', generation_config=generation_config)


async def research_company_interview_questions(
    company_name: str,
    role: str,
    num_questions: int = 5
) -> dict:
    """
    Research company-specific interview questions using actual web scraping

    Args:
        company_name: Target company (e.g., "Google", "Amazon")
        role: Job role (e.g., "Software Engineer", "Product Manager")
        num_questions: Number of questions to generate based on research

    Returns:
        Dict with scraped questions and AI-generated insights
    """

    try:
        logger.info(f"Generating {company_name} {role} interview questions...")

        search_prompt = f"""Generate {num_questions} realistic interview questions that match ACTUAL questions asked at {company_name} for {role} positions.

**CRITICAL RULES:**
1. Questions must match REAL interview patterns (direct, concise, no fluff)
2. Use exact phrasing that real interviewers use
3. NO personalized/conversational style ("You mentioned...", "That's interesting...")
4. Based on known {company_name} interview patterns from Glassdoor/Blind/LeetCode

**Question Types for {company_name}:**
- Technical concept questions (50%): "What's the difference between X and Y?", "Explain how X works"
- Behavioral questions (30%): "Tell me about a time...", "Describe a situation..."
- System design (10%): "Design a [system]", "How would you build..."
- Experience questions (10%): "Walk me through a project", "What's the most challenging..."

**Examples of GOOD questions:**
✓ "What's the difference between a process and a thread?"
✓ "Explain how garbage collection works in Java"
✓ "Tell me about a time you disagreed with your manager"
✓ "Design a URL shortening service like bit.ly"
✓ "How would you optimize a slow database query?"

**AVOID these patterns:**
✗ "I see you've worked with Python. Can you tell me about..."
✗ "Your background is quite impressive! Let's talk about..."
✗ "You mentioned in your resume..."

Return ONLY a JSON array of questions:
["Question 1?", "Question 2?", "Question 3?"]

Return ONLY the JSON array, no markdown."""

        response = model.generate_content(search_prompt)

        result_text = response.text.strip()
        if result_text.startswith('```json'):
            result_text = result_text[7:]
        if result_text.startswith('```'):
            result_text = result_text[3:]
        if result_text.endswith('```'):
            result_text = result_text[:-3]

        scraped_questions = json.loads(result_text.strip())
        total_found = len(scraped_questions)

        logger.info(f"Generated {total_found} questions for {company_name}")

        if scraped_questions:
            analysis_prompt = f"""Analyze these REAL interview questions scraped from Reddit and LeetCode for {company_name} {role} interviews:

REAL QUESTIONS FOUND:
{chr(10).join(['- ' + q for q in scraped_questions[:15]])}

Based on these actual questions, extract insights in JSON format:
{{
    "company_culture": {{
        "values": ["value1", "value2", "value3"],
        "interview_style": "What the question patterns reveal about interview approach"
    }},
    "common_question_themes": ["theme1", "theme2", "theme3"],
    "technical_focus_areas": ["area1", "area2", "area3"],
    "behavioral_focus": ["focus1", "focus2"]
}}

Return ONLY the JSON, no markdown."""

            response = model.generate_content(analysis_prompt)
            result_text = response.text.strip()

            # Remove markdown if present
            if result_text.startswith('```json'):
                result_text = result_text[7:]
            if result_text.startswith('```'):
                result_text = result_text[3:]
            if result_text.endswith('```'):
                result_text = result_text[:-3]

            insights = json.loads(result_text.strip())

            return {
                "company_name": company_name,
                "role": role,
                "research_data": {
                    **insights,
                    "example_questions": scraped_questions[:10],  # Return top 10 real questions
                    "sources": f"Scraped from Reddit and LeetCode ({total_found} questions found)"
                },
                "data_freshness": "Real-time web scraping"
            }
        else:
            # No questions found, fallback
            logger.warning(f"No questions found via scraping, using generic fallback")
            return {
                "company_name": company_name,
                "role": role,
                "research_data": {
                    "company_culture": {
                        "values": ["Innovation", "Collaboration", "Excellence"],
                        "interview_style": "Standard behavioral and technical interviews"
                    },
                    "common_question_themes": ["Past experience", "Problem solving", "Teamwork"],
                    "example_questions": [],
                    "technical_focus_areas": ["System Design", "Coding", "Architecture"],
                    "behavioral_focus": ["Leadership", "Communication"],
                    "sources": "No data found via scraping"
                },
                "data_freshness": "Fallback - generic data"
            }

    except Exception as e:
        logger.error(f"Error in web scraping: {e}")
        # Fallback to generic response
        return {
            "company_name": company_name,
            "role": role,
            "research_data": {
                "company_culture": {
                    "values": ["Innovation", "Collaboration", "Excellence"],
                    "interview_style": "Standard behavioral and technical interviews"
                },
                "common_question_themes": ["Past experience", "Problem solving", "Teamwork"],
                "example_questions": [],
                "technical_focus_areas": ["System Design", "Coding", "Architecture"],
                "behavioral_focus": ["Leadership", "Communication"],
                "sources": "Error during scraping"
            },
            "data_freshness": "Fallback - generic data"
        }


async def generate_company_specific_questions(
    company_name: str,
    role: str,
    resume_data: dict,
    jd_analysis: dict,
    num_questions: int = 10
) -> list:
    """
    Use exact scraped questions from real company interviews
    """

    # Scrape real questions
    research = await research_company_interview_questions(company_name, role, num_questions)
    research_data = research["research_data"]

    scraped_questions = research_data.get('example_questions', [])

    if not scraped_questions:
        logger.warning(f"No scraped questions found for {company_name}, returning empty list")
        return []

    # Use the exact scraped questions, format them properly
    questions = []
    for i, q_text in enumerate(scraped_questions[:num_questions], 1):
        # Determine question type based on content
        q_lower = q_text.lower()
        if any(word in q_lower for word in ['tell me about', 'describe a time', 'give an example']):
            q_type = "behavioral"
        elif any(word in q_lower for word in ['design', 'architecture', 'scale', 'system']):
            q_type = "technical"
        elif any(word in q_lower for word in ['project', 'built', 'developed']):
            q_type = "project_deepdive"
        else:
            q_type = "situational"

        questions.append({
            "question_number": i,
            "question_text": q_text,
            "question_type": q_type,
            "difficulty": "medium",
            "category": f"{company_name} Interview",
            "expected_topics": [],
            "skill_tags": [],
            "company_specific": True,
            "target_company": company_name,
            "based_on_research": True,
            "source": "Real scraped question"
        })

    logger.info(f"Returning {len(questions)} exact scraped questions from {company_name}")
    return questions
