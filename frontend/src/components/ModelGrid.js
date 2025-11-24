import React from "react";
import ModelCard from "./ModelCard";

const ModelGrid = ({ models, onSelect }) => {
  // Transform the API response into an array of model objects
  const modelArray = React.useMemo(() => {
    if (!models) return [];
    
    // Handle the case where models is an object with model names as keys
    if (typeof models === 'object' && !Array.isArray(models)) {
      console.log(JSON.stringify(models))
      return Object.entries(models).map(([modelName, modelData]) => ({
        id: modelName,
        name: modelName,
        error: modelData.error,
        description: `Model with ${modelData.model_version_status?.length || 0} version(s)`,
        versions: modelData.model_version_status || [],
        tags: modelData.model_version_status
          ?.map(version => `v${version.version}`) || []
      }));
    }
    
    // Handle the case where models is already an array
    if (Array.isArray(models)) {
      return models;
    }
    
    return [];
  }, [models]);

  return (
    <div className="model-grid">
      {modelArray.map((model) => (
        <ModelCard
          key={model.id}
          model={model}
          onClick={() => onSelect(model)}
          onVersionSelect={(version) => onSelect(model, version)}
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
