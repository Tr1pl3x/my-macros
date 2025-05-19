import { useState } from 'react';

function Keypad({ onPasswordSuccess }) {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  
  const correctPassword = '2911'; // Hardcoded password from requirements
  
  const handleKeyPress = (digit) => {
    if (password.length < 4) {
      setPassword(prevPassword => prevPassword + digit);
    }
  };
  
  const handleDelete = () => {
    setPassword(prevPassword => prevPassword.slice(0, -1));
    setError('');
  };
  
  const handleSubmit = () => {
    if (password === correctPassword) {
      setError('');
      // Call the callback function to inform parent component
      onPasswordSuccess();
    } else {
      setError('Wrong password. Please try again.');
      setPassword('');
    }
  };
  
  return (
    <div className="keypad-container">
      <div className="password-display">
        {Array.from({ length: 4 }).map((_, index) => (
          <div 
            key={index} 
            className={`password-dot ${index < password.length ? 'filled' : ''}`}
          >
            {/* Empty div, the dot is now shown via CSS ::after pseudo-element */}
          </div>
        ))}
      </div>
      
      {error && <div className="error-message">{error}</div>}
      
      <div className="keypad-grid">
        {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(digit => (
          <button 
            key={digit} 
            className="keypad-button" 
            onClick={() => handleKeyPress(digit)}
            disabled={password.length >= 4}
          >
            {digit}
          </button>
        ))}
        <button 
          className="keypad-button action-button" 
          onClick={handleDelete}
          disabled={password.length === 0}
        >
          Del
        </button>
        <button 
          className="keypad-button" 
          onClick={() => handleKeyPress(0)}
          disabled={password.length >= 4}
        >
          0
        </button>
        <button 
          className="keypad-button action-button" 
          onClick={handleSubmit}
          disabled={password.length !== 4}
        >
          Enter
        </button>
      </div>
    </div>
  );
}

export default Keypad;