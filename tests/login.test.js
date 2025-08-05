const request = require('supertest');
const createServer = require('../server');

let app;

beforeAll(() => {
  app = createServer();
});

describe('POST /api/login', () => {
  it('returns 400 when fields are missing', async () => {
    const res = await request(app).post('/api/login').send({});
    expect(res.status).toBe(400);
  });

  it('returns 401 with invalid credentials', async () => {
    const res = await request(app)
      .post('/api/login')
      .send({ username: 'invalid', password: 'credentials' });
    expect(res.status).toBe(401);
  });
});
