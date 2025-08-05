const sqlite3 = require("sqlite3").verbose();
const path = require("path");

const dbPath = path.resolve(__dirname, "recordsmgmtsys.db");

console.log("Running database migration...");

const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error("Error opening database:", err.message);
    process.exit(1);
  }
  console.log("Connected to database for migration");
});

// Create user_activity_log table if it doesn't exist
db.run(
  `
  CREATE TABLE IF NOT EXISTS user_activity_log (
    log_id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    activity_type TEXT NOT NULL,
    activity_description TEXT,
    ip_address TEXT,
    user_agent TEXT,
    timestamp TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (user_id) REFERENCES users_tbl(user_id)
  )
`,
  (err) => {
    if (err) {
      console.error("Error creating user_activity_log:", err.message);
    } else {
      console.log("✓ user_activity_log table created/verified");
    }
  }
);

// Create indexes for user_activity_log
db.run(
  "CREATE INDEX IF NOT EXISTS idx_activity_user_id ON user_activity_log(user_id)",
  (err) => {
    if (err) {
      console.error("Error creating activity user_id index:", err.message);
    } else {
      console.log("✓ user_activity_log indexes created/verified");
    }
  }
);

db.run(
  "CREATE INDEX IF NOT EXISTS idx_activity_timestamp ON user_activity_log(timestamp)",
  (err) => {
    if (err) {
      console.error("Error creating activity timestamp index:", err.message);
    } else {
      console.log("✓ Migration completed successfully");
      db.close();
    }
  }
);
