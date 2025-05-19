import fetch from 'node-fetch';
import { FormData } from 'formdata-node';
import { fileFromPath } from 'formdata-node/file-from-path';
import * as dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

// Load environment variables
dotenv.config();

// Get current directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

async function testLocalApi() {
  try {
    console.log('🚀 Starting local API test...');
    
    // Create form data
    const form = new FormData();
    
    // Add test image file
    // Replace 'test-image.jpg' with your test image path
    const testImagePath = resolve(__dirname, 'test-image.jpg');
    const file = await fileFromPath(testImagePath);
    form.append('image', file);
    
    // Add password and mode
    form.append('password', process.env.APP_PASSWORD || '2911');
    form.append('mode', 'detailed'); // Test detailed mode
    
    console.log('📤 Sending request to local API...');
    
    // Send request to local API
    const response = await fetch('http://localhost:3000/api/estimate', {
      method: 'POST',
      body: form,
    });
    
    // Parse response
    const data = await response.json();
    
    // Log results
    console.log('📥 Response status:', response.status);
    console.log('📋 Response data:', JSON.stringify(data, null, 2));
    
    if (response.ok) {
      console.log('✅ Test successful!');
    } else {
      console.log('❌ Test failed!');
    }
  } catch (error) {
    console.error('❌ Error during test:', error);
  }
}

// Run the test
testLocalApi();