"""
Generic Model Service Client for TensorFlow Serving
"""
import aiohttp
from logger import logger
from config import config
from typing import Optional, Dict, List, Any

class ModelServiceClient:
    """Generic client for TensorFlow Serving models."""
    
    def __init__(self):
        """Initialize with TensorFlow Serving base URL."""
        self.base_url = config.TF_MODEL_SERVING_URL
    
    async def get_all_models(self) -> Dict[str, Any]:
        """
        Get all available models from TensorFlow Serving.
        This tries to discover models by checking known model names.
        """
        # Known models from configuration - can be extended
        known_models = self._get_known_models()
        
        all_models = {}
        for model_name in known_models:
            try:
                model_info = await self._get_model_info(model_name)
                all_models[model_name] = model_info
            except Exception as e:
                logger.warning(f"Failed to get info for model '{model_name}': {str(e)}")
                all_models[model_name] = {"error": str(e)}
        
        return {
            "models": all_models,
            "total_models": len(all_models),
            "available_models": len([m for m in all_models.values() if "error" not in m])
        }
    
    async def _get_model_info(self, model_name: str, version: Optional[str] = None) -> Dict[str, Any]:
        """
        Get model information from TensorFlow Serving.
        
        Args:
            model_name: Name of the model
            version: Optional version (if not specified, gets all versions)
        """
        try:
            if version:
                # Get specific model version info
                url = f"{self.base_url}/v1/models/{model_name}/versions/{version}"
            else:
                # Get all versions for the model
                url = f"{self.base_url}/v1/models/{model_name}"
            
            async with aiohttp.ClientSession() as session:
                async with session.get(url) as response:
                    if response.status == 200:
                        result = await response.json()
                        logger.info(f"Model info retrieved for '{model_name}'" + 
                                  (f" version '{version}'" if version else ""))
                        return result
                    else:
                        error_text = await response.text()
                        logger.warning(f"Failed to get model info for '{model_name}': HTTP {response.status}")
                        raise Exception(f"Model service returned status {response.status}: {error_text}")
                        
        except aiohttp.ClientError as e:
            logger.warning(f"Cannot connect to model service: {str(e)}")
            raise Exception(f"Cannot connect to model service at {self.base_url}")
        except Exception as e:
            logger.error(f"Failed to get model info: {str(e)}")
            raise
    
    def _get_known_models(self) -> List[str]:
        """
        Get list of known models from configuration.
        This can be extended to read from environment variables or config files.
        """
        known_models = config.KNOWN_MODELS
        return [model.strip() for model in known_models.split(",")]

model_service = ModelServiceClient()

    # def predict(self, model: str, data: any) -> BasePredictResponse:
    #     logger.info(f"Calling model serving service for predictions from model: {model}")
    #     pass