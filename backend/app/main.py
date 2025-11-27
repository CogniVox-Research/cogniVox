from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
import logging

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')

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

@app.websocket("/ws/audio")
async def websocket_endpoint(websocket: WebSocket):
    await websocket.accept()
    logging.info("WebSocket connection established for audio stream.")
    
    try:
        while True:
            
            audio_data: bytes = await websocket.receive_bytes() 
            
            
            
            logging.info(f"Received audio chunk of size: {len(audio_data)} bytes")

            
            await websocket.send_text(f"Received {len(audio_data)} bytes")

    except WebSocketDisconnect:
        logging.info("WebSocket connection closed.")
    except Exception as e:
        logging.error(f"An error occurred: {e}")
    finally:
        # Ensures connection is closed if an error occurs
        if websocket.client_state != 3:
            await websocket.close()