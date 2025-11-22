# HandNumbers
This simple ml model takes an 27x27 image array of handwritten numbers (0-9) and outputs a probability distribution of the most likely number.

Test with
```bash
curl -X POST 'http://localhost:8501/v1/models/handnumbers:predict' \
  -H 'Content-Type: application/json' \
  -d @test.json
```
