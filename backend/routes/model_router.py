"""
Model Router for ML Zoo Backend
"""
from fastapi import APIRouter, HTTPException, Path
from logger import logger
from api.handnumbers import ModelHandNumbers
from api.modeslinfo import model_service

# Create router with /v1/ prefix
router = APIRouter(prefix="/v1")

# Model info endpoints
@router.get("/models")
async def get_all_models():
    """Get information about all available models."""
    logger.info("All models info requested")
    
    try:
        info = await model_service.get_all_models()
        return info
    except Exception as e:
        logger.error(f"Failed to get all models info: {e}")
        raise HTTPException(status_code=503, detail=f"Cannot get models info: {str(e)}")

@router.get("/models/{model_name}")
async def get_model_info_by_name(
    model_name: str = Path(..., description="Name of the model")
):
    """Get information about a specific model (all versions)."""
    logger.info(f"Model info requested for model: {model_name}")
    
    try:
        info = await model_service.get_model_info(model_name)
        return info
    except Exception as e:
        logger.error(f"Failed to get model info for {model_name}: {e}")
        raise HTTPException(status_code=503, detail=f"Cannot get model info: {str(e)}")

@router.get("/models/{model_name}/versions/{version}")
async def get_model_info_by_version(
    model_name: str = Path(..., description="Name of the model"),
    version: str = Path(..., description="Version of the model")
):
    """Get information about a specific model version."""
    logger.info(f"Model info requested for model: {model_name}, version: {version}")
    
    try:
        info = await model_service.get_model_info(model_name, version)
        return info
    except Exception as e:
        logger.error(f"Failed to get model info for {model_name} v{version}: {e}")
        raise HTTPException(status_code=503, detail=f"Cannot get model info: {str(e)}")

# Model predictions endpoints
@router.post("/models/handnumbers/predict", response_model=ModelHandNumbers.PredictResponse)
async def predict_handnumbers(
    request: ModelHandNumbers.PredictRequest = ...
):
    """Predict handwritten digit from canvas drawing."""
    logger.info("Prediction request received for handwritten digit")
    
    try:
        handnumbers = ModelHandNumbers()
        handnumbers.validate_request(request.data)
        response = await handnumbers.predict(request)
        logger.info(f"Prediction completed: digit={response.prediction}, confidence={response.confidence:.3f}")
        
        return response
        
    except ValueError as e:
        # Validation errors from validate_request
        logger.warning(f"Validation failed: {str(e)}")
        raise HTTPException(status_code=400, detail=f"Invalid image data: {str(e)}")
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Prediction failed: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")
