const sqlite3 = require("sqlite3").verbose();
const path = require("path");

const dbPath = path.resolve(__dirname, "../recordsmgmtsys.db");

console.log("Checking user management tables...");

const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error("Error opening database:", err.message);
    process.exit(1);
  }
  console.log("Connected to database");
});

// Check if user_sessions table exists
db.get(
  "SELECT name FROM sqlite_master WHERE type='table' AND name='user_sessions'",
  (err, row) => {
    if (err) {
      console.error("Error checking user_sessions table:", err.message);
    } else if (row) {
      console.log("✓ user_sessions table exists");
    } else {
      console.log("✗ user_sessions table does not exist");
    }
  }
);

// Check if user_activity_log table exists
db.get(
  "SELECT name FROM sqlite_master WHERE type='table' AND name='user_activity_log'",
  (err, row) => {
    if (err) {
      console.error("Error checking user_activity_log table:", err.message);
    } else if (row) {
      console.log("✓ user_activity_log table exists");
    } else {
      console.log("✗ user_activity_log table does not exist");
    }
  }
);

// Check if user_permissions table exists
db.get(
  "SELECT name FROM sqlite_master WHERE type='table' AND name='user_permissions'",
  (err, row) => {
    if (err) {
      console.error("Error checking user_permissions table:", err.message);
    } else if (row) {
      console.log("✓ user_permissions table exists");
    } else {
      console.log("✗ user_permissions table does not exist");
    }
  }
);

// Check permissions data
db.all(
  "SELECT role_name, resource_name, action_name FROM user_permissions ORDER BY role_name, resource_name",
  (err, rows) => {
    if (err) {
      console.error("Error checking permissions:", err.message);
    } else {
      console.log("\nUser Permissions:");
      rows.forEach((row) => {
        console.log(
          `  ${row.role_name} - ${row.resource_name}:${row.action_name}`
        );
      });
    }

    db.close((err) => {
      if (err) {
        console.error("Error closing database:", err.message);
      } else {
        console.log("\nDatabase connection closed");
      }
    });
  }
);
