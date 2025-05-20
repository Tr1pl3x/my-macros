// app.js - Main Express application
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const swaggerUi = require('swagger-ui-express');
const swaggerSpec = require('./swagger/swaggerConfig');
const requestLogger = require('./middleware/logger');
const { notFoundHandler, errorHandler } = require('./middleware/errorHandler');
const estimateRoute = require('./routes/estimateRoute');
const verifyRoute = require('./routes/verifyRoute');

// Initialize Express app
const app = express();

// Security middleware
app.use(helmet()); // Set security-related HTTP headers
app.use(cors({
  origin: process.env.FRONTEND_URL || '*', // Restrict to frontend origin in production
  methods: ['GET', 'POST'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Basic request parsing
app.use(express.json({ limit: '10mb' })); // For JSON requests
app.use(express.urlencoded({ extended: true, limit: '10mb' })); // For form data

// Rate limiting - only in production to avoid issues in development
if (process.env.NODE_ENV === 'production') {
  const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // Limit each IP to 100 requests per windowMs
    standardHeaders: true,
    legacyHeaders: false,
    message: {
      status: 429,
      error: 'Too many requests, please try again later.'
    }
  });
  
  // Apply rate limiting to all requests
  app.use(apiLimiter);
}

// Request logging (but not in production serverless environment)
if (process.env.NODE_ENV !== 'production') {
  app.use(requestLogger);
}

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    env: process.env.NODE_ENV
  });
});

// Routes
app.use('/api', estimateRoute);
app.use('/api', verifyRoute);

// Swagger documentation - only mount in development mode
if (process.env.NODE_ENV !== 'production') {
  console.log('Swagger documentation available at /docs');
  app.use('/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));
} else {
  // In production, provide a simple message if someone tries to access /docs
  app.get('/docs', (req, res) => {
    res.status(200).send(`
      <html>
        <head>
          <title>API Documentation</title>
          <style>
            body { font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px; line-height: 1.6; }
            h1 { color: #333; }
            p { margin-bottom: 20px; }
            code { background: #f4f4f4; padding: 2px 5px; border-radius: 3px; }
          </style>
        </head>
        <body>
          <h1>My Macros App API</h1>
          <p>API documentation is available in the development environment only.</p>
          <p>Please refer to the project README for API details or contact the development team.</p>
        </body>
      </html>
    `);
  });
}

// 404 handler for undefined routes
app.use(notFoundHandler);

// Global error handler
app.use(errorHandler);

// Only listen on a port if not in production (for local development)
// In production on Vercel, the serverless function will handle this
if (process.env.NODE_ENV !== 'production' && process.env.NODE_ENV !== 'test') {
  const PORT = process.env.PORT || 3000;
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    console.log(`API Documentation: http://localhost:${PORT}/docs`);
  });
}

module.exports = app; // For testing purposes and serverless function