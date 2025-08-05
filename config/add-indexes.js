const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// Path to SQLite database
const dbPath = path.resolve(__dirname, '../database/recordsmgmtsys.db');
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Failed to connect to database:', err.message);
    process.exit(1);
  }
});

// Create indexes to optimize frequent queries
const statements = [
  `CREATE INDEX IF NOT EXISTS idx_entries_entry_date ON entries_tbl(entry_date);`,
  `CREATE INDEX IF NOT EXISTS idx_entries_file_number ON entries_tbl(file_number);`,
  `CREATE INDEX IF NOT EXISTS idx_entries_entry_category ON entries_tbl(entry_category);`
];

db.serialize(() => {
  statements.forEach((sql) => {
    db.run(sql, (err) => {
      if (err) {
        console.error('Error executing statement:', sql, err.message);
      } else {
        console.log('Executed:', sql);
      }
    });
  });
});

db.close((err) => {
  if (err) {
    console.error('Error closing database:', err.message);
  } else {
    console.log('Indexes migration completed.');
  }
});
