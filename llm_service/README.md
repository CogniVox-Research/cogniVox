# LLM Service (Large Language Model)

A microservice for the CogniVox platform that provides AI-powered contextual suggestions using large language models to help speakers continue their conversations.

## Overview

The LLM Service is a FastAPI-based microservice that leverages the Qwen language model to generate intelligent suggestions when speakers get stuck during conversations. It integrates with the Document Service to retrieve expected transcripts and provides contextual recommendations via RabbitMQ RPC.

## Features

- Contextual suggestion generation using Qwen 3 model
- RPC-based service communication via RabbitMQ
- Integration with Document Service for transcript retrieval
- Optional thinking mode for enhanced reasoning
- GPU acceleration support
- Lightweight 0.6B parameter model for fast inference

## Technology Stack

- **Framework**: FastAPI
- **LLM**: Qwen/Qwen3-0.6B (Hugging Face Transformers)
- **Message Queue**: RabbitMQ (RPC pattern)
- **ML Libraries**: PyTorch, Transformers, Accelerate
- **Python**: 3.12+
- **Dependency Management**: Poetry

## Architecture

```
┌──────────────────┐         ┌──────────────┐         ┌──────────────────┐
│  Stuck Detection │────────▶│  LLM Service │────────▶│ Document Service │
│     Service      │   RPC   │  (RPC Server)│   RPC   │   (RPC Client)   │
└──────────────────┘         └──────────────┘         └──────────────────┘
                                     │
                                     │
                                     ▼
                             ┌──────────────┐
                             │  Qwen Model  │
                             │  Generation  │
                             └──────────────┘
```

## Installation

### Prerequisites

- Python 3.12 or higher
- Poetry
- RabbitMQ server
- CUDA-compatible GPU (optional, for acceleration)

### Setup

1. **Navigate to the service directory**:
```bash
cd llm_service
```

2. **Install dependencies**:
```bash
poetry install
```

3. **Configure the service**:

Edit `config.toml`:
```toml
port = 99999              # Service port (not currently used)
enable_thinking = false   # Enable model thinking mode
rabbitmq_url = "amqp://appuser:apppass@127.0.0.1/"
```

### GPU Support

For GPU acceleration, ensure PyTorch with CUDA is installed:

```bash
# Install PyTorch with CUDA support
poetry run pip install torch --index-url https://download.pytorch.org/whl/cu118
```

## Usage

### Starting the Service

```bash
poetry run fastapi dev main.py
```

The service will:
1. Connect to RabbitMQ
2. Load the Qwen language model
3. Register as an RPC server (`llm-server`)
4. Connect to Document Service as RPC client

### RPC Interface

The service exposes the following RPC methods:

#### get_continue_for

Generate suggestions for continuing a conversation.

**Parameters**:
- `session_id` (str): Session identifier
- `current_text` (str): Current speech transcript

**Returns**:
- `str`: Generated suggestion for continuing the conversation

**Example RPC Call** (from another service):
```python
from shared import rpc

# In your service
async with rpc.RPCClient(channel) as client:
    llm_service = client.get_server("llm-server", LLMService)
    suggestion = await llm_service.get_continue_for(
        session_id="session-123",
        current_text="I was thinking about..."
    )
    print(suggestion)
```

## Model Details

### Qwen3-0.6B

- **Model**: Qwen/Qwen3-0.6B
- **Parameters**: 600 million
- **Type**: Causal Language Model
- **Context Length**: Up to 32K tokens
- **Strengths**: Fast inference, low memory footprint, multilingual support

### Generation Parameters

```python
max_new_tokens = 32768  # Maximum tokens to generate
enable_thinking = False  # Optional thinking mode
```

### Thinking Mode

When `enable_thinking` is enabled, the model uses internal reasoning before generating the final response. This can improve response quality but increases generation time.

## Configuration

### config.toml

```toml
# Service port (reserved for future use)
port = 99999

# Enable model thinking mode for enhanced reasoning
enable_thinking = false

# RabbitMQ connection
rabbitmq_url = "amqp://appuser:apppass@127.0.0.1/"
```

### Configuration Options

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `port` | int | 99999 | Reserved service port |
| `enable_thinking` | bool | false | Enable model thinking mode |
| `rabbitmq_url` | str | - | RabbitMQ connection URL |

## Integration Flow

1. **Stuck Detection**: Detects when a speaker is stuck
2. **RPC Request**: Calls `get_continue_for` on LLM Service
3. **Document Retrieval**: LLM Service fetches expected transcript from Document Service
4. **Prompt Construction**: Builds prompt with expected and current text
5. **Generation**: Qwen model generates continuation suggestion
6. **Response**: Returns suggestion to Stuck Detection Service
7. **User Feedback**: Suggestion displayed to user

