# K-Means
This simple ml model takes an array of two dimensional coordinates and assignes them to choosen number of clusters.

Test with
```bash
curl -X POST \
  http://localhost:8501/v1/models/kmeans/versions/5:predict \
  -H 'Content-Type: application/json' \
  -d '{"instances": [[5.0, 6.0], [-1.0, -2.0], [0.0, 0.0], [8.0, 9.0], [3.0, 4.0], [3.7, 4.5], [1.7, -4.5]]}'
```
