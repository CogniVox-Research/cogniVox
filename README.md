# CogniVox

A comprehensive real-time physiological monitoring and speech analysis platform that combines wearable sensor data with advanced speech processing to provide intelligent feedback and insights.

## Overview

CogniVox is a research and development platform designed to monitor and analyze human physiological and speech patterns in real-time. The system integrates data from wearable devices (like Galaxy Watch) with sophisticated speech analysis to detect stress levels, evaluate speech delivery quality, and provide actionable feedback.

## Key Features

- Real-time stress detection using physiological signals (BVP, EDA, temperature, accelerometer)
- Speech delivery quality analysis across multiple dimensions
- Automatic speech recognition with streaming support
- Stuck detection during conversations with contextual suggestions
- Transcript comparison and analysis
- Microservices architecture with RabbitMQ message queue
- Mobile and wearable device integration
- React-based frontend dashboard

## Architecture

CogniVox follows a microservices architecture with the following components:

```
┌─────────────────┐         ┌──────────────────┐         ┌─────────────────┐
│  Wearable       │────────▶│  Mobile App      │────────▶│  Backend        │
│  (Galaxy Watch) │         │  (Android)       │         │  Services       │
└─────────────────┘         └──────────────────┘         └─────────────────┘
                                                                   │
                            ┌──────────────────────────────────────┤
                            │                                      │
                    ┌───────▼────────┐                    ┌───────▼────────┐
                    │   RabbitMQ     │                    │   Frontend     │
                    │  Message Queue │                    │   Dashboard    │
                    └────────────────┘                    └────────────────┘
```

## Services

### Biometric Service
FastAPI-based stress prediction service using machine learning models trained on the WESAD dataset.

- **Models**: Dual Random Forest models (full and lite)
- **Features**: Real-time stress classification with actionable suggestions
- **Input**: Physiological signals (EDA, BVP, temperature, accelerometer)
- **Output**: Stress scores (0-1) with granular feedback

[Read more](./biometric_service/README.md)

### Speech Delivery Scoring Service (SDS)
Analyzes verbal delivery quality from audio recordings.

- **Dimensions**: Clarity, pace, pauses, pitch, loudness
- **Technology**: ML-powered evaluation using Random Forest models
- **Scoring**: 1-5 scale across independent delivery dimensions
- **Features**: Hardware-independent metrics, lightweight inference

[Read more](./sds_service/Readme.md)

### Stuck Detection Service
Real-time speech analysis to detect when speakers are stuck during conversations.

- **Detection Types**: Semantic repetition and prolonged silence
- **Technology**: spaCy NLP with semantic similarity analysis
- **Integration**: RabbitMQ message queue for real-time processing
- **Features**: Session-based tracking, automatic unstuck detection

[Read more](./stuck_detection/README.md)

### Transcript Analysis Service
Compares delivered speech with prepared transcripts using NLP.

- **Technology**: Sentence-BERT embeddings for semantic comparison
- **Features**: Missing point detection, paraphrase analysis, key point extraction
- **Output**: Structured comparison reports with similarity scores
- **Use Cases**: Training systems, interview preparation, feedback platforms

[Read more](./transcript_analysis/README.md)

### ASR Service
Automatic Speech Recognition service for real-time transcription.

- **Features**: Audio streaming support
- **Integration**: RabbitMQ for message distribution

[Read more](./asr_service/README.md)

### Gateway Service
API gateway for routing and managing service communication.

### LLM Service
Large Language Model integration for generating contextual suggestions.

### Document Service
Document management and storage service.

### Frontend
React + TypeScript + Vite dashboard for visualization and control.

- **Framework**: React with TypeScript
- **Build Tool**: Vite for fast development
- **Features**: Real-time data visualization, speech analysis dashboard

[Read more](./frontend/README.md)

### Mobile & Wearable Apps
Android applications for data collection from wearable devices.

- **Mobile**: Android 14+ application
- **Wear**: Wear OS 4/5 application for Galaxy Watch 7
- **Features**: Real-time sensor data streaming, biometric monitoring

## Technology Stack

