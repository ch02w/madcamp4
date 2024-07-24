import React from 'react';
import { useNavigate } from 'react-router-dom';
import './HomePage.css';

const HomePage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="wrapper">
      <div className="cols">
        <div className="col" onClick={() => navigate('/page2')}>
          <div className="container">
            <div className="front" style={{ backgroundImage: 'url(https://cdn.skyrisecities.com/sites/default/files/images/articles/2019/01/35507/35507-119797.jpg)' }}>
              <div className="inner">
                <p>Page 2</p>
                <span>Details about Page 2</span>
              </div>
            </div>
            <div className="back">
              <div className="inner">
                <p>Page 2 description and details.</p>
              </div>
            </div>
          </div>
        </div>
        <div className="col" onClick={() => navigate('/page3')}>
          <div className="container">
            <div className="front">
              <div className="inner">
                <p>Page 3</p>
                <span>Details about Page 3</span>
              </div>
            </div>
            <div className="back">
              <div className="inner">
                <p>Page 3 description and details.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HomePage;
