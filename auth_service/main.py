from app import app
from app.config import config

if __name__ == "__main__":
    import uvicorn

    print("Starting CogniVox Auth Service...")
    print(f"Listening on 0.0.0.0:{config.port}")
    uvicorn.run(app, host="0.0.0.0", port=config.port)
