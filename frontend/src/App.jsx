const handleBackFromPassword = () => {
    setCurrentScreen('welcome');
  };// src/App.jsx
import React, { useState } from 'react';
import WelcomeScreen from './components/WelcomeScreen';
import PasswordScreen from './components/PasswordScreen';
import ImageUploadScreen from './components/ImageUploadScreen';
import ResultsScreen from './components/ResultsScreen';
import './App.css';

function App() {
  const [currentScreen, setCurrentScreen] = useState('welcome');
  const [authenticated, setAuthenticated] = useState(false);
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [analysisResults, setAnalysisResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Backend API URL
  const API_URL = 'https://backend-my-macros.vercel.app';

  const handleStartClick = () => {
    setCurrentScreen('password');
  };

  const verifyPassword = async (password) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`${API_URL}/api/verify`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ password }),
      });
      
      const data = await response.json();
      
      if (response.ok) {
        setAuthenticated(true);
        setCurrentScreen('upload');
      } else {
        setError(data.error || 'Verification failed');
      }
    } catch (error) {
      setError('Network error, please try again');
    } finally {
      setLoading(false);
    }
  };
  
  const handleImageSelect = (file) => {
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  };
  
  const analyzeImage = async (mode = 'detailed') => {
    if (!imageFile) {
      setError('Please select an image first');
      return;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      const formData = new FormData();
      formData.append('image', imageFile);
      formData.append('mode', mode);
      
      console.log('Sending request to /api/estimate');
      const response = await fetch(`${API_URL}/api/estimate`, {
        method: 'POST',
        body: formData,
      });
      
      if (!response.ok) {
        throw new Error(`Server responded with ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      console.log('Response data:', data);
      
      setAnalysisResults(data);
      setCurrentScreen('results');
        
      // Check if food was detected
      if (data.calories === null) {
        setError(data.message || 'No food detected in the image');
      }
    } catch (error) {
      console.error('Error analyzing image:', error);
      setError(`Analysis failed: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };
  
  const resetApp = () => {
    // Clean up resources
    setImageFile(null);
    if (imagePreview) {
      URL.revokeObjectURL(imagePreview);
    }
    setImagePreview(null);
    setAnalysisResults(null);
    setAuthenticated(false); // Reset authentication
    setCurrentScreen('welcome'); // Go to welcome screen instead of upload
  };

  return (
    <div className="app">
      {error && (
        <div className="error-message">
          {error}
          <button onClick={() => setError(null)}>Dismiss</button>
        </div>
      )}
      
      {loading && <div className="loading-overlay">Analyzing...</div>}
      
      {currentScreen === 'welcome' && (
        <WelcomeScreen onStartClick={handleStartClick} />
      )}
      
      {currentScreen === 'password' && (
        <PasswordScreen 
          onPasswordSubmit={verifyPassword} 
          loading={loading}
          onBackClick={() => setCurrentScreen('welcome')}
        />
      )}
      
      {currentScreen === 'upload' && authenticated && (
        <ImageUploadScreen 
          imagePreview={imagePreview}
          onImageSelect={handleImageSelect}
          onAnalyze={analyzeImage}
          loading={loading}
        />
      )}
      
      {currentScreen === 'results' && authenticated && analysisResults && (
        <ResultsScreen 
          results={analysisResults}
          imagePreview={imagePreview}
          onDone={resetApp}
        />
      )}
    </div>
  );
}

export default App;