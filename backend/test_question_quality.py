"""
Quick test script to verify improved question generation quality
Run with: python -m test_question_quality
"""
import asyncio
import json
from app.services.interview_service import generate_interview_questions

# Sample resume data
sample_resume = {
    "technical_skills": {
        "languages": ["Python", "JavaScript", "TypeScript", "Go"],
        "frameworks_libraries": ["FastAPI", "React", "Next.js", "Django"],
        "cloud_databases": ["PostgreSQL", "Redis", "AWS S3", "Docker"]
    },
    "experience": [
        {
            "title": "Senior Software Engineer",
            "company": "TechCorp",
            "responsibilities": [
                "Built scalable microservices handling 100K+ requests/day",
                "Led team of 3 engineers in developing payment processing system",
                "Implemented CI/CD pipeline reducing deployment time by 60%"
            ]
        },
        {
            "title": "Software Engineer",
            "company": "StartupXYZ",
            "responsibilities": [
                "Developed REST APIs with Python and FastAPI",
                "Integrated third-party payment gateways (Stripe, PayPal)"
            ]
        }
    ],
    "projects": [
        {
            "name": "E-commerce Platform",
            "description": ["Built full-stack e-commerce with Next.js and PostgreSQL"],
            "technologies": ["Next.js", "PostgreSQL", "Stripe", "AWS"]
        },
        {
            "name": "Real-time Chat Application",
            "description": ["WebSocket-based chat with message history"],
            "technologies": ["Node.js", "Socket.IO", "MongoDB"]
        }
    ]
}

# Sample job description analysis
sample_jd = {
    "job_title": "Senior Backend Engineer",
    "company": "Meta",
    "required_skills": ["Python", "FastAPI", "PostgreSQL", "Redis", "Docker", "Kubernetes"],
    "experience_level": "senior",
    "key_responsibilities": [
        "Design and build scalable backend services",
        "Mentor junior engineers",
        "Optimize database queries and caching strategies"
    ],
    "technical_requirements": [
        "5+ years backend development",
        "Experience with microservices architecture",
        "Strong system design skills"
    ]
}

async def test_questions():
    print("🧪 Testing improved question generation...\n")
    print("=" * 80)

    try:
        questions = await generate_interview_questions(
            resume_data=sample_resume,
            jd_analysis=sample_jd,
            num_questions=5  # Generate 5 questions for quick test
        )

        print(f"\n✅ Successfully generated {len(questions)} questions\n")
        print("=" * 80)

        for i, q in enumerate(questions, 1):
            print(f"\n📝 QUESTION {i}")
            print(f"   Type: {q.get('question_type', 'N/A')}")
            print(f"   Difficulty: {q.get('difficulty', 'N/A')}")
            print(f"   Category: {q.get('category', 'N/A')}")
            print(f"\n   Q: {q.get('question_text', 'N/A')}")
            print(f"\n   Expected topics: {', '.join(q.get('expected_topics', []))}")
            print("   " + "-" * 76)

        print("\n" + "=" * 80)
        print("\n🎯 QUALITY ASSESSMENT:")
        print("\nCheck if questions:")
        print("  ✓ Reference actual resume items (TechCorp, FastAPI, E-commerce Platform)")
        print("  ✓ Sound natural and conversational")
        print("  ✓ Avoid generic textbook questions")
        print("  ✓ Include specific technical details")
        print("  ✓ Mix question types properly")

        # Count question types
        type_counts = {}
        for q in questions:
            qtype = q.get('question_type', 'unknown')
            type_counts[qtype] = type_counts.get(qtype, 0) + 1

        print(f"\n📊 Question Mix: {type_counts}")

    except Exception as e:
        print(f"\n❌ Error: {str(e)}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    asyncio.run(test_questions())
