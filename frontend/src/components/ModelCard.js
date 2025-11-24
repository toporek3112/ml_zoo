
const cardStyle = {
  padding: "20px",
  borderRadius: "12px",
  border: "1px solid #ddd",
  background: "white",
  cursor: "pointer",
  transition: "0.2s",
};

const ModelCard = ({ model, onClick, onVersionSelect }) => {
  const availableVersions = model.versions?.filter(v => v.state === 'AVAILABLE') || [];
  const totalVersions = model.versions?.length || 0;
  const hasError = !!model.error;
  
  const handleVersionClick = (e, version) => {
    e.stopPropagation(); // Prevent card click
    if (onVersionSelect) {
      onVersionSelect(version);
    }
  };
  
  console.log(JSON.stringify(model))
  return (
    <div 
      className="model-card"
      style={{
        ...cardStyle,
        opacity: hasError ? 0.8 : 1,
        cursor: hasError ? 'not-allowed' : 'pointer',
        borderColor: hasError ? '#dc3545' : '#ddd',
        ':hover': {
          transform: hasError ? 'none' : 'translateY(-2px)',
          boxShadow: hasError ? 'none' : '0 4px 12px rgba(0,0,0,0.15)'
        }
      }} 
      onClick={hasError ? undefined : onClick}
    >
      <h3 style={{ margin: "0 0 12px 0", color: hasError ? "#dc3545" : "#333" }}>
        {model.name || model.id}
      </h3>
      
      {/* Error Message */}
      {hasError && (
        <div style={{ 
          margin: "0 0 12px 0", 
          color: "#dc3545", 
          fontSize: "14px",
          background: "#f8d7da",
          border: "1px solid #f5c6cb",
          padding: "8px",
          borderRadius: "4px"
        }}>
          <strong> Model Service Unavailable</strong><br/>
          {model.error.includes('Cannot connect') ? 
            'Working on a solution!' :
            model.error
          }
        </div>
      )}
      
      {/* Description - only show if no error */}
      {!hasError && (
        <p style={{ margin: "0 0 12px 0", color: "#666", fontSize: "14px" }}>
          {model.description || "No description provided."}
        </p>
      )}

      {/* Version Status - only show if no error and has versions */}
      {!hasError && model.versions && model.versions.length > 0 && (
        <div style={{ marginBottom: "12px" }}>
          <div style={{ fontSize: "12px", color: "#666", marginBottom: "12px" }}>
            Status: {availableVersions.length}/{totalVersions} versions available
          </div>
          <div style={{ display: "flex", gap: "4px", flexWrap: "wrap" }}>
            {model.versions.map(version => (
              <span
                key={version.version}
                onClick={(e) => handleVersionClick(e, version.version)}
                style={{
                  background: version.state === 'AVAILABLE' ? '#e8f5e8' : '#f5e8e8',
                  color: version.state === 'AVAILABLE' ? '#2d5a2d' : '#5a2d2d',
                  padding: "6px 12px",
                  borderRadius: "4px",
                  fontSize: "11px",
                  fontWeight: "500",
                  cursor: version.state === 'AVAILABLE' ? 'pointer' : 'default',
                  transition: 'all 0.2s ease',
                  border: version.state === 'AVAILABLE' ? '1px solid transparent' : '1px solid #ddd'
                }}
                onMouseEnter={(e) => {
                  if (version.state === 'AVAILABLE') {
                    e.target.style.background = '#d4edda';
                    e.target.style.border = '1px solid #28a745';
                    e.target.style.transform = 'scale(1.05)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (version.state === 'AVAILABLE') {
                    e.target.style.background = '#e8f5e8';
                    e.target.style.border = '1px solid transparent';
                    e.target.style.transform = 'scale(1)';
                  }
                }}
                title={version.state === 'AVAILABLE' ? `Click to open version ${version.version}` : `Version ${version.version} is not available`}
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
