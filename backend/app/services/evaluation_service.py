"""
Answer evaluation service using Gemini AI
"""
import json
from typing import Dict, Any
import google.generativeai as genai
from app.config import settings
from tenacity import retry, stop_after_attempt, wait_exponential, retry_if_exception_type
from app.logging_config import logger

# Configure Gemini
genai.configure(api_key=settings.GEMINI_API_KEY)

generation_config = {
    "temperature": 0.3,
    "top_p": 0.8,
    "top_k": 40,
}

ai_retry = retry(
    stop=stop_after_attempt(3),
    wait=wait_exponential(multiplier=1, min=1, max=10),
    retry=retry_if_exception_type((Exception,)),
    before_sleep=lambda retry_state: logger.warning(
        f"Evaluation service retry attempt {retry_state.attempt_number}/3"
    )
)


@ai_retry
async def evaluate_answer(
    question_text: str,
    question_context: Dict[str, Any],
    answer_transcript: str,
    resume_data: Dict[str, Any],
    jd_analysis: Dict[str, Any]
) -> Dict[str, Any]:
    """
    Evaluate an interview answer using Gemini AI

    Args:
        question_text: The interview question
        question_context: Question metadata (type, difficulty, category)
        answer_transcript: User's answer transcript
        resume_data: Parsed resume data
        jd_analysis: Job description analysis

    Returns:
        Dict containing:
        - score: int (1-10)
        - strengths: list of strings
        - weaknesses: list of strings
        - improvements: list of strings
        - feedback: overall feedback text
        - star_analysis: dict (if behavioral question)
    """

    # Build evaluation prompt
    prompt = f"""You are an expert interview coach evaluating a candidate's answer to an interview question.

**Job Context:**
Position: {jd_analysis.get('job_title', 'Not specified')}
Experience Level: {jd_analysis.get('experience_level', 'Not specified')}
Required Skills: {', '.join(jd_analysis.get('required_skills', []))}

**Candidate Background:**
Experience: {json.dumps(resume_data.get('experience', []), indent=2)}
Skills: {', '.join(resume_data.get('skills', []))}
Education: {json.dumps(resume_data.get('education', []), indent=2)}

**Question Details:**
Type: {question_context.get('question_type', 'general')}
Difficulty: {question_context.get('difficulty', 'medium')}
Category: {question_context.get('category', 'general')}
Question: {question_text}

**Candidate's Answer:**
{answer_transcript}

**Evaluation Criteria:**
1. Relevance - Does the answer address the question? (25%)
2. Specificity - Are there concrete examples and details? (25%)
3. Clarity - Is the answer well-structured and clear? (20%)
4. Technical Accuracy - Is the information technically sound? (20%)
5. Job Alignment - Does it align with job requirements? (10%)

**For Behavioral Questions (STAR Method):**
- Situation: Context and background
- Task: Challenge or responsibility
- Action: Specific actions taken
- Result: Outcomes and learnings

**Please provide a comprehensive evaluation in the following JSON format:**
{{
    "score": <integer from 1-10>,
    "strengths": [
        "<specific strength 1>",
        "<specific strength 2>",
        "<specific strength 3>"
    ],
    "weaknesses": [
        "<specific weakness 1>",
        "<specific weakness 2>"
    ],
    "improvements": [
        "<actionable improvement 1>",
        "<actionable improvement 2>",
        "<actionable improvement 3>"
    ],
    "feedback": "<2-3 sentence overall assessment>",
    "evidence_quotes": [
        "<quote from answer that demonstrates strength or weakness>"
    ],
    "star_analysis": {{
        "situation": "<present/missing/weak>",
        "task": "<present/missing/weak>",
        "action": "<present/missing/weak>",
        "result": "<present/missing/weak>",
        "notes": "<brief explanation>"
    }},
    "missing_keywords": ["<keyword from job requirements not mentioned>"],
    "technical_accuracy_notes": "<any technical errors or misconceptions>"
}}

Be constructive and specific. Provide actionable feedback that helps the candidate improve.
"""

    try:
        logger.info(f"Evaluating answer for question: {question_text[:50]}...")
        model = genai.GenerativeModel('gemini-2.5-flash', generation_config=generation_config)
        response = model.generate_content(prompt)

        # Extract JSON from response
        response_text = response.text.strip()

        # Remove markdown code blocks if present
        if response_text.startswith("```json"):
            response_text = response_text[7:]
        if response_text.startswith("```"):
            response_text = response_text[3:]
        if response_text.endswith("```"):
            response_text = response_text[:-3]

        response_text = response_text.strip()

        # Parse JSON
        evaluation = json.loads(response_text)

        # Validate score is between 1-10
        evaluation['score'] = max(1, min(10, evaluation.get('score', 5)))

        logger.info(f"Answer evaluated successfully with score: {evaluation['score']}/10")
        return evaluation

    except Exception as e:
        logger.error(f"Error evaluating answer: {e}")
        # Return a default evaluation if API fails
        return {
            "score": 5,
            "strengths": ["Unable to evaluate due to technical error"],
            "weaknesses": [],
            "improvements": ["Please try again later"],
            "feedback": "Evaluation could not be completed due to a technical error.",
            "evidence_quotes": [],
            "star_analysis": None,
            "missing_keywords": [],
            "technical_accuracy_notes": ""
        }


