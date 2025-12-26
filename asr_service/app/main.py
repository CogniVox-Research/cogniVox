import asyncio
from contextlib import asynccontextmanager
import json
from pathlib import Path

from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
import logging

from whisperlivekit import AudioProcessor
from whisperlivekit.audio_processor import FrontData
import aio_pika

from .asr import create_engine

logging.basicConfig(
    level=logging.INFO, format="%(asctime)s - %(levelname)s - %(message)s"
)
logger = logging.getLogger(__name__)
logger.setLevel(logging.DEBUG)


transcription_engine = None

############################################
# RabbitMQ connection
############################################
connection: aio_pika.abc.AbstractRobustConnection | None = None
channel: aio_pika.abc.AbstractChannel | None = None


@asynccontextmanager
async def lifespan(app: FastAPI):
    global transcription_engine, connection, channel
    transcription_engine = create_engine()
    connection = await aio_pika.connect_robust(
        "amqp://appuser:apppass@127.0.0.1/", loop=asyncio.get_event_loop()
    )
    await connection.connect()
    # Creating channel
    channel = await connection.channel()

    # Declaring queue
    await channel.declare_queue("ASR_stream", auto_delete=False)
    await channel.declare_queue("ASR", auto_delete=False)

    yield
    await channel.close()
    await connection.close()


app = FastAPI(lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/")
def read_root():
    return {"Hello": "FastAPI is running"}


async def handle_websocket_results(websocket, results_generator) -> FrontData | None:
    """Consumes results from the audio processor and sends them via WebSocket."""
    try:
        last_response = None
        async for response in results_generator:
            # send data to queue
            assert channel is not None, "RabbitMQ channel is not initialized"
            await channel.default_exchange.publish(
                aio_pika.Message(body=json.dumps(response.to_dict()).encode()),
                routing_key="ASR_stream",
            )

            await websocket.send_json(response.to_dict())
            last_response = response

        # await websocket.send_json({"type": "ready_to_stop"})

        return last_response
    except WebSocketDisconnect:
        logger.info(
            "WebSocket disconnected while handling results (client likely closed connection)."
        )
    except Exception as e:
        logger.exception(f"Error in WebSocket results handler: {e}")

    return None


@app.websocket("/ws/audio")
async def websocket_endpoint(websocket: WebSocket):
    audio_processor = AudioProcessor(
        transcription_engine=transcription_engine,
    )
    await websocket.accept()
    logger.info("WebSocket connection opened.")

    results_generator = await audio_processor.create_tasks()
    websocket_task = asyncio.create_task(
        handle_websocket_results(websocket, results_generator)
    )

    try:
        while True:
            message = await websocket.receive_bytes()
            if b"STOP" in message:
                logger.info("Received end from client")
                break

            await audio_processor.process_audio(message)

        await audio_processor.process_audio(None)

        last_response = await websocket_task
        if last_response:
            lines = [
                line.text for line in last_response.lines if line.text and line.speaker
            ]
            logger.info(f"Delivered speech: {''.join(lines)}")
            assert channel is not None, "RabbitMQ channel is not initialized"
            await channel.default_exchange.publish(
                aio_pika.Message(body="".join(lines).encode()),
                routing_key="ASR",
            )

    except KeyError as e:
        if "bytes" in str(e):
            logger.warning("Client has closed the connection.")
        else:
            logger.error(
                f"Unexpected KeyError in websocket_endpoint: {e}", exc_info=True
            )
    except WebSocketDisconnect:
        logger.info("WebSocket disconnected by client during message receiving loop.")
    except Exception as e:
        logger.error(
            f"Unexpected error in websocket_endpoint main loop: {e}", exc_info=True
        )
    finally:
        logger.info("Cleaning up WebSocket endpoint...")
        if not websocket_task.done():
            websocket_task.cancel()
        try:
            await websocket_task
        except asyncio.CancelledError:
            logger.info("WebSocket results handler task was cancelled.")
        except Exception as e:
            logger.warning(f"Exception while awaiting websocket_task completion: {e}")

        await audio_processor.cleanup()
        logger.info("WebSocket endpoint cleaned up successfully.")
