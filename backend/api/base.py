from abc import ABC, abstractmethod
from typing import TypeVar, Type
from pydantic import BaseModel
from typing import List


class ModelBase(ABC):
    """Base class for calling served ML models via API requests.
    
    Each implementation must define:
    - PredictRequest: A Pydantic model inheriting from BasePredictRequest
    - PredictResponse: A Pydantic model inheriting from BasePredictResponse
    
    These types can be customized for each model while maintaining consistency.
    """
    
    # Common request/response types for image classification models
    class BasePredictRequest(BaseModel):
        """Common request model for image classification."""
        data: str  # Base64 encoded image (with or without data URL prefix)

    class BasePredictResponse(BaseModel):
        """Common response model for image classification."""
        prediction: int  # Predicted class
        confidence: float  # Confidence score
        probabilities: List[float]  # Probabilities for each class

    # Type variables for the required types
    RequestType = TypeVar('RequestType', bound=BasePredictRequest)
    ResponseType = TypeVar('ResponseType', bound=BasePredictResponse)
    
    # Class attributes that must be defined by subclasses
    PredictRequest: Type[BasePredictRequest]
    PredictResponse: Type[BasePredictResponse]
    
    @property
    def request_type(self) -> Type[BasePredictRequest]:
        """Get the PredictRequest type for this model instance."""
        return self.__class__.PredictRequest
    
    @property
    def response_type(self) -> Type[BasePredictResponse]:
        """Get the PredictResponse type for this model instance."""
        return self.__class__.PredictResponse
    
    def __init_subclass__(cls, **kwargs):
        """Validate that subclass defines required types."""
        super().__init_subclass__(**kwargs)
        
        # Check if PredictRequest is defined and inherits from BasePredictRequest
        if not hasattr(cls, 'PredictRequest'):
            raise TypeError(f"{cls.__name__} must define a PredictRequest class attribute")
        
        if not (isinstance(cls.PredictRequest, type) and 
                issubclass(cls.PredictRequest, cls.BasePredictRequest)):
            raise TypeError(f"{cls.__name__}.PredictRequest must inherit from BasePredictRequest")
        
        # Check if PredictResponse is defined and inherits from BasePredictResponse
        if not hasattr(cls, 'PredictResponse'):
            raise TypeError(f"{cls.__name__} must define a PredictResponse class attribute")
        
        if not (isinstance(cls.PredictResponse, type) and 
                issubclass(cls.PredictResponse, cls.BasePredictResponse)):
            raise TypeError(f"{cls.__name__}.PredictResponse must inherit from BasePredictResponse")
    
    @abstractmethod
    async def predict(self, request: RequestType) -> ResponseType:
        """Make prediction with the model.
        
        Args:
            request: Input data conforming to the model's PredictRequest type
            
        Returns:
            Response conforming to the model's PredictResponse type
        """
        pass
