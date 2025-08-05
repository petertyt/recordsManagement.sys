const sqlite3 = require('sqlite3').verbose();
const fs = require('fs');
const path = require('path');

// Ensure the database directory exists
const dbDir = path.resolve(__dirname, '../database');
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

const dbPath = path.join(dbDir, 'recordsmgmtsys.db');
const db = new sqlite3.Database(dbPath);

// Create required tables
// users_tbl stores application users
// entries_tbl stores both letter and file entries

db.serialize(() => {
  db.run(`
    CREATE TABLE IF NOT EXISTS users_tbl (
      user_id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT NOT NULL UNIQUE,
      password TEXT NOT NULL,
      user_role TEXT NOT NULL
    );
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS entries_tbl (
      entry_id INTEGER PRIMARY KEY AUTOINCREMENT,
      entry_date TEXT NOT NULL,
      entry_category TEXT NOT NULL,
      file_number TEXT NOT NULL,
      subject TEXT NOT NULL,
      officer_assigned TEXT NOT NULL,
      recieved_date TEXT,
      date_sent TEXT,
      file_type TEXT,
      reciepient TEXT,
      description TEXT,
      status TEXT NOT NULL,
      letter_date TEXT,
      letter_type TEXT,
      folio_number TEXT
    );
  `);
});

db.close((err) => {
  if (err) {
    console.error('Error closing database:', err.message);
  } else {
    console.log('Database initialized at', dbPath);
  }
});
