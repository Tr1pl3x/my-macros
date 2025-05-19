import express from 'express';
import cors from 'cors';
import * as dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import estimateHandler from './api/estimate.js';

// Load environment variables from .env file
dotenv.config();

// Get current directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Create Express app
const app = express();
const PORT = process.env.PORT || 3000;

// Enable CORS
app.use(cors());

// Serve static files from test directory if it exists
app.use(express.static(join(__dirname, 'test')));

// Log all requests
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
  next();
});

// Create a compatible request/response adapter for the Vercel function
const createCompatibleHandler = (handler) => async (req, res) => {
  // Create a compatible request object for our handler
  const compatReq = {
    ...req,
    method: req.method,
    body: req.body,
    headers: req.headers,
  };
  
  // Create a compatible response object with the same API as Vercel
  const compatRes = {
    status: (code) => {
      res.status(code);
      return compatRes;
    },
    json: (data) => {
      res.json(data);
      return compatRes;
    },
    setHeader: (name, value) => {
      res.setHeader(name, value);
      return compatRes;
    },
    end: () => {
      res.end();
      return compatRes;
    }
  };
  
  // Call our handler
  await handler(compatReq, compatRes);
};

// Simple test endpoint
app.get('/api/test', (req, res) => {
  res.json({
    message: 'API is working!',
    env: {
      nodeEnv: process.env.NODE_ENV,
      mockApi: process.env.MOCK_API,
      hasAnthropicKey: Boolean(process.env.ANTHROPIC_API_KEY),
      hasPassword: Boolean(process.env.APP_PASSWORD)
    }
  });
});

// Environment variables test endpoint
app.get('/api/test-env', (req, res) => {
  res.json({
    mockApi: process.env.MOCK_API,
    debug: process.env.DEBUG,
    hasPassword: Boolean(process.env.APP_PASSWORD),
    hasAnthropicKey: Boolean(process.env.ANTHROPIC_API_KEY)
  });
});

// Test endpoint with pizza ingredients
app.get('/api/test-pizza', (req, res) => {
  res.json({
    calories: 1800,
    protein: "45g",
    carbs: "220g",
    fat: "70g",
    ingredients: ["pizza dough", "tomato sauce", "cheese", "pepperoni"]
  });
});

// Mount the estimate handler
app.post('/api/estimate', express.raw({ type: '*/*', limit: '10mb' }), async (req, res) => {
  try {
    // Create a compatible request object with a working 'on' method
    const buffer = req.body;
    const compatReq = {
      ...req,
      method: req.method,
      headers: req.headers,
      on: (event, handler) => {
        if (event === 'data' && buffer) {
          handler(buffer);
        }
        if (event === 'end') {
          handler();
        }
        return compatReq;
      }
    };
    
    // Create a compatible response object
    const compatRes = {
      status: (code) => {
        res.status(code);
        return compatRes;
      },
      json: (data) => {
        res.json(data);
        return compatRes;
      },
      setHeader: (name, value) => {
        res.setHeader(name, value);
        return compatRes;
      },
      end: () => {
        res.end();
        return compatRes;
      }
    };
    
    // Call our handler
    await estimateHandler(compatReq, compatRes);
  } catch (error) {
    console.error('Error in /api/estimate endpoint:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`
🚀 Express server running at http://localhost:${PORT}
📋 API endpoints:
   - http://localhost:${PORT}/api/estimate
   - http://localhost:${PORT}/api/test
   - http://localhost:${PORT}/api/test-env
   - http://localhost:${PORT}/api/test-pizza

⚙️ Current mode: ${process.env.MOCK_API === 'true' ? 'MOCK API (not calling Claude)' : 'REAL API (calling Claude)'}
  `);
});