import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import NavBar from './components/NavBar';
import HomePage from './pages/HomePage';
import Page1 from './pages/Page1';
import Page2 from './pages/Page2';
import Page3 from './pages/Page3';
import MouseParticles from 'react-mouse-particles';

const App: React.FC = () => {
  return (
    <Router>
      <div style={{ position: 'relative', height: '100vh', width: '100%' }}>
        <MouseParticles g={1} color="random" cull="col,image-wrapper" 
          style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%' }} />
        <NavBar />
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/page1" element={<Page1 />} />
          <Route path="/page2" element={<Page2 />} />
          <Route path="/page3" element={<Page3 />} />
        </Routes>
      </div>
    </Router>
  );
};

export default App;
