const fs = require('fs');
const path = require('path');
const cron = require('node-cron');

const dbPath = path.join(__dirname, '..', 'database', 'recordsmgmtsys.db');
const backupDir = path.join(__dirname, '..', 'backups');
const MAX_BACKUPS = 5;

function ensureBackupDir() {
  if (!fs.existsSync(backupDir)) {
    fs.mkdirSync(backupDir, { recursive: true });
  }
}

function getTimestamp() {
  const now = new Date();
  const pad = (n) => n.toString().padStart(2, '0');
  const date = `${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}`;
  const time = `${pad(now.getHours())}${pad(now.getMinutes())}`;
  return `${date}-${time}`;
}

function rotateBackups() {
  const files = fs.readdirSync(backupDir)
    .filter(f => f.startsWith('recordsmgmtsys-') && f.endsWith('.db'))
    .map(f => ({ name: f, time: fs.statSync(path.join(backupDir, f)).mtime }))
    .sort((a, b) => b.time - a.time);
  files.slice(MAX_BACKUPS).forEach(f => fs.unlinkSync(path.join(backupDir, f.name)));
}

function backupDatabase() {
  ensureBackupDir();
  const ts = getTimestamp();
  const dest = path.join(backupDir, `recordsmgmtsys-${ts}.db`);
  fs.copyFileSync(dbPath, dest);
  console.log('Backup created:', dest);
  rotateBackups();
}

if (require.main === module) {
  if (process.argv.includes('--schedule')) {
    const schedule = process.env.DB_BACKUP_SCHEDULE || '0 0 * * *';
    cron.schedule(schedule, backupDatabase);
    console.log('Scheduled backups with cron pattern:', schedule);
  } else {
    backupDatabase();
  }
}

module.exports = backupDatabase;
