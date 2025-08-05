const { spawn } = require('node:child_process');
const sqlite3 = require('sqlite3').verbose();
const path = require('node:path');

async function run() {
  const PORT = 3001;
  const server = spawn('node', ['server.js'], {
    cwd: path.resolve(__dirname, '..'),
    env: { ...process.env, PORT: PORT },
    stdio: 'inherit'
  });

  // wait for server to start
  await new Promise((r) => setTimeout(r, 1000));

  const dbPath = path.resolve(__dirname, '../database/recordsmgmtsys.db');
  const db = new sqlite3.Database(dbPath);

  const entryId = await new Promise((resolve, reject) => {
    db.run(
      `INSERT INTO entries_tbl (entry_date, entry_category, file_number, subject, officer_assigned, recieved_date, date_sent, file_type, reciepient, description, status) VALUES (?, 'File', ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      ['2024-01-01', 'TEST123', 'Initial Subject', 'Officer A', null, '2024-01-02', 'TypeA', null, null, 'Pending'],
      function (err) {
        if (err) reject(err);
        else resolve(this.lastID);
      }
    );
  });

  const updateBody = {
    entry_id: entryId,
    entry_date: '2024-01-01',
    file_number: 'TEST123',
    subject: 'Updated Subject',
    officer_assigned: 'Officer A',
    status: 'Complete',
    recieved_date: '2024-01-03',
    date_sent: '2024-01-04',
    reciepient: 'Recipient B',
    file_type: 'TypeB',
    folio_number: 'FOL456',
    description: 'Updated description'
  };

  const response = await fetch(`http://localhost:${PORT}/api/update-file`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(updateBody)
  });
  const result = await response.json();
  console.log('Update response:', result);

  const row = await new Promise((resolve, reject) => {
    db.get(
      `SELECT recieved_date, date_sent, reciepient, file_type, folio_number, description, status FROM entries_tbl WHERE entry_id = ?`,
      [entryId],
      (err, row) => {
        if (err) reject(err);
        else resolve(row);
      }
    );
  });

  console.log('Updated row:', row);

  await new Promise((resolve, reject) => {
    db.run(`DELETE FROM entries_tbl WHERE entry_id = ?`, [entryId], (err) =>
      err ? reject(err) : resolve()
    );
  });

  db.close();
  server.kill();
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
