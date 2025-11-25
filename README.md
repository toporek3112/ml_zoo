# ML Zoo - Interactive Machine Learning Model Platform

A modern, containerized machine learning platform featuring interactive web interfaces for exploring and testing ML models. Built with **FastAPI**, **React.js**, **TensorFlow Serving**, and **Docker Compose**.

## 🎯 Project Overview

**ML Zoo** is a comprehensive machine learning platform that demonstrates:

- **🎨 Interactive Neural Networks**: Handwritten digit recognition with drawing canvas
- **📊 Dynamic K-Means Clustering**: Real-time clustering visualization
- **🚀 Production-Ready Architecture**: Containerized deployment with TensorFlow Serving
- **📈 Monitoring & Observability**: Prometheus metrics and Grafana dashboards
- **🔄 Real-time Inference**: FastAPI backend with async processing

### ✨ Key Features

| Feature | Description |
|---------|-------------|
| **Interactive Canvas** | Draw digits and see real-time neural network predictions |
| **Dynamic Clustering** | Click to add points and watch K-means centroids recalculate |
| **Model Versioning** | Switch between different model versions (CNNs, cluster counts) |
| **RESTful API** | OpenAPI/Swagger documentation with structured endpoints |

## 🚀 Quick Start

### One-Command Deployment

```bash
# Deploy complete platform
docker-compose up -d

# View service status
docker-compose ps
```

### 🌐 Access Points

Once deployed, access these services:

