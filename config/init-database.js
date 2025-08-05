const fs = require('fs');
const path = require('path');
const sqlite3 = require('sqlite3').verbose();

// Default locations
const dbDirectory = path.resolve(__dirname, '../database');
const defaultDbPath = path.join(dbDirectory, 'recordsmgmtsys.db');
const backupsDir = path.join(dbDirectory, 'backups');

/**
 * Initialize the SQLite database. Creates the database file and
 * required tables if they do not already exist.
 * @param {string} [dbPath] Optional path to the database file.
 * @returns {sqlite3.Database} Connected database instance.
 */
function initializeDatabase(dbPath = defaultDbPath) {
  const dir = path.dirname(dbPath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  const db = new sqlite3.Database(dbPath);

  db.serialize(() => {
    // entries_tbl
    db.run(`CREATE TABLE IF NOT EXISTS entries_tbl (
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

    // users_tbl
    db.run(`CREATE TABLE IF NOT EXISTS users_tbl (
      user_id INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
      username TEXT NOT NULL,
      password TEXT NOT NULL,
      user_role TEXT NOT NULL,
      user_creation_date TEXT
    );`);
  });

  return db;
}

/**
 * Create a timestamped backup of the database file.
 * The backup files are stored in database/backups directory.
 * @param {string} [dbPath]
 * @returns {string} Path to the created backup file.
 */
function backupDatabase(dbPath = defaultDbPath) {
  if (!fs.existsSync(dbPath)) {
    throw new Error('Database file does not exist.');
  }

  if (!fs.existsSync(backupsDir)) {
    fs.mkdirSync(backupsDir, { recursive: true });
  }

  const timestamp = new Date().toISOString().replace(/[-:T]/g, '').slice(0, 14);
  const backupPath = path.join(backupsDir, `recordsmgmtsys-${timestamp}.db`);
  fs.copyFileSync(dbPath, backupPath);
  return backupPath;
}

/**
 * Restore the database from a backup file. The backup can be specified
 * either as an absolute path or as a file name inside the backups directory.
 * @param {string} backupFile Path or file name of the backup to restore.
 * @param {string} [dbPath]
 */
function restoreDatabase(backupFile, dbPath = defaultDbPath) {
  if (!backupFile) {
    throw new Error('Backup file must be specified.');
  }

  const source = path.isAbsolute(backupFile)
    ? backupFile
    : path.join(backupsDir, backupFile);

  if (!fs.existsSync(source)) {
    throw new Error('Backup file does not exist.');
  }

  fs.copyFileSync(source, dbPath);
}

module.exports = {
  initializeDatabase,
  backupDatabase,
  restoreDatabase,
  defaultDbPath,
};
