// middleware/logger.js
/**
 * Simple request logger middleware
 */
function requestLogger(req, res, next) {
  const start = Date.now();
  const { method, originalUrl, ip } = req;
  
  // Log request start
  console.log(`[${new Date().toISOString()}] ${method} ${originalUrl} - Request received from ${ip}`);
  
  // Override end method to log response
  const originalEnd = res.end;
  res.end = function(...args) {
    const duration = Date.now() - start;
    const statusCode = res.statusCode;
    
    // Log response details
    console.log(
      `[${new Date().toISOString()}] ${method} ${originalUrl} - Status: ${statusCode} - Duration: ${duration}ms`
    );
    
    // Call the original end method
    return originalEnd.apply(this, args);
  };
  
  next();
}

module.exports = requestLogger;