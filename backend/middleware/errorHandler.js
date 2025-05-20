// middleware/errorHandler.js

/**
 * Custom error class for API errors
 */
class ApiError extends Error {
  constructor(statusCode, message, details = null) {
    super(message);
    this.statusCode = statusCode;
    this.details = details;
    this.name = 'ApiError';
  }
}

/**
 * Not found error handler middleware
 * Catches 404 routes and forwards to error handler
 */
function notFoundHandler(req, res, next) {
  const error = new ApiError(404, 'Resource not found');
  next(error);
}

/**
 * Global error handler middleware
 */
function errorHandler(err, req, res, next) {
  // Log the error (but not in test environment)
  if (process.env.NODE_ENV !== 'test') {
    console.error(`[ERROR] ${err.stack || err.message}`);
  }
  
  // Default to 500 if status code is not set
  const statusCode = err.statusCode || 500;
  
  // Structure the error response
  const errorResponse = {
    status: statusCode,
    error: err.message || 'Internal Server Error'
  };
  
  // Include error details in development mode
  if (process.env.NODE_ENV !== 'production' && err.details) {
    errorResponse.details = err.details;
  }
  
  // Send the error response
  res.status(statusCode).json(errorResponse);
}

module.exports = {
  ApiError,
  notFoundHandler,
  errorHandler
};