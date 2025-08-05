const sqlite3 = require("sqlite3").verbose();
const path = require("path");

const dbPath = path.resolve(__dirname, "../recordsmgmtsys.db");

console.log("Cleaning up failed migration 002...");

const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error("Error opening database:", err.message);
    process.exit(1);
  }
  console.log("Connected to database for cleanup");
});

// Remove the failed migration from the log
db.run(
  "DELETE FROM migration_log WHERE migration_name = '002_enhance_user_management'",
  (err) => {
    if (err) {
      console.error("Error cleaning up migration log:", err.message);
    } else {
      console.log("Successfully removed failed migration 002 from log");
    }

    db.close((err) => {
      if (err) {
        console.error("Error closing database:", err.message);
      } else {
        console.log("Database connection closed");
      }
    });
  }
);
