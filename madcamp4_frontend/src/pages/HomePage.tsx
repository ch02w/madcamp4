import React, { Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { useNavigate } from 'react-router-dom';
import './HomePage.css';
import Blob from "../components/Blob/Blob";

const HomePage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="wrapper">
    <Canvas className="canvas">
      <Suspense fallback={null}>
        <Blob />
      </Suspense>
    </Canvas>
    <div className="card-container">
      <div className="card" onClick={() => navigate('/page2')}>
        <img src='/cube-image.png' alt="CubeCanvas" className="icon" />
        <h2>CubeCanvas</h2>
        <p>Express your imagination on a pixelated cube canvas</p>
      </div>
      <div className="card" onClick={() => navigate('/page3')}>
        <img src='/music-note.png' alt="PixelSheet" className="icon" />
        <h2>PixelSheet</h2>
        <p>Where pixels convert to a sequence of melody</p>
      </div>
    </div>
  </div>
  );
};

export default HomePage;
