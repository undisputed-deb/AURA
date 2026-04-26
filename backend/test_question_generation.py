"""
Test script to verify improved question generation
Run this to see sample questions generated with the new prompts
"""
import asyncio
import json
from app.services.interview_service import generate_interview_questions, analyze_job_description

# Sample resume data (simplified)
SAMPLE_RESUME = {
    "name": "John Doe",
    "technical_skills": {
        "languages": ["Python", "JavaScript", "SQL"],
        "frameworks_libraries": ["React", "FastAPI", "Node.js"],
        "cloud_databases": ["PostgreSQL", "AWS", "Redis"]
    },
    "experience": [
        {
            "title": "Backend Developer",
            "company": "Tech Corp",
            "responsibilities": [
                "Developed REST APIs using FastAPI",
                "Optimized database queries reducing load time by 40%"
            ]
        }
    ],
    "projects": [
        {
            "name": "E-commerce Platform",
            "description": ["Built a full-stack e-commerce platform with React and Node.js"]
        }
    ]
}

# Sample job description
SAMPLE_JD = """
Software Engineer - Backend

We're looking for a Backend Software Engineer with strong Python and SQL skills.

Requirements:
- 2+ years of experience with Python
- Strong knowledge of SQL databases (PostgreSQL preferred)
- Experience with REST API development
- Knowledge of FastAPI or similar frameworks
- Understanding of caching strategies (Redis)
- Experience with cloud platforms (AWS)
- Strong problem-solving skills

Responsibilities:
- Design and implement scalable backend services
- Optimize database performance
- Write clean, maintainable code
- Collaborate with frontend team
"""


async def test_question_generation():
    print("=" * 80)
    print("TESTING IMPROVED QUESTION GENERATION")
    print("=" * 80)

    # First analyze the job description
    print("\n1. Analyzing Job Description...")
    jd_analysis = await analyze_job_description(SAMPLE_JD)
    print(f"✓ Job Title: {jd_analysis.get('job_title')}")
    print(f"✓ Experience Level: {jd_analysis.get('experience_level')}")
    print(f"✓ Required Skills: {', '.join(jd_analysis.get('required_skills', [])[:5])}")

    # Generate questions
    print("\n2. Generating Interview Questions...")
    questions = await generate_interview_questions(
        resume_data=SAMPLE_RESUME,
        jd_analysis=jd_analysis,
        num_questions=10
    )

    print(f"\n✓ Generated {len(questions)} questions\n")
    print("=" * 80)
    print("GENERATED QUESTIONS:")
    print("=" * 80)

    # Display questions by type
    for q in questions:
        print(f"\nQ{q['question_number']}. {q['question_text']}")
        print(f"   Type: {q['question_type']} | Difficulty: {q['difficulty']} | Category: {q['category']}")

    print("\n" + "=" * 80)
    print("QUALITY CHECK:")
    print("=" * 80)

    # Check for bad patterns
    bad_patterns = [
        "you mentioned",
        "i see you",
        "your project",
        "sounds fascinating",
        "that's interesting",
        "impressive"
    ]

    issues_found = []
    for q in questions:
        q_text_lower = q['question_text'].lower()
        for pattern in bad_patterns:
            if pattern in q_text_lower:
                issues_found.append(f"Q{q['question_number']}: Contains '{pattern}'")

    if issues_found:
        print("\n❌ ISSUES FOUND (personalized/conversational patterns):")
        for issue in issues_found:
            print(f"   - {issue}")
    else:
        print("\n✅ No personalized/conversational patterns detected!")

    # Check question type distribution
    type_counts = {}
    for q in questions:
        q_type = q['question_type']
        type_counts[q_type] = type_counts.get(q_type, 0) + 1

    print("\n📊 Question Type Distribution:")
    for q_type, count in type_counts.items():
        percentage = (count / len(questions)) * 100
        print(f"   - {q_type}: {count} ({percentage:.0f}%)")

    # Check if questions are realistic
    print("\n🎯 Realism Check:")
    realistic_patterns = [
        "what",
        "explain",
        "describe",
        "tell me about",
        "how",
        "difference between"
    ]

    realistic_count = 0
    for q in questions:
        q_text_lower = q['question_text'].lower()
        if any(pattern in q_text_lower for pattern in realistic_patterns):
            realistic_count += 1

    print(f"   - {realistic_count}/{len(questions)} questions use realistic interview patterns")

    print("\n" + "=" * 80)

    # Save to file for review
    with open('/Users/tanvirislam/projects/mockmate/backend/test_output.json', 'w') as f:
        json.dump({
            'jd_analysis': jd_analysis,
            'questions': questions
        }, f, indent=2)

    print("✓ Full output saved to test_output.json")
    print("=" * 80)


if __name__ == "__main__":
    asyncio.run(test_question_generation())
