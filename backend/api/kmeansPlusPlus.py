"""
K-Means++ Clustering Model
"""
import aiohttp
import json
from typing import List, Dict, Any
from pydantic import BaseModel, Field
from config import config
from logger import logger
from .base import ModelBase

class ModelKMeansPlusPlus(ModelBase):
    """K-Means++ clustering model using TensorFlow Serving."""
    
    class PredictRequest(ModelBase.BasePredictRequest):
        """Request model for K-Means clustering - reuses data field for JSON points."""
        data: str
        pass
    
    class PredictResponse(ModelBase.BasePredictResponse):
        """Response model for K-Means clustering - extends base response with predictions array."""
        predictions: List[Dict[str, Any]] = Field(..., description="Array of clustering predictions for each input point")
        
    def __init__(self, version: str = "1"):
        """Initialize K-Means model with TensorFlow Serving URL."""
        self.url = config.TF_MODEL_SERVING_URL
        self.model_name = "kmeans"
        self.model_version = version
    
    def validate_request(self, data: str) -> List[List[float]]:
        """Validate and parse JSON points data.
        
        Args:
            data: JSON string containing points array
            
        Returns:
            Parsed points list
            
        Raises:
            ValueError: If data is invalid
        """
        if not data or len(data.strip()) == 0:
            raise ValueError("Empty data provided")
        
        try:
            points = json.loads(data)
        except json.JSONDecodeError as e:
            raise ValueError(f"Invalid JSON format: {str(e)}")
        
        if not isinstance(points, list) or len(points) == 0:
            raise ValueError("Points must be a non-empty array")
        
        if len(points) > 1000:
            raise ValueError("Too many points. Maximum 1000 points allowed.")
        
        # Validate each point
        for i, point in enumerate(points):
            if not isinstance(point, list) or len(point) != 2:
                raise ValueError(f"Point {i} must be a 2D coordinate [x, y]")
            
            for j, coord in enumerate(point):
                if not isinstance(coord, (int, float)):
                    raise ValueError(f"Point {i}, coordinate {j} must be a number")
        
        return points
    
    async def predict(self, request: PredictRequest) -> PredictResponse:
        """Make clustering prediction using TensorFlow Serving."""
        try:
            # Parse points from JSON data
            points = self.validate_request(request.data)
            
            # Prepare request for TensorFlow Serving
            tf_serving_request = {
                "instances": points
            }

            # Make request to TensorFlow Serving
            url = f"{self.url}/v1/models/{self.model_name}/versions/{self.model_version}:predict"
            
            logger.info(f"Making clustering request to TF Serving: {url}")
            logger.info(f"Input points: {len(points)} points")
            
            async with aiohttp.ClientSession() as session:
                async with session.post(
                    url,
                    headers={'Content-Type': 'application/json'},
                    data=json.dumps(tf_serving_request)
                ) as response:
                    
                    if response.status != 200:
                        error_text = await response.text()
                        logger.error(f"TensorFlow Serving error: {response.status} - {error_text}")
                        raise Exception(f"TensorFlow Serving request failed: {error_text}")
                    
                    result = await response.json()
            
            # Parse TensorFlow Serving response
            logger.info(f"TF Serving response structure: {result}")
            tf_predictions = result['predictions']
            
            return self.PredictResponse(
                predictions=tf_predictions
            )
            
        except aiohttp.ClientError as e:
            logger.error(f"Network error calling TensorFlow Serving: {e}")
            raise Exception(f"Failed to connect to model server: {str(e)}")
        except KeyError as e:
            logger.error(f"Unexpected response format from TensorFlow Serving: {e}")
            raise Exception(f"Invalid response from model server: missing {str(e)}")
        except Exception as e:
            logger.error(f"Clustering prediction failed: {e}")
            raise

        
