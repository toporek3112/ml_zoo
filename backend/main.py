"""
Simple FastAPI Backend
"""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
# from config import Config
from logger import logger
from routes.model_router import router as model_router
from config import config

# Create FastAPI app
app = FastAPI(title="ML Zoo Backend")

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],  # React dev server
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include model router
app.include_router(model_router)

@app.get("/")
async def root():
    """Hello endpoint."""
    logger.info("Root endpoint called")
    return {"message": "Hello from ML Zoo Backend!"}

if __name__ == "__main__":
    import uvicorn

    # Log configuration details
    logger.info(f"Starting server on {config.HOST}:{config.PORT}")
    logger.info(f"Log format: {config.LOG_FORMAT}")
    logger.info(f"Image saving enabled: {config.SAVE_IMAGES}")
    logger.info(f"Image save path: {config.SAVE_IMAGES_PATH}")
    
    uvicorn.run(
        "main:app",
        host=config.HOST,
        port=config.PORT,
        log_level=config.LOG_LEVEL.lower(),
        access_log=True
    )
