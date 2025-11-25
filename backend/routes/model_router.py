"""
Model Router for ML Zoo Backend
"""
from fastapi import APIRouter, HTTPException, Path, Query
from logger import logger
from api.handnumbers import ModelHandNumbers
from api.kmeansPlusPlus import ModelKMeansPlusPlus
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
@router.post("/models/handnumbers/{version}/predict", response_model=ModelHandNumbers.PredictResponse)
async def predict_handnumbers_versioned(
    request: ModelHandNumbers.PredictRequest,
    version: str = Path(..., description="Model version to use for prediction (0 or 1)")
):
    """Predict handwritten digit from canvas drawing using specific version."""
    logger.info(f"Prediction request received for handwritten digit (version {version})")
    
    try:
        handnumbers = ModelHandNumbers(version=version)
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

@router.post("/models/kmeans/{version}/predict", response_model=ModelKMeansPlusPlus.PredictResponse)
async def predict_kmeans_plus_plus(
    request: ModelKMeansPlusPlus.PredictRequest,
    version: str = Path(..., description="Model version to use for prediction (1-5 for k=1 to k=5 clusters)")
):
    """Perform K-means clustering on 2D points using specific version."""
    logger.info(f"Prediction request received for KMeans++ (cluster {version})")
    
    try:
        kmeans = ModelKMeansPlusPlus(version)
        logger.debug(request)
        response = await kmeans.predict(request)
        logger.info(f"KMeans++ completed successfully")
        
        return response
        
    except ValueError as e:
        # Validation errors from validate_request
        logger.warning(f"Validation failed: {str(e)}")
        raise HTTPException(status_code=400, detail=f"Invalid data: {str(e)}")
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"KMeans++ prediction failed: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")
