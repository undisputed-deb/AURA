"""
Adaptive follow-up question generation service
Analyzes answers in real-time and generates clarifying questions
"""
import google.generativeai as genai
from app.config import settings
import json
from app.logging_config import logger

genai.configure(api_key=settings.GEMINI_API_KEY)

generation_config = {
    "temperature": 0.4,
    "top_p": 0.85,
    "top_k": 40,
}

model = genai.GenerativeModel('gemini-2.5-flash', generation_config=generation_config)


async def analyze_answer_quality(
    question_text: str,
    answer_transcript: str,
    question_context: dict
) -> dict:
    """
    Quick analysis to determine if a follow-up question is needed

    Returns:
        Dict with needs_followup (bool) and reason (str)
    """

    # Quick checks first
    word_count = len(answer_transcript.split())

    # If answer is very short (< 15 words), likely incomplete
    if word_count < 15:
        return {
            "needs_followup": True,
            "reason": "answer_too_short",
            "word_count": word_count
        }

    # If answer is decent length (50+ words), probably good enough
    if word_count >= 50:
        return {
            "needs_followup": False,
            "reason": "answer_adequate_length",
            "word_count": word_count
        }

    # Use AI for borderline cases (15-50 words)
    prompt = f"""You're interviewing a candidate. Determine if their answer is GOOD ENOUGH to move on, or if you need a follow-up.

Question: {question_text}
Their Answer: {answer_transcript}

Ask yourself:
1. Did they genuinely TRY to answer the question? (even if not perfect)
2. Did they provide ANY specific detail, example, or concrete information?
3. Does the answer show they understand what was asked?
4. Did they address the core of the question, even briefly?

ONLY ask follow-up if:
- They completely dodged/avoided the question
- Answer is just generic fluff with ZERO specifics (e.g., "I'm good at that" with no explanation)
- They only answered a tiny part of the question and ignored the rest
- For behavioral: They gave zero example/situation at all

DON'T ask follow-up if:
- They made a genuine attempt to answer with some detail
- They provided at least one specific example or fact
- Answer shows effort and understanding (even if could be better)
- They addressed most/all parts of the question
- It sounds like they tried but just gave a shorter answer

Think: "Is this answer good enough for an interview, or does it need clarification?"

Return JSON:
{{
    "needs_followup": true/false,
    "reason": "1-2 sentence explanation"
}}

Return ONLY JSON."""

    try:
        response = model.generate_content(prompt)
        result_text = response.text.strip()

        # Clean markdown
        if result_text.startswith('```json'):
            result_text = result_text[7:]
        if result_text.startswith('```'):
            result_text = result_text[3:]
        if result_text.endswith('```'):
            result_text = result_text[:-3]

        analysis = json.loads(result_text.strip())
        analysis['word_count'] = word_count
        return analysis

    except Exception as e:
        logger.error(f"Error analyzing answer quality: {e}")
        # Default to no follow-up if analysis fails
        return {
            "needs_followup": False,
            "reason": "analysis_failed",
            "word_count": word_count
        }


async def generate_followup_question(
    original_question: str,
    answer_transcript: str,
    question_context: dict,
    missing_elements: list = None
) -> dict:
    """
    Generate a natural follow-up question to dig deeper

    Returns:
        Dict with followup_question (str) and focus (str)
    """

    prompt = f"""Generate a brief follow-up question. The candidate's answer was incomplete.

Question: {original_question}
Their Answer: {answer_transcript}

Generate a SHORT (1 sentence), natural follow-up that asks for what's MISSING without repeating what they already said.

Good examples:
- "Can you give me a specific example of when you did that?"
- "What was the outcome or result?"
- "Walk me through your approach to that."
- "Tell me more about the technical challenges you faced."

Keep it conversational and focus on the gap in their answer.

Return JSON:
{{
    "followup_question": "short, natural follow-up question"
}}

Return ONLY JSON."""

    try:
        response = model.generate_content(prompt)
        result_text = response.text.strip()

        # Clean markdown
        if result_text.startswith('```json'):
            result_text = result_text[7:]
        if result_text.startswith('```'):
            result_text = result_text[3:]
        if result_text.endswith('```'):
            result_text = result_text[:-3]

        followup = json.loads(result_text.strip())
        return followup

    except Exception as e:
        logger.error(f"Error generating follow-up: {e}")
        # Return a generic follow-up
        return {
            "followup_question": "Could you elaborate on that with a specific example?",
            "focus": "getting more detail"
        }


async def should_ask_followup(
    question_text: str,
    answer_transcript: str,
    question_context: dict
) -> tuple[bool, dict]:
    """
    Determine if we should ask a follow-up and generate it if needed

    Returns:
        Tuple of (should_ask: bool, followup_data: dict)
    """

    # Analyze answer quality
    analysis = await analyze_answer_quality(
        question_text,
        answer_transcript,
        question_context
    )

    if not analysis.get('needs_followup', False):
        return False, {}

    # Generate follow-up question
    followup = await generate_followup_question(
        question_text,
        answer_transcript,
        question_context,
        analysis.get('missing_elements', [])
    )

    return True, {
        "followup_question": followup.get('followup_question'),
        "focus": followup.get('focus'),
        "reason": analysis.get('reason'),
        "original_answer_length": analysis.get('word_count', 0)
    }
