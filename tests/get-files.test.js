const request = require('supertest');
const createServer = require('../server');

let app;

beforeAll(() => {
  app = createServer();
});

afterAll(() => {
  const db = app.locals.db;
  if (db && db.close) {
    db.close();
  }
});

describe('GET /api/get-files', () => {
  it('responds with a list of files', async () => {
    const res = await request(app).get('/api/get-files');
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('data');
    expect(Array.isArray(res.body.data)).toBe(true);
  });
});
