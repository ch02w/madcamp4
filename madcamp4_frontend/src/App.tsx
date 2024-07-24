import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import NavBar from './components/NavBar';
import HomePage from './pages/HomePage';
import Page2 from './pages/Page2';
import Page3 from './pages/Page3';
import MouseParticles from 'react-mouse-particles';
import SplashScreen from './components/SplashScreen';
import ChatComponent from './components/chatComponent';
import socketService from './services/SocketService';

const App: React.FC = () => {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setLoading(false);
    }, 3000);

    return () => clearTimeout(timer);
  }, []);

  if (loading) {
    return <SplashScreen />;
  }

  return (
    <Router>
      <div style={{ position: 'relative', height: '100vh' }}>
        <MouseParticles
          g={1.5}
          color="random"
          cull="col,image-wrapper"
          style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', zIndex: 9999 }}
        />
        <NavBar />
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/page2" element={<Page2 />} />
          <Route path="/page3" element={<Page3 />} />
        </Routes>
        <ChatComponent />
      </div>
    </Router>
  );
};

export default App;
