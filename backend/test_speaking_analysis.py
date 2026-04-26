"""
Test script for speaking pattern analysis
Run with: python3 -m test_speaking_analysis
"""
from app.services.evaluation_service import analyze_speaking_patterns

# Test cases
test_cases = [
    {
        "name": "Professional answer with minimal fillers",
        "transcript": "I implemented the authentication system using JWT tokens. The architecture included a token refresh mechanism and role-based access control. We stored the tokens securely in HTTP-only cookies.",
        "duration": 15.0
    },
    {
        "name": "Answer with moderate filler words",
        "transcript": "So, um, I think the main challenge was like, you know, designing the database schema. I mean, we had to basically ensure data integrity and, uh, optimize the queries.",
        "duration": 12.0
    },
    {
        "name": "Answer with high filler usage",
        "transcript": "Um, so like, I basically, you know, kind of worked on this project where, uh, like, I mean, we sort of implemented, um, like a real-time chat feature, you know, using websockets and stuff.",
        "duration": 10.0
    },
    {
        "name": "Fast speaking pace",
        "transcript": "I designed implemented and deployed a microservices architecture with Docker and Kubernetes I created the CI CD pipeline configured monitoring with Prometheus and Grafana optimized database queries reducing latency by fifty percent",
        "duration": 8.0  # ~250 WPM
    },
    {
        "name": "Slow speaking pace",
        "transcript": "The project... was quite interesting. I worked... on building... an API.",
        "duration": 10.0  # ~80 WPM
    }
]

def run_tests():
    print("=" * 80)
    print("SPEAKING PATTERN ANALYSIS TEST")
    print("=" * 80)

    for i, test in enumerate(test_cases, 1):
        print(f"\n\n📝 TEST CASE {i}: {test['name']}")
        print(f"Transcript: \"{test['transcript']}\"")
        print(f"Duration: {test['duration']}s")
        print("-" * 80)

        analysis = analyze_speaking_patterns(
            transcript=test['transcript'],
            audio_duration_seconds=test['duration']
        )

        print(f"\n✅ RESULTS:")
        print(f"   Words Per Minute: {analysis['words_per_minute']} WPM")
        print(f"   Total Words: {analysis['total_words']}")
        print(f"   Filler Words Found: {analysis['total_filler_count']}")
        print(f"   Filler Percentage: {analysis['filler_percentage']}%")

        if analysis['filler_words']:
            print(f"\n   Top Filler Words:")
            for word, count in list(analysis['filler_words'].items())[:5]:
                print(f"      • '{word}': {count}x")

        print(f"\n   💬 Pace Feedback: {analysis['speaking_pace_feedback']}")
        print(f"   💬 Filler Feedback: {analysis['filler_word_feedback']}")

    print("\n" + "=" * 80)
    print("✅ All tests completed!")
    print("=" * 80)

if __name__ == "__main__":
    run_tests()
