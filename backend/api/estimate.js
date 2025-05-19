import { IncomingForm } from 'formidable';
import { promises as fs } from 'fs';
import { OpenAI } from 'openai';

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Set the correct password from environment variable or use default
const CORRECT_PASSWORD = process.env.APP_PASSWORD || '2911';

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
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Parse the form data
    const { fields, files } = await parseForm(req);
    
    // Validate password
    const password = fields.password ? fields.password[0] : '';
    if (password !== CORRECT_PASSWORD) {
      return res.status(401).json({ error: 'Unauthorized: Incorrect password' });
    }
    
    // Check if image file exists
    if (!files.image) {
      return res.status(400).json({ error: 'No image file uploaded' });
    }
    
    // Get the uploaded image file
    const imageFile = files.image[0];
    
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
    
    // Convert image to base64
    const base64Image = await readFileAsBase64(imageFile.filepath);
    
    // Construct the prompt based on mode
    let prompt;
    if (mode === 'detailed') {
      prompt = `Analyze this photo of a meal. Provide a JSON response with the following fields:
- calories: estimated calories (numeric value only)
- protein: estimated protein in grams (include 'g' unit)
- carbs: estimated carbohydrates in grams (include 'g' unit)
- fat: estimated fat in grams (include 'g' unit)
- ingredients: an array of strings listing the main visible ingredients

Be as accurate as possible with your nutritional estimates based on portion size.`;
    } else {
      prompt = `Analyze this photo of a meal. Provide a JSON response with the following fields:
- calories: estimated calories (numeric value only)
- protein: estimated protein in grams (include 'g' unit)
- carbs: estimated carbohydrates in grams (include 'g' unit)
- fat: estimated fat in grams (include 'g' unit)

Be as accurate as possible with your nutritional estimates based on portion size.`;
    }
    
    // Make a request to OpenAI API
    try {
      // Prepare the request to OpenAI Vision API
      const response = await openai.chat.completions.create({
        model: "gpt-4-vision-preview",
        messages: [
          {
            role: "user",
            content: [
              { type: "text", text: prompt },
              {
                type: "image_url",
                image_url: {
                  url: `data:image/${imageFile.mimetype};base64,${base64Image}`,
                },
              },
            ],
          },
        ],
        max_tokens: 500,
        response_format: { type: "json_object" },
      });
      
      // Clean up the temporary file
      await fs.unlink(imageFile.filepath);
      
      // Get the OpenAI response content
      const aiResponse = JSON.parse(response.choices[0].message.content);
      
      // Return the structured data from OpenAI
      return res.status(200).json(aiResponse);
    } catch (aiError) {
      console.error('Error calling OpenAI API:', aiError);
      
      // Provide a fallback response in case of API failure
      const fallbackResponse = {
        calories: "~500",
        protein: "~25g",
        carbs: "~40g",
        fat: "~20g",
        error: "Failed to get precise estimates from AI service",
      };
      
      if (mode === 'detailed') {
        fallbackResponse.ingredients = ["Could not identify ingredients"];
      }
      
      return res.status(200).json(fallbackResponse);
    }
    
  } catch (error) {
    console.error('Error processing request:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}