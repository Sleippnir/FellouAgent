const request = require('supertest');
const app = require('../index');

describe('GET /', () => {
  it('should respond with a message that the server is running', async () => {
    const response = await request(app).get('/');
    expect(response.statusCode).toBe(200);
    expect(response.text).toBe('Voice Interview Backend is running!');
  });
});
