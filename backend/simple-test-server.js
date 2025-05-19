import express from 'express';
import { IncomingForm } from 'formidable';
import { promises as fs } from 'fs';
import * as dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import cors from 'cors';
import fetch from 'node-fetch';

// Load environment variables from .env file
dotenv.config();

// Log environment variables for debugging
console.log('Environment variables:');
console.log('- MOCK_API:', process.env.MOCK_API);
console.log('- DEBUG:', process.env.DEBUG);
console.log('- APP_PASSWORD:', process.env.APP_PASSWORD ? '[SET]' : '[NOT SET]');
console.log('- ANTHROPIC_API_KEY:', process.env.ANTHROPIC_API_KEY ? '[SET]' : '[NOT SET]');

// Get current directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Set up password from .env or use default
const CORRECT_PASSWORD = process.env.APP_PASSWORD || '2911';
const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;

// Create Express app
const app = express();
const PORT = process.env.PORT || 3000;

// Enable CORS
app.use(cors());

// Serve static test form
app.use(express.static(join(__dirname, 'test')));

// Helper function to parse form data with image
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

// Simple test endpoint to check environment variables
app.get('/api/test-env', (req, res) => {
  res.json({
    mockApi: process.env.MOCK_API,
    debug: process.env.DEBUG,
    hasPassword: !!process.env.APP_PASSWORD,
    hasAnthropicKey: !!process.env.ANTHROPIC_API_KEY
  });
});

// Main API endpoint for image analysis
app.post('/api/estimate', async (req, res) => {
  console.log('📥 Received request to /api/estimate');
  
  try {
    // Parse form data
    console.log('Parsing form data...');
    const { fields, files } = await parseForm(req);
    
    // Validate password
    const password = fields.password ? fields.password[0] : '';
    if (password !== CORRECT_PASSWORD) {
      console.log('❌ Authentication failed: Incorrect password');
      return res.status(401).json({ error: 'Unauthorized: Incorrect password' });
    }
    
    // Check if image exists
    if (!files.image) {
      console.log('❌ No image file uploaded');
      return res.status(400).json({ error: 'No image file uploaded' });
    }
    
    // Get uploaded image
    const imageFile = files.image[0];
    console.log(`✅ Image received: ${imageFile.originalFilename} (${imageFile.size} bytes, ${imageFile.mimetype})`);
    
    // Validate file type
    const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/heic'];
    if (!allowedMimeTypes.includes(imageFile.mimetype)) {
      console.log(`❌ Invalid file type: ${imageFile.mimetype}`);
      return res.status(400).json({ 
        error: 'Invalid file type. Only JPEG, PNG, WEBP, and HEIC images are allowed.' 
      });
    }
    
    // Get analysis mode
    const mode = fields.mode ? fields.mode[0] : 'basic';
    console.log(`📊 Analysis mode: ${mode}`);
    
    // Construct prompt based on mode
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
    
    // Convert image to base64
    console.log('Converting image to base64...');
    const base64Image = await readFileAsBase64(imageFile.filepath);
    
    // Debug option - to avoid using Claude API during testing
    if (process.env.MOCK_API === 'true') {
      console.log('🔶 Using mock response (MOCK_API=true)');
      console.log('MOCK_API value type:', typeof process.env.MOCK_API);
      console.log('MOCK_API exact value:', JSON.stringify(process.env.MOCK_API));
      
      // Clean up temporary file
      await fs.unlink(imageFile.filepath);
      
      // Generate more realistic mock data based on filename
      // This helps with testing different foods during API rate limiting
      let mockResponse = {
        calories: 0,
        protein: "0g",
        carbs: "0g",
        fat: "0g",
      };
      
      // Try to guess the food type from the filename
      const filename = imageFile.originalFilename ? imageFile.originalFilename.toLowerCase() : "";
      
      if (filename.includes("pizza") || imageFile.filepath.includes("pizza")) {
        mockResponse = {
          calories: 300,
          protein: "12g",
          carbs: "35g",
          fat: "10g",
        };
        if (mode === 'detailed') {
          mockResponse.ingredients = ["pizza dough", "tomato sauce", "cheese", "pepperoni"];
        }
      } else if (filename.includes("salad") || imageFile.filepath.includes("salad")) {
        mockResponse = {
          calories: 150,
          protein: "5g",
          carbs: "10g",
          fat: "8g",
        };
        if (mode === 'detailed') {
          mockResponse.ingredients = ["lettuce", "tomato", "cucumber", "olive oil"];
        }
      } else if (filename.includes("burger") || imageFile.filepath.includes("burger")) {
        mockResponse = {
          calories: 550,
          protein: "30g",
          carbs: "40g",
          fat: "25g",
        };
        if (mode === 'detailed') {
          mockResponse.ingredients = ["beef patty", "burger bun", "lettuce", "tomato", "cheese"];
        }
      } else {
        // Default fallback
        mockResponse = {
          calories: 540,
          protein: "30g",
          carbs: "45g",
          fat: "22g",
        };
        if (mode === 'detailed') {
          mockResponse.ingredients = ["grilled chicken", "rice", "broccoli"];
        }
      }
      
      return res.status(200).json(mockResponse);
    }
    
    // Make request to Claude API
    try {
      console.log('🔍 Sending request to Claude API...');
      console.log('MOCK_API is false, using real Claude API');
      console.log('Using Anthropic API Key:', process.env.ANTHROPIC_API_KEY ? 'Key is set' : 'Key is NOT set');
      
      // Implement exponential backoff retry logic
      const maxRetries = 2;
      let retryCount = 0;
      let lastError = null;
      
      while (retryCount <= maxRetries) {
        try {
          // If not the first attempt, wait with exponential backoff
          if (retryCount > 0) {
            const delayMs = Math.pow(2, retryCount) * 1000; // 2s, 4s
            console.log(`Retry attempt ${retryCount}/${maxRetries}. Waiting ${delayMs/1000}s...`);
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
            console.log('✅ Response received from Claude');
            return res.status(200).json(parsedResponse);
            
          } catch (jsonError) {
            console.error('❌ Error parsing JSON from Claude response:', jsonError);
            console.log('Raw response content:', content);
            
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
      // Get status code
      const statusCode = apiError.status || (apiError.response ? apiError.response.status : null);
      
      console.error(`❌ Error calling Claude API: ${apiError.message}`);
      console.error(`Status code: ${statusCode}`);
      
      let errorMessage = "Failed to get precise estimates from AI service";
      
      // Handle specific error types
      if (statusCode === 429) {
        console.error('Rate limit exceeded. You have sent too many requests to the Claude API.');
        errorMessage = "Rate limit exceeded. Please try again in a few moments.";
      } else if (statusCode === 401) {
        console.error('Authentication error. Check your API key.');
        errorMessage = "API authentication error. Please check your API key.";
      } else if (statusCode === 404) {
        console.error('Endpoint not found or resource unavailable.');
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
    console.error('❌ Server error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`
🚀 Simple test server running at http://localhost:${PORT}
📋 API endpoint: http://localhost:${PORT}/api/estimate
🖥️ Test form: http://localhost:${PORT}/test-form.html
🧪 Env test: http://localhost:${PORT}/api/test-env
  
⚙️ Current mode: ${process.env.MOCK_API === 'true' ? 'MOCK API (not calling Claude)' : 'REAL API (calling Claude)'}
  `);
});