// tests/verify.test.js
const request = require('supertest');
const app = require('../app');

describe('Password Verification API', () => {
  // Save original environment variable
  const originalPassword = process.env.APP_PASSWORD;
  
  beforeAll(() => {
    // Set known password for testing
    process.env.APP_PASSWORD = '2911';
  });
  
  afterAll(() => {
    // Restore original password
    process.env.APP_PASSWORD = originalPassword;
  });
  
  it('should return 200 with correct password', async () => {
    const response = await request(app)
      .post('/api/verify')
      .send({ password: '2911' })
      .expect('Content-Type', /json/)
      .expect(200);
    
    expect(response.body).toHaveProperty('status', 200);
    expect(response.body).toHaveProperty('message', 'Authentication successful');
  });
  
  it('should return 401 with incorrect password', async () => {
    const response = await request(app)
      .post('/api/verify')
      .send({ password: '1234' })
      .expect('Content-Type', /json/)
      .expect(401);
    
    expect(response.body).toHaveProperty('status', 401);
    expect(response.body).toHaveProperty('error', 'Invalid password');
  });
  
  it('should return 400 with missing password', async () => {
    const response = await request(app)
      .post('/api/verify')
      .send({})
      .expect('Content-Type', /json/)
      .expect(400);
    
    expect(response.body).toHaveProperty('status', 400);
    expect(response.body).toHaveProperty('error', 'Password is required');
  });
});