async def calculate_overall_score(evaluations: list) -> float:
    """
    Calculate overall interview score from individual answer evaluations

    Args:
        evaluations: List of evaluation dicts with 'score' key

    Returns:
        Average score (float)
    """
    if not evaluations:
        return 0.0

    total = sum(e.get('score', 0) for e in evaluations)
    return round(total / len(evaluations), 2)


def analyze_speaking_patterns(transcript: str, audio_duration_seconds: float = None) -> Dict[str, Any]:
    """
    Analyze speaking patterns from transcript

    Args:
        transcript: The answer transcript
        audio_duration_seconds: Duration of audio (if available)

    Returns:
        Dict containing:
        - words_per_minute: Speaking pace
        - filler_words: List of detected filler words with counts
        - total_filler_count: Total number of filler words
        - filler_percentage: Percentage of words that are fillers
        - speaking_pace_feedback: Assessment of speaking pace
    """

    # Common filler words and phrases
    FILLER_WORDS = {
        'um', 'uh', 'umm', 'uhh', 'like', 'you know', 'sort of', 'kind of',
        'i mean', 'basically', 'actually', 'literally', 'right', 'okay',
        'so', 'well', 'yeah', 'just', 'really'
    }

    # Clean and tokenize
    words = transcript.lower().split()
    total_words = len(words)

    if total_words == 0:
        return {
            "words_per_minute": 0,
            "filler_words": {},
            "total_filler_count": 0,
            "filler_percentage": 0,
            "speaking_pace_feedback": "No speech detected"
        }

    # Count filler words
    filler_counts = {}
    total_fillers = 0

    for filler in FILLER_WORDS:
        if ' ' in filler:  # Multi-word phrases
            count = transcript.lower().count(filler)
        else:  # Single words
            count = words.count(filler)

        if count > 0:
            filler_counts[filler] = count
            total_fillers += count

    # Calculate filler percentage
    filler_percentage = round((total_fillers / total_words) * 100, 1)

    # Calculate WPM if duration provided
    wpm = None
    wpm_feedback = ""

    if audio_duration_seconds and audio_duration_seconds > 0:
        minutes = audio_duration_seconds / 60
        wpm = round(total_words / minutes, 1)

        # Assess speaking pace (typical conversational: 120-150 WPM)
        if wpm < 100:
            wpm_feedback = "Consider speaking slightly faster for better engagement"
        elif wpm <= 150:
            wpm_feedback = "Good speaking pace - clear and easy to follow"
        elif wpm <= 180:
            wpm_feedback = "Slightly fast - ensure you're articulating clearly"
        else:
            wpm_feedback = "Speaking too fast - slow down for better clarity"

    # Assess filler word usage
    if filler_percentage < 2:
        filler_feedback = "Excellent - minimal filler words"
    elif filler_percentage < 5:
        filler_feedback = "Good - occasional filler words are natural"
    elif filler_percentage < 10:
        filler_feedback = "Moderate - try to reduce filler words"
    else:
        filler_feedback = "High filler word usage - practice pausing instead"

    return {
        "words_per_minute": wpm,
        "total_words": total_words,
        "filler_words": dict(sorted(filler_counts.items(), key=lambda x: x[1], reverse=True)),
        "total_filler_count": total_fillers,
        "filler_percentage": filler_percentage,
        "speaking_pace_feedback": wpm_feedback if wpm else "Audio duration not available",
        "filler_word_feedback": filler_feedback
    }


