"""
Interview generation service using Gemini AI
"""
import google.generativeai as genai
from app.config import settings
import json

genai.configure(api_key=settings.GEMINI_API_KEY)

generation_config = {
    "temperature": 0.4,
    "top_p": 0.85,
    "top_k": 40,
}

model = genai.GenerativeModel(
    'gemini-2.5-flash',
    generation_config=generation_config
)


async def analyze_job_description(jd_text: str) -> dict:
    """
    Analyze job description to extract key requirements

    Args:
        jd_text: Job description text

    Returns:
        Dictionary with analyzed JD data
    """
    prompt = f"""
    Analyze this job description and extract key information in JSON format.

    Job Description:
    {jd_text}

    Return a JSON object with:
    {{
        "job_title": "extracted job title",
        "company": "company name if mentioned",
        "required_skills": ["skill1", "skill2", ...],
        "preferred_skills": ["skill1", "skill2", ...],
        "experience_level": "entry/mid/senior",
        "key_responsibilities": ["responsibility1", "responsibility2", ...],
        "technical_requirements": ["requirement1", "requirement2", ...],
        "soft_skills": ["skill1", "skill2", ...]
    }}

    Extract as much detail as possible. If information is not available, use null.
    Return ONLY the JSON object, no additional text.
    """

    response = model.generate_content(prompt)

    # Parse JSON from response
    import json
    result_text = response.text.strip()

    # Remove markdown code blocks if present
    if result_text.startswith('```json'):
        result_text = result_text[7:]
    if result_text.startswith('```'):
        result_text = result_text[3:]
    if result_text.endswith('```'):
        result_text = result_text[:-3]

    return json.loads(result_text.strip())


