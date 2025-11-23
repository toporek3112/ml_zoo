# ML Zoo FastAPI Backend

## Development
Install dependencies 
```bash
pip install -r requirements.txt
```

Run server
```bash
uvicorn main:app --reload
```

## Testing
### HandNumbers
```bash
# test predicting number 7
curl -X POST http://localhost:8000/v1/models/handnumbers/predict \
  -H "Content-Type: application/json" \
  -d '{
    "data": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABwAAAAcCAAAAABXZoBIAAAA2klEQVR4nGP8z4AbMOGRG3ySLBBq9WwpjmgJVTRJRog/FR8wMDDwakMFZcpMkXXOvqh17fyBE7KPGRhYRJ8zyJki62RgYGBgeHfe5DQDA4ea5rsp2RCR/xhgNaPuGwgLU/KFKMNqKBPTK1NfC6jD2OgaD7MyHPiPS+e2386WDDh0fjVkOwLnoEs2MHj8xyW5mZnvKC7J14oMEf9xSP42ZlC+jUvyBgPDxv84JO/LMXT/RZZE9uesRwz2qP5GqDvIw8Bw6j8OnUe+MCjzoGhkQebo7xVGkWTElx0AxZw0MijSkCQAAAAASUVORK5CYII="
  }'
```
