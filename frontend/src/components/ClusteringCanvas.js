import { useRef, useState, useEffect } from 'react';
import axios from 'axios';
import './ClusteringCanvas.css';

const ClusteringCanvas = ({ models, selectedModel, onVersionChange }) => {
  const canvasRef = useRef(null);
  const [points, setPoints] = useState([]);
  const [prediction, setPrediction] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [stableClusterMapping, setStableClusterMapping] = useState({});
  const [selectedVersion, setSelectedVersion] = useState(
    selectedModel?.selectedVersion || '5'
  );
  const [availableVersions, setAvailableVersions] = useState([]);
  const [canvasDimensions, setCanvasDimensions] = useState({ width: 400, height: 400 });

  // Colors for different clusters
  const clusterColors = [
    '#FF6B6B',  '#FECA57', '#FF9FF3', '#54A0FF', '#5F27CD'
  ];

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');

    const resizeCanvas = () => {
      const container = canvas.parentElement;
      const containerWidth = container.clientWidth;
      const containerHeight = container.clientHeight;

      // Set canvas to match container size exactly
      canvas.width = containerWidth;
      canvas.height = containerHeight;

      setCanvasDimensions({ width: containerWidth, height: containerHeight });
      redrawCanvas();
    };

    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    return () => {
      window.removeEventListener('resize', resizeCanvas);
    };
  }, []);

  // Redraw canvas whenever points or prediction change
  useEffect(() => {
    redrawCanvas();
  }, [points, prediction, canvasDimensions]);

  // Update selected version when selectedModel prop changes
  useEffect(() => {
    if (selectedModel?.selectedVersion && selectedModel.selectedVersion !== selectedVersion) {
      setSelectedVersion(selectedModel.selectedVersion);
    }
  }, [selectedModel?.selectedVersion]);

  useEffect(() => {
    extractModelVersions();
  }, [models, selectedVersion]);

  // Extract available model versions from models prop
  const extractModelVersions = () => {
    // Try both "kmeans" and "clustering" as model names
    const modelData = models?.kmeans || models?.clustering;
    
    if (!modelData) {
      console.warn('K-means/clustering models data not available');
      setAvailableVersions([]);
      return;
    }

    if (modelData.error) {
      console.warn('K-means/clustering model service error:', modelData.error);
      setAvailableVersions([]);
      setError(`Model service unavailable: ${modelData.error}`);
      return;
    }

    if (!modelData.model_version_status) {
      console.warn('model_version_status not available for k-means/clustering');
      setAvailableVersions([]);
      return;
    }

    const versions = modelData.model_version_status
      .map(versionInfo => ({
        version: versionInfo.version.toString(),
        state: versionInfo.state,
        status: versionInfo.status
      }))
      .filter(v => v.state === 'AVAILABLE');
    
    setAvailableVersions(versions);
    
    // Set default to highest available version if current selection isn't available
    const availableVersionNumbers = versions.map(v => v.version);
    if (availableVersionNumbers.length > 0 && !availableVersionNumbers.includes(selectedVersion)) {
      const highestVersion = Math.max(...availableVersionNumbers.map(v => parseInt(v))).toString();
      setSelectedVersion(highestVersion);
    }
    
    setError(null);
  };

  // Handle version selection changes
  const handleVersionChange = (newVersion) => {
    setSelectedVersion(newVersion);
    setStableClusterMapping({}); // Reset mapping when changing cluster count
    if (onVersionChange) {
      onVersionChange(newVersion);
    }
    // Recompute clustering if we have enough points
    if (points.length >= 2) {
      predictClusters(points, newVersion);
    }
  };

  // Convert canvas coordinates to data coordinates
  const canvasToDataCoords = (canvasX, canvasY) => {
    const padding = 40;
    const usableWidth = canvasDimensions.width - 2 * padding;
    const usableHeight = canvasDimensions.height - 2 * padding;
    
    // Map to range [-10, 10] for both axes
    const dataX = ((canvasX - padding) / usableWidth) * 20 - 10;
    const dataY = -(((canvasY - padding) / usableHeight) * 20 - 10); // Invert Y axis
    
    return [parseFloat(dataX.toFixed(2)), parseFloat(dataY.toFixed(2))];
  };

  // Convert data coordinates to canvas coordinates
  const dataToCanvasCoords = (dataX, dataY) => {
    const padding = 40;
    const usableWidth = canvasDimensions.width - 2 * padding;
    const usableHeight = canvasDimensions.height - 2 * padding;
    
    // Map from range [-10, 10] to canvas coordinates
    const canvasX = ((dataX + 10) / 20) * usableWidth + padding;
    const canvasY = ((-dataY + 10) / 20) * usableHeight + padding; // Invert Y axis
    
    return [canvasX, canvasY];
  };

  const getMousePos = (e) => {
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    
    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY
    };
  };

  const handleCanvasClick = (e) => {
    const pos = getMousePos(e);
    const dataCoords = canvasToDataCoords(pos.x, pos.y);
    
    const newPoints = [...points, dataCoords];
    setPoints(newPoints);
    
    // Auto-predict if we have enough points
    if (newPoints.length >= 2) {
      predictClusters(newPoints);
    }
  };

  const redrawCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    const { width, height } = canvasDimensions;
    
    // Clear canvas
    ctx.clearRect(0, 0, width, height);
    
    // Draw background
    ctx.fillStyle = '#f8f9fa';
    ctx.fillRect(0, 0, width, height);
    
    // Draw grid and axes
    drawGrid(ctx, width, height);
    
    // Draw centroids if available
    if (prediction && prediction.predictions.length > 0) {
      drawCentroids(ctx);
    }
    
    // Draw points
    drawPoints(ctx);
  };

  const drawGrid = (ctx, width, height) => {
    const padding = 40;
    const usableWidth = width - 2 * padding;
    const usableHeight = height - 2 * padding;
    
    ctx.strokeStyle = '#e0e0e0';
    ctx.lineWidth = 1;
    
    // Draw grid lines
    for (let i = 0; i <= 20; i++) {
      const x = padding + (i / 20) * usableWidth;
      const y = padding + (i / 20) * usableHeight;
      
      // Vertical lines
      ctx.beginPath();
      ctx.moveTo(x, padding);
      ctx.lineTo(x, height - padding);
      ctx.stroke();
      
      // Horizontal lines
      ctx.beginPath();
      ctx.moveTo(padding, y);
      ctx.lineTo(width - padding, y);
      ctx.stroke();
    }
    
    // Draw main axes
    ctx.strokeStyle = '#999';
    ctx.lineWidth = 2;
    
    // X-axis (y=0)
    const centerY = height / 2;
    ctx.beginPath();
    ctx.moveTo(padding, centerY);
    ctx.lineTo(width - padding, centerY);
    ctx.stroke();
    
    // Y-axis (x=0)
    const centerX = width / 2;
    ctx.beginPath();
    ctx.moveTo(centerX, padding);
    ctx.lineTo(centerX, height - padding);
    ctx.stroke();
    
    // Draw axis labels
    ctx.fillStyle = '#666';
    ctx.font = '12px Arial';
    ctx.textAlign = 'center';
    
    // X-axis labels
    for (let i = -10; i <= 10; i += 5) {
      if (i === 0) continue;
      const [x] = dataToCanvasCoords(i, 0);
      ctx.fillText(i.toString(), x, centerY + 15);
    }
    
    // Y-axis labels
    ctx.textAlign = 'right';
    for (let i = -10; i <= 10; i += 5) {
      if (i === 0) continue;
      const [, y] = dataToCanvasCoords(0, i);
      ctx.fillText(i.toString(), centerX - 10, y + 4);
    }
    
    // Origin label
    ctx.fillText('0', centerX - 10, centerY + 15);
  };

  const drawPoints = (ctx) => {
    points.forEach((point, index) => {
      const [canvasX, canvasY] = dataToCanvasCoords(point[0], point[1]);
      
      // Determine color based on cluster assignment with stable mapping
      let color = '#333';
      if (prediction && prediction.predictions && prediction.predictions[index]) {
        const originalClusterIndex = prediction.predictions[index].cluster_assignments;
        const stableClusterIndex = stableClusterMapping[originalClusterIndex] !== undefined 
          ? stableClusterMapping[originalClusterIndex] 
          : originalClusterIndex;
        color = clusterColors[stableClusterIndex % clusterColors.length];
      }
      
      // Draw point
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.arc(canvasX, canvasY, 6, 0, 2 * Math.PI);
      ctx.fill();
      
      // Draw border
      ctx.strokeStyle = '#fff';
      ctx.lineWidth = 2;
      ctx.stroke();
    });
  };

  const drawCentroids = (ctx) => {
    if (!prediction || !prediction.predictions[0]) return;
    
    const centroids = prediction.predictions[0].centroids;
    
    centroids.forEach((centroid, originalIndex) => {
      const [canvasX, canvasY] = dataToCanvasCoords(centroid[0], centroid[1]);
      const stableIndex = stableClusterMapping[originalIndex] !== undefined 
        ? stableClusterMapping[originalIndex] 
        : originalIndex;
      const color = clusterColors[stableIndex % clusterColors.length];
      
      // Draw centroid as a larger diamond
      ctx.fillStyle = color;
      ctx.strokeStyle = '#000';
      ctx.lineWidth = 2;
      
      ctx.beginPath();
      ctx.moveTo(canvasX, canvasY - 10);
      ctx.lineTo(canvasX + 10, canvasY);
      ctx.lineTo(canvasX, canvasY + 10);
      ctx.lineTo(canvasX - 10, canvasY);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
    });
  };

  const clearCanvas = () => {
    setPoints([]);
    setPrediction(null);
    setError(null);
    setStableClusterMapping({}); // Reset cluster mapping
    redrawCanvas();
  };

  const addRandomPoints = () => {
    // Generate 10 random points within the coordinate range [-10, 10]
    const randomPoints = [];
    for (let i = 0; i < 10; i++) {
      const x = parseFloat((Math.random() * 20 - 10).toFixed(2)); // Range: -10 to 10
      const y = parseFloat((Math.random() * 20 - 10).toFixed(2)); // Range: -10 to 10
      randomPoints.push([x, y]);
    }
    
    const newPoints = [...points, ...randomPoints];
    setPoints(newPoints);
    
    // Auto-predict if we have enough points
    if (newPoints.length >= 2) {
      predictClusters(newPoints);
    }
  };

  // Create stable cluster mapping to prevent color switching
  const createStableClusterMapping = (newCentroids, currentMapping = {}) => {
    if (!newCentroids || newCentroids.length === 0) return {};
    
    // If no previous mapping exists, create initial mapping
    if (Object.keys(currentMapping).length === 0) {
      const initialMapping = {};
      newCentroids.forEach((_, index) => {
        initialMapping[index] = index;
      });
      return initialMapping;
    }

    // Extract previous centroid positions from mapping
    const previousCentroids = Object.keys(currentMapping).map(oldId => {
      const stableId = currentMapping[oldId];
      return { oldId: parseInt(oldId), stableId, position: null }; // position will be filled from previous prediction
    });

    // Get previous centroid positions from the current prediction state
    if (prediction && prediction.predictions[0] && prediction.predictions[0].centroids) {
      const prevCentroidPositions = prediction.predictions[0].centroids;
      previousCentroids.forEach(item => {
        if (prevCentroidPositions[item.oldId]) {
          item.position = prevCentroidPositions[item.oldId];
        }
      });
    }

    // Calculate distances and create optimal mapping
    const newMapping = {};
    const usedStableIds = new Set();
    
    // For each new centroid, find the closest previous centroid
    newCentroids.forEach((newCentroid, newId) => {
      let closestStableId = newId; // fallback
      let minDistance = Infinity;
      
      previousCentroids.forEach(prev => {
        if (prev.position && !usedStableIds.has(prev.stableId)) {
          const distance = Math.sqrt(
            Math.pow(newCentroid[0] - prev.position[0], 2) + 
            Math.pow(newCentroid[1] - prev.position[1], 2)
          );
          
          if (distance < minDistance) {
            minDistance = distance;
            closestStableId = prev.stableId;
          }
        }
      });
      
      // Assign the stable ID
      newMapping[newId] = closestStableId;
      usedStableIds.add(closestStableId);
    });

    return newMapping;
  };

  const predictClusters = async (pointsToPredict = points, version = selectedVersion) => {
    try {
      setIsLoading(true);
      setError(null);
      
      console.log('Sending points for clustering:', pointsToPredict);
      
      const response = await axios.post(
        `http://localhost:8000/v1/models/kmeans/${version}/predict`,
        {
          data: JSON.stringify(pointsToPredict)
        }
      );
      
      console.log('Clustering response:', response.data);
      
      // Create stable cluster mapping to prevent color switching
      if (response.data.predictions && response.data.predictions[0] && response.data.predictions[0].centroids) {
        const newCentroids = response.data.predictions[0].centroids;
        const newMapping = createStableClusterMapping(newCentroids, stableClusterMapping);
        setStableClusterMapping(newMapping);
      }
      
      setPrediction(response.data);
      
    } catch (err) {
      console.error('Prediction error:', err);
      if (err.response) {
        console.error('Response data:', err.response.data);
        setError(`Error ${err.response.status}: ${err.response.data.detail || JSON.stringify(err.response.data)}`);
      } else if (err.request) {
        setError('No response from server. Check if backend is running.');
      } else {
        setError(`Request error: ${err.message}`);
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="kmeans-canvas-container">
      {/* Left side - Canvas and Controls */}
      <div className="kmeans-canvas-section">
        <div className="kmeans-canvas-wrapper">
          <div className="kmeans-canvas-heading-overlay">
            <h3>Click to add points</h3>
          </div>
          <canvas
            ref={canvasRef}
            className="kmeans-canvas"
            onClick={handleCanvasClick}
          />
        </div>
        
        {/* Controls beneath canvas */}
        <div className="kmeans-controls">
          <div className="kmeans-version-selector">
            <label>Clusters:</label>
            <select 
              value={selectedVersion} 
              onChange={(e) => handleVersionChange(e.target.value)}
              className="kmeans-version-dropdown"
              disabled={availableVersions.length === 0}
            >
              {availableVersions.length > 0 ? (
                availableVersions.map(versionInfo => (
                  <option key={versionInfo.version} value={versionInfo.version}>
                    {versionInfo.version}
                  </option>
                ))
              ) : (
                <option value="">No versions available</option>
              )}
            </select>
          </div>
          
          <button 
            className="kmeans-btn kmeans-btn-secondary" 
            onClick={clearCanvas}
          >
            Clear Points
          </button>
          
          <button 
            className="kmeans-btn kmeans-btn-primary" 
            onClick={addRandomPoints}
          >
            Draw 10 Random Points
          </button>
        </div>
      </div>

      {/* Bottom - Results */}
      <div className="kmeans-controls-results-section">
        <div className="kmeans-results-section">
          <h3>Clustering Results</h3>
          
          {error && (
            <div className="kmeans-error">
              <h4>Error</h4>
              <p>{error}</p>
            </div>
          )}

          {points.length === 0 && (
            <div className="kmeans-instructions-placeholder">
              <div>
                <h4>Instructions:</h4>
                <ul>
                  <li>Click anywhere on the coordinate system to add points</li>
                  <li>Choose the number of clusters using the dropdown above</li>
                  <li>Clustering starts automatically after adding 2+ points</li>
                  <li>Points are colored by their cluster assignment</li>
                  <li>Diamonds (♦) represent cluster centroids</li>
                </ul>
              </div>
            </div>
          )}

          {points.length > 0 && points.length < 2 && (
            <div className="kmeans-instructions-placeholder">
              <p>Add at least 2 points to start clustering.</p>
              <p>Current points: {points.length}</p>
            </div>
          )}

          {prediction && points.length >= 2 && (
            <div className="kmeans-prediction-result">
              <h4>Cluster Analysis</h4>
              <div className="kmeans-summary">
                <div className="kmeans-summary-item">
                  <span className="kmeans-label">Total Points:</span>
                  <span className="kmeans-value">{points.length}</span>
                </div>
                <div className="kmeans-summary-item">
                  <span className="kmeans-label">Number of Clusters:</span>
                  <span className="kmeans-value">{selectedVersion}</span>
                </div>
              </div>
              
              <h5>Point Details:</h5>
              <div className="kmeans-points-list">
                {points.map((point, index) => {
                  const pred = prediction.predictions[index];
                  if (!pred) return null; // Skip if no prediction data
                  const originalClusterIndex = pred.cluster_assignments;
                  const stableClusterIndex = stableClusterMapping[originalClusterIndex] !== undefined 
                    ? stableClusterMapping[originalClusterIndex] 
                    : originalClusterIndex;
                  const clusterColor = clusterColors[stableClusterIndex % clusterColors.length];
                  
                  return (
                    <div key={index} className="kmeans-point-item">
                      <div className="kmeans-point-color" style={{ backgroundColor: clusterColor }}></div>
                      <div className="kmeans-point-info">
                        <span className="kmeans-point-coords">
                          ({point[0]}, {point[1]})
                        </span>
                        <span className="kmeans-cluster-info">
                          Cluster {stableClusterIndex} 
                          (distance: {pred.distances_to_assigned_cluster.toFixed(3)})
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>

              <h5>Cluster Centroids:</h5>
              <div className="kmeans-centroids-list">
                {prediction.predictions[0].centroids.map((centroid, originalIndex) => {
                  const stableIndex = stableClusterMapping[originalIndex] !== undefined 
                    ? stableClusterMapping[originalIndex] 
                    : originalIndex;
                  const clusterColor = clusterColors[stableIndex % clusterColors.length];
                  return (
                    <div key={originalIndex} className="kmeans-centroid-item">
                      <div className="kmeans-centroid-color" style={{ backgroundColor: clusterColor }}>♦</div>
                      <span className="kmeans-centroid-coords">
                        Cluster {stableIndex}: ({centroid[0].toFixed(3)}, {centroid[1].toFixed(3)})
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ClusteringCanvas;