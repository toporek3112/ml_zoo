import { useRef, useState, useEffect } from 'react';
import axios from 'axios';
import './DrawingCanvas.css';

const DrawingCanvas = ({ models, selectedModel, onVersionChange }) => {
  const canvasRef = useRef(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [prediction, setPrediction] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [selectedVersion, setSelectedVersion] = useState(
    selectedModel?.selectedVersion || '1'
  ); // Default to version 1 (convolutional)
  const [availableVersions, setAvailableVersions] = useState([]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');

    // Make canvas responsive to its container
    const resizeCanvas = () => {
      const container = canvas.parentElement;
      const containerWidth = container.clientWidth;
      const containerHeight = container.clientHeight;

      // Set canvas size to fill container
      canvas.width = containerWidth;
      canvas.height = containerHeight;

      // Set drawing styles
      ctx.strokeStyle = '#000';
      ctx.lineWidth = Math.max(8, containerWidth * 0.02); // Responsive line width
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';

      // Clear canvas with white background
      clearCanvas();
    };

    // Initial resize
    resizeCanvas();

    // Listen for window resize
    window.addEventListener('resize', resizeCanvas);

    return () => {
      window.removeEventListener('resize', resizeCanvas);
    };
  }, []);

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
    // Check if models data has an error (service unavailable)
    if (!models || !models.handnumbers) {
      console.warn('Models data not available');
      setAvailableVersions([]);
      return;
    }

    // Check if there's an error in the handnumbers model data
    if (models.handnumbers.error) {
      console.warn('Model service error:', models.handnumbers.error);
      setAvailableVersions([]);
      setError(`Model service unavailable: ${models.handnumbers.error}`);
      return;
    }

    // Check if model_version_status exists
    if (!models.handnumbers.model_version_status) {
      console.warn('model_version_status not available');
      setAvailableVersions([]);
      return;
    }

    const versions = models.handnumbers.model_version_status
      .map(versionInfo => ({
        version: versionInfo.version.toString(),
        state: versionInfo.state,
        status: versionInfo.status
      }))
      .filter(v => v.state === 'AVAILABLE'); // Only show available versions
    
    setAvailableVersions(versions);
    
    // Set default to highest available version if current selection isn't available
    const availableVersionNumbers = versions.map(v => v.version);
    if (availableVersionNumbers.length > 0 && !availableVersionNumbers.includes(selectedVersion)) {
      const highestVersion = Math.max(...availableVersionNumbers.map(v => parseInt(v))).toString();
      setSelectedVersion(highestVersion);
    }
    
    // Clear any previous errors if we have valid data
    setError(null);
  };

  // Handle version selection changes
  const handleVersionChange = (newVersion) => {
    setSelectedVersion(newVersion);
    if (onVersionChange) {
      onVersionChange(newVersion);
    }
  };

  // Cancas drawing functions
  const clearCanvas = () => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#fff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    setPrediction(null);
    setError(null);
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

  const getTouchPos = (e) => {
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    
    return {
      x: (e.touches[0].clientX - rect.left) * scaleX,
      y: (e.touches[0].clientY - rect.top) * scaleY
    };
  };

  const startDrawing = (e) => {
    setIsDrawing(true);
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const pos = e.type.includes('touch') ? getTouchPos(e) : getMousePos(e);
    
    ctx.beginPath();
    ctx.moveTo(pos.x, pos.y);
  };

  const draw = (e) => {
    if (!isDrawing) return;
    
    e.preventDefault(); // Prevent scrolling on touch devices
    
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const pos = e.type.includes('touch') ? getTouchPos(e) : getMousePos(e);
    
    ctx.lineTo(pos.x, pos.y);
    ctx.stroke();
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const preprocessImage = () => {
    const canvas = canvasRef.current;
    // Convert canvas to base64 PNG
    const dataURL = canvas.toDataURL('image/png');
    
    // Log for debugging
    console.log('Canvas size:', canvas.width, 'x', canvas.height);
    console.log('Data URL length:', dataURL.length);
    console.log('Data URL starts with:', dataURL.substring(0, 50));
    
    return dataURL;
  };

  const predictNumber = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const imageData = preprocessImage();
      console.log('Sending image data length:', imageData.length);
      console.log('Image data preview:', imageData.substring(0, 50) + '...');
      
      const response = await axios.post(`http://localhost:8000/v1/models/handnumbers/${selectedVersion}/predict`, {
        data: imageData
      });
      
      console.log('Response received:', response.data);
      
      const prediction = response.data;
      const predictedClass = prediction.prediction;
      const confidence = prediction.confidence;
      const probabilities = prediction.probabilities;
      
      setPrediction({
        number: predictedClass,
        confidence: (confidence * 100).toFixed(2),
        probabilities: probabilities.map((prob, index) => ({
          digit: index,
          probability: (prob * 100).toFixed(2)
        }))
      });
      
    } catch (err) {
      console.error('Prediction error:', err);
      if (err.response) {
        console.error('Response data:', err.response.data);
        console.error('Response status:', err.response.status);
        console.error('Response headers:', err.response.headers);
        setError(`Error ${err.response.status}: ${err.response.data.detail || JSON.stringify(err.response.data)}`);
      } else if (err.request) {
        console.error('Request made but no response:', err.request);
        setError('No response from server. Check if backend is running.');
      } else {
        console.error('Error setting up request:', err.message);
        setError(`Request error: ${err.message}`);
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="drawing-canvas-container">
      {/* Left side - Canvas and Controls (1/3) */}
      <div className="canvas-section">
        <div className="canvas-wrapper">
          <div className="canvas-heading-overlay">
            <h3>Draw a number (0-9)</h3>
          </div>
          <canvas
            ref={canvasRef}
            className="drawing-canvas"
            onMouseDown={startDrawing}
            onMouseMove={draw}
            onMouseUp={stopDrawing}
            onMouseLeave={stopDrawing}
            onTouchStart={startDrawing}
            onTouchMove={draw}
            onTouchEnd={stopDrawing}
          />
        </div>
        
        {/* Controls beneath canvas */}
        <div className="controls">
          <div className="version-selector">
            <select 
              id="version-select"
              value={selectedVersion} 
              onChange={(e) => handleVersionChange(e.target.value)}
              className="version-dropdown"
              disabled={availableVersions.length === 0}
            >
              {availableVersions.length > 0 ? (
                availableVersions.map(versionInfo => (
                  <option key={versionInfo.version} value={versionInfo.version}>
                    v{versionInfo.version}
                  </option>
                ))
              ) : (
                <option value="">No versions available</option>
              )}
            </select>
          </div>
          
          <button 
            className="btn btn-secondary" 
            onClick={clearCanvas}
          >
            Clear Canvas
          </button>
          <button 
            className="btn btn-primary" 
            onClick={predictNumber}
            disabled={isLoading}
          >
            {isLoading ? 'Predicting...' : 'Predict Number'}
          </button>
        </div>
      </div>

      {/* Right side - Results (2/3) */}
      <div className="controls-results-section">
        {/* Results section */}
        <div className="results-section">
          {error && (
            <div className="error">
              <h4>Error</h4>
              <p>{error}</p>
            </div>
          )}

          {prediction && (
            <div className="prediction-result">
              <h4>Prediction Result</h4>
              <div className="main-prediction">
                <span className="predicted-number">{prediction.number}</span>
                <span className="confidence">({prediction.confidence}% confident)</span>
              </div>
              
              <h5>Probability Distribution:</h5>
              <div className="probabilities-grid">
                {prediction.probabilities.map((item) => (
                  <div 
                    key={item.digit} 
                    className={`probability-item ${item.digit === prediction.number ? 'highest' : ''}`}
                  >
                    <span className="digit">{item.digit}</span>
                    <span className="prob">{item.probability}%</span>
                    <div className="prob-bar">
                      <div 
                        className="prob-fill" 
                        style={{width: `${item.probability}%`}}
                      ></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DrawingCanvas;