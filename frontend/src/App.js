import React, { useEffect, useState } from 'react';
import DrawingCanvas from './components/DrawingCanvas';
import ClusteringCanvas from './components/ClusteringCanvas';
import ModelGrid from './components/ModelGrid';

const API_URL = window.RUNTIME_ENV.MODEL_SERVING_API || "http://localhost:8000/v1/models";

function App() {
  const [models, setModels] = useState([]);
  const [selectedModel, setSelectedModel] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    // fetch all models on load
    const fetchModels = async () => {
      try {
        console.debug("Calling Model Serving Backend on:", API_URL)
        const res = await fetch(API_URL);
        if (!res.ok) throw new Error("Failed to fetch models");
        const data = await res.json();
        console.log("Raw API response:", data);

        // Handle the nested structure from the API
        if (data.models) {
          setModels(data.models);
        } else if (data && typeof data === 'object') {
          setModels(data);
        } else {
          setModels({});
        }
      } catch (err) {
        console.error("Error fetching models:", err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchModels();

    // Handle URL-based navigation
    const handlePopState = () => {
    const urlPath = window.location.pathname;
      if (urlPath === '/' || urlPath === '') {
        setSelectedModel(null);
      }
      else {
        const pathParts = urlPath.split('/');
        if (pathParts[1] === 'model' && pathParts[2]) {
          const modelId = pathParts[2];
          const version = pathParts[3] || null; // Optional version parameter
          setSelectedModel({ id: modelId, name: modelId, selectedVersion: version });
        }
      }
    };
  
    // Handle initial URL
    handlePopState();
    
    // Listen for browser back/forward
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  // Update document title based on current page
  useEffect(() => {
    if (selectedModel) {
      document.title = `${selectedModel.name || selectedModel.id} - ML Zoo`;
    } else {
      document.title = 'Model Gallery - ML Zoo';
    }
  }, [selectedModel]);

  // Handle model selection with URL update
  const handleModelSelect = (model, version = null) => {
    // Don't allow navigation to models with errors
    if (model.error) {
      console.warn('Cannot navigate to model with error:', model.error);
      return;
    }
    
    const modelWithVersion = { ...model, selectedVersion: version };
    setSelectedModel(modelWithVersion);
    
    const url = version ? `/model/${model.id}/${version}` : `/model/${model.id}`;
    window.history.pushState({}, '', url);
  };

  // Handle back to gallery
  const handleBackToGallery = () => {
    setSelectedModel(null);
    window.history.pushState({}, '', '/');
  };

  return (
    <div className="app">
      {/* Horizontal Header Bar */}
      <header className="header-bar">
        <div className="header-content">
          <h1>ML Zoo</h1>
          
          {/* Navigation Breadcrumbs */}
          <nav className="breadcrumbs">
            <button 
              className={`breadcrumb-item ${!selectedModel ? 'active' : ''}`}
              onClick={handleBackToGallery}
              disabled={!selectedModel}
            >
              Model Gallery
            </button>
            {selectedModel && (
              <>
                <span className="breadcrumb-separator">›</span>
                <span className="breadcrumb-item active">
                  {selectedModel.name || selectedModel.id}
                </span>
              </>
            )}
          </nav>
        </div>
      </header>
      
      <div className="main-container">
        {/* MODEL LIST */}
        {!selectedModel && (
          <div className="model-section">
            <h1 className="section-title">Model Gallery</h1>
            {loading && <p className="loading">Loading models…</p>}
            {error && <p className="error">{error}</p>}
            {!loading && !error && (
              <ModelGrid models={models} onSelect={handleModelSelect} />
            )}
          </div>
        )}

        {/* SINGLE MODEL PAGE — only show when selected */}
        {selectedModel && selectedModel.id === "handnumbers" && (
          <div className="model-detail">
            <DrawingCanvas 
              models={models} 
              selectedModel={selectedModel}
              onVersionChange={(version) => handleModelSelect(selectedModel, version)}
            />
          </div>
        )}

        {/* CLUSTERING MODEL PAGE */}
        {selectedModel && selectedModel.id === "kmeans" && (
          <div className="model-detail">
            <ClusteringCanvas 
              models={models} 
              selectedModel={selectedModel}
              onVersionChange={(version) => handleModelSelect(selectedModel, version)}
            />
          </div>
        )}

        {/* FALLBACK FOR OTHER MODELS */}
        {selectedModel && selectedModel.id !== "handnumbers" && selectedModel.id !== "kmeans" && (
          <div className="model-detail">
            <div style={{ 
              padding: '40px', 
              textAlign: 'center', 
              background: 'white', 
              borderRadius: '8px', 
              margin: '20px',
              boxShadow: '0 4px 8px rgba(0,0,0,0.1)'
            }}>
              <h3>Model Interface Not Available</h3>
              <p>
                The model "{selectedModel.name || selectedModel.id}" doesn't have a custom interface yet.
              </p>
              <p>
                Available models with interfaces: <strong>handnumbers</strong> (digit recognition) 
                and <strong>kmeans</strong> (k-means clustering visualization).
              </p>
              <button 
                className="btn btn-primary"
                onClick={handleBackToGallery}
                style={{ marginTop: '20px' }}
              >
                Back to Model Gallery
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
