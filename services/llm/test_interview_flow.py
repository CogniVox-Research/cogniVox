"""
Test script for LLM service interview evaluation flow.
"""

import json
import urllib.request


BASE_URL = "http://127.0.0.1:8000/api/v1"


def test_generate_questions():
    """Test question generation from CV"""
    print("=" * 60)
    print("TEST 1: Generate Interview Questions")
    print("=" * 60)
    
    url = f"{BASE_URL}/generate-interview-questions"
    
    payload = {
        "cv_content": """
John Doe
Software Engineer

Experience:
- 5 years of Python development
- Built RESTful APIs with FastAPI
- Worked with PostgreSQL and Redis
- Deployed applications on AWS

Skills:
- Python, FastAPI, Docker
- PostgreSQL, Redis
- AWS (EC2, S3, Lambda)
"""
    }
    
    req = urllib.request.Request(url)
    req.add_header("Content-Type", "application/json")
    jsondata = json.dumps(payload).encode("utf-8")
    
    try:
        response = urllib.request.urlopen(req, jsondata)
        result = json.loads(response.read().decode("utf-8"))
        
        print(f"✓ Status: {response.getcode()}")
        print(f"✓ Total Questions: {result['total_questions']}")
        print()
        
        for i, qa in enumerate(result["questions_and_answers"], 1):
            print(f"Question {i}: {qa['question']}")
            print(f"Sample Answer: {qa['sample_answer'][:80]}...")
            print()
        
        return result["questions_and_answers"]
    
    except urllib.error.HTTPError as e:
        print(f"✗ HTTP Error: {e.code}")
        print(f"✗ Response: {e.read().decode('utf-8')}")
        return None
    except Exception as e:
        print(f"✗ Error: {e}")
        return None


def test_evaluate_answers(questions_and_answers):
    """Test answer evaluation"""
    print("=" * 60)
    print("TEST 2: Evaluate Interview Answers")
    print("=" * 60)
    
    if not questions_and_answers:
        print("✗ Skipped: No questions available")
        return
    
    # Simulate user answers (mix of good and poor answers)
    url = f"{BASE_URL}/evaluate-answers"
    
    # Take first 3 questions for demo
    test_data = questions_and_answers[:3]
    
    payload = {
        "questions_with_answers": [
            {
                "question": test_data[0]["question"],
                "sample_answer": test_data[0]["sample_answer"],
                "user_answer": "I have 5 years of experience building APIs with Python and FastAPI. I focus on clean code and scalability."
            },
            {
                "question": test_data[1]["question"],
                "sample_answer": test_data[1]["sample_answer"],
                "user_answer": "I don't know much about that."
            },
            {
                "question": test_data[2]["question"],
                "sample_answer": test_data[2]["sample_answer"],
                "user_answer": test_data[2]["sample_answer"]  # Perfect match
            },
        ]
    }
    
    req = urllib.request.Request(url)
    req.add_header("Content-Type", "application/json")
    jsondata = json.dumps(payload).encode("utf-8")
    
    try:
        response = urllib.request.urlopen(req, jsondata)
        result = json.loads(response.read().decode("utf-8"))
        
        print(f"✓ Status: {response.getcode()}")
        print(f"✓ Overall Score: {result['overall_score']}/3")
        print()
        
        for i, evaluation in enumerate(result["results"], 1):
            match_icon = "✓" if evaluation["is_matching"] else "✗"
            print(f"{match_icon} Question {i}:")
            print(f"  Matching: {evaluation['matching_percentage']:.1f}%")
            print(f"  Accepted: {'Yes' if evaluation['is_matching'] else 'No'}")
            print()
        
        return result
    
    except urllib.error.HTTPError as e:
        print(f"✗ HTTP Error: {e.code}")
        print(f"✗ Response: {e.read().decode('utf-8')}")
        return None
    except Exception as e:
        print(f"✗ Error: {e}")
        return None


if __name__ == "__main__":
    print("\n🚀 LLM Service Test Suite\n")
    
    # Test 1: Generate questions
    questions = test_generate_questions()
    
    # Test 2: Evaluate answers
    if questions:
        test_evaluate_answers(questions)
    
    print("=" * 60)
    print("✓ Test suite completed")
    print("=" * 60)
