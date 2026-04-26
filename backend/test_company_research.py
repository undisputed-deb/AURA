"""
Test company-specific interview question research
"""
import asyncio
from app.services.company_research_service import (
    research_company_interview_questions,
    generate_company_specific_questions
)

async def test_research():
    print("=" * 80)
    print("TESTING COMPANY-SPECIFIC INTERVIEW PREP")
    print("=" * 80)

    # Test 1: Research company interview questions
    print("\n📊 Test 1: Researching Google Software Engineer interview questions...")
    print("-" * 80)

    research = await research_company_interview_questions(
        company_name="Google",
        role="Software Engineer",
        num_questions=5
    )

    print(f"\n✅ Company: {research['company_name']}")
    print(f"✅ Role: {research['role']}")
    print(f"✅ Data Freshness: {research['data_freshness']}")

    research_data = research['research_data']

    print(f"\n📌 Culture Values:")
    for value in research_data['company_culture']['values']:
        print(f"   • {value}")

    print(f"\n📌 Interview Style:")
    print(f"   {research_data['company_culture']['interview_style']}")

    print(f"\n📌 Common Question Themes:")
    for theme in research_data['common_question_themes']:
        print(f"   • {theme}")

    if research_data['example_questions']:
        print(f"\n📌 Example Real Questions Found:")
        for i, q in enumerate(research_data['example_questions'][:3], 1):
            print(f"   {i}. {q}")

    print(f"\n📌 Technical Focus Areas:")
    for area in research_data['technical_focus_areas']:
        print(f"   • {area}")

    # Test 2: Generate company-specific questions
    print("\n\n" + "=" * 80)
    print("📝 Test 2: Generating Google-specific questions...")
    print("-" * 80)

    sample_resume = {
        "technical_skills": {
            "languages": ["Python", "JavaScript", "Java"],
            "frameworks_libraries": ["React", "Node.js", "Django"],
            "cloud_databases": ["AWS", "PostgreSQL", "MongoDB"]
        },
        "experience": [
            {
                "title": "Software Engineer",
                "company": "TechStartup",
                "responsibilities": [
                    "Built REST APIs with Python",
                    "Led migration to microservices"
                ]
            }
        ],
        "projects": [
            {
                "name": "Real-time Analytics Dashboard",
                "description": ["Built scalable dashboard with React and WebSockets"]
            }
        ]
    }

    sample_jd = {
        "job_title": "Senior Software Engineer",
        "required_skills": ["Python", "System Design", "Leadership"],
        "experience_level": "senior"
    }

    questions = await generate_company_specific_questions(
        company_name="Google",
        role="Software Engineer",
        resume_data=sample_resume,
        jd_analysis=sample_jd,
        num_questions=3
    )

    print(f"\n✅ Generated {len(questions)} Google-specific questions:\n")

    for i, q in enumerate(questions, 1):
        print(f"\n{'='*80}")
        print(f"QUESTION {i}")
        print(f"{'='*80}")
        print(f"Text: {q['question_text']}")
        print(f"Type: {q['question_type']}")
        print(f"Difficulty: {q['difficulty']}")
        print(f"Category: {q['category']}")
        if 'company_value_assessed' in q:
            print(f"Google Value Assessed: {q['company_value_assessed']}")
        print(f"Skill Tags: {', '.join(q.get('skill_tags', []))}")
        print(f"Expected Topics: {', '.join(q.get('expected_topics', []))}")

    print("\n" + "=" * 80)
    print("✅ Test Complete!")
    print("=" * 80)

if __name__ == "__main__":
    asyncio.run(test_research())
