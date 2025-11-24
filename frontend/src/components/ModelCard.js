
const cardStyle = {
  padding: "20px",
  borderRadius: "12px",
  border: "1px solid #ddd",
  background: "white",
  cursor: "pointer",
  transition: "0.2s",
};

const ModelCard = ({ model, onClick }) => {
  const availableVersions = model.versions?.filter(v => v.state === 'AVAILABLE') || [];
  const totalVersions = model.versions?.length || 0;
  
  return (
    <div 
      className="model-card"
      style={{
        ...cardStyle,
        ':hover': {
          transform: 'translateY(-2px)',
          boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
        }
      }} 
      onClick={onClick}
    >
      <h3 style={{ margin: "0 0 12px 0", color: "#333" }}>
        {model.name || model.id}
      </h3>
      
      <p style={{ margin: "0 0 12px 0", color: "#666", fontSize: "14px" }}>
        {model.description || "No description provided."}
      </p>

      {/* Version Status */}
      {model.versions && model.versions.length > 0 && (
        <div style={{ marginBottom: "12px" }}>
          <div style={{ fontSize: "12px", color: "#666", marginBottom: "12px" }}>
            Status: {availableVersions.length}/{totalVersions} versions available
          </div>
          <div style={{ display: "flex", gap: "4px", flexWrap: "wrap" }}>
            {model.versions.map(version => (
              <span
                key={version.version}
                style={{
                  background: version.state === 'AVAILABLE' ? '#e8f5e8' : '#f5e8e8',
                  color: version.state === 'AVAILABLE' ? '#2d5a2d' : '#5a2d2d',
                  padding: "6px 12px",
                  borderRadius: "4px",
                  fontSize: "11px",
                  fontWeight: "500"
                }}
              >
                v{version.version}
              </span>
            ))}
          </div>
        </div>
      )}

    </div>
  );
};

export default ModelCard;
