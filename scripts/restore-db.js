const fs = require('fs');
const path = require('path');

const dbPath = path.join(__dirname, '..', 'database', 'recordsmgmtsys.db');
const backupDir = path.join(__dirname, '..', 'backups');

function restoreDatabase(backupFile) {
  const candidate = path.isAbsolute(backupFile) ? backupFile : path.join(backupDir, backupFile);
  if (!fs.existsSync(candidate)) {
    console.error('Backup file not found:', candidate);
    process.exit(1);
  }
  fs.copyFileSync(candidate, dbPath);
  console.log('Database restored from', candidate);
}

if (require.main === module) {
  const backupFile = process.argv[2];
  if (!backupFile) {
    console.error('Usage: node scripts/restore-db.js <backup-file>');
    process.exit(1);
  }
  restoreDatabase(backupFile);
}

module.exports = restoreDatabase;
