import React, { useRef, useState, useEffect } from 'react';
import axios from 'axios';
import './DrawingCanvas.css';

const DrawingCanvas = () => {
  const canvasRef = useRef(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [prediction, setPrediction] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const canvasSize = 280; // 28x28 scaled up by 10

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    
    // Set canvas size and styles
    canvas.width = canvasSize;
    canvas.height = canvasSize;
    
    // Set drawing styles
    ctx.strokeStyle = '#000';
    ctx.lineWidth = 15;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    
    // Clear canvas with white background
    clearCanvas();
  }, []);

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
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    };
  };

  const getTouchPos = (e) => {
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    return {
      x: e.touches[0].clientX - rect.left,
      y: e.touches[0].clientY - rect.top
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
      
      const response = await axios.post('http://localhost:8000/v1/models/handnumbers/predict', {
        data: imageData
      });
      
      console.log('Response received:', response.data);
      
      const prediction = response.data;
      const predictedClass = prediction.prediction;
      const confidence = prediction.confidence;
      const probabilities = prediction.probabilities;
      
      setPrediction({
        number: predictedClass,
        confidence: (confidence * 100).toFixed(1),
        probabilities: probabilities.map((prob, index) => ({
          digit: index,
          probability: (prob * 100).toFixed(1)
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
      <div className="canvas-section">
        <h3>Draw a number (0-9)</h3>
        <div className="canvas-wrapper">
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
        
        <div className="controls">
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
            
            <h5>All Probabilities:</h5>
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
  );
};

export default DrawingCanvas;