| Service | URL | Description |
|---------|-----|-------------|
| **🎨 Web Interface** | [http://localhost:3000](http://localhost:3000) | Interactive ML playground |
| **📚 API Docs** | [http://localhost:8000/docs](http://localhost:8000/docs) | Swagger UI documentation |
| **🤖 TensorFlow Serving** | [http://localhost:8501](http://localhost:8501) | Model serving REST API |
| **📊 Grafana Dashboard** | [http://localhost:3001](http://localhost:3001) | Monitoring dashboard |
| **📈 Prometheus** | [http://localhost:9090](http://localhost:9090) | Metrics collection |

---

## 🏗️ Architecture

```
┌─────────────────┐    ┌───────────────────┐    ┌──────────────────┐
│   React.js      │    │   FastAPI         │    │ TensorFlow       │
│   Frontend      │◄──►│   Backend         │◄──►│ Serving          │
│                 │    │                   │    │                  │
│ • Drawing Canvas│    │ • RESTful API     │    │ • Model Hosting  │
│ • Clustering UI │    │ • Async Processing│    │ • Version Control│
│ • Real-time Viz │    │ • Image Processing│    │ • gRPC/REST API  │
└─────────────────┘    └───────────────────┘    └──────────────────┘
                                                         │
                                 ┌───────────────────────┘
                                 ▼
              ┌─────────────────────────────────┐
              │        Monitoring Stack         │
              │                                 │
              │ Prometheus ◄─► Grafana          │
              │ (Metrics)      (Dashboards)     │
              └─────────────────────────────────┘
```

### 🧩 Components

- **Frontend** (`React.js`): Interactive canvas components with real-time visualization
- **Backend** (`FastAPI`): Async API server with image processing and model orchestration  
- **Model Server** (`TensorFlow Serving`): Production ML model hosting with version management
- **Monitoring** (`Prometheus + Grafana`): Metrics collection and visualization dashboards

## 🛠️ Development

### Prerequisites

- **Python 3.11**
- **Node.js v16.19.1** 
- **Docker & Docker Compose**
- **Git**

### Backend Development

```bash
cd backend

# Install dependencies
pip install -r requirements.txt

# Start development server
uvicorn main:app --reload --host 0.0.0.0 --port 8000

# Server starts at: http://localhost:8000
# API docs available at: http://localhost:8000/docs
```

### Frontend Development  

```bash
cd frontend

# Install dependencies
npm install

# Start development server
npm start

# Application starts at: http://localhost:3000
```

### Model Testing

#### Handwritten Digits Recognition
```bash
# Test digit recognition with base64 image
curl -X POST http://localhost:8000/v1/models/handnumbers/predict \
  -H "Content-Type: application/json" \
  -d '{
    "data": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABwAAAAcCAAAAABXZoBIAAAA2klEQVR4nGP8z4AbMOGRG3ySLBBq9WwpjmgJVTRJRog/FR8wMDDwakMFZcpMkXXOvqh17fyBE7KPGRhYRJ8zyJki62RgYGBgeHfe5DQDA4ea5rsp2RCR/xhgNaPuGwgLU/KFKMNqKBPTK1NfC6jD2OgaD7MyHPiPS+e2386WDDh0fjVkOwLnoEs2MHj8xyW5mZnvKC7J14oMEf9xSP42ZlC+jUvyBgPDxv84JO/LMXT/RZZE9uesRwz2qP5GqDvIw8Bw6j8OnUe+MCjzoGhkQebo7xVGkWTElx0AxZw0MijSkCQAAAAASUVORK5CYII="
  }'

# Expected response:
# {
#   "prediction": 7,
#   "confidence": 0.98,
#   "probabilities": [0.001, 0.002, ..., 0.98, ...]
# }
```

#### K-Means Clustering
```bash
# Test clustering with coordinate points
curl -X POST http://localhost:8000/v1/models/kmeans/3/predict \
  -H "Content-Type: application/json" \
  -d '{
    "data": "[[1.0, 1.0], [1.5, 1.5], [8.0, 8.0], [8.5, 8.5], [5.0, 5.0]]"
  }'

# Expected response:
# {
#   "predictions": [
#     {
#       "cluster_assignments": 0,
#       "distances_to_assigned_cluster": 0.707,
#       "centroids": [[1.25, 1.25], [8.25, 8.25], [5.0, 5.0]]
#     }
#   ]
# }
```

### Model Information
```bash
# Get all available models
curl http://localhost:8000/v1/models

# Get specific model info
curl http://localhost:8000/v1/models/handnumbers

# Get specific model version
curl http://localhost:8000/v1/models/kmeans/versions/3
```

## 📊 Models

### 1. **Handwritten Digits Recognition**

| Version | Architecture | Accuracy | Description |
|---------|--------------|----------|-------------|
| **0** | Fully Connected | ~97% | Dense neural network (784→128→64→10) |
| **1** | Convolutional | ~99% | CNN with Conv2D + MaxPooling layers |

**Features:**
- Real-time canvas drawing
- 28x28 grayscale preprocessing  
- Base64 image encoding
- Confidence scores and probability distributions

### 2. **Dynamic K-Means Clustering**

| Version | Clusters | Algorithm | Features |
|---------|----------|-----------|----------|
| **1-5** | 1-5 | K-means++ | Wikipedia-compliant initialization |

**Features:**
- Interactive point placement
- Real-time centroid recalculation
- Stable color mapping 
- Distance-based cluster assignment

## 🔧 Configuration

### Environment Variables

```bash
# Backend Configuration
MLZOO_LOG_LEVEL=INFO
MLZOO_LOG_FORMAT=json
MLZOO_HOST=0.0.0.0
MLZOO_PORT=8000
MLZOO_TF_MODEL_SERVING_URL=http://localhost:8501
MLZOO_KNOWN_MODELS=handnumbers,kmeans
MLZOO_SAVE_IMAGES=false
MLZOO_SAVE_IMAGES_PATH=./images
```

## 📈 Monitoring

### Prometheus Metrics

- **Model Inference Latency**: Response time tracking
- **Request Throughput**: Requests per second
- **Model Performance**: Accuracy and confidence metrics
- **System Resources**: CPU, memory, and GPU utilization

### Grafana Dashboards

Access pre-configured dashboards at [http://localhost:3001](http://localhost:3001):

- **Model Performance Overview**
- **Request Analytics**  
- **System Health Monitoring**
- **TensorFlow Serving Metrics**


## 🤝 Contributing

1. **Fork** the repository
2. **Create** feature branch (`git checkout -b feature/amazing-feature`)
3. **Commit** changes (`git commit -m 'Add amazing feature'`)
4. **Push** to branch (`git push origin feature/amazing-feature`)
5. **Open** a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

**Built with ❤️ using TensorFlow, FastAPI, React, and Docker**
