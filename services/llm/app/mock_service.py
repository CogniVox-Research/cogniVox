def generate_interview_questions(cv_content: str) -> dict:
    return {
        "questions_and_answers": [
            {"question": "Mock question 01", "sample_answer": "Mock answer 01"}
        ],
        "total_questions": 1,
    }


def generate_stress_management_plan(stress_summary: dict) -> dict:
    return {
        "plan": "Sample stress management plan",
    }


def evaluate_interview_answers(questions_with_answers: list[dict]) -> dict:
    return {
        "overall_score": 46,
        "results": [
            {
                "question": "Question 01",
                "matching_percentage": 85.0,
                "is_matching": 1,
            }
        ],
    }


def generate_speech_continuation(full_speech: str, delivered_so_far: str) -> dict:
    return {
        "continuation_hint": "Talk about the details and features of each Micro Machine.",
        "status": "success",
    }


def generate_speech_questions(speech_content: str) -> dict:
    return {
        "questions_and_answers": [
            {"question": "Mock question 01", "sample_answer": "Mock answer 01"}
        ],
        "total_questions": 1,
    }
