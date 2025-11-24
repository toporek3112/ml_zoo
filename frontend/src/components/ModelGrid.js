import React from "react";
import ModelCard from "./ModelCard";

const ModelGrid = ({ models, onSelect }) => {
  console.log("Models data:", JSON.stringify(models, null, 2));
  
  // Transform the API response into an array of model objects
  const modelArray = React.useMemo(() => {
    if (!models) return [];
    
    // Handle the case where models is an object with model names as keys
    if (typeof models === 'object' && !Array.isArray(models)) {
      return Object.entries(models).map(([modelName, modelData]) => ({
        id: modelName,
        name: modelName,
        description: `Model with ${modelData.model_version_status?.length || 0} version(s)`,
        versions: modelData.model_version_status || [],
        tags: modelData.model_version_status
          ?.filter(version => version.state === 'AVAILABLE')
          .map(version => `v${version.version}`) || []
      }));
    }
    
    // Handle the case where models is already an array
    if (Array.isArray(models)) {
      return models;
    }
    
    return [];
  }, [models]);

  return (
    <div
      className="model-grid"
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))",
        padding: "20px"
      }}
    >
      {modelArray.map((model) => (
        <ModelCard
          key={model.id}
          model={model}
          onClick={() => onSelect(model)}
        />
      ))}
      
      {modelArray.length === 0 && (
        <div style={{ gridColumn: "1 / -1", textAlign: "center", padding: "40px", color: "#666" }}>
          No models available
        </div>
      )}
    </div>
  );
};

export default ModelGrid;
