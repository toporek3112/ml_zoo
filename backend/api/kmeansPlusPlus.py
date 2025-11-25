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
            tf_predictions = result['predictions'][0]  # Get the response structure
            logger.info(f"TF predictions structure: {tf_predictions}")
            
            # Extract data from response - handle both single values and arrays
            cluster_assignments = tf_predictions['cluster_assignments']
            distances = tf_predictions['distances_to_assigned_cluster'] 
            centroids_3d = tf_predictions['centroids']  # Shape: [num_input_points, k, 2]
            
            logger.info(f"cluster_assignments type: {type(cluster_assignments)}, value: {cluster_assignments}")
            logger.info(f"distances type: {type(distances)}, value: {distances}")
            logger.info(f"centroids_3d type: {type(centroids_3d)}, shape: {len(centroids_3d) if isinstance(centroids_3d, list) else 'not a list'}")
            
            # Convert single values to lists if needed
            if not isinstance(cluster_assignments, list):
                cluster_assignments = [cluster_assignments] * len(points)
            if not isinstance(distances, list):
                distances = [distances] * len(points)
            
            # Extract centroids (they're the same for all input points, so take the first)
            centroids = centroids_3d[0] if isinstance(centroids_3d, list) and len(centroids_3d) > 0 else centroids_3d
            
            # Format response as array of predictions for each point
            predictions_array = []
            for i in range(len(points)):  # Use len(points) instead of len(cluster_assignments)
                predictions_array.append({
                    "cluster_assignments": int(cluster_assignments[i]) if i < len(cluster_assignments) else 0,
                    "centroids": centroids.tolist() if hasattr(centroids, 'tolist') else centroids,
                    "distances_to_assigned_cluster": float(distances[i]) if i < len(distances) else 0.0
                })
            
            # Calculate required base fields
            if isinstance(cluster_assignments, list) and len(cluster_assignments) > 0:
                dominant_cluster = max(set(cluster_assignments), key=cluster_assignments.count)
                avg_distance = sum(distances) / len(distances) if len(distances) > 0 else 0.0
            else:
                dominant_cluster = cluster_assignments if isinstance(cluster_assignments, int) else 0
                avg_distance = distances if isinstance(distances, (int, float)) else 0.0
            
            confidence = max(0.0, min(1.0, 1.0 - avg_distance / 10.0))  # Convert distance to confidence
            
            # Create simple probabilities based on cluster distribution
            if isinstance(cluster_assignments, list):
                max_cluster = max(cluster_assignments) + 1 if cluster_assignments else 1
                cluster_counts = [0] * max_cluster
                for assignment in cluster_assignments:
                    cluster_counts[assignment] += 1
                total = sum(cluster_counts)
                probabilities = [count / total for count in cluster_counts] if total > 0 else [1.0]
            else:
                probabilities = [1.0]  # Single cluster case
            
            return self.PredictResponse(
                prediction=int(dominant_cluster),
                confidence=float(confidence),
                probabilities=[float(p) for p in probabilities],
                predictions=predictions_array
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

        
