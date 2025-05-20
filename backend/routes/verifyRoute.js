// routes/verifyRoute.js
const express = require('express');
const router = express.Router();
const { ApiError } = require('../middleware/errorHandler');

/**
 * @swagger
 * /api/verify:
 *   post:
 *     summary: Verify password access
 *     description: Verifies if the provided password matches the application password
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/VerifyRequest'
 *     responses:
 *       200:
 *         description: Password verification successful
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/VerifyResponse'
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */
router.post('/verify', (req, res, next) => {
  try {
    // Input validation
    const { password } = req.body;
    
    if (!password) {
      return res.status(400).json({
        status: 400,
        error: 'Password is required'
      });
    }

    // Convert to string to handle number inputs
    const passwordStr = String(password);
    
    // Compare with environment variable
    if (passwordStr === process.env.APP_PASSWORD) {
      return res.status(200).json({
        status: 200,
        message: 'Authentication successful'
      });
    }
    
    // Password doesn't match
    return res.status(401).json({
      status: 401,
      error: 'Invalid password'
    });
  } catch (error) {
    console.error('Error in verify route:', error);
    return res.status(500).json({
      status: 500,
      error: 'Internal server error',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

module.exports = router;