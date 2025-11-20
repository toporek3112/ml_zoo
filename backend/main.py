from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional
import uvicorn

# Initialize FastAPI app
app = FastAPI(
    title="ML Zoo Backend",
    description="A simple FastAPI backend for ML Zoo",
    version="1.0.0"
)

# Add CORS middleware to allow frontend connections
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, specify your frontend URL
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Pydantic models for request/response
class Item(BaseModel):
    id: int
    name: str
    description: Optional[str] = None
    price: float

class PredictionRequest(BaseModel):
    data: List[float]
    model_name: Optional[str] = "default"

class PredictionResponse(BaseModel):
    prediction: str
    confidence: float
    model_used: str

# In-memory storage for demo (use database in production)
items_db = [
    Item(id=1, name="Sample Item 1", description="First demo item", price=10.99),
    Item(id=2, name="Sample Item 2", description="Second demo item", price=25.50),
]

# Root endpoint
@app.get("/")
async def root():
    return {"message": "Welcome to ML Zoo Backend API!"}

# Health check endpoint
@app.get("/health")
async def health_check():
    return {"status": "healthy", "service": "ml-zoo-backend"}

# Get all items
@app.get("/items", response_model=List[Item])
async def get_items():
    return items_db

# Get item by ID
@app.get("/items/{item_id}", response_model=Item)
async def get_item(item_id: int):
    item = next((item for item in items_db if item.id == item_id), None)
    if item is None:
        raise HTTPException(status_code=404, detail="Item not found")
    return item

# Create new item
@app.post("/items", response_model=Item)
async def create_item(item: Item):
    # Check if item with same ID already exists
    if any(existing_item.id == item.id for existing_item in items_db):
        raise HTTPException(status_code=400, detail="Item with this ID already exists")
    
    items_db.append(item)
    return item

# Update item
@app.put("/items/{item_id}", response_model=Item)
async def update_item(item_id: int, updated_item: Item):
    for i, item in enumerate(items_db):
        if item.id == item_id:
            items_db[i] = updated_item
            return updated_item
    
    raise HTTPException(status_code=404, detail="Item not found")

# Delete item
@app.delete("/items/{item_id}")
async def delete_item(item_id: int):
    for i, item in enumerate(items_db):
        if item.id == item_id:
            deleted_item = items_db.pop(i)
            return {"message": f"Item '{deleted_item.name}' deleted successfully"}
    
    raise HTTPException(status_code=404, detail="Item not found")

# ML Prediction endpoint (mock implementation)
@app.post("/predict", response_model=PredictionResponse)
async def predict(request: PredictionRequest):
    # This is a mock prediction - replace with actual ML model inference
    if not request.data:
        raise HTTPException(status_code=400, detail="No data provided for prediction")
    
    # Mock prediction logic
    prediction_value = sum(request.data) / len(request.data)
    
    if prediction_value > 0.5:
        prediction = "positive"
        confidence = min(prediction_value, 0.95)
    else:
        prediction = "negative" 
        confidence = min(1 - prediction_value, 0.95)
    
    return PredictionResponse(
        prediction=prediction,
        confidence=round(confidence, 3),
        model_used=request.model_name or "default"
    )

# Get available models endpoint
@app.get("/models")
async def get_models():
    return {
        "available_models": ["handnumbers", "default"],
        "default_model": "default"
    }

if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)