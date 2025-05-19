import { IncomingForm } from 'formidable';
import { promises as fs } from 'fs';
import fetch from 'node-fetch';
import logger from '../utils/logger.js';

// Set the correct password from environment variable or use default
const CORRECT_PASSWORD = process.env.APP_PASSWORD || '2911';
const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;

export const config = {
  api: {
    bodyParser: false, // Disable built-in bodyParser to use formidable
  },
};

// Helper function to parse form data
const parseForm = (req) => {
  return new Promise((resolve, reject) => {
    const form = new IncomingForm({
      keepExtensions: true,
      maxFileSize: 10 * 1024 * 1024, // 10MB limit
    });
    
    form.parse(req, (err, fields, files) => {
      if (err) return reject(err);
      resolve({ fields, files });
    });
  });
};

// Helper function to read file as base64
const readFileAsBase64 = async (filepath) => {
  const data = await fs.readFile(filepath);
  return data.toString('base64');
};

export default async function handler(req, res) {
  // Add CORS headers for local development
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  // Handle OPTIONS request
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Parse the form data
    logger.info('Parsing form data...');
    const { fields, files } = await parseForm(req);
    
    // Validate password
    const password = fields.password ? fields.password[0] : '';
    if (password !== CORRECT_PASSWORD) {
      logger.info('Authentication failed: Incorrect password');
      return res.status(401).json({ error: 'Unauthorized: Incorrect password' });
    }
    
    // Check if image file exists
    if (!files.image) {
      logger.info('No image file uploaded');
      return res.status(400).json({ error: 'No image file uploaded' });
    }
    
    // Get the uploaded image file
    const imageFile = files.image[0];
    logger.debug('Image file received', { 
      filename: imageFile.originalFilename,
      size: imageFile.size,
      type: imageFile.mimetype
    });
    
    // Validate file type
    const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/heic'];
    if (!allowedMimeTypes.includes(imageFile.mimetype)) {
      return res.status(400).json({ 
        error: 'Invalid file type. Only JPEG, PNG, WEBP, and HEIC images are allowed.' 
      });
    }
    
    // Validate file size (max 10MB)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (imageFile.size > maxSize) {
      return res.status(400).json({ 
        error: 'File too large. Maximum size is 10MB.' 
      });
    }
    
    // Get analysis mode (default to basic)
    const mode = fields.mode ? fields.mode[0] : 'basic';
    logger.info(`Analysis mode: ${mode}`);
    
    // Convert image to base64
    const base64Image = await readFileAsBase64(imageFile.filepath);
    
    // Construct the prompt based on mode
    let prompt;
    if (mode === 'detailed') {
      prompt = `Return ONLY a JSON object with these fields:
{
  "calories": [number],
  "protein": [string with g suffix],
  "carbs": [string with g suffix],
  "fat": [string with g suffix],
  "ingredients": [array of strings]
}

Analyze this food image and estimate nutritional values based on visible portion size.`;
    } else {
      prompt = `Return ONLY a JSON object with these fields:
{
  "calories": [number],
  "protein": [string with g suffix],
  "carbs": [string with g suffix],
  "fat": [string with g suffix]
}

Analyze this food image and estimate nutritional values based on visible portion size.`;
    }
    
    // Make a request to Claude API
    try {
      logger.info('Sending request to Claude API...');
      logger.info('Using Anthropic API Key:', ANTHROPIC_API_KEY ? 'Key is set' : 'Key is NOT set');
      
      // Implement exponential backoff retry logic
      const maxRetries = 2;
      let retryCount = 0;
      let lastError = null;
      
      while (retryCount <= maxRetries) {
        try {
          // If not the first attempt, wait with exponential backoff
          if (retryCount > 0) {
            const delayMs = Math.pow(2, retryCount) * 1000; // 2s, 4s
            logger.info(`Retry attempt ${retryCount}/${maxRetries}. Waiting ${delayMs/1000}s...`);
            await new Promise(resolve => setTimeout(resolve, delayMs));
          }
          
          // Prepare the request to Claude API
          const claudeResponse = await fetch('https://api.anthropic.com/v1/messages', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'x-api-key': ANTHROPIC_API_KEY,
              'anthropic-version': '2023-06-01'
            },
            body: JSON.stringify({
              model: "claude-3-opus-20240229",
              max_tokens: 150,
              temperature: 0.3,
              system: "You are a nutrition expert analyzing food images. Provide only the requested JSON object with no additional text.",
              messages: [
                {
                  role: "user",
                  content: [
                    {
                      type: "text",
                      text: prompt
                    },
                    {
                      type: "image",
                      source: {
                        type: "base64",
                        media_type: imageFile.mimetype,
                        data: base64Image
                      }
                    }
                  ]
                }
              ]
            })
          });
          
          if (!claudeResponse.ok) {
            const errorData = await claudeResponse.json();
            throw {
              status: claudeResponse.status,
              message: errorData.error?.message || "Error calling Claude API",
              data: errorData
            };
          }
          
          // Clean up temporary file
          await fs.unlink(imageFile.filepath);
          
          // Parse Claude's response
          const responseData = await claudeResponse.json();
          
          // Extract the content
          const content = responseData.content[0].text;
          
          // Try to parse the JSON from Claude's response
          try {
            // Find JSON object in the response - Claude might wrap it with ```json and ```
            let jsonString = content;
            const jsonMatch = content.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
            if (jsonMatch && jsonMatch[1]) {
              jsonString = jsonMatch[1];
            }
            
            const parsedResponse = JSON.parse(jsonString);
            logger.info('Response received from Claude');
            logger.debug('Claude response', parsedResponse);
            return res.status(200).json(parsedResponse);
            
          } catch (jsonError) {
            logger.error('Error parsing JSON from Claude response:', jsonError);
            logger.debug('Raw response content:', content);
            
            // Try to extract the nutrition information using regex
            const caloriesMatch = content.match(/"calories":\s*(\d+)/);
            const proteinMatch = content.match(/"protein":\s*"([^"]+)"/);
            const carbsMatch = content.match(/"carbs":\s*"([^"]+)"/);
            const fatMatch = content.match(/"fat":\s*"([^"]+)"/);
            
            const extractedData = {
              calories: caloriesMatch ? parseInt(caloriesMatch[1]) : 0,
              protein: proteinMatch ? proteinMatch[1] : "0g",
              carbs: carbsMatch ? carbsMatch[1] : "0g",
              fat: fatMatch ? fatMatch[1] : "0g"
            };
            
            if (mode === 'detailed') {
              const ingredientsMatch = content.match(/"ingredients":\s*\[(.*?)\]/);
              extractedData.ingredients = ingredientsMatch ? 
                ingredientsMatch[1].split(',').map(i => i.trim().replace(/"/g, '')) : 
                ["Could not extract ingredients"];
            }
            
            return res.status(200).json(extractedData);
          }
          
        } catch (err) {
          lastError = err;
          // Only retry rate limit errors
          if ((err.status === 429 || err.status === 500) && retryCount < maxRetries) {
            retryCount++;
            continue;
          }
          // For other errors or if we've exhausted retries, break the loop
          break;
        }
      }
      
      // If we get here, all retries failed
      throw lastError;
      
    } catch (apiError) {
      logger.error('Error calling Claude API:', apiError);
      
      // Get status code
      const statusCode = apiError.status || (apiError.response ? apiError.response.status : null);
      
      let errorMessage = "Failed to get precise estimates from AI service";
      
      // Handle specific error types
      if (statusCode === 429) {
        logger.error('Rate limit exceeded. You have sent too many requests to the Claude API.');
        errorMessage = "Rate limit exceeded. Please try again in a few moments.";
      } else if (statusCode === 401) {
        logger.error('Authentication error. Check your API key.');
        errorMessage = "API authentication error. Please check your API key.";
      } else if (statusCode === 404) {
        logger.error('Endpoint not found or resource unavailable.');
        errorMessage = "API endpoint error. The service is not available.";
      }
      
      // Clean up temporary file
      await fs.unlink(imageFile.filepath).catch(() => {});
      
      // Return fallback response
      const fallbackResponse = {
        calories: 0,
        protein: "0g",
        carbs: "0g",
        fat: "0g",
        error: errorMessage,
      };
      
      if (mode === 'detailed') {
        fallbackResponse.ingredients = ["Could not identify ingredients"];
      }
      
      return res.status(200).json(fallbackResponse);
    }
    
  } catch (error) {
    logger.error('Error processing request:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}