async def generate_interview_questions(resume_data: dict, jd_analysis: dict, num_questions: int = 10, raw_jd: str = None) -> list:
    """
    Generate interview questions based on resume and job description

    Args:
        resume_data: Parsed resume data
        jd_analysis: Analyzed job description
        num_questions: Number of questions to generate
        raw_jd: Raw job description text (optional, for full context)

    Returns:
        List of question dictionaries
    """

    # Extract detailed info from resume
    skills = resume_data.get('technical_skills', {})
    all_skills = []
    if skills:
        all_skills.extend(skills.get('languages', []))
        all_skills.extend(skills.get('frameworks_libraries', []))
        all_skills.extend(skills.get('cloud_databases', []))

    experiences = resume_data.get('experience', [])
    projects = resume_data.get('projects', [])

    experience_context = ""
    if experiences:
        for exp in experiences:
            experience_context += f"\n- {exp.get('title', '')} at {exp.get('company', '')}: {', '.join(exp.get('responsibilities', []))}"

    project_context = ""
    if projects:
        for proj in projects:
            project_context += f"\n- {proj.get('name', '')}: {', '.join(proj.get('description', []))}"

    # Helper function to safely join lists
    def safe_join(items, default=''):
        if isinstance(items, list):
            return ', '.join(str(item) for item in items)
        elif isinstance(items, str):
            return items
        return default

    # Include raw JD for full context if available
    jd_context = ""
    if raw_jd:
        jd_context = f"""
**FULL JOB DESCRIPTION (use this as primary source of truth):**
{raw_jd}

**EXTRACTED KEY POINTS (use as hints, but don't limit yourself to these):**"""

    prompt = f"""You are generating realistic interview questions for a {jd_analysis.get('job_title', 'Software Engineer')} position.
{jd_context}
**Job Requirements (Required Skills):** {safe_join(jd_analysis.get('required_skills', []))}
**Job Requirements (Preferred Skills):** {safe_join(jd_analysis.get('preferred_skills', []))}
**Technical Requirements:** {safe_join(jd_analysis.get('technical_requirements', []))}
**Soft Skills Needed:** {safe_join(jd_analysis.get('soft_skills', []))}
**Key Responsibilities:** {safe_join(jd_analysis.get('key_responsibilities', []))}
**Company/Role:** {jd_analysis.get('company', 'Not specified')}

**Candidate Skills:** {', '.join(all_skills)}
**Candidate Experience:**{experience_context}
**Candidate Projects:**{project_context}
**Experience Level:** {jd_analysis.get('experience_level', 'mid')}

Generate {num_questions} interview questions that match REAL interview patterns AND are RELEVANT to both the job requirements and the candidate's background.

**CRITICAL RULES:**
1. Questions must be DIRECT and CONCISE (no conversational fluff)
2. NO personalized references like "You mentioned..." or "Your project..."
3. NO compliments or narrative style ("sounds fascinating!")
4. Ask questions a HUMAN interviewer would actually ask
5. Use industry-standard phrasing

**Question Type Distribution:**
- 50% Technical Definition/Concept Questions (direct, knowledge-based)
- 30% Behavioral Questions (STAR method, past experiences)
- 20% Experience/Project Questions (open-ended but brief)

**TECHNICAL QUESTIONS - Examples of GOOD patterns:**
✓ "What's the difference between LEFT JOIN and RIGHT JOIN in SQL?"
✓ "Explain how closures work in JavaScript"
✓ "What is normalization in databases?"
✓ "How does the event loop work in Node.js?"
✓ "What are the main differences between REST and GraphQL?"
✓ "Explain the virtual DOM in React"
✓ "What is dependency injection?"
✓ "How would you optimize a slow-running SQL query?"

**BEHAVIORAL QUESTIONS - Examples of GOOD patterns:**
✓ "Tell me about a time you had a conflict with a coworker"
✓ "Describe a situation where you had to meet a tight deadline"
✓ "Tell me about the most difficult bug you've fixed recently"
✓ "How do you handle receiving criticism on your work?"
✓ "Describe a time you had to learn a new technology quickly"

**EXPERIENCE QUESTIONS - Examples of GOOD patterns:**
✓ "Walk me through a project you're most proud of"
✓ "What's the most challenging technical problem you've solved?"
✓ "Tell me about your experience with [specific technology from resume]"
✓ "What challenges have you faced working in a team?"

**AVOID these patterns:**
✗ "You mentioned working with SQL. Can you describe a time..."
✗ "Your OpenGym project sounds fascinating! Can you walk me through..."
✗ "I see you have experience with Python..."
✗ "That's interesting! Tell me more about..."

**Question Selection Strategy - CRITICAL RULES:**

1. **ONLY ask about what the candidate has actually done or used**
   - Review the candidate's skills, projects, and experience carefully
   - If a technology/concept is NOT in their resume, do NOT ask about it
   - Example: If JD mentions "Terraform" but candidate has no IaC experience → ask about their DevOps/automation experience instead
   - Example: If JD mentions "RBAC" but candidate hasn't worked with it → ask about their authentication/security work instead

2. **Find the overlap between JD requirements and candidate experience**
   - JD needs cloud (Azure/GCP) + Candidate has AWS → ask about AWS and cloud concepts they know
   - JD needs Python automation + Candidate has Python projects → ask about their automation scripts
   - JD needs identity management + Candidate has no IAM experience → ask about their API security or auth implementation

3. **When there's NO direct overlap, ask transferable questions**
   - Focus on fundamentals and problem-solving approaches the candidate CAN answer
   - Example: Instead of "Explain RBAC" → "How did you handle user permissions in your projects?"
   - Example: Instead of "What is Terraform?" → "How would you approach automating infrastructure deployment?"

4. **Question types based on experience match:**
   - 60% questions about technologies the candidate HAS used (from their resume)
   - 30% behavioral questions about situations they've likely faced
   - 10% conceptual questions about transferable skills (NOT technologies they've never touched)

5. **Difficulty matching:**
   - Entry level: Focus on fundamentals and what they've learned
   - Mid level: Mix of their experience + how they'd apply it
   - Senior: System design and architecture based on their projects

6. **NEVER ask textbook questions about unfamiliar technologies**
   - Don't ask "What is X?" if X isn't in their resume
   - Don't test knowledge of tools they've never claimed to use
   - Every question must be answerable based on their actual experience

Return JSON array with {num_questions} questions:
[
    {{
        "question_number": 1,
        "question_text": "Direct question here - no fluff",
        "question_type": "technical_concept|technical_coding|behavioral|experience|system_design",
        "difficulty": "easy|medium|hard",
        "category": "specific skill or topic",
        "expected_topics": ["topic1", "topic2"],
        "skill_tags": ["relevant_skill"]
    }}
]

Return ONLY valid JSON, no markdown."""

    response = model.generate_content(prompt)

    # Parse JSON from response
    import json
    result_text = response.text.strip()

    # Remove markdown code blocks if present
    if result_text.startswith('```json'):
        result_text = result_text[7:]
    if result_text.startswith('```'):
        result_text = result_text[3:]
    if result_text.endswith('```'):
        result_text = result_text[:-3]

    return json.loads(result_text.strip())

