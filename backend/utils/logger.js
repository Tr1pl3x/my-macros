// Simple utility for consistent logging
const logger = {
  info: (message, data = null) => {
    console.log(`[INFO] ${message}`, data ? data : '');
  },
  error: (message, error = null) => {
    console.error(`[ERROR] ${message}`, error ? error : '');
    
    // Log additional stack trace for errors
    if (error && error.stack) {
      console.error(`[STACK] ${error.stack}`);
    }
  },
  debug: (message, data = null) => {
    if (process.env.DEBUG) {
      console.log(`[DEBUG] ${message}`, data ? JSON.stringify(data, null, 2) : '');
    }
  }
};

export default logger;