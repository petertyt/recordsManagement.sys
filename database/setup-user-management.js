const sqlite3 = require("sqlite3").verbose();
const path = require("path");

const dbPath = path.resolve(__dirname, "../recordsmgmtsys.db");

console.log("Setting up user management tables and columns...");

const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error("Error opening database:", err.message);
    process.exit(1);
  }
  console.log("Connected to database");
});

// Function to safely add columns
function addColumnIfNotExists(tableName, columnName, columnDef) {
  return new Promise((resolve, reject) => {
    db.run(
      `ALTER TABLE ${tableName} ADD COLUMN ${columnName} ${columnDef}`,
      (err) => {
        if (err && err.message.includes("duplicate column name")) {
          console.log(`Column ${columnName} already exists in ${tableName}`);
          resolve();
        } else if (err) {
          console.error(`Error adding column ${columnName}:`, err.message);
          reject(err);
        } else {
          console.log(`Added column ${columnName} to ${tableName}`);
          resolve();
        }
      }
    );
  });
}

// Function to create table if not exists
function createTableIfNotExists(tableName, createSQL) {
  return new Promise((resolve, reject) => {
    db.run(createSQL, (err) => {
      if (err) {
        console.error(`Error creating table ${tableName}:`, err.message);
        reject(err);
      } else {
        console.log(`Table ${tableName} ready`);
        resolve();
      }
    });
  });
}

async function setupUserManagement() {
  try {
    // Add missing columns to users_tbl
    await addColumnIfNotExists("users_tbl", "locked_until", "TEXT");
    await addColumnIfNotExists("users_tbl", "password_changed_date", "TEXT");
    await addColumnIfNotExists("users_tbl", "created_by", "INTEGER");
    await addColumnIfNotExists("users_tbl", "updated_at", "TEXT");

    // Create user_sessions table
    await createTableIfNotExists(
      "user_sessions",
      `
      CREATE TABLE user_sessions (
        session_id TEXT PRIMARY KEY,
        user_id INTEGER NOT NULL,
        session_token TEXT NOT NULL,
        ip_address TEXT,
        user_agent TEXT,
        created_at TEXT DEFAULT (datetime('now')),
        expires_at TEXT NOT NULL,
        is_active INTEGER DEFAULT 1,
        FOREIGN KEY (user_id) REFERENCES users_tbl(user_id) ON DELETE CASCADE
      )
    `
    );

    // Create user_activity_log table
    await createTableIfNotExists(
      "user_activity_log",
      `
      CREATE TABLE user_activity_log (
        log_id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER,
        activity_type TEXT NOT NULL,
        activity_description TEXT,
        ip_address TEXT,
        user_agent TEXT,
        created_at TEXT DEFAULT (datetime('now')),
        FOREIGN KEY (user_id) REFERENCES users_tbl(user_id) ON DELETE SET NULL
      )
    `
    );

    // Create user_permissions table
    await createTableIfNotExists(
      "user_permissions",
      `
      CREATE TABLE user_permissions (
        permission_id INTEGER PRIMARY KEY AUTOINCREMENT,
        role_name TEXT NOT NULL,
        resource_name TEXT NOT NULL,
        action_name TEXT NOT NULL,
        is_allowed INTEGER DEFAULT 1,
        created_at TEXT DEFAULT (datetime('now')),
        UNIQUE(role_name, resource_name, action_name)
      )
    `
    );

    // Create indexes
    const indexes = [
      "CREATE INDEX IF NOT EXISTS idx_user_sessions_user_id ON user_sessions(user_id)",
      "CREATE INDEX IF NOT EXISTS idx_user_sessions_token ON user_sessions(session_token)",
      "CREATE INDEX IF NOT EXISTS idx_user_activity_user_id ON user_activity_log(user_id)",
      "CREATE INDEX IF NOT EXISTS idx_user_activity_type ON user_activity_log(activity_type)",
      "CREATE INDEX IF NOT EXISTS idx_user_permissions_role ON user_permissions(role_name)",
      "CREATE INDEX IF NOT EXISTS idx_users_email ON users_tbl(email)",
      "CREATE INDEX IF NOT EXISTS idx_users_is_active ON users_tbl(is_active)",
      "CREATE INDEX IF NOT EXISTS idx_users_department ON users_tbl(department)",
    ];

    for (const indexSQL of indexes) {
      await new Promise((resolve, reject) => {
        db.run(indexSQL, (err) => {
          if (err) {
            console.error("Error creating index:", err.message);
            reject(err);
          } else {
            resolve();
          }
        });
      });
    }

    // Insert default permissions
    const permissions = [
      // Administrator permissions
      ["Administrator", "users", "create"],
      ["Administrator", "users", "read"],
      ["Administrator", "users", "update"],
      ["Administrator", "users", "delete"],
      ["Administrator", "entries", "create"],
      ["Administrator", "entries", "read"],
      ["Administrator", "entries", "update"],
      ["Administrator", "entries", "delete"],
      ["Administrator", "reports", "create"],
      ["Administrator", "reports", "read"],
      ["Administrator", "reports", "export"],
      ["Administrator", "system", "admin"],
      // User permissions
      ["User", "entries", "create"],
      ["User", "entries", "read"],
      ["User", "entries", "update"],
      ["User", "reports", "read"],
    ];

    for (const [role, resource, action] of permissions) {
      await new Promise((resolve, reject) => {
        db.run(
          "INSERT OR IGNORE INTO user_permissions (role_name, resource_name, action_name) VALUES (?, ?, ?)",
          [role, resource, action],
          (err) => {
            if (err) {
              console.error("Error inserting permission:", err.message);
              reject(err);
            } else {
              resolve();
            }
          }
        );
      });
    }

    // Update existing users with default values
    await new Promise((resolve, reject) => {
      db.run(
        `
        UPDATE users_tbl SET 
          email = username || '@lvd.gov.ng',
          full_name = username,
          department = 'General',
          is_active = 1,
          password_changed_date = user_creation_date
        WHERE email IS NULL
      `,
        (err) => {
          if (err) {
            console.error("Error updating users:", err.message);
            reject(err);
          } else {
            console.log("Updated existing users with default values");
            resolve();
          }
        }
      );
    });

    console.log("User management setup completed successfully!");
  } catch (error) {
    console.error("Error setting up user management:", error);
  } finally {
    db.close((err) => {
      if (err) {
        console.error("Error closing database:", err.message);
      } else {
        console.log("Database connection closed");
      }
    });
  }
}

setupUserManagement();
