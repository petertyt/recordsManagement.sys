const request = require('supertest');
const createServer = require('../server');

let app;

beforeAll(() => {
  app = createServer();
});

describe('CRUD API', () => {
  it('GET /api/recent-entries responds with JSON', async () => {
    const res = await request(app).get('/api/recent-entries');
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('data');
  });

  it('POST /api/add-file with missing fields returns 400', async () => {
    const res = await request(app).post('/api/add-file').send({});
    expect(res.status).toBe(400);
  });

  it('POST /api/update-entry with missing fields returns 400', async () => {
    const res = await request(app).post('/api/update-entry').send({});
    expect(res.status).toBe(400);
  });

  it('DELETE /api/delete-entry/:id returns 200', async () => {
    const res = await request(app).delete('/api/delete-entry/999999');
    expect(res.status).toBe(200);
  });
});
