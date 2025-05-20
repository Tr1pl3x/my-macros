// src/components/ImageUploadScreen.jsx
import React, { useState } from 'react';

const ImageUploadScreen = ({ imagePreview, onImageSelect, onAnalyze, loading }) => {
  const [showOptions, setShowOptions] = useState(false);
  
  const handleFileInputChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      onImageSelect(e.target.files[0]);
      setShowOptions(false); // Hide options after selection
    }
  };
  
  return (
    <div className="screen upload-screen">
      <div className="image-preview-container">
        {imagePreview ? (
          <img src={imagePreview} alt="Selected food" className="image-preview" />
        ) : (
          <div className="no-image">
            <p>No image selected yet. Please upload an image</p>
          </div>
        )}
      </div>
      
      <div className="upload-actions">
        {/* Hidden input for gallery selection */}
        <input
          type="file"
          accept="image/*"
          id="gallery-upload"
          onChange={handleFileInputChange}
          className="file-input"
          disabled={loading}
        />
        
        {/* Hidden input for camera capture */}
        <input
          type="file"
          accept="image/*"
          capture="environment"
          id="camera-upload"
          onChange={handleFileInputChange}
          className="file-input"
          disabled={loading}
        />
        
        {!showOptions ? (
          // Main "Choose Image" button that shows options
          <button
            className="primary-button"
            onClick={() => setShowOptions(true)}
            disabled={loading}
          >
            Choose Image
          </button>
        ) : (
          // Image source options
          <div className="image-source-options">
            <label htmlFor="gallery-upload" className="primary-button option-button">
              <span className="option-icon">🖼️</span> Gallery
            </label>
            
            <label htmlFor="camera-upload" className="primary-button option-button">
              <span className="option-icon">📷</span> Camera
            </label>
            
            <button 
              className="secondary-button cancel-button"
              onClick={() => setShowOptions(false)}
            >
              Cancel
            </button>
          </div>
        )}
        
        {imagePreview && !showOptions && (
          <button
            className="primary-button analyze-button"
            onClick={() => onAnalyze('detailed')}
            disabled={loading || !imagePreview}
          >
            Analyze
          </button>
        )}
      </div>
    </div>
  );
};

export default ImageUploadScreen;