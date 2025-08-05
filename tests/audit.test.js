const test = require('node:test');
const assert = require('node:assert');
const path = require('node:path');
const fs = require('node:fs');
const sqlite3 = require('sqlite3').verbose();
const startServer = require('../server');

let serverInfo;
let db;
let baseUrl;
let dbPath;

function run(db, sql, params = []) {
  return new Promise((resolve, reject) => {
    db.run(sql, params, function (err) {
      if (err) reject(err); else resolve(this);
    });
  });
}

function all(db, sql, params = []) {
  return new Promise((resolve, reject) => {
    db.all(sql, params, (err, rows) => {
      if (err) reject(err); else resolve(rows);
    });
  });
}

test.before(async () => {
  dbPath = path.join(__dirname, 'test.db');
  try { fs.unlinkSync(dbPath); } catch {}
  process.env.DB_PATH = dbPath;
  process.env.PORT = 0;

  serverInfo = startServer();
  db = serverInfo.db;
  const port = serverInfo.server.address().port;
  baseUrl = `http://localhost:${port}`;

  await run(db, `CREATE TABLE entries_tbl (
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
});

test.after(async () => {
  await new Promise(resolve => serverInfo.server.close(resolve));
  db.close();
  fs.unlinkSync(dbPath);
});


test.beforeEach(async () => {
  await run(db, 'DELETE FROM entries_tbl');
  await run(db, 'DELETE FROM history_tbl');
});

test('create file logs history', async () => {
  const res = await fetch(`${baseUrl}/api/add-file`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      entry_date: '2024-01-01',
      file_number: 'FN1',
      subject: 'Sub',
      officer_assigned: 'Officer',
      status: 'open',
      recieved_date: '2024-01-01',
      date_sent: '2024-01-02',
      file_type: 'Type',
      user_id: 1
    })
  });
  assert.strictEqual(res.status, 201);
  const body = await res.json();
  const rows = await all(db, 'SELECT * FROM history_tbl');
  assert.strictEqual(rows.length, 1);
  assert.strictEqual(rows[0].entry_id, body.entry_id);
  assert.strictEqual(rows[0].user_id, 1);
  assert.strictEqual(rows[0].action, 'CREATE');
});

test('update entry logs history', async () => {
  const createRes = await fetch(`${baseUrl}/api/add-file`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      entry_date: '2024-01-01',
      file_number: 'FN2',
      subject: 'Sub',
      officer_assigned: 'Officer',
      status: 'open',
      recieved_date: '2024-01-01',
      date_sent: '2024-01-02',
      file_type: 'Type',
      user_id: 1
    })
  });
  const created = await createRes.json();

  const updateRes = await fetch(`${baseUrl}/api/update-entry`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ entry_id: created.entry_id, file_number: 'FN2A', status: 'closed', user_id: 2 })
  });
  assert.strictEqual(updateRes.status, 200);

  const rows = await all(db, 'SELECT * FROM history_tbl ORDER BY id');
  assert.strictEqual(rows.length, 2);
  assert.strictEqual(rows[1].entry_id, created.entry_id);
  assert.strictEqual(rows[1].user_id, 2);
  assert.strictEqual(rows[1].action, 'UPDATE');
});

test('delete entry logs history', async () => {
  const createRes = await fetch(`${baseUrl}/api/add-file`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      entry_date: '2024-01-01',
      file_number: 'FN3',
      subject: 'Sub',
      officer_assigned: 'Officer',
      status: 'open',
      recieved_date: '2024-01-01',
      date_sent: '2024-01-02',
      file_type: 'Type',
      user_id: 1
    })
  });
  const created = await createRes.json();

  const deleteRes = await fetch(`${baseUrl}/api/delete-entry/${created.entry_id}`, {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ user_id: 3 })
  });
  assert.strictEqual(deleteRes.status, 200);

  const rows = await all(db, 'SELECT * FROM history_tbl ORDER BY id');
  assert.strictEqual(rows.length, 2);
  assert.strictEqual(rows[1].entry_id, created.entry_id);
  assert.strictEqual(rows[1].user_id, 3);
  assert.strictEqual(rows[1].action, 'DELETE');
});

