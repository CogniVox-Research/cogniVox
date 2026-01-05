# ASR Service (Automatic Speech Recognition)

A real-time speech-to-text service for the CogniVox platform that provides streaming audio transcription with WebSocket support and RabbitMQ integration.

## Overview

The ASR Service is a FastAPI-based microservice that converts spoken audio into text in real-time. It uses WhisperLiveKit for high-quality transcription and integrates seamlessly with the CogniVox ecosystem through RabbitMQ message queues.

## Features

- Real-time audio streaming via WebSocket
- Automatic speech recognition using Whisper models
- Partial and complete transcript generation
- Silence detection and tracking
- Audio recording with automatic file management
- RabbitMQ integration for message distribution
- Session-based transcription management
- CORS support for web clients

## Technology Stack

- **Framework**: FastAPI
- **ASR Engine**: WhisperLiveKit (Whisper-based)
- **Message Queue**: RabbitMQ (aio_pika)
- **Audio Processing**: FFmpeg
- **Python**: 3.12+
- **Dependency Management**: Poetry

## Architecture

```
┌─────────────┐         ┌──────────────┐         ┌─────────────┐
│  Web Client │───────▶│  WebSocket   │───────▶│  Whisper    │ 
│  (Audio)    │         │  Handler     │         │  Engine     │
└─────────────┘         └──────────────┘         └─────────────┘
                                │                        │
                                │                        │
                                ▼                        ▼
                        ┌──────────────┐         ┌─────────────┐
                        │  Recording   │         │  RabbitMQ   │
                        │   Storage    │         │  Publisher  │
                        └──────────────┘         └─────────────┘
```

## Installation

### Prerequisites

- Python 3.12 or higher
- Poetry
- FFmpeg (for audio processing)
- RabbitMQ server

### Setup

1. **Navigate to the service directory**:

```bash
cd asr_service
```

1. **Install dependencies**:

```bash
poetry install
```

1. **Configure the service**:

Edit `config.toml`:

```toml
cors_allow_origins = ["http://localhost:5173"]
rabbitmq_url = "amqp://appuser:apppass@127.0.0.1/"

whisper_model = "small"  # Options: tiny, base, small, medium, large
warmup_model = false     # Pre-warm model on startup

recording_dir = "../recordings/"
```

### Model Options

The service supports various Whisper model sizes:

| Model | Size | Speed | Accuracy | Use Case |
|-------|------|-------|----------|----------|
| `tiny` | 39M | Fastest | Lower | Testing, low-resource |
| `base` | 74M | Fast | Good | Real-time applications |
| `small` | 244M | Moderate | Better | Balanced performance |
| `medium` | 769M | Slow | High | High accuracy needs |
| `large` | 1550M | Slowest | Highest | Maximum accuracy |

## Usage

### Starting the Service

```bash
poetry run fastapi dev app/main.py
```

The service will start on `http://localhost:8000` by default.

### API Endpoints

#### 1. Health Check

**GET** `/`

Check if the service is running.

```bash
curl http://localhost:8000/
```

Response:

```json
{
  "Hello": "FastAPI is running"
}
```

#### 2. WebSocket Audio Stream

**WebSocket** `/audio/{session_id}`

Stream audio for real-time transcription.

**Parameters**:

- `session_id` (path): Unique identifier for the transcription session

**Client Example** (JavaScript):

```javascript
const ws = new WebSocket('ws://localhost:8000/audio/session-123');

// Send audio chunks
ws.onopen = () => {
  // Send binary audio data
  ws.send(audioChunk);
};

// Receive transcription updates
ws.onmessage = (event) => {
  const data = JSON.parse(event.data);
  console.log('Transcript:', data.full_text);
};
```

#### 3. Download Recording

**GET** `/recording/{session_id}`

Download the recorded audio file for a session.

```bash
curl http://localhost:8000/recording/session-123 -o recording.wav
```

## Data Models

### ASRData (Output)

```json
{
  "type": "partial",
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
        "end": "2024-01-01T00:00:05",
        "duration": 3.0
      }
    }
  ],
  "full_text": "Hello world",
  "session_id": "session-123",
  "current_silence": null,
  "remaining_time": 0.5
}
```

**Fields**:

- `type`: `"partial"` or `"complete"` - indicates if transcription is ongoing or finished
- `lines`: Array of text segments and silences with timestamps
- `full_text`: Complete transcribed text so far
- `session_id`: Session identifier
- `current_silence`: Current ongoing silence (if any)
- `remaining_time`: Estimated time remaining for transcription

