# ML Zoo FastAPI Backend

A simple FastAPI backend demonstrating basic API functionality for the ML Zoo project.

## Features

- **CRUD Operations**: Create, Read, Update, Delete items
- **ML Prediction Endpoint**: Mock prediction service
- **Health Check**: Service health monitoring
- **CORS Support**: Cross-origin requests enabled
- **API Documentation**: Automatic OpenAPI/Swagger docs

## Quick Start

1. **Install dependencies:**
   ```bash
   pip install -r requirements.txt
   ```

2. **Run the server:**
   ```bash
   python main.py
   ```
   
   Or with uvicorn directly:
   ```bash
   uvicorn main:app --reload --host 0.0.0.0 --port 8000
   ```

3. **Access the API:**
   - API Base URL: http://localhost:8000
   - Interactive Docs: http://localhost:8000/docs
   - Alternative Docs: http://localhost:8000/redoc

## API Endpoints

### General
- `GET /` - Welcome message
- `GET /health` - Health check

### Items Management
- `GET /items` - Get all items
- `GET /items/{item_id}` - Get specific item
- `POST /items` - Create new item
- `PUT /items/{item_id}` - Update item
- `DELETE /items/{item_id}` - Delete item

### ML Functionality
- `POST /predict` - Make predictions (mock implementation)
- `GET /models` - Get available models

## Example Usage

### Creating an Item
```bash
curl -X POST "http://localhost:8000/items" \
  -H "Content-Type: application/json" \
  -d '{
    "id": 3,
    "name": "New Item",
    "description": "A new test item",
    "price": 15.99
  }'
```

### Making a Prediction
```bash
curl -X POST "http://localhost:8000/predict" \
  -H "Content-Type: application/json" \
  -d '{
    "data": [0.1, 0.2, 0.8, 0.9],
    "model_name": "default"
  }'
```

## Project Structure

```
frontend/
├── main.py              # FastAPI application
├── requirements.txt     # Python dependencies
└── README.md           # This file
```

## Development Notes

- The current implementation uses in-memory storage for demo purposes
- For production, replace with a proper database (PostgreSQL, MongoDB, etc.)
- The prediction endpoint is mocked - integrate with actual ML models
- CORS is configured to allow all origins - restrict in production
- Add authentication/authorization as needed

## Next Steps

1. **Database Integration**: Add SQLAlchemy or similar ORM
2. **Authentication**: Implement JWT or OAuth2
3. **ML Model Integration**: Connect to actual TensorFlow Serving
4. **Testing**: Add unit and integration tests
5. **Logging**: Implement proper logging
6. **Docker**: Add Dockerfile for containerization