import React from 'react';
import DrawingCanvas from './components/DrawingCanvas';

function App() {
  return (
    <div className="app">
      <div className="header">
        <h1>ML Zoo</h1>
        <p>Draw a number (0-9) on the canvas below and let AI predict what it is!</p>
      </div>
      <div className="main-content">
        <DrawingCanvas />
      </div>
    </div>
  );
}

export default App;