// utils/claudeApi.js
const axios = require('axios');
const fs = require('fs');

/**
 * Process an image with Claude API to estimate macros
 * @param {string} imagePath - Path to the temporary uploaded image file
 * @param {string} mode - Analysis mode ('basic' or 'detailed')
 * @returns {Promise<Object>} - Parsed macros data
 */
async function processFoodImage(imagePath, mode = 'basic') {
  try {
    // Read the image file as base64
    const imageBuffer = fs.readFileSync(imagePath);
    const base64Image = imageBuffer.toString('base64');
    
    // Construct the prompt based on the mode
    let systemPrompt = `You are a nutrition analysis assistant that accurately estimates macronutrients (calories, protein, carbs, fat) in food images.`;
    
    systemPrompt += ` If the image does not contain edible food or you cannot identify food in the image with reasonable confidence, return all values as null with an appropriate message.`;
    
    if (mode === 'detailed') {
      systemPrompt += ` If food is present, please identify 3-5 main ingredients in the food and provide detailed macronutrient breakdown.`;
    } else {
      systemPrompt += ` If food is present, please identify 3-5 main ingredients in the food and provide basic macronutrient estimates.`;
    }
    
    systemPrompt += ` Return ONLY a valid JSON object with the following structure: 
    {
      "calories": "value or null",
      "protein": "value in grams or null",
      "carbs": "value in grams or null",
      "fat": "value in grams or null",
      "ingredients": ["ingredient1", "ingredient2", "ingredient3"] or null,
      "message": "Optional message explaining why values are null, if applicable"
    }
    Do not include any explanations or notes outside the JSON object.`;

    // Prepare the request for Claude API
    const requestData = {
      model: process.env.CLAUDE_MODEL || 'claude-3-haiku-20240307',
      max_tokens: parseInt(process.env.MAX_TOKENS, 10) || 1024,
      messages: [
        {
          role: "user",
          content: [
            {
              type: "image",
              source: {
                type: "base64",
                media_type: "image/jpeg",
                data: base64Image
              }
            },
            {
              type: "text",
              text: "What food is in this image? Please analyze it and estimate the macronutrients. If there is no food in the image, please indicate this."
            }
          ]
        }
      ],
      system: systemPrompt
    };

    console.log('Sending request to Claude API...');
    
    // Make the API call to Claude
    const response = await axios.post(
      process.env.CLAUDE_API_URL || 'https://api.anthropic.com/v1/messages',
      requestData,
      {
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': process.env.ANTHROPIC_API_KEY,
          'anthropic-version': '2023-06-01'
        }
      }
    );

    console.log('Received response from Claude API');
    
    // Extract and parse the JSON response
    const claudeResponse = response.data.content[0].text;
    
    // Find JSON object in the response
    const jsonMatch = claudeResponse.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('Failed to extract valid JSON from Claude API response');
    }
    
    const macrosData = JSON.parse(jsonMatch[0]);
    
    // Validate the response format
    validateMacrosData(macrosData);
    
    return macrosData;
  } catch (error) {
    console.error('Claude API processing error:', error);
    
    if (error.response) {
      // Claude API error response
      console.error('API error details:', error.response.data);
      throw new Error(`Claude API error: ${error.response.status} - ${JSON.stringify(error.response.data)}`);
    } else if (error.request) {
      // No response received
      throw new Error('No response received from Claude API');
    } else {
      // Other errors
      throw error;
    }
  }
}

/**
 * Validate macros data structure
 * @param {Object} data - Macros data to validate
 * @throws {Error} If validation fails
 */
function validateMacrosData(data) {
  const requiredFields = ['calories', 'protein', 'carbs', 'fat', 'ingredients'];
  
  for (const field of requiredFields) {
    if (field !== 'ingredients' && data[field] === undefined) {
      throw new Error(`Missing required field in Claude response: ${field}`);
    }
  }
  
  // Ingredients can be null or an array, but must be present in the response
  if (data.ingredients !== null && !Array.isArray(data.ingredients)) {
    throw new Error('Ingredients field must be null or an array');
  }
  
  // If message field exists, it should be a string
  if (data.message !== undefined && typeof data.message !== 'string') {
    throw new Error('Message field must be a string');
  }
}

/**
 * For testing or when API key is not available
 * @param {string} mode - Analysis mode
 * @returns {Object} - Mock macros data
 */
function getMockMacroData(mode) {
  // Return mock data for development/testing
  if (mode === 'detailed') {
    return {
      calories: "450",
      protein: "30g",
      carbs: "45g",
      fat: "15g",
      ingredients: ["chicken", "rice", "broccoli", "olive oil", "garlic"]
    };
  } else {
    return {
      calories: "350",
      protein: "25g",
      carbs: "30g",
      fat: "10g",
      ingredients: ["chicken", "vegetables", "sauce"]
    };
  }
}

/**
 * Get "no food detected" response
 * @returns {Object} - No food detected response
 */
function getNoFoodResponse() {
  return {
    calories: null,
    protein: null, 
    carbs: null,
    fat: null,
    ingredients: null,
    message: "No edible food detected in the image"
  };
}

// Export all functions
module.exports = {
  processFoodImage,
  getMockMacroData,
  getNoFoodResponse,
  validateMacrosData
};