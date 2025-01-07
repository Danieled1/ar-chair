// src/App.jsx
import React, { useState } from 'react';
import PlaneDetectionAR from './components/PlaneDetectionAR';

function App() {
  const [modelPath, setModelPath] = useState('/models/chair.glb');

  return (
    <div>
      <h1 style={{ textAlign: 'center' }}>Plane Detection AR (Mini MVP)</h1>
      <div style={{ textAlign: 'center' }}>
        <p>
          Tap anywhere to start AR. Then tap the screen again to place the model where the reticle appears.
        </p>
        <label htmlFor="modelSelect"><strong>Select Model:</strong></label>
        <select
          id="modelSelect"
          onChange={(e) => setModelPath(e.target.value)}
          style={{ marginLeft: '0.5rem' }}
        >
          <option value="/models/chair.glb">Chair</option>
          <option value="/models/office_chair.glb">Sofa</option>
        </select>
      </div>

      <PlaneDetectionAR modelPath={modelPath} />
    </div>
  );
}

export default App;
