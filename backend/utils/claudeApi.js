// routes/estimateRoute.js
const express = require('express');
const router = express.Router();
const { processFileUpload, cleanupFile } = require('../utils/fileUpload');
const { processFoodImage, getNoFoodResponse } = require('../utils/claudeApi');
const { ApiError } = require('../middleware/errorHandler');

/**
 * @swagger
 * /api/estimate:
 *   post:
 *     summary: Estimate macros from food image
 *     description: Analyze a food image to estimate macronutrients and identify ingredients. Returns null values if no food is detected.
 *     tags: [Analysis]
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             $ref: '#/components/schemas/EstimateRequest'
 *     responses:
 *       200:
 *         description: Successful analysis
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/EstimateResponse'
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */
router.post('/estimate', async (req, res, next) => {
  let imagePath = null;
  
  try {
    // Process and validate the uploaded file
    const uploadResult = await processFileUpload(req);
    imagePath = uploadResult.imagePath;
    
    // Log upload info (without sensitive data)
    console.log(`Processing ${uploadResult.originalFilename} (${uploadResult.mimetype}) in ${uploadResult.mode} mode`);
    
    // Process the image with Claude API
    let macrosData;
    try {
      // Check if we have a valid API key, otherwise use mock data
      if (!process.env.ANTHROPIC_API_KEY || process.env.ANTHROPIC_API_KEY === 'your-key-here') {
        console.warn('Using mock data because API key is not set');
        // For testing purposes, you can simulate no food detection with a query parameter
        if (req.query.noFood === 'true') {
          macrosData = getNoFoodResponse();
        } else {
          // This would be replaced with the real API call in production
          macrosData = await processFoodImage(imagePath, uploadResult.mode);
        }
      } else {
        // Real API call
        macrosData = await processFoodImage(imagePath, uploadResult.mode);
      }
    } catch (apiError) {
      console.error('Error with Claude API:', apiError);
      // If it's an API-specific error, we might want to return a more specific message
      throw new ApiError(502, 'Failed to analyze image with AI service', 
        process.env.NODE_ENV === 'development' ? apiError.message : undefined);
    }
    
    // Clean up the temporary file
    cleanupFile(imagePath);
    imagePath = null;
    
    // Return the analysis results, which may include null values if no food detected
    return res.status(200).json(macrosData);
    
  } catch (error) {
    // Clean up temporary file in case of error
    if (imagePath) {
      cleanupFile(imagePath);
    }
    
    // Handle specific error types
    if (error.message.includes('File type not allowed') || 
        error.message.includes('No image file uploaded') ||
        error.message.includes('Invalid mode specified')) {
      next(new ApiError(400, error.message));
      return;
    }
    
    if (error.message.includes('File size exceeds')) {
      next(new ApiError(413, 'File size exceeds the limit'));
      return;
    }
    
    if (error.message.includes('Claude API error')) {
      next(new ApiError(502, 'Failed to process image with AI service', 
        process.env.NODE_ENV === 'development' ? error.message : undefined));
      return;
    }
    
    // Pass other errors to the global error handler
    next(error);
  }
});

module.exports = router;