# Backend Dockerfile
FROM python:3.10-slim

# Set working directory
WORKDIR /app

# Install system dependencies if needed
RUN apt-get update && apt-get install -y \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements first for better Docker layer caching
COPY requirements.txt .

# Install Python dependencies
RUN pip install --no-cache-dir -r requirements.txt

# Create application user for security
RUN groupadd -r appuser && useradd -r -g appuser appuser

# Copy application source code
COPY . .

# Create necessary directories with proper permissions
RUN mkdir -p /app/saved_images /app/logs && \
    chown -R appuser:appuser /app

# Switch to non-root user for security
USER appuser

# Expose port 8000
EXPOSE 8000

# Health check
HEALTHCHECK --interval=30s --timeout=30s --start-period=5s --retries=3 \
    CMD python -c "import requests; requests.get('http://localhost:8000/')" || exit 1

# Start the application
CMD ["python", "main.py"]