async def generate_ideal_answer(
    question_text: str,
    question_context: dict,
    resume_data: dict,
    jd_analysis: dict,
    user_answer: str = None
) -> dict:
    """
    Generate an ideal answer example for a given question
    Uses the user's answer context to make it more relevant
    """
    skills = resume_data.get('technical_skills', {})
    all_skills = []
    if skills:
        all_skills.extend(skills.get('languages', []))
        all_skills.extend(skills.get('frameworks_libraries', []))
        all_skills.extend(skills.get('cloud_databases', []))

    question_type = question_context.get('question_type', 'technical')

    # Build context from user's answer if provided
    user_context = ""
    if user_answer:
        user_context = f"""
**User's Answer (for context):**
{user_answer}

IMPORTANT: Use the SAME scenario/project/experience mentioned in the user's answer, but show how to answer it more effectively.
If they mentioned "NYC subway analysis project", use that same project.
If they mentioned "worked at Company X", reference that same company.
Keep their story but improve the structure, detail, and delivery.
"""

    prompt = f"""Generate an IDEAL ANSWER EXAMPLE for this interview question.

Question: {question_text}
Type: {question_type}
Job: {jd_analysis.get('job_title', 'Software Engineer')}
Skills: {', '.join(all_skills[:10])}

{user_context}

Generate a strong 120-150 word answer that:
- Uses the SAME context/scenario as the user if they provided one
- Shows proper STAR structure (for behavioral/situational questions)
- Balances technical depth with simplicity (explain concepts clearly without being overly complex)
- Includes the "why" behind decisions
- Demonstrates learning and outcomes
- Keeps it conversational and easy to follow

CRITICAL FORMATTING RULES:
- Write in PLAIN TEXT with NO markdown formatting
- DO NOT use asterisks (**), backticks (`), or any markdown symbols
- Use simple quotation marks for code/terms if needed (e.g., "list" not `list`)
- Write naturally like you're speaking to an interviewer
- Keep technical terms clear but don't over-explain basic concepts

For situational/behavioral questions:
- Situation: Set clear context (use their scenario!)
- Task: Define the specific challenge
- Action: Explain concrete steps with technical details
- Result: Quantify outcomes and learnings

Return JSON:
{{
    "ideal_answer": "Full improved answer in PLAIN TEXT with NO markdown symbols",
    "key_points": ["point 1", "point 2", "point 3"],
    "structure": {{"opening": "how to start", "body": "main content", "closing": "how to end"}},
    "why_this_works": "why this answer is stronger"
}}

Return ONLY JSON, no markdown."""

    response = model.generate_content(prompt)
    import json, re
    result_text = response.text.strip()

    if result_text.startswith('```json'):
        result_text = result_text[7:]
    if result_text.startswith('```'):
        result_text = result_text[3:]
    if result_text.endswith('```'):
        result_text = result_text[:-3]

    result_text = result_text.strip()
    try:
        return json.loads(result_text)
    except json.JSONDecodeError:
        result_text = re.sub(r'[\x00-\x1f\x7f]', ' ', result_text)
        return json.loads(result_text)


