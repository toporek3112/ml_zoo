"""
Handwritten Numbers Model
"""
import base64
import io
import numpy as np
import aiohttp
import string
from typing import List
from config import config
from logger import logger
from .base import ModelBase

class ModelHandNumbers(ModelBase):
    """Handwritten numbers model using TensorFlow Serving."""
    
    PredictRequest = ModelBase.BasePredictRequest
    PredictResponse = ModelBase.BasePredictResponse
    
    def __init__(self, version: str = "1"):
        """Initialize with URL from config."""
        self.url = config.TF_MODEL_SERVING_URL
        self.model_name = "handnumbers"
        self.model_version = version
    
    def validate_request(self, data: str) -> None:
        """Validate image data format and raise appropriate exceptions.
        
        Args:
            data: Base64 encoded image data (with or without data URL prefix)
            
        Raises:
            ValueError: If data is empty or invalid format
        """
        if not data or len(data.strip()) == 0:
            raise ValueError("Empty image data provided")
        
        # Handle both raw base64 and data URL formats
        if data.startswith('data:image/'):
            logger.info("Received canvas data URL format")
            # Validate that there's actual data after the comma
            if ',' not in data or len(data.split(',', 1)[1].strip()) == 0:
                raise ValueError("Invalid data URL format: no base64 data after comma")
        elif len(data) > 0:
            logger.info("Received raw base64 format")
            # Basic validation - check if it looks like base64
            valid_chars = string.ascii_letters + string.digits + '+/='
            if not all(c in valid_chars for c in data.replace('\n', '').replace('\r', '')):
                raise ValueError("Invalid base64 format: contains invalid characters")
        
        # Try to decode to validate it's proper base64
        try:
            test_data = data.split(',', 1)[1] if data.startswith('data:') else data
            base64.b64decode(test_data)
        except Exception as e:
            raise ValueError(f"Invalid base64 data: {str(e)}")
        

    async def predict(self, request: ModelBase.BasePredictRequest) -> ModelBase.BasePredictResponse:
        """Predict handwritten digit from base64 image data (from canvas)."""
        try:
            # Handle canvas data URL format (data:image/png;base64,...)
            data = request.data
            if data.startswith('data:image/'):
                # Extract base64 part after the comma
                data = data.split(',', 1)[1]
            
            # Decode base64 image
            image_bytes = base64.b64decode(data)
            logger.info(f"Image data decoded, size: {len(image_bytes)} bytes")
            
            # Process image for model input
            processed_image = self._process_image(image_bytes)
            logger.info(f"Image processed to shape: {processed_image.shape}")
            
            # Prepare request for TensorFlow Serving
            tf_request = {
                "instances": processed_image.tolist()
            }
            
            # Make request to TensorFlow Serving
            prediction_url = f"{self.url}/v1/models/{self.model_name}/versions/{self.model_version}:predict"
            
            async with aiohttp.ClientSession() as session:
                async with session.post(prediction_url, json=tf_request) as response:
                    if response.status != 200:
                        error_text = await response.text()
                        logger.error(f"TensorFlow Serving error: {error_text}")
                        raise Exception(f"Model serving failed: {error_text}")
                    
                    result = await response.json()
                    logger.info("Prediction received from TensorFlow Serving")
            
            # Process predictions
            predictions = result["predictions"][0]
            predicted_digit = int(np.argmax(predictions))
            confidence = float(max(predictions))
            
            logger.info(f"Predicted digit: {predicted_digit}, confidence: {confidence:.3f}")
            
            return self.PredictResponse(
                prediction=predicted_digit,
                confidence=confidence,
                probabilities=predictions
            )
            
        except Exception as e:
            logger.error(f"Prediction failed: {str(e)}")
            raise
    
    def _process_image(self, image_bytes: bytes) -> np.ndarray:
        """Process canvas image to 28x28 grayscale numpy array for MNIST model."""
        from PIL import Image
        
        # Load image from bytes
        image = Image.open(io.BytesIO(image_bytes))
        logger.info(f"Original image size: {image.size}, mode: {image.mode}")
        
        # Convert to grayscale if not already
        if image.mode != 'L':
            image = image.convert('L')
        
        # Canvas typically has white background with black drawings
        # But MNIST expects black background with white digits
        # So we need to invert the colors
        image = Image.eval(image, lambda x: 255 - x)
        
        # Resize to 28x28 (MNIST standard)
        image = image.resize((28, 28), Image.Resampling.LANCZOS)
        
        # Convert to numpy array and normalize to [0, 1]
        img_array = np.array(image, dtype=np.float32) / 255.0
        
        # Reshape for model input: (1, 28, 28, 1)
        img_array = img_array.reshape(1, 28, 28, 1)
        
        logger.info(f"Final processed shape: {img_array.shape}, min: {img_array.min():.3f}, max: {img_array.max():.3f}")
        
        return img_array