### Backend Services
- **Language**: Python 3.10+
- **Frameworks**: FastAPI, Flask
- **ML Libraries**: scikit-learn, spaCy, sentence-transformers
- **Message Queue**: RabbitMQ (aio_pika)
- **Data Processing**: NumPy, pandas, librosa

### Frontend
- **Framework**: React 18+ with TypeScript
- **Build Tool**: Vite
- **Styling**: CSS (Vanilla)

### Mobile
- **Platform**: Android (Kotlin)
- **Build System**: Gradle
- **Wearable**: Wear OS with Samsung Health SDK

### Infrastructure
- **Message Broker**: RabbitMQ
- **Containerization**: Docker support
- **API**: RESTful services with FastAPI/Flask

## Getting Started

### Prerequisites

- Python 3.10 or higher
- Node.js 16+ (for frontend)
- RabbitMQ server
- Android Studio (for mobile development)
- Poetry (recommended for Python dependency management)

### Installation

1. Clone the repository:
```bash
git clone https://github.com/yourusername/cogniVox.git
cd cogniVox
```

2. Set up individual services (refer to service-specific READMEs):

**Biometric Service:**
```bash
cd biometric_service
pip install fastapi uvicorn pydantic numpy scikit-learn joblib
python app.py
```

**Speech Delivery Service:**
```bash
cd sds_service
pip install -r requirements.txt
uvicorn api:app --reload
```

**Stuck Detection Service:**
```bash
cd stuck_detection
poetry install
poetry run python -m spacy download en_core_web_md
poetry run fastapi dev main.py
```

**Frontend:**
```bash
cd frontend
npm install
npm run dev
```

3. Start RabbitMQ:
```bash
# Using Docker
docker run -d --name rabbitmq -p 5672:5672 -p 15672:15672 rabbitmq:management
```

### Configuration

Each service has its own configuration file. Key configuration files:

- `stuck_detection/config.toml` - Stuck detection parameters
- `biometric_service/app.py` - Model paths and API settings
- `sds_service/api.py` - Speech scoring thresholds
- RabbitMQ connection URLs in service configurations

## Project Structure

```
cogniVox/
├── app/                          # Android mobile & wear applications
│   ├── mobile/                   # Android mobile app
│   └── wear/                     # Wear OS app
├── asr_service/                  # Automatic Speech Recognition
├── biometric_service/            # Stress prediction service
├── document_service/             # Document management
├── frontend/                     # React dashboard
├── gateway_service/              # API gateway
├── llm_service/                  # LLM integration
├── rabbitmq-docker/              # RabbitMQ configuration
├── sds_service/                  # Speech delivery scoring
├── shared/                       # Shared utilities
├── stuck_detection/              # Stuck detection service
├── transcript_analysis/          # Transcript comparison
└── README.md                     # This file
```

## Use Cases

### Research Applications
- Physiological stress monitoring studies
- Speech pattern analysis research
- Human-computer interaction studies
- Wearable sensor data collection

### Training & Education
- Public speaking training
- Interview preparation
- Speech delivery improvement
- Real-time feedback systems

### Health & Wellness
- Stress management
- Mental health monitoring
- Biofeedback applications
- Wellness tracking

## Development

### Running Tests

Each service includes its own test suite. Refer to individual service READMEs for testing instructions.

### Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## Research & Citations

This project uses the WESAD (Wearable Stress and Affect Detection) dataset for stress prediction models. If you use this project in your research, please cite:

```
Schmidt, P., Reiss, A., Duerichen, R., Marberger, C. and Van Laerhoven, K., 2018, September.
Introducing WESAD, a multimodal dataset for wearable stress and affect detection.
In Proceedings of the 20th ACM international conference on multimodal interaction (pp. 400-408).
```

## License

This project is part of ongoing research and development. Please refer to individual service licenses for specific terms.

## Support

For issues, questions, or contributions, please contact the CogniVox development team or open an issue on GitHub.

## Acknowledgments

- WESAD dataset for physiological stress detection training data
- Samsung Health SDK for wearable sensor integration
- Open-source ML and NLP communities for foundational tools
