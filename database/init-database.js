const sqlite3 = require("sqlite3").verbose();
const path = require("path");

const dbPath = path.resolve(__dirname, "../recordsmgmtsys.db");

console.log("Initializing database...");

const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error("Error opening database:", err.message);
    process.exit(1);
  }
  console.log("Connected to database");
});

// Create tables
const createTables = () => {
  return new Promise((resolve, reject) => {
    // Create users_tbl
    db.run(
      `
      CREATE TABLE IF NOT EXISTS users_tbl (
        user_id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT NOT NULL UNIQUE,
        password TEXT NOT NULL,
        user_role TEXT NOT NULL,
        user_creation_date TEXT DEFAULT (datetime('now')),
        email TEXT,
        full_name TEXT,
        phone TEXT,
        department TEXT,
        last_login_date TEXT,
        is_active INTEGER DEFAULT 1,
        login_attempts INTEGER DEFAULT 0,
        locked_until TEXT,
        password_changed_date TEXT,
        created_by INTEGER
      )
    `,
      (err) => {
        if (err) {
          console.error("Error creating users_tbl:", err.message);
          reject(err);
        } else {
          console.log("✓ users_tbl created");
        }
      }
    );

    // Create entries_tbl
    db.run(
      `
      CREATE TABLE IF NOT EXISTS entries_tbl (
        entry_id INTEGER PRIMARY KEY AUTOINCREMENT,
        entry_date TEXT NOT NULL,
        entry_category TEXT NOT NULL,
        file_number TEXT,
        subject TEXT,
        officer_assigned TEXT,
        date_sent TEXT,
        received_date TEXT,
        letter_date TEXT,
        recipient TEXT,
        letter_type TEXT,
        folio_number TEXT,
        file_type TEXT,
        description TEXT,
        status TEXT
      )
    `,
      (err) => {
        if (err) {
          console.error("Error creating entries_tbl:", err.message);
          reject(err);
        } else {
          console.log("✓ entries_tbl created");
        }
      }
    );

    // Create user_activity_log table
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
          reject(err);
        } else {
          console.log("✓ user_activity_log created");
        }
      }
    );

    // Create indexes
    const indexes = [
      "CREATE INDEX IF NOT EXISTS idx_users_username ON users_tbl(username)",
      "CREATE INDEX IF NOT EXISTS idx_users_role ON users_tbl(user_role)",
      "CREATE INDEX IF NOT EXISTS idx_users_active ON users_tbl(is_active)",
      "CREATE INDEX IF NOT EXISTS idx_entries_date ON entries_tbl(entry_date)",
      "CREATE INDEX IF NOT EXISTS idx_entries_category ON entries_tbl(entry_category)",
      "CREATE INDEX IF NOT EXISTS idx_entries_status ON entries_tbl(status)",
      "CREATE INDEX IF NOT EXISTS idx_entries_file_number ON entries_tbl(file_number)",
      "CREATE INDEX IF NOT EXISTS idx_activity_user_id ON user_activity_log(user_id)",
      "CREATE INDEX IF NOT EXISTS idx_activity_timestamp ON user_activity_log(timestamp)",
    ];

    let completed = 0;
    indexes.forEach((indexSQL) => {
      db.run(indexSQL, (err) => {
        if (err) {
          console.error("Error creating index:", err.message);
        }
        completed++;
        if (completed === indexes.length) {
          resolve();
        }
      });
    });
  });
};

// Insert default users
const insertDefaultUsers = () => {
  return new Promise((resolve, reject) => {
    const defaultUsers = [
      {
        username: "LVD-ADMIN",
        password: "password",
        user_role: "Administrator",
        email: "admin@lvd.gov.ng",
        full_name: "System Administrator",
        department: "IT",
        is_active: 1,
      },
      {
        username: "LVD-PRUDENCE",
        password: "password",
        user_role: "User",
        email: "prudence@lvd.gov.ng",
        full_name: "Prudence",
        department: "General",
        is_active: 1,
      },
      {
        username: "LVD-PETER",
        password: "password",
        user_role: "User",
        email: "peter@lvd.gov.ng",
        full_name: "Peter",
        department: "General",
        is_active: 1,
      },
      {
        username: "LVD-ESTHER",
        password: "password",
        user_role: "User",
        email: "esther@lvd.gov.ng",
        full_name: "Esther",
        department: "General",
        is_active: 1,
      },
      {
        username: "LVD-COURAGE",
        password: "password",
        user_role: "User",
        email: "courage@lvd.gov.ng",
        full_name: "Courage",
        department: "General",
        is_active: 1,
      },
    ];

    let completed = 0;
    defaultUsers.forEach((user) => {
      db.run(
        `
        INSERT OR IGNORE INTO users_tbl 
        (username, password, user_role, email, full_name, department, is_active)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `,
        [
          user.username,
          user.password,
          user.user_role,
          user.email,
          user.full_name,
          user.department,
          user.is_active,
        ],
        (err) => {
          if (err) {
            console.error("Error inserting user:", err.message);
          } else {
            console.log(`✓ User ${user.username} created`);
          }
          completed++;
          if (completed === defaultUsers.length) {
            resolve();
          }
        }
      );
    });
  });
};

// Main initialization
async function initializeDatabase() {
  try {
    await createTables();
    await insertDefaultUsers();
    console.log("Database initialization completed successfully!");
  } catch (error) {
    console.error("Error initializing database:", error);
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

initializeDatabase();