async def generate_interview_insights(
    evaluations: list,
    jd_analysis: Dict[str, Any]
) -> Dict[str, Any]:
    """
    Generate overall insights and recommendations for the interview

    Args:
        evaluations: List of all answer evaluations
        jd_analysis: Job description analysis

    Returns:
        Dict with insights, trends, and recommendations
    """

    if not evaluations:
        return {
            "top_strengths": [],
            "areas_for_improvement": [],
            "skill_gaps": [],
            "overall_feedback": "No evaluations available"
        }

    # Calculate category scores
    category_scores = {}
    for eval_data in evaluations:
        category = eval_data.get('question_category', 'general')
        if category not in category_scores:
            category_scores[category] = []
        category_scores[category].append(eval_data.get('score', 0))

    # Average by category
    category_averages = {
        cat: sum(scores) / len(scores)
        for cat, scores in category_scores.items()
    }

    # Collect all strengths and weaknesses
    all_strengths = []
    all_weaknesses = []
    all_missing_keywords = []

    for eval_data in evaluations:
        all_strengths.extend(eval_data.get('strengths', []))
        all_weaknesses.extend(eval_data.get('weaknesses', []))
        all_missing_keywords.extend(eval_data.get('missing_keywords', []))

    # Find most common patterns
    # Note: More sophisticated NLP later

    return {
        "category_scores": category_averages,
        "top_strengths": list(set(all_strengths))[:5],
        "areas_for_improvement": list(set(all_weaknesses))[:5],
        "skill_gaps": list(set(all_missing_keywords))[:5],
        "overall_feedback": f"Your strongest area was {max(category_averages, key=category_averages.get)} with an average score of {max(category_averages.values()):.1f}/10."
    }


def aggregate_skill_performance(evaluations: list) -> Dict[str, Any]:
    """
    Aggregate performance by skill tags across all questions

    Args:
        evaluations: List of evaluation dicts with skill_tags and scores

    Returns:
        Dict with skill-level performance breakdown
    """
    skill_scores = {}  # {skill_name: [scores]}
    
    for eval_data in evaluations:
        score = eval_data.get('score', 0)
        skill_tags = eval_data.get('skill_tags', [])
        
        for skill in skill_tags:
            if skill not in skill_scores:
                skill_scores[skill] = []
            skill_scores[skill].append(score)
    
    # Calculate averages and counts
    skill_performance = {}
    for skill, scores in skill_scores.items():
        avg_score = sum(scores) / len(scores)
        skill_performance[skill] = {
            "average_score": round(avg_score, 1),
            "questions_count": len(scores),
            "assessment": _get_skill_assessment(avg_score)
        }
    
    # Sort by average score
    sorted_skills = sorted(
        skill_performance.items(),
        key=lambda x: x[1]['average_score'],
        reverse=True
    )
    
    # Identify strengths and weaknesses
    strengths = [s[0] for s in sorted_skills if s[1]['average_score'] >= 7.0][:5]
    weaknesses = [s[0] for s in sorted_skills if s[1]['average_score'] < 6.0][:5]
    
    return {
        "skill_breakdown": dict(sorted_skills),
        "top_skills": strengths,
        "skills_to_improve": weaknesses,
        "total_skills_assessed": len(skill_scores)
    }


def _get_skill_assessment(score: float) -> str:
    """Get qualitative assessment for a skill score"""
    if score >= 8.0:
        return "Strong"
    elif score >= 6.5:
        return "Proficient"
    elif score >= 5.0:
        return "Developing"
    else:
        return "Needs Improvement"
