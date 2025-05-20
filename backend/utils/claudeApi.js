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
    
    if (mode === 'detailed') {
      systemPrompt += ` Please identify 3-5 main ingredients in the food and provide detailed macronutrient breakdown.`;
    } else {
      systemPrompt += ` Please identify 3-5 main ingredients in the food and provide basic macronutrient estimates.`;
    }
    
    systemPrompt += ` Return ONLY a valid JSON object with the following structure: 
    {
      "calories": "value",
      "protein": "value in grams",
      "carbs": "value in grams",
      "fat": "value in grams",
      "ingredients": ["ingredient1", "ingredient2", "ingredient3"]
    }
    Do not include any explanations or notes outside the JSON object.`;

    // Prepare the request for Claude API
    const requestData = {
      model: process.env.CLAUDE_MODEL,
      max_tokens: parseInt(process.env.MAX_TOKENS, 10),
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
              text: "What food is in this image? Please analyze it and estimate the macronutrients."
            }
          ]
        }
      ],
      system: systemPrompt
    };

    // Make the API call to Claude
    const response = await axios.post(
      process.env.CLAUDE_API_URL,
      requestData,
      {
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': process.env.ANTHROPIC_API_KEY,
          'anthropic-version': '2023-06-01'
        }
      }
    );

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
    if (!data[field]) {
      throw new Error(`Missing required field in Claude response: ${field}`);
    }
  }
  
  if (!Array.isArray(data.ingredients)) {
    throw new Error('Ingredients field must be an array');
  }
}

module.exports = {
  processFoodImage
};