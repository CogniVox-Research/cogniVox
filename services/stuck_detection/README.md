# Stuck Detection Service

A real-time speech analysis microservice for the **CogniVox** project that detects when speakers are "stuck" during conversations by analyzing semantic repetition patterns and prolonged silences.

## Overview

The Stuck Detection Service processes Automatic Speech Recognition (ASR) data streams to identify two types of speaking difficulties:

1. **Semantic Repetition**: When a speaker repeats similar sentences or phrases
2. **Prolonged Silence**: When a speaker pauses for an extended period

When stuck behavior is detected, the service can optionally generate contextual suggestions to help the speaker continue their conversation.

## Features

- Real-time ASR data stream processing via RabbitMQ
- Semantic similarity analysis using spaCy NLP models
- Configurable silence duration thresholds
- Session-based detection tracking
- Automatic unstuck detection
- FastAPI-based health monitoring
- Integration with LLM service for suggestion generation

## Architecture

```
┌─────────────┐         ┌──────────────────┐         ┌─────────────┐
│  ASR Stream │───────▶│ Stuck Detection  │───────▶│  Session    │
│  (RabbitMQ) │         │     Service      │         │  Queue      │
└─────────────┘         └──────────────────┘         └─────────────┘
                               │
                               │ (Optional)
                               ▼
                        ┌──────────────┐
                        │ LLM Service  │
                        │ (RPC Client) │
                        └──────────────┘
```

## Technology Stack

- **Python**: 3.13+
- **Framework**: FastAPI
- **NLP**: spaCy (en_core_web_md model)
- **Message Queue**: RabbitMQ (via aio_pika)
- **Data Validation**: Pydantic
- **Dependency Management**: Poetry

## Installation

### Prerequisites

- Python 3.13+
- Poetry
- RabbitMQ server
- spaCy English model

### Setup

1. **Install dependencies**:

   ```bash
   poetry install
   ```

2. **Download spaCy model**:

   ```bash
   poetry run python -m spacy download en_core_web_md
   ```

3. **Configure the service**:

   Edit `config.toml` to customize detection parameters:

   ```toml
   rabbitmq_url = "amqp://appuser:apppass@127.0.0.1/"
   max_silence = 7.5  # Maximum silence duration in seconds
   
   checked_sentences = 5  # Number of recent sentences to analyze
   sentence_similarity_threshold = 0.95  # Cosine similarity threshold (0-1)
   repeated_sentence_threshold = 2  # Minimum repeated pairs to trigger detection
   ```

## Configuration

### Parameters

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `rabbitmq_url` | string | `amqp://appuser:apppass@127.0.0.1/` | RabbitMQ connection URL |
| `max_silence` | float | `7.5` | Maximum silence duration (seconds) before triggering stuck detection |
| `checked_sentences` | int | `5` | Number of recent sentences to analyze for repetition |
| `sentence_similarity_threshold` | float | `0.95` | Cosine similarity threshold for detecting semantic repetition (0.0-1.0) |
| `repeated_sentence_threshold` | int | `2` | Minimum number of similar sentence pairs to trigger repetition detection |

## Usage

### Running the Service

```bash
poetry run fastapi dev main.py
```

The service will:

- Connect to RabbitMQ at the configured URL
- Subscribe to the `ASR_stream` queue
- Process incoming ASR data in real-time
- Publish detection events to session-specific queues

### Health Check

```bash
curl http://localhost:8000/
```

Expected response:

```json
"Running"
```

## Data Models

### Input: ASRData

```python
{
  "type": "partial" | "complete",
  "lines": [
    {
      "type": "text",
      "text": "Hello world",
      "timestamp": {
        "start": "2024-01-01T00:00:00",
        "end": "2024-01-01T00:00:02",
        "duration": 2.0
      }
    },
    {
      "type": "silence",
      "timestamp": {
        "start": "2024-01-01T00:00:02",
        "end": "2024-01-01T00:00:10",
        "duration": 8.0
      }
    }
  ],
  "full_text": "Hello world",
  "session_id": "session-123",
  "current_silence": null,
  "remaining_time": 0.0
}
```

### Output: StuckDetection

```python
{
  "stuck_id": "unique-id",
  "reason": "repetition" | "silence",
  "suggestions": ["Try saying...", "You could mention..."],
  "at": "2024-01-01T00:00:10"
}
```

### Output: UnstuckDetection

```python
{
  "stuck_id": "previous-stuck-id"
}
```

## Detection Logic

### Semantic Repetition Detection

1. Extracts the last N sentences (configured by `checked_sentences`)
2. Computes pairwise cosine similarity using spaCy word vectors
3. Identifies sentence pairs with similarity ≥ `sentence_similarity_threshold`
4. Triggers detection if repeated pairs ≥ `repeated_sentence_threshold`

### Silence Detection

1. Checks if the last line in ASR data is a silence
2. Compares silence duration against `max_silence` threshold
3. Triggers detection if duration exceeds threshold

### State Management

- Tracks detection state per session ID
- Automatically detects when a user becomes "unstuck"
- Generates suggestions only once per stuck episode

## Message Flow

1. **ASR Stream** → Service receives ASR data from `ASR_stream` queue
2. **Detection** → Service analyzes data for stuck patterns
3. **Publishing** → Service publishes detection events to `session-{session_id}` queue

### Published Message Format

**Stuck Detection**:

```json
{
  "type": "stuck_detection",
  "data": {
    "stuck_id": "...",
    "reason": "repetition",
    "suggestions": ["..."],
    "at": "2024-01-01T00:00:00"
  }
}
```

**Unstuck Detection**:

```json
{
  "type": "unstuck_detection",
  "data": {
    "stuck_id": "..."
  }
}
```

## Development

### Project Structure

```
stuck_detection/
├── app/
│   ├── __init__.py      # FastAPI app & RabbitMQ consumer
│   ├── config.py        # Configuration management
│   ├── detector.py      # Core detection logic
│   └── dto.py           # Pydantic data models
├── config.toml          # Service configuration
├── main.py              # Entry point
├── pyproject.toml       # Poetry dependencies
└── README.md            # This file
```

### Dependencies

- `fastapi[standard]` - Web framework and ASGI server
- `aio_pika` - Async RabbitMQ client
- `spacy` - NLP and semantic similarity
- `pydantic` - Data validation
- `shared` - Internal shared utilities (local package)

## Integration

This service is part of the **CogniVox** ecosystem and integrates with:

- **ASR Service**: Provides real-time speech transcription data
- **LLM Service**: Generates contextual suggestions (via RPC)
- **Session Manager**: Receives stuck/unstuck detection events

## Troubleshooting

### Common Issues

**Service won't start**:

- Verify RabbitMQ is running and accessible
- Check `rabbitmq_url` in `config.toml`

**No detections**:

- Verify ASR data is being published to `ASR_stream` queue
- Check detection thresholds in configuration
- Review logs for semantic similarity scores

**spaCy model not found**:

```bash
poetry run python -m spacy download en_core_web_md
```

## License

Part of the CogniVox project.

## Author

yehan2002 <yehanjaya2002@gmail.com>
