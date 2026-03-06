# LLM Service - Interview Question Generator

A FastAPI-based service that generates interview questions and sample answers based on CV content using Google's Gemini AI.

## Features

- **CV Analysis**: Accepts CV content as a string
- **Question Generation**: Generates 5 professional interview questions tailored to the CV
- **Sample Answers**: Provides comprehensive sample answers for each question
- **Error Handling**: Robust error handling with detailed error messages
- **Health Check**: Includes a health check endpoint for monitoring

## Setup

### Prerequisites

- Python 3.10+
- Poetry (for dependency management)
- Google Gemini API Key

### Installation

1. Install dependencies using Poetry:

```bash
poetry install
```

2. Create a `.env` file in the root directory (optional, for overriding defaults):

```env
GEMINI_API_KEY=your_api_key_here
GEMINI_MODEL=gemini-1.5-flash
DEBUG=false
PORT=8000
```

## Running the Service

### Using Poetry

```bash
poetry run python main.py
```

### Using Uvicorn directly

```bash
uvicorn app:app --host 0.0.0.0 --port 8000 --reload
```

The service will start at `http://localhost:8000`

## API Endpoints

### 1. Generate Interview Questions

**Endpoint**: `POST /api/v1/generate-interview-questions`

**Request Body**:

```json
{
  "cv_content": "John Doe\nSoftware Engineer\nExperience:\n- 5 years in Python development..."
}
```

**Response**:

```json
{
  "questions_and_answers": [
    {
      "question": "Tell me about your experience with Python development?",
      "sample_answer": "I have 5 years of professional experience in Python development..."
    },
    {
      "question": "What is your approach to code quality and testing?",
      "sample_answer": "I believe in writing clean, maintainable code..."
    }
  ],
  "total_questions": 5
}
```

**Status Codes**:

- `200 OK`: Successfully generated questions
- `400 Bad Request`: Invalid CV content or Gemini API error
- `500 Internal Server Error`: Server error

### 2. Health Check

**Endpoint**: `GET /api/v1/health`

**Response**:

```json
{
  "status": "healthy",
  "service": "LLM Service",
  "version": "0.1.0"
}
```

## Architecture

```
llm_service/
├── app/
│   ├── __init__.py          # FastAPI app initialization
│   ├── config.py            # Configuration settings
│   ├── models.py            # Pydantic models for request/response
│   ├── gemini_service.py    # Gemini AI integration
│   └── routes.py            # API route handlers
├── main.py                  # Entry point
├── pyproject.toml           # Poetry dependencies
└── README.md                # This file
```

## Code Standards

- **Type Hints**: All functions include type hints
- **Logging**: Comprehensive logging for debugging and monitoring
- **Error Handling**: Proper exception handling with meaningful error messages
- **Docstrings**: All functions and classes have detailed docstrings
- **Pydantic Models**: Strong validation using Pydantic models
- **Async/Await**: Proper async/await patterns for FastAPI

## Configuration

Settings are managed in `app/config.py` using Pydantic's `BaseSettings`. Key settings:

- `GEMINI_API_KEY`: Your Gemini API key (hardcoded for now)
- `GEMINI_MODEL`: The Gemini model to use (default: `gemini-1.5-flash`)
- `APP_NAME`: Application name
- `DEBUG`: Debug mode (default: `False`)
- `HOST`: Server host (default: `0.0.0.0`)
- `PORT`: Server port (default: `8000`)

## Example Usage

Using `curl`:

```bash
curl -X POST "http://localhost:8000/api/v1/generate-interview-questions" \
  -H "Content-Type: application/json" \
  -d '{
    "cv_content": "Jane Smith\nData Scientist\n10 years experience\nSkills: Python, SQL, Machine Learning, TensorFlow"
  }'
```

Using Python `requests`:

```python
import requests

response = requests.post(
    "http://localhost:8000/api/v1/generate-interview-questions",
    json={
        "cv_content": "Your CV content here..."
    }
)

print(response.json())
```

## Error Handling

The service implements comprehensive error handling:

- **Invalid Input**: Returns 400 with details about what's wrong
- **API Errors**: Returns 400 if Gemini API fails with specific error message
- **Server Errors**: Returns 500 for unexpected errors

## Dependencies

- **FastAPI**: Web framework
- **Uvicorn**: ASGI server
- **Pydantic**: Data validation
- **google-generativeai**: Gemini AI API client
- **python-dotenv**: Environment variable management

## Future Improvements

- [ ] Add request caching to avoid duplicate API calls
- [ ] Add rate limiting
- [ ] Add user authentication/authorization
- [ ] Support for multiple languages
- [ ] Add logging to a file
- [ ] Add metrics/monitoring
- [ ] Add unit tests
- [ ] Add integration tests
