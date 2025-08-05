const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const createServerApp = require('./src/server/app');

const dbPath = path.resolve(__dirname, './database/recordsmgmtsys.db');
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Error connecting to the database:', err.message);
  } else {
    console.log('Connected to the SQLite database.');
  }
});

const app = createServerApp(db);
const PORT = process.env.PORT || 49200;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