## Project Structure

```
llm_service/
├── app/
│   ├── __init__.py           # FastAPI app and lifespan management
│   ├── config.py             # Configuration management
│   ├── llm.py                # LLM generation logic
│   └── rpc_handler.py        # RPC server implementation
├── config.toml               # Service configuration
├── main.py                   # Entry point
├── pyproject.toml            # Poetry dependencies
├── poetry.lock               # Locked dependencies
└── README.md                 # This file
```

## Code Overview

### LLM Generation (`llm.py`)

```python
def generate_content(messages):
    # Load tokenizer and model
    tokenizer = AutoTokenizer.from_pretrained(model_name)
    model = AutoModelForCausalLM.from_pretrained(
        model_name, dtype="auto", device_map="auto"
    )
    
    # Apply chat template
    text = tokenizer.apply_chat_template(
        messages,
        tokenize=False,
        add_generation_prompt=True,
        enable_thinking=config.enable_thinking,
    )
    
    # Generate response
    generated_ids = model.generate(**model_inputs, max_new_tokens=32768)
    
    return content
```

### RPC Handler (`rpc_handler.py`)

```python
class LLMRPCServer:
    async def get_continue_for(self, session_id: str, current_text: str):
        # Retrieve expected transcript
        content = await self.docs.get_transcript(session_id)
        
        # Build prompt
        input_text = f"Expected transcript: {content['text']}\n"
        input_text += f"Current speech: {current_text}\n"
        input_text += "Next sentence:"
        
        # Generate suggestion
        return generate_content(input_text)
```

## Performance Considerations

### Model Loading
- First request may be slow due to model loading
- Model is cached in memory after first use
- Consider pre-warming model on startup for production

### Memory Requirements
- **CPU**: ~2GB RAM
- **GPU**: ~2GB VRAM (with GPU acceleration)

### Optimization Tips
1. Use GPU acceleration for faster inference
2. Enable model quantization for lower memory usage
3. Adjust `max_new_tokens` based on use case
4. Consider model caching strategies

## Dependencies

### Core Dependencies
- `fastapi[standard]`: Web framework
- `transformers`: Hugging Face model library
- `torch`: PyTorch for model inference
- `accelerate`: GPU acceleration
- `shared`: Internal RPC and messaging utilities

### Version Requirements
```toml
python = ">=3.12,<3.15"
fastapi = "^0.119.0"
transformers = "^4.57.3"
torch = "^2.9.1"
accelerate = "^1.12.0"
```

## Integration with CogniVox

This service integrates with:

- **Stuck Detection Service**: Primary consumer, requests suggestions when speakers are stuck
- **Document Service**: Provides expected transcripts for context
- **RabbitMQ**: RPC communication layer

## Troubleshooting

### Common Issues

**Service won't start**:
- Verify RabbitMQ is running
- Check `rabbitmq_url` in config
- Ensure Document Service is available

**Model loading fails**:
- Check internet connection (first run downloads model)
- Verify disk space for model cache
- Check Hugging Face Hub access

**Out of memory errors**:
- Reduce `max_new_tokens`
- Use CPU instead of GPU
- Enable model quantization

**Slow generation**:
- Enable GPU acceleration
- Use smaller model variant
- Disable thinking mode

### Model Cache Location

Models are cached by default in:
- Linux/Mac: `~/.cache/huggingface/`
- Windows: `C:\Users\<username>\.cache\huggingface\`

To change cache location:
```bash
export TRANSFORMERS_CACHE=/path/to/cache
```

## Development

### Running in Development Mode

```bash
poetry run fastapi dev main.py --reload
```

### Testing RPC Methods

```python
# Test script example
import asyncio
from shared import rabbitmq, rpc

async def test_llm():
    async with rabbitmq.connect("amqp://appuser:apppass@127.0.0.1/") as channel:
        async with rpc.RPCClient(channel) as client:
            llm = client.get_server("llm-server", LLMService)
            result = await llm.get_continue_for(
                "session-123",
                "I was thinking about the importance of..."
            )
            print(f"Suggestion: {result}")

asyncio.run(test_llm())
```

## Future Enhancements

- Support for multiple LLM models
- Fine-tuning on domain-specific data
- Streaming response generation
- Prompt template customization
- Response caching for common patterns
- Multi-language support optimization

## License

Part of the CogniVox project.

## Author

yehan2002 <yehanjaya2002@gmail.com>

## Support

For issues or questions, please contact the CogniVox development team or open an issue on GitHub.

## References

- [Qwen Model Documentation](https://huggingface.co/Qwen)
- [Hugging Face Transformers](https://huggingface.co/docs/transformers)
- [FastAPI Documentation](https://fastapi.tiangolo.com/)