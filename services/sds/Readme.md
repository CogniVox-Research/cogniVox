# 🎤 Speech Delivery Scoring Service

A lightweight API service that analyzes **verbal delivery quality** from audio recordings and produces structured delivery scores. The service evaluates *how* something is spoken — not *what* is spoken.

[![Python](https://img.shields.io/badge/Python-3.10%2B-blue)](https://www.python.org/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.100%2B-green)](https://fastapi.tiangolo.com/)
[![License](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

---

## 📖 Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Installation](#installation)
- [Usage](#usage)
- [API Reference](#api-reference)
- [Scoring Methodology](#scoring-methodology)
- [Project Structure](#project-structure)
- [Technology Stack](#technology-stack)
- [Future Enhancements](#future-enhancements)

---

## Overview

The Speech Delivery Scoring Service is designed to be consumed by:

- 🎓 Training systems
- 💼 Interview preparation tools
- 📊 Feedback platforms

### In Scope

- Extracting objective speech and audio metrics from raw audio
- Mapping metrics to human-interpretable delivery scores (1–5 scale)
- Exposing results through a REST API

### Out of Scope

- Speech content analysis
- Language understanding
- Transcript quality evaluation

---

## Features

✅ **Independent scoring** across 5 delivery dimensions  
✅ **ML-powered** evaluation using Random Forest models  
✅ **Hardware-independent** metrics robust to moderate background noise  
✅ **Lightweight inference** suitable for near real-time evaluation  
✅ **Modular design** — models can be retrained independently  

---

## Installation

### Prerequisites

- Python 3.10 or higher
- pip (Python package manager)

### Setup

1. **Clone the repository**

   ```bash
   git clone https://github.com/yourusername/speech-delivery-score-mvp.git
   cd speech-delivery-score-mvp
   ```

2. **Create a virtual environment** (recommended)

   ```bash
   python -m venv venv
   
   # Windows
   venv\Scripts\activate
   
   # macOS/Linux
   source venv/bin/activate
   ```

3. **Install dependencies**

   ```bash
   pip install -r requirements.txt
   ```

---

## Usage

### Start the API Server

```bash
uvicorn api:app --reload
```

The server will start at `http://localhost:8000`

### Interactive API Documentation

Once the server is running, visit:

- **Swagger UI**: http://localhost:8000/docs
- **ReDoc**: http://localhost:8000/redoc

### Quick Test

```bash
curl -X POST "http://localhost:8000/analyze-speech" \
  -H "accept: application/json" \
  -F "file=@audio/good-speech.wav"
```

---

## API Reference

### Analyze Speech Delivery

Analyzes an audio file and returns delivery quality scores.

| Property | Value |
|----------|-------|
| **Endpoint** | `POST /analyze-speech` |
| **Content-Type** | `multipart/form-data` |
| **Accepted Formats** | WAV (recommended), MP3 |

#### Request

```bash
curl -X POST "http://localhost:8000/analyze-speech" \
  -H "accept: application/json" \
  -F "file=@sample_speech.wav"
```

#### Response

```json
{
  "clarity": 4,
  "pace": 3,
  "pauses": 2,
  "pitch": 4,
  "loudness": 3
}
```

#### Response Fields

| Field | Type | Description |
|-------|------|-------------|
| `clarity` | integer (1-5) | Articulation quality and speech smoothness |
| `pace` | integer (1-5) | Speaking speed appropriateness |
| `pauses` | integer (1-5) | Naturalness and consistency of pauses |
| `pitch` | integer (1-5) | Vocal variation and expressiveness |
| `loudness` | integer (1-5) | Volume stability and projection strength |

---

## Scoring Methodology

### Delivery Dimensions

Each speech sample is scored on a **1–5 scale** across five dimensions:

| Score | Meaning |
|-------|---------|
| 1 | Poor |
| 2 | Below Average |
| 3 | Average |
| 4 | Good |
| 5 | Excellent |

| Dimension | What It Measures |
|-----------|------------------|
| **Clarity** | Articulation quality and speech smoothness |
| **Pace** | Speaking speed appropriateness |
| **Pause Management** | Naturalness and consistency of pauses |
| **Pitch / Prosody** | Vocal variation and expressiveness |
| **Loudness / Projection** | Volume stability and projection strength |

### Audio Feature Extraction

The following metrics are extracted from audio signals:

| Metric | Description |
|--------|-------------|
| Words Per Minute (WPM) | Speaking rate |
| Average Pause Duration | Mean silence duration between speech segments |
| Pitch Variability (F0 Std. Dev.) | Vocal variation measurement |
| Disfluency Count | Speech interruptions and repetitions |
| Filled Pauses | Detected filler words (um, uh, etc.) |
| Loudness Variance | Volume consistency throughout speech |

### Machine Learning Models

Each delivery dimension uses an **independent Random Forest Regressor**:

- ✅ One model per delivery dimension
- ✅ Trained on manually labeled speech samples (1–5 ratings)
- ✅ Predictions clamped to range **1–5** and rounded to nearest integer

**Why independent models?**

- Improved interpretability
- Avoids conflating unrelated delivery traits
- Allows independent retraining and tuning

---

## Project Structure

```
speech-delivery-score-mvp/
├── api.py                    # FastAPI application entry point
├── requirements.txt          # Python dependencies
├── readme.md                 # This file
│
├── audio/                    # Sample audio files
│   ├── good-speech.wav
│   ├── bad-speech.wav
│   └── uploads/              # Uploaded files directory
│
├── features/                 # Feature extraction module
│   └── extract_metrics.py    # Audio metric extraction
│
├── scoring/                  # Scoring module
│   └── score_speech.py       # ML model inference
│
├── feedback/                 # Feedback generation module
│   └── generate_feedback.py  # Human-readable feedback
│
├── models/                   # Trained ML models
│   ├── clarity_model.joblib
│   ├── pace_model.joblib
│   ├── pauses_model.joblib
│   ├── pitch_model.joblib
│   └── loudness_model.joblib
│
├── training/                 # Model training resources
│   ├── train_models.py       # Training script
│   └── data/                 # Training datasets
│
└── tests/                    # Test files
    ├── test_metrics.py
    ├── test_scoring.py
    └── test_feedback.py
```

---

## Technology Stack

| Technology | Purpose |
|------------|---------|
| **Python 3.10+** | Core language |
| **FastAPI** | REST API framework |
| **Librosa** | Audio feature extraction |
| **scikit-learn** | Machine learning models |
| **Joblib** | Model serialization |
| **Uvicorn** | ASGI server |

---

## Running Tests

```bash
# Run all tests
pytest

# Run specific test file
pytest test_scoring.py

# Run with verbose output
pytest -v
```

---

## Future Enhancements

- [ ] Confidence estimation for predicted scores
- [ ] Speaker-specific normalization
- [ ] Streaming audio support
- [ ] Automated personalized feedback generation
- [ ] Support for additional audio formats
- [ ] Batch processing endpoint
- [ ] WebSocket support for real-time analysis

---

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

---

<p align="center">
  Made with ❤️ for better speech delivery
</p>