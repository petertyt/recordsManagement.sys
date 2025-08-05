const fs = require('fs');
const path = require('path');
const sqlite3 = require('sqlite3').verbose();

const dbPath = path.join(__dirname, '..', 'database', 'recordsmgmtsys.db');
const initSqlPath = path.join(__dirname, '..', 'database', 'init.sql');

function initializeDatabase() {
  if (fs.existsSync(dbPath)) {
    console.log('Database already exists at', dbPath);
    return;
  }

  if (!fs.existsSync(initSqlPath)) {
    console.error('Initialization SQL script not found:', initSqlPath);
    process.exit(1);
  }

  const schema = fs.readFileSync(initSqlPath, 'utf8');
  const db = new sqlite3.Database(dbPath);
  db.exec(schema, (err) => {
    if (err) {
      console.error('Failed to initialize database:', err);
    } else {
      console.log('Database created and initialized at', dbPath);
    }
    db.close();
  });
}

if (require.main === module) {
  initializeDatabase();
}

module.exports = initializeDatabase;
