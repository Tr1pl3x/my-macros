// api/index.js
const app = require('../app');

// Fixing any potential issues with express-rate-limit in serverless
if (!app.get('trust proxy')) {
  app.set('trust proxy', 1);
}

module.exports = app;