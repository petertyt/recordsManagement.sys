#!/usr/bin/env node

const path = require('path');
const { backupDatabase, restoreDatabase, defaultDbPath } = require('../config/init-database');

const [,, command, arg] = process.argv;

function printUsage() {
  console.log('Usage: node scripts/db-backup.js <backup|restore> [backup-file]');
}

try {
  if (command === 'backup') {
    const file = backupDatabase(defaultDbPath);
    console.log(`Backup created at ${file}`);
  } else if (command === 'restore') {
    if (!arg) {
      console.error('Please specify the backup file to restore.');
      printUsage();
      process.exit(1);
    }
    const backupPath = path.resolve(arg);
    restoreDatabase(backupPath, defaultDbPath);
    console.log(`Database restored from ${backupPath}`);
  } else {
    printUsage();
    process.exit(1);
  }
} catch (err) {
  console.error('Error:', err.message);
  process.exit(1);
}
