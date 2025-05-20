// src/components/ImageUploadScreen.jsx
import React from 'react';

const ImageUploadScreen = ({ imagePreview, onImageSelect, onAnalyze, loading }) => {
  const handleFileInputChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      onImageSelect(e.target.files[0]);
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
        <input
          type="file"
          accept="image/*"
          capture="environment"
          id="image-upload"
          onChange={handleFileInputChange}
          className="file-input"
          disabled={loading}
        />
        <label htmlFor="image-upload" className="primary-button">
          Choose Image
        </label>
        
        {imagePreview && (
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