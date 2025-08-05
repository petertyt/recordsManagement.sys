const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.resolve(__dirname, '../recordsmgmtsys.db');
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Unable to open database:', err.message);
    process.exit(1);
  }
});

function columnExists(columns, name) {
  return columns.some(col => col.name === name);
}

db.serialize(() => {
  db.all("PRAGMA table_info(entries_tbl);", (err, columns) => {
    if (err) {
      console.error('Error fetching table info:', err.message);
      db.close();
      return;
    }

    const migrations = [];

    if (columnExists(columns, 'reciepient') && !columnExists(columns, 'recipient')) {
      migrations.push(["ALTER TABLE entries_tbl RENAME COLUMN reciepient TO recipient;", 'reciepient -> recipient']);
    }

    if (columnExists(columns, 'recieved_date') && !columnExists(columns, 'received_date')) {
      migrations.push(["ALTER TABLE entries_tbl RENAME COLUMN recieved_date TO received_date;", 'recieved_date -> received_date']);
    }

    (function run(i) {
      if (i >= migrations.length) {
        console.log('Migration complete.');
        db.close();
        return;
      }
      const [sql, msg] = migrations[i];
      db.run(sql, (err) => {
        if (err) {
          console.error(`Failed to rename column (${msg}):`, err.message);
        } else {
          console.log(`Renamed column (${msg}).`);
        }
        run(i + 1);
      });
    })(0);
  });
});
