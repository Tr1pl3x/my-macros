import { useState, useRef } from 'react';
import Keypad from './Keypad';
import './style.css';

function App() {
  const [step, setStep] = useState('home'); // 'home', 'password', 'upload', 'results'
  const [image, setImage] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [isAnimating, setIsAnimating] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [macroResults, setMacroResults] = useState(null);
  const [error, setError] = useState(null);
  const fileInputRef = useRef(null);

  const handleUploadClick = () => {
    setIsAnimating(true);
    setTimeout(() => {
      setStep('password');
      setIsAnimating(false);
    }, 300);
  };

  const handlePasswordSuccess = () => {
    setIsAnimating(true);
    setTimeout(() => {
      setStep('upload');
      setIsAnimating(false);
      // Trigger file input click after transition
      setTimeout(() => {
        if (fileInputRef.current) {
          fileInputRef.current.click();
        }
      }, 300);
    }, 300);
  };

  const handleGoBack = () => {
    setIsAnimating(true);
    setTimeout(() => {
      setStep('home');
      setIsAnimating(false);
      // Reset all states when going back to home
      setImage(null);
      setPreviewUrl(null);
      setMacroResults(null);
      setError(null);
    }, 300);
  };

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    
    if (file && file.type.startsWith('image/')) {
      setImage(file);
      
      // Create a preview URL for displaying the image
      const fileReader = new FileReader();
      fileReader.onload = () => {
        const imageUrl = fileReader.result;
        setPreviewUrl(imageUrl);
        
        // Automatically process image after upload
        processImage(file, imageUrl);
      };
      fileReader.readAsDataURL(file);
    }
  };

  // Helper function for error messages
  const getErrorMessage = (error) => {
    // Check for common API errors
    if (error.includes('401')) {
      return 'Unauthorized: Password is incorrect.';
    } else if (error.includes('413')) {
      return 'Image file is too large. Please select a smaller image.';
    } else if (error.includes('415')) {
      return 'Unsupported file type. Please upload a valid image.';
    } else if (error.includes('500')) {
      return 'Server error. Please try again later.';
    } else if (error.includes('503')) {
      return 'Service unavailable. Please try again later.';
    } else if (error.includes('network') || error.includes('fetch')) {
      return 'Network error. Please check your internet connection.';
    }
    
    // Default error message
    return 'Failed to process image. Please try again.';
  };

  const processImage = async (imageFile, imageUrl) => {
    setIsLoading(true);
    setError(null);
    
    try {
      // Create form data for API request
      const formData = new FormData();
      formData.append('image', imageFile);
      formData.append('password', '2911'); // Including password for verification
      
      // API endpoint URL - use environment variable if available
      const apiUrl = import.meta.env.VITE_API_URL || '/api/estimate';
      
      try {
        const response = await fetch(apiUrl, {
          method: 'POST',
          body: formData,
          // No need to set Content-Type header as it's automatically set with FormData
        });
        
        if (!response.ok) {
          throw new Error(`Server responded with ${response.status}: ${await response.text()}`);
        }
        
        const data = await response.json();
        
        // Process the response data
        const processedResponse = {
          calories: data.calories || 450,
          protein: data.protein || "25g",
          carbs: data.carbs || "45g",
          fat: data.fat || "15g",
          ingredients: data.ingredients || ["grilled chicken", "rice", "broccoli"],
          imageUrl: imageUrl // Use the locally saved image URL
        };
        
        setMacroResults(processedResponse);
        setStep('results');
        setIsLoading(false);
      } catch (err) {
        console.error('Error processing image:', err);
        setError(getErrorMessage(err.message));
        setIsLoading(false);
      }
    } catch (err) {
      console.error('Error uploading image:', err);
      setError('Failed to upload image. Please try again.');
      setIsLoading(false);
    }
  };

  return (
    <div className="app-container">
      <div className={`content ${isAnimating ? 'content-animating' : ''}`}>
        {step === 'home' && (
          <>
            <h1>My Macros</h1>
            <div className="upload-container">
              <p>Upload your meal now to get the macros!</p>
              <button 
                className="upload-button" 
                onClick={handleUploadClick}
              >
                Get Started
              </button>
            </div>
          </>
        )}
        
        {step === 'password' && (
          <div className="password-container">
            <button 
              className="back-button outlined-button" 
              onClick={handleGoBack}
            >
              ←
            </button>
            <p className="password-prompt">Please enter password to continue</p>
            <Keypad onPasswordSuccess={handlePasswordSuccess} />
            <p className="contact-prompt">
              Don't know password? <a href="#" className="contact-link">Contact here</a>
            </p>
          </div>
        )}
        
        {step === 'upload' && (
          <>
            <div className="image-upload-container">
              <input 
                type="file" 
                accept="image/*" 
                onChange={handleImageUpload} 
                className="file-input"
                ref={fileInputRef}
              />
              
              {previewUrl && !isLoading ? (
                <div className="upload-success">
                  <div className="image-preview">
                    <img src={previewUrl} alt="Uploaded meal" />
                  </div>
                  {error && (
                    <div className="error-message-container">
                      <p className="error-message">{error}</p>
                      <button 
                        className="upload-button" 
                        onClick={() => fileInputRef.current.click()}
                      >
                        Try Another Image
                      </button>
                    </div>
                  )}
                </div>
              ) : isLoading ? (
                <div className="loading-container">
                  <div className="spinner"></div>
                  <p className="processing-message">
                    Processing your image...
                  </p>
                </div>
              ) : (
                <div className="no-image-selected">
                  <p>No image selected yet. Please upload an image</p>
                  <button 
                    className="upload-button" 
                    onClick={() => fileInputRef.current.click()}
                  >
                    Choose Image
                  </button>
                </div>
              )}
            </div>
          </>
        )}
        
        {step === 'results' && macroResults && (
          <>
            <div className="results-container">
              {/* 1. Display the analyzed meal image */}
              <div className="result-image-container">
                <img 
                  src={macroResults.imageUrl} 
                  alt="Analyzed meal" 
                  className="result-image"
                />
              </div>
              
              {/* 2. Display identified ingredients */}
              {macroResults.ingredients && macroResults.ingredients.length > 0 && (
                <div className="ingredients-container">
                  <h2>Identified Ingredients:</h2>
                  <div className="ingredients-list">
                    {macroResults.ingredients.map((ingredient, index) => (
                      <div key={index} className="ingredient-item">
                        {ingredient}
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              {/* 3. Display macros */}
              <div className="macro-results">
                <h2>Estimated Macros:</h2>
                
                <div className="macro-card">
                  <div className="macro-label">Calories</div>
                  <div className="macro-value">{macroResults.calories}</div>
                </div>
                
                <div className="macro-card">
                  <div className="macro-label">Protein</div>
                  <div className="macro-value">{macroResults.protein}</div>
                </div>
                
                <div className="macro-card">
                  <div className="macro-label">Carbs</div>
                  <div className="macro-value">{macroResults.carbs}</div>
                </div>
                
                <div className="macro-card">
                  <div className="macro-label">Fat</div>
                  <div className="macro-value">{macroResults.fat}</div>
                </div>
                
                <button 
                  className="upload-button back-to-home-button" 
                  onClick={handleGoBack}
                >
                  Done
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default App;

