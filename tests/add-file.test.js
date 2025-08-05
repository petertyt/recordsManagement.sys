const request = require('supertest');
const startServer = require('../server');

describe('POST /api/add-file', () => {
  let app;
  let db;

  beforeAll((done) => {
    ({ app, db } = startServer({ dbPath: ':memory:', listen: false }));
    db.serialize(() => {
      db.run(
        `CREATE TABLE entries_tbl (
          entry_id INTEGER PRIMARY KEY AUTOINCREMENT,
          entry_date TEXT,
          entry_category TEXT,
          file_number TEXT,
          subject TEXT,
          officer_assigned TEXT,
          recieved_date TEXT,
          date_sent TEXT,
          file_type TEXT,
          reciepient TEXT,
          description TEXT,
          status TEXT
        )`,
        done
      );
    });
  });

  afterAll((done) => {
    db.close(done);
  });

  it('adds a file entry', async () => {
    const res = await request(app)
      .post('/api/add-file')
      .send({
        entry_date: '2024-01-01',
        file_number: 'FN001',
        subject: 'Test Subject',
        officer_assigned: 'Officer',
        status: 'Open',
        date_sent: '2024-01-02',
        file_type: 'General'
      });

    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty('entry_id');
    expect(res.body).toHaveProperty('message', 'File added successfully');
  });
});