async def generate_resume_grill_questions(resume_data: dict, num_questions: int = 10) -> list:
    """
    Generate CRITICAL questions that grill the candidate on their resume
    No job description - purely testing if they know what they wrote

    Args:
        resume_data: Parsed resume data
        num_questions: Number of questions to generate (default 10)

    Returns:
        List of tough, probing questions about their resume
    """

    # Extract all resume details
    skills = resume_data.get('technical_skills', {})
    all_skills = []
    if skills:
        all_skills.extend(skills.get('languages', []))
        all_skills.extend(skills.get('frameworks_libraries', []))
        all_skills.extend(skills.get('cloud_databases', []))
        all_skills.extend(skills.get('ai_tools', []))
        all_skills.extend(skills.get('developer_tools', []))

    experiences = resume_data.get('experience', [])
    projects = resume_data.get('projects', [])

    # Build detailed context for grilling
    experience_details = ""
    if experiences:
        for exp in experiences:
            experience_details += f"\n- {exp.get('title', '')} at {exp.get('company', '')}"
            for resp in exp.get('responsibilities', []):
                experience_details += f"\n  • {resp}"

    project_details = ""
    if projects:
        for proj in projects:
            project_details += f"\n- {proj.get('name', '')} ({', '.join(proj.get('technologies', [])[:5])})"
            for desc in proj.get('description', []):
                project_details += f"\n  • {desc}"

    prompt = f"""Role & Goal:
You are an experienced software engineering interviewer conducting a resume grill — a simulated technical interview where the goal is to test a candidate's true understanding of their resume.
Your task is to generate probing, realistic, and context-aware questions based on the candidate's resume.

**Candidate's Resume:**

**Technical Skills:** {', '.join(all_skills)}

**Experience:**{experience_details}

**Projects:**{project_details}

Behavior & Output Requirements:

1. Act as a human interviewer — curious, skeptical, and conversational.
   - Your tone should sound natural and professional, not robotic.
   - You can show curiosity ("Can you walk me through how that worked?") or challenge claims ("You said you reduced time by 80% — how did you measure that?").

2. Analyze the resume deeply — identify:
   - Projects: technologies used, purpose, impact metrics, architecture.
   - Experience: job titles, responsibilities, leadership roles.
   - Skills: match claims with potential technical questions.

3. Generate {num_questions} questions that:
   - Test technical depth (implementation details, architecture, algorithms, libraries).
   - Test role clarity (what exactly the candidate did).
   - Test impact validation (how they measured results).
   - Test design decisions (why a framework, DB, or model was chosen).
   - Test behavioral reasoning (teamwork, leadership, learning challenges).

4. Difficulty mix:
   - 60% technical deep-dives (project or skill-based)
   - 25% behavioral / reflective ("What did you learn?", "What would you do differently?")
   - 15% follow-ups that push for more detail ("Can you go deeper into how you handled X?")

Global guidelines:
- Avoid generic questions like "Tell me about yourself."
- Always ground questions in the specific resume content.
- Use variable tone — mix in curiosity, skepticism, and encouragement.
- Keep each question under 45 words.

Return JSON array with {num_questions} questions:
[
    {{
        "question_number": 1,
        "question_text": "Your natural, conversational question here",
        "question_type": "technical_depth|impact_validation|behavioral_reflection|design_decision",
        "difficulty": "medium|hard",
        "category": "Brief category like 'Vector Search' or 'Database Design'",
        "expected_topics": ["topic1", "topic2"],
        "skill_tags": ["specific_technology"],
        "resume_reference": "What project/experience this tests"
    }}
]

Return ONLY valid JSON, no markdown."""

    response = model.generate_content(prompt)

    # Parse JSON from response
    result_text = response.text.strip()

    if result_text.startswith('```json'):
        result_text = result_text[7:]
    if result_text.startswith('```'):
        result_text = result_text[3:]
    if result_text.endswith('```'):
        result_text = result_text[:-3]

    return json.loads(result_text.strip())
