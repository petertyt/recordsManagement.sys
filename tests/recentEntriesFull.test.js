const request = require('supertest');
const sqlite3 = require('sqlite3').verbose();
const createApp = require('../server');

let app;
let db;

beforeAll((done) => {
  db = new sqlite3.Database(':memory:');
  db.serialize(() => {
    db.run(`CREATE TABLE entries_tbl (
      entry_id INTEGER PRIMARY KEY AUTOINCREMENT,
      entry_date TEXT NOT NULL,
      entry_category TEXT NOT NULL,
      file_number TEXT,
      subject TEXT,
      officer_assigned TEXT,
      date_sent TEXT,
      recieved_date TEXT,
      letter_date TEXT,
      reciepient TEXT,
      letter_type TEXT,
      folio_number TEXT,
      file_type TEXT,
      description TEXT,
      status TEXT
    );`);

    const stmt = db.prepare(`INSERT INTO entries_tbl (entry_date, entry_category, file_number, subject, officer_assigned, status) VALUES (?,?,?,?,?,?)`);
    stmt.run('2024-01-01', 'File', 'F1', 'Alpha report', 'Officer A', 'Open');
    stmt.run('2024-02-15', 'Letter', 'L1', 'Beta letter', 'Officer B', 'Closed');
    stmt.run('2024-03-10', 'File', 'F2', 'Gamma file', 'Officer A', 'Pending');
    stmt.finalize();

    ({ app } = createApp(db));
    done();
  });
});

afterAll((done) => {
  db.close(done);
});

test('filters by keyword, category, status and date range', async () => {
  const res = await request(app)
    .get('/api/recent-entries-full')
    .query({
      keyword: 'Alpha',
      category: 'File',
      status: 'Open',
      start_date: '2024-01-01',
      end_date: '2024-12-31'
    });
  expect(res.status).toBe(200);
  expect(res.body.data).toHaveLength(1);
  expect(res.body.data[0].file_number).toBe('F1');
});

test('paginates filtered results', async () => {
  const res = await request(app)
    .get('/api/recent-entries-full')
    .query({ category: 'File', page: 2, limit: 1 });
  expect(res.status).toBe(200);
  expect(res.body.data).toHaveLength(1);
  expect(res.body.data[0].file_number).toBe('F1');
});

