// src/components/WelcomeScreen.jsx
import React from 'react';

const WelcomeScreen = ({ onStartClick }) => {
  return (
    <div className="screen welcome-screen">
      <h1 className="app-title">My Macros</h1>
      <p className="app-description">Upload your meal now to get the macros!</p>
      <button 
        className="primary-button" 
        onClick={onStartClick}
      >
        Get Started
      </button>
    </div>
  );
};

export default WelcomeScreen;