### Line Types

**Text Line**:

```json
{
  "type": "text",
  "text": "Transcribed speech",
  "timestamp": {
    "start": "2024-01-01T00:00:00",
    "end": "2024-01-01T00:00:02",
    "duration": 2.0
  }
}
```

**Silence Line**:

```json
{
  "type": "silence",
  "timestamp": {
    "start": "2024-01-01T00:00:02",
    "end": "2024-01-01T00:00:05",
    "duration": 3.0
  }
}
```

## RabbitMQ Integration

The service publishes transcription data to RabbitMQ queues:

### Queues

1. **ASR_stream**: Partial transcription updates (sent every second)
2. **ASR**: Complete transcription (sent when session ends)
3. **speech_done**: Session completion notification

### Message Flow

1. Client connects via WebSocket
2. Audio chunks are processed in real-time
3. Partial transcripts published to `ASR_stream` queue
4. Complete transcript published to `ASR` queue on session end
5. Session completion event published to `speech_done` queue

## Configuration

### config.toml

```toml
# CORS settings for web clients
cors_allow_origins = ["http://localhost:5173"]

# RabbitMQ connection
rabbitmq_url = "amqp://appuser:apppass@127.0.0.1/"

# Whisper model configuration
whisper_model = "small"
warmup_model = false

# Recording storage
recording_dir = "../recordings/"
```

### Environment-Specific Settings

For production, update:

- `cors_allow_origins`: Add your production domain
- `rabbitmq_url`: Use production RabbitMQ credentials
- `whisper_model`: Choose based on accuracy/speed requirements
- `recording_dir`: Set to persistent storage location

## Audio Requirements

### Supported Formats

- WAV (recommended)
- MP3
- FLAC
- OGG

### Recommended Settings

- Sample Rate: 16000 Hz
- Channels: Mono (1 channel)
- Bit Depth: 16-bit
- Format: PCM

## Project Structure

```
asr_service/
├── app/
│   ├── __init__.py           # Package initialization
│   ├── main.py               # FastAPI application
│   ├── asr.py                # ASR engine and session management
│   ├── websocket.py          # WebSocket handler
│   ├── dto.py                # Data models (Pydantic)
│   ├── config.py             # Configuration management
│   └── ffmpeg_manager.py     # Audio processing utilities
├── config.toml               # Service configuration
├── pyproject.toml            # Poetry dependencies
├── poetry.lock               # Locked dependencies
├── micro-machines.wav        # Model warmup file (optional)
└── README.md                 # This file
```

## Performance Considerations

### Model Selection

- **tiny/base**: Real-time on CPU, lower accuracy
- **small**: Balanced performance, recommended for most use cases
- **medium/large**: Requires GPU for real-time performance

### Optimization Tips

1. Enable `warmup_model` for faster first transcription
2. Use GPU acceleration when available
3. Adjust model size based on accuracy requirements
4. Monitor RabbitMQ queue sizes to prevent backlog

## Integration with CogniVox

This service integrates with:

- **Stuck Detection Service**: Consumes ASR stream for repetition detection
- **Transcript Analysis Service**: Uses complete transcripts for comparison
- **Frontend Dashboard**: Displays real-time transcriptions via WebSocket
- **Document Service**: Stores and retrieves session transcripts

## Troubleshooting

### Common Issues

**Service won't start**:

- Verify RabbitMQ is running
- Check `rabbitmq_url` in config
- Ensure FFmpeg is installed

**No transcription output**:

- Verify audio format is supported
- Check WebSocket connection
- Review logs for Whisper model errors

**Slow transcription**:

- Use smaller Whisper model
- Enable GPU acceleration
- Reduce audio quality if acceptable

**FFmpeg errors**:

```bash
# Install FFmpeg
# Ubuntu/Debian
sudo apt-get install ffmpeg

# macOS
brew install ffmpeg

# Windows
# Download from https://ffmpeg.org/download.html
```

## Development

### Running Tests

```bash
poetry run pytest
```

### Debug Mode

```bash
poetry run fastapi dev app/main.py --reload
```

## License

Part of the CogniVox project.

## Author

navindunimsara2001 <navidunimsara@gmail.com>

## Support

For issues or questions, please contact the CogniVox development team or open an issue on GitHub.
