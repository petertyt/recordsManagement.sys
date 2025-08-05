const path = require('path');
const fs = require('fs');
const sqlite3 = require('sqlite3').verbose();
const request = require('supertest');
const { expect } = require('chai');
const { createApp } = require('../server');

function binaryParser(res, callback) {
  res.setEncoding('binary');
  res.data = '';
  res.on('data', chunk => { res.data += chunk; });
  res.on('end', () => {
    callback(null, Buffer.from(res.data, 'binary'));
  });
}

describe('GET /api/reports/export', () => {
  let app;
  let db;
  let dbPath;

  before(done => {
    dbPath = path.join(__dirname, 'test.db');
    if (fs.existsSync(dbPath)) fs.unlinkSync(dbPath);
    db = new sqlite3.Database(dbPath);
    db.serialize(() => {
      db.run(`CREATE TABLE entries_tbl (
        entry_id INTEGER PRIMARY KEY AUTOINCREMENT,
        entry_date TEXT,
        entry_category TEXT,
        file_number TEXT,
        subject TEXT,
        officer_assigned TEXT,
        status TEXT
      )`);
      const stmt = db.prepare(`INSERT INTO entries_tbl (entry_date, entry_category, file_number, subject, officer_assigned, status) VALUES (?,?,?,?,?,?)`);
      stmt.run('2024-01-01', 'File', 'FN1', 'Subject1', 'Officer1', 'Open');
      stmt.run('2024-01-02', 'Letter', 'FN2', 'Subject2', 'Officer2', 'Closed');
      stmt.finalize(() => {
        ({ app } = createApp(dbPath));
        done();
      });
    });
  });

  after(done => {
    db.close(() => {
      fs.unlinkSync(dbPath);
      done();
    });
  });

  it('exports CSV', done => {
    request(app)
      .get('/api/reports/export?format=csv')
      .expect('Content-Type', /text\/csv/)
      .expect(200)
      .then(res => {
        expect(res.text).to.include('entry_id');
        expect(res.text).to.include('Officer1');
        done();
      })
      .catch(done);
  });

  it('exports PDF', done => {
    request(app)
      .get('/api/reports/export?format=pdf')
      .buffer()
      .parse(binaryParser)
      .expect('Content-Type', /application\/pdf/)
      .expect(200)
      .then(res => {
        expect(res.body.length).to.be.greaterThan(0);
        done();
      })
      .catch(done);
  });
});

