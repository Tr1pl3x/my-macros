// src/components/PasswordScreen.jsx
import React, { useState } from 'react';

const PasswordScreen = ({ onPasswordSubmit, loading, onBackClick }) => {
  const [password, setPassword] = useState('');
  
  const handleKeyPress = (digit) => {
    if (password.length < 4) {
      setPassword(prev => prev + digit);
    }
  };
  
  const handleDelete = () => {
    setPassword(prev => prev.slice(0, -1));
  };
  
  const handleSubmit = () => {
    if (password.length === 4) {
      onPasswordSubmit(password);
    }
  };
  
  // Safe way to handle back button click
  const handleBackButtonClick = () => {
    if (typeof onBackClick === 'function') {
      onBackClick();
    }
  };
  
  return (
    <div className="screen password-screen">
      <button 
        className="back-button"
        onClick={handleBackButtonClick}
        disabled={loading}
      >
        ←
      </button>
      
      <h2 className="screen-title password-title">Please enter password to continue</h2>
      
      <div className="password-display">
        {[...Array(4)].map((_, index) => (
          <div 
            key={index} 
            className={`password-digit ${index < password.length ? 'filled' : ''}`}
          >
            {index < password.length ? '•' : ''}
          </div>
        ))}
      </div>
      
      <div className="keypad">
        <div className="keypad-row">
          {[1, 2, 3].map(digit => (
            <button 
              key={digit} 
              className="keypad-button" 
              onClick={() => handleKeyPress(digit)}
              disabled={loading || password.length >= 4}
            >
              {digit}
            </button>
          ))}
        </div>
        
        <div className="keypad-row">
          {[4, 5, 6].map(digit => (
            <button 
              key={digit} 
              className="keypad-button" 
              onClick={() => handleKeyPress(digit)}
              disabled={loading || password.length >= 4}
            >
              {digit}
            </button>
          ))}
        </div>
        
        <div className="keypad-row">
          {[7, 8, 9].map(digit => (
            <button 
              key={digit} 
              className="keypad-button" 
              onClick={() => handleKeyPress(digit)}
              disabled={loading || password.length >= 4}
            >
              {digit}
            </button>
          ))}
        </div>
        
        <div className="keypad-row">
          <button 
            className="keypad-button function-button" 
            onClick={handleDelete}
            disabled={loading || password.length === 0}
          >
            Del
          </button>
          <button 
            className="keypad-button" 
            onClick={() => handleKeyPress(0)}
            disabled={loading || password.length >= 4}
          >
            0
          </button>
          <button 
            className="keypad-button function-button" 
            onClick={handleSubmit}
            disabled={loading || password.length !== 4}
          >
            Enter
          </button>
        </div>
      </div>
      
      <p className="help-text">
        Don't know password? <a href="https://pyae-sone-oo.vercel.app/" target="_blank" className="text-link">Contact here</a>
      </p>
    </div>
  );
};

export default PasswordScreen;