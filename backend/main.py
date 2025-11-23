"""
Simple FastAPI Backend
"""
from fastapi import FastAPI
# from config import Config
from logger import logger
from routes.model_router import router as model_router
from config import config
# Create FastAPI app
app = FastAPI(title="ML Zoo Backend")

# Include model router
app.include_router(model_router)

@app.get("/")
async def root():
    """Hello endpoint."""
    logger.info("Root endpoint called")
    return {"message": "Hello from ML Zoo Backend!"}

if __name__ == "__main__":
    import uvicorn

    logger.info(f"Starting server on {config.HOST}:{config.PORT}")
    
    uvicorn.run(
        "main:app",
        host=config.HOST,
        port=config.PORT,
        log_level=config.LOG_LEVEL.lower(),
        access_log=False  # Disable uvicorn access logs to avoid conflicts
    )
