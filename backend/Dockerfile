# Backend Dockerfile
FROM python:3.10-slim

WORKDIR /app

# Copy requirements first for better caching
COPY requirements.txt .

# Install dependencies
RUN pip install --no-cache-dir -r requirements.txt

# Copy source code
COPY . .

# Create directory for saved images (if image saving is enabled)
RUN mkdir -p /app/saved_images

# Expose port 8000
EXPOSE 8000

# Environment variables (can be overridden at runtime)
# MLZOO_SAVE_IMAGES=false
# MLZOO_SAVE_IMAGES_PATH=/app/saved_images
# MLZOO_HOST=0.0.0.0
# MLZOO_PORT=8000
# MLZOO_LOG_LEVEL=INFO

# Start the app
CMD ["python", "main.py"]