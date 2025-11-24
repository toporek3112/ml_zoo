# ML Zoo

A containerized machine learning model serving platform with an intuitive React.js web interface for model interaction and monitoring.

## Quick Start

Deploy the complete stack using Docker Compose:

```bash
docker-compose up -d
```

Once all containers are running, access the following services:

- **Web Interface**: http://localhost:3000/
- **API Documentation**: http://localhost:8000/docs
- **Monitoring Dashboard**: http://localhost:3001/

## Development

### Backend

Install dependencies:
```bash
pip install -r requirements.txt
```

Start the development server:
```bash
uvicorn main:app --reload
```

#### API Testing

Test the HandNumbers model:
```bash
curl -X POST http://localhost:8000/v1/models/handnumbers/predict \
  -H "Content-Type: application/json" \
  -d '{
    "data": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABwAAAAcCAAAAABXZoBIAAAA2klEQVR4nGP8z4AbMOGRG3ySLBBq9WwpjmgJVTRJRog/FR8wMDDwakMFZcpMkXXOvqh17fyBE7KPGRhYRJ8zyJki62RgYGBgeHfe5DQDA4ea5rsp2RCR/xhgNaPuGwgLU/KFKMNqKBPTK1NfC6jD2OgaD7MyHPiPS+e2386WDDh0fjVkOwLnoEs2MHj8xyW5mZnvKC7J14oMEf9xSP42ZlC+jUvyBgPDxv84JO/LMXT/RZZE9uesRwz2qP5GqDvIw8Bw6j8OnUe+MCjzoGhkQebo7xVGkWTElx0AxZw0MijSkCQAAAAASUVORK5CYII="
  }'
```

### Frontend

Install dependencies:
```bash
npm install
```

Start the development server:
```bash
npm start
```

The application will be available at http://localhost:3000
