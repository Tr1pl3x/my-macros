// src/components/ResultsScreen.jsx
import React from 'react';

const ResultsScreen = ({ results, imagePreview, onDone }) => {
  const { calories, protein, carbs, fat, ingredients } = results;
  
  const hasFood = calories !== null;
  
  return (
    <div className="screen results-screen">
      {imagePreview && (
        <div className="results-image-container">
          <img src={imagePreview} alt="Analyzed food" className="results-image" />
        </div>
      )}
      
      {hasFood ? (
        <>
          {ingredients && ingredients.length > 0 && (
            <div className="ingredients-section">
              <h3>Identified Ingredients:</h3>
              <div className="ingredients-list">
                {ingredients.map((ingredient, index) => (
                  <span key={index} className="ingredient-tag">
                    {ingredient}
                  </span>
                ))}
              </div>
            </div>
          )}
          
          <h2 className="results-title">Estimated Macros:</h2>
          
          <div className="macro-results">
            <div className="macro-card">
              <div className="macro-label">Calories</div>
              <div className="macro-value">{calories}</div>
            </div>
            
            <div className="macro-card">
              <div className="macro-label">Protein</div>
              <div className="macro-value">{protein}</div>
            </div>
            
            <div className="macro-card">
              <div className="macro-label">Carbs</div>
              <div className="macro-value">{carbs}</div>
            </div>
            
            <div className="macro-card">
              <div className="macro-label">Fat</div>
              <div className="macro-value">{fat}</div>
            </div>
          </div>
        </>
      ) : (
        <div className="no-food-detected">
          <h3>No food detected</h3>
          <p>{results.message || "We couldn't detect any food in this image. Please try again with a different image."}</p>
        </div>
      )}
      
      <button className="primary-button done-button" onClick={onDone}>
        Back to Home
      </button>
    </div>
  );
};

export default ResultsScreen;