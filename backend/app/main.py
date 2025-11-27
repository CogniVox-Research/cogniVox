import asyncio
from contextlib import asynccontextmanager
from pathlib import Path

from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
import logging

from whisperlivekit import AudioProcessor

from .asr import create_engine

logging.basicConfig(
    level=logging.INFO, format="%(asctime)s - %(levelname)s - %(message)s"
)
logger = logging.getLogger(__name__)
logger.setLevel(logging.DEBUG)


transcription_engine = None


@asynccontextmanager
async def lifespan(app: FastAPI):
    global transcription_engine
    transcription_engine = create_engine()
    yield


app = FastAPI()

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


async def handle_websocket_results(websocket, results_generator):
    """Consumes results from the audio processor and sends them via WebSocket."""
    try:
        async for response in results_generator:
            await websocket.send_json(response.to_dict())
        # when the results_generator finishes it means all audio has been processed
        logger.info("Results generator finished. Sending 'ready_to_stop' to client.")
        await websocket.send_json({"type": "ready_to_stop"})
    except WebSocketDisconnect:
        logger.info(
            "WebSocket disconnected while handling results (client likely closed connection)."
        )
    except Exception as e:
        logger.exception(f"Error in WebSocket results handler: {e}")


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

            await audio_processor.process_audio(message)
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
