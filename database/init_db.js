const fs = require('fs');
const path = require('path');
const sqlite3 = require('sqlite3').verbose();

const dbPath = path.resolve(__dirname, 'recordsmgmtsys.db');
const schemaPath = path.resolve(__dirname, 'schema.sql');
const seedPath = path.resolve(__dirname, 'seed.sql');

const schema = fs.readFileSync(schemaPath, 'utf8');
const seed = fs.readFileSync(seedPath, 'utf8');

const db = new sqlite3.Database(dbPath);

db.exec(schema, (err) => {
  if (err) {
    console.error('Failed to create schema:', err);
    return db.close();
  }
  console.log('Database schema created.');
  db.exec(seed, (seedErr) => {
    if (seedErr) {
      console.error('Failed to seed database:', seedErr);
    } else {
      console.log('Database seeded successfully.');
    }
    db.close();
  });
});
