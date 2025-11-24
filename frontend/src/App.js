import React, { useEffect, useState } from 'react';
import DrawingCanvas from './components/DrawingCanvas';
import ModelGrid from './components/ModelGrid';

const API_URL = "http://localhost:8000/v1/models";

function App() {
  const [models, setModels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedModel, setSelectedModel] = useState(null);

  // Handle URL-based navigation
  useEffect(() => {
    const handlePopState = () => {
      const urlPath = window.location.pathname;
      if (urlPath === '/' || urlPath === '') {
        setSelectedModel(null);
      } else {
        const modelId = urlPath.replace('/model/', '');
        if (modelId) {
          setSelectedModel({ id: modelId, name: modelId });
        }
      }
    };

    // Handle initial URL
    handlePopState();
    
    // Listen for browser back/forward
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  // Handle model selection with URL update
  const handleModelSelect = (model) => {
    setSelectedModel(model);
    window.history.pushState({}, '', `/model/${model.id}`);
  };

  // Handle back to gallery
  const handleBackToGallery = () => {
    setSelectedModel(null);
    window.history.pushState({}, '', '/');
  };

  // Update document title based on current page
  useEffect(() => {
    if (selectedModel) {
      document.title = `${selectedModel.name || selectedModel.id} - ML Zoo`;
    } else {
      document.title = 'Model Gallery - ML Zoo';
    }
  }, [selectedModel]);

  // fetch all models on load
  useEffect(() => {
    const fetchModels = async () => {
      try {
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
  }, []);

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
            <DrawingCanvas models={models} />
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
