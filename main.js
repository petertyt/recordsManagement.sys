const { app, BrowserWindow, ipcMain, dialog } = require("electron");
const path = require("path");
const ejs = require("ejs-electron");
const { autoUpdater } = require("electron-updater");
const fs = require("fs");
const bcrypt = require("bcrypt");
const {
  validateUserData,
  sanitizeInput,
  sanitizeUsername,
} = require("./utils/validation");
const auditLogger = require("./utils/audit");
const UserManagement = require("./utils/userManagement");
const PerformanceMonitor = require("./utils/performance");

// SERVER ROUTES
const express = require("express");
const sqlite3 = require("sqlite3").verbose();
const bodyParser = require("body-parser");

// Print userData path for debugging
console.log("userData path:", app.getPath("userData"));

// Determine the correct path for the database
let dbPath;
if (app.isPackaged) {
  // Production mode: Store the database in the userData folder
  dbPath = path.join(app.getPath("userData"), "recordsmgmtsys.db");

  // Check if the database exists in userData; if not, copy it from resources
  if (!fs.existsSync(dbPath)) {
    const sourceDbPath = path.join(
      process.resourcesPath,
      "database/recordsmgmtsys.db"
    );
    console.log("Source DB Path:", sourceDbPath); // Debugging the source path

    try {
      if (fs.existsSync(sourceDbPath)) {
        fs.copyFileSync(sourceDbPath, dbPath);
        console.log("Database copied to userData folder:", dbPath);
      } else {
        console.error("Source database file not found at:", sourceDbPath);
      }
    } catch (err) {
      console.error("Error copying database file:", err.message);
    }
  } else {
    console.log("Database already exists in userData folder:", dbPath);
  }
} else {
  // Development mode: Use the local database path
  dbPath = path.resolve(__dirname, "./database/recordsmgmtsys.db");
  console.log("Development mode DB Path:", dbPath); // Debugging the development path
}

// Initialize the database
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error("Error connecting to the database:", err.message);
  } else {
    console.log("Connected to the SQLite database at", dbPath);
  }
});

// Initialize User Management
const userManagement = new UserManagement(dbPath);

// Initialize Performance Monitor
const performanceMonitor = new PerformanceMonitor();

// Start Express server
function startServer() {
  const app = express();
  const PORT = process.env.PORT || 49200;

  // Middleware setup
  app.use(bodyParser.json());
  app.use(bodyParser.urlencoded({ extended: true }));

  // Performance monitoring middleware
  app.use(performanceMonitor.middleware());

  // Input validation middleware
  app.use((req, res, next) => {
    // Sanitize input for all requests
    if (req.body) {
      Object.keys(req.body).forEach((key) => {
        if (typeof req.body[key] === "string") {
          req.body[key] = sanitizeInput(req.body[key]);
        }
      });
    }

    if (req.query) {
      Object.keys(req.query).forEach((key) => {
        if (typeof req.query[key] === "string") {
          req.query[key] = sanitizeInput(req.query[key]);
        }
      });
    }

    next();
  });

  // CORS middleware
  app.use((req, res, next) => {
    res.header("Access-Control-Allow-Origin", "*");
    res.header(
      "Access-Control-Allow-Methods",
      "GET, POST, PUT, DELETE, OPTIONS"
    );
    res.header(
      "Access-Control-Allow-Headers",
      "Origin, X-Requested-With, Content-Type, Accept, Authorization"
    );
    if (req.method === "OPTIONS") {
      res.sendStatus(200);
    } else {
      next();
    }
  });

  // API route for user authentication (login)
  app.post("/api/login", async (req, res) => {
    const { username, password } = req.body;
    const ipAddress = req.ip || req.connection.remoteAddress;
    const userAgent = req.get("User-Agent");

    if (!username || !password) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    try {
      const query = `
        SELECT * FROM users_tbl WHERE username = ?;
      `;

      db.get(query, [username], async (err, row) => {
        if (err) {
          console.error("Error checking user credentials:", err.message);
          return res.status(500).json({ error: err.message });
        }

        if (row) {
          try {
            // Check if account is locked
            const isLocked = await userManagement.isAccountLocked(row.user_id);
            if (isLocked) {
              await userManagement.logActivity(
                row.user_id,
                "login_failed",
                "Account locked due to multiple failed attempts",
                ipAddress,
                userAgent
              );
              return res.status(423).json({
                error:
                  "Account is temporarily locked due to multiple failed login attempts",
              });
            }

            // Check if user is active
            if (row.is_active === 0) {
              await userManagement.logActivity(
                row.user_id,
                "login_failed",
                "Login attempt on inactive account",
                ipAddress,
                userAgent
              );
              return res.status(401).json({ error: "Account is deactivated" });
            }

            // Check if password is hashed (starts with $2b$)
            const isPasswordHashed = row.password.startsWith("$2b$");

            let passwordValid = false;

            if (isPasswordHashed) {
              // Compare with hashed password
              passwordValid = await bcrypt.compare(password, row.password);
            } else {
              // Legacy plain text password (for backward compatibility)
              passwordValid = password === row.password;

              // If login successful with plain text, hash the password for future use
              if (passwordValid) {
                const hashedPassword = await bcrypt.hash(password, 10);
                const updateQuery =
                  "UPDATE users_tbl SET password = ? WHERE username = ?";
                db.run(updateQuery, [hashedPassword, username], (updateErr) => {
                  if (updateErr) {
                    console.error(
                      "Error updating password hash:",
                      updateErr.message
                    );
                  } else {
                    console.log("Password hashed for user:", username);
                  }
                });
              }
            }

            if (passwordValid) {
              // Reset login attempts and update last login
              await userManagement.resetLoginAttempts(row.user_id);
              await userManagement.updateLastLogin(row.user_id, ipAddress);

              // Create session
              const session = await userManagement.createSession(
                row.user_id,
                ipAddress,
                userAgent
              );

              // Log successful login
              await userManagement.logActivity(
                row.user_id,
                "login_success",
                "User logged in successfully",
                ipAddress,
                userAgent
              );

              res.json({
                message: "Login successful",
                user: row,
                session: {
                  sessionId: session.sessionId,
                  sessionToken: session.sessionToken,
                  expiresAt: session.expiresAt,
                },
              });
            } else {
              // Increment login attempts
              await userManagement.incrementLoginAttempts(row.user_id);

              // Check if account should be locked (after 5 failed attempts)
              const updatedUser = await new Promise((resolve, reject) => {
                db.get(
                  "SELECT login_attempts FROM users_tbl WHERE user_id = ?",
                  [row.user_id],
                  (err, userRow) => {
                    if (err) reject(err);
                    else resolve(userRow);
                  }
                );
              });

              if (updatedUser.login_attempts >= 5) {
                await userManagement.lockAccount(row.user_id, 30); // Lock for 30 minutes
                await userManagement.logActivity(
                  row.user_id,
                  "account_locked",
                  "Account locked due to multiple failed attempts",
                  ipAddress,
                  userAgent
                );
                return res.status(423).json({
                  error:
                    "Account locked due to multiple failed login attempts. Try again in 30 minutes.",
                });
              }

              // Log failed login
              await userManagement.logActivity(
                row.user_id,
                "login_failed",
                "Invalid password provided",
                ipAddress,
                userAgent
              );
              res.status(401).json({ error: "Invalid username or password" });
            }
          } catch (error) {
            console.error("Error during password verification:", error);
            res.status(500).json({ error: "Authentication error" });
          }
        } else {
          res.status(401).json({ error: "Invalid username or password" });
        }
      });
    } catch (error) {
      console.error("Error in login process:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Define routes here
  app.get("/api/recent-entries", (req, res) => {
    const query = `
              SELECT entry_id, entry_date, entry_category, file_number, subject, officer_assigned, status
              FROM entries_tbl
              ORDER BY entry_date DESC
              LIMIT 6;
          `;
    db.all(query, [], (err, rows) => {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      res.json({ data: rows });
    });
  });

  // REPORTS ROUTE
  app.get("/api/make-reports", (req, res) => {
    const {
      start_date,
      end_date,
      officer_assigned,
      status,
      file_number,
      category,
    } = req.query;
    let query = `
        SELECT entry_id, entry_date, entry_category, file_number, subject, officer_assigned, status
        FROM entries_tbl
        WHERE 1=1
      `;

    const params = [];

    if (start_date) {
      query += " AND entry_date >= ?";
      params.push(start_date);
    }
    if (end_date) {
      query += " AND entry_date <= ?";
      params.push(end_date);
    }
    if (officer_assigned) {
      query += " AND officer_assigned LIKE ?";
      params.push(`%${officer_assigned}%`);
    }
    if (status) {
      query += " AND status = ?";
      params.push(status);
    }
    if (file_number) {
      query += " AND file_number = ?";
      params.push(file_number);
    }
    if (category) {
      query += " AND entry_category = ?";
      params.push(category);
    }

    query += " ORDER BY entry_date DESC;";

    db.all(query, params, (err, rows) => {
      if (err) {
        console.error("Error executing SQL query:", err.message);
        return res.status(500).json({ error: err.message });
      }
      res.json({ data: rows });
    });
  });

  // ENTIRES EJS ROUTE
  app.get("/api/recent-entries-full", (req, res) => {
    const query = `
      SELECT *
      FROM entries_tbl
      ORDER BY entry_date DESC;
    `;

    db.all(query, [], (err, rows) => {
      if (err) {
        console.error("Error executing SQL query:", err.message);
        return res.status(500).json({ error: err.message });
      }

      // console.log("Retrieved rows:", rows); // Debugging output
      res.json({ data: rows });
    });
  });

  // FILES MANAGEMENT SECTION
  // GET FILE FROM TABLE
  app.get("/api/get-files", (req, res) => {
    const query = `
      SELECT *
      FROM entries_tbl 
      WHERE entry_category = 'File'
      ORDER BY entry_date DESC;
  `;
    db.all(query, [], (err, rows) => {
      if (err) {
        console.error("Error executing SQL query:", err.message);
        return res.status(500).json({ error: err.message });
      }
      res.json({ data: rows });
    });
  });

  // ADD FILE TO TABLE
  app.post("/api/add-file", (req, res) => {
    const {
      entry_date,
      file_number,
      subject,
      officer_assigned,
      status,
      recieved_date,
      date_sent,
      file_type,
      reciepient,
      description,
    } = req.body;

    // Check only for required fields
    if (
      !entry_date ||
      !file_number ||
      !subject ||
      !officer_assigned ||
      !status ||
      !date_sent ||
      !file_type
    ) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    // Use null for optional fields if not provided
    const reciepientValue = reciepient || null;
    const recievedDateValue = recieved_date || null;
    const descriptionValue = description || null;

    const query = `
    INSERT INTO entries_tbl (entry_date, entry_category, file_number, subject, officer_assigned, recieved_date, date_sent, file_type, reciepient, description, status)
    VALUES (?, 'File', ?, ?, ?, ?, ?, ?, ?, ?, ?);
  `;
    db.run(
      query,
      [
        entry_date,
        file_number,
        subject,
        officer_assigned,
        recievedDateValue,
        date_sent,
        file_type,
        reciepientValue,
        descriptionValue,
        status,
      ],
      function (err) {
        if (err) {
          console.error("Error inserting new file:", err.message);
          return res.status(500).json({ error: err.message });
        }
        res
          .status(201)
          .json({ message: "File added successfully", entry_id: this.lastID });
      }
    );
  });

  // UPDATE FILE IN TABLE
  app.post("/api/update-file", (req, res) => {
    const {
      entry_id,
      entry_date,
      file_number,
      subject,
      officer_assigned,
      status,
      recieved_date, // Correct spelling here: received_date
      date_sent,
      reciepient, // Correct spelling here
      file_type,
      description,
    } = req.body;

    // Check only for required fields
    if (
      !entry_id ||
      !entry_date ||
      !file_number ||
      !subject ||
      !officer_assigned ||
      !status ||
      !date_sent ||
      !file_type
    ) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    // Use null for optional fields if not provided
    const reciepientValue = reciepient || null; // Correct spelling here
    const recievedDateValue = recieved_date || null; // Correct spelling here
    const descriptionValue = description || null;

    const query = `
    UPDATE entries_tbl
    SET entry_date = ?, file_number = ?, subject = ?, officer_assigned = ?, recieved_date = ?, date_sent = ?, reciepient = ?, file_type = ?, description = ?, status = ?
    WHERE entry_id = ? AND entry_category = 'File';
  `;

    db.run(
      query,
      [
        entry_date,
        file_number,
        subject,
        officer_assigned,
        recievedDateValue, // Corrected: received date
        date_sent,
        reciepientValue, // Corrected: recipient
        file_type,
        descriptionValue,
        status,
        entry_id,
      ],
      function (err) {
        if (err) {
          console.error("Error updating file:", err.message);
          return res.status(500).json({ error: err.message });
        }
        res.status(200).json({ message: "File updated successfully" });
      }
    );
  });

  // LETTER MANAGEMENT SECTION
  // GET LETTERS FROM TABLE
  app.get("/api/get-letters", (req, res) => {
    const query = `
            SELECT *
            FROM entries_tbl WHERE entry_category = 'Letter'
            ORDER BY entry_date DESC;
        `;
    db.all(query, [], (err, rows) => {
      if (err) {
        console.error("Error executing SQL query:", err.message);
        return res.status(500).json({ error: err.message });
      }
      res.json({ data: rows });
    });
  });

  // ADD LETTER TO TABLE
  app.post("/api/add-letter", (req, res) => {
    const {
      entry_date,
      file_number,
      subject,
      officer_assigned,
      status,
      recieved_date,
      letter_date,
      letter_type,
      folio_number,
      description,
    } = req.body;

    // Check only for required fields
    if (
      !entry_date ||
      !file_number ||
      !subject ||
      !officer_assigned ||
      !status ||
      !recieved_date ||
      !letter_date ||
      !letter_type
    ) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    // Use null for optional fields if not provided
    const folioNumberValue = folio_number || null;
    const descriptionValue = description || null;

    const query = `
      INSERT INTO entries_tbl (entry_date, entry_category, file_number, subject, officer_assigned, recieved_date, letter_date, letter_type, folio_number, description, status)
      VALUES (?, 'Letter', ?, ?, ?, ?, ?, ?, ?, ?, ?);
  `;
    db.run(
      query,
      [
        entry_date,
        file_number,
        subject,
        officer_assigned,
        recieved_date,
        letter_date,
        letter_type,
        folioNumberValue,
        descriptionValue,
        status,
      ],
      function (err) {
        if (err) {
          console.error("Error inserting new letter:", err.message);
          return res.status(500).json({ error: err.message });
        }
        res.status(201).json({
          message: "Letter added successfully",
          entry_id: this.lastID,
        });
      }
    );
  });

  // UPDATE LETTER IN TABLE
  app.post("/api/update-letter", (req, res) => {
    const {
      entry_id,
      entry_date,
      file_number,
      subject,
      officer_assigned,
      status,
      recieved_date,
      letter_date,
      letter_type,
      folio_number,
      description,
    } = req.body;

    // Check only for required fields
    if (
      !entry_id ||
      !entry_date ||
      !file_number ||
      !subject ||
      !officer_assigned ||
      !status ||
      !recieved_date ||
      !letter_date ||
      !letter_type
    ) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    // Use null for optional fields if not provided
    const folioNumberValue = folio_number || null;
    const descriptionValue = description || null;

    const query = `
      UPDATE entries_tbl
      SET entry_date = ?, file_number = ?, subject = ?, officer_assigned = ?, recieved_date = ?, letter_date = ?, letter_type = ?, folio_number = ?, description = ?, status = ?
      WHERE entry_id = ? AND entry_category = 'Letter';
  `;
    db.run(
      query,
      [
        entry_date,
        file_number,
        subject,
        officer_assigned,
        recieved_date,
        letter_date,
        letter_type,
        folioNumberValue,
        descriptionValue,
        status,
        entry_id,
      ],
      function (err) {
        if (err) {
          console.error("Error updating letter:", err.message);
          return res.status(500).json({ error: err.message });
        }
        res.status(200).json({ message: "Letter updated successfully" });
      }
    );
  });

  // DELETE ENTRY IN TABLE
  app.delete("/api/delete-file/:entry_id", (req, res) => {
    const entryId = req.params.entry_id;
    const query = `
          DELETE FROM entries_tbl
          WHERE entry_id = ? AND entry_category = 'File';
      `;
    db.run(query, [entryId], function (err) {
      if (err) {
        console.error("Error deleting File:", err.message);
        return res.status(500).json({ error: err.message });
      }
      res.status(200).json({ message: "File deleted successfully" });
    });
  });
  // DELETE ENTRY IN TABLE
  app.delete("/api/delete-letter/:entry_id", (req, res) => {
    const entryId = req.params.entry_id;
    const query = `
          DELETE FROM entries_tbl
          WHERE entry_id = ? AND entry_category = 'Letter';
      `;
    db.run(query, [entryId], function (err) {
      if (err) {
        console.error("Error deleting Letter:", err.message);
        return res.status(500).json({ error: err.message });
      }
      res.status(200).json({ message: "Letter deleted successfully" });
    });
  });

  // ALL ENTRIES ROUTE
  app.get("/api/all-entries", (req, res) => {
    const query = `
        SELECT entry_id, entry_date, entry_category, file_number, subject, officer_assigned, status
        FROM entries_tbl
        ORDER BY entry_date DESC;
      `;

    db.all(query, [], (err, rows) => {
      if (err) {
        console.error("Error executing SQL query:", err.message);
        return res.status(500).json({ error: err.message });
      }

      // console.log("Retrieved rows:", rows); // Debugging output
      res.json({ data: rows });
    });
  });

  // Route to get summations for total entries, letters, and files from entries_tbl
  app.get("/api/summations", (req, res) => {
    const totalEntriesQuery = `SELECT COUNT(*) AS total_entries FROM entries_tbl`;
    const totalLettersQuery = `SELECT COUNT(*) AS total_letters FROM entries_tbl WHERE entry_category = 'Letter'`;
    const totalFilesQuery = `SELECT COUNT(*) AS total_files FROM entries_tbl WHERE entry_category = 'File'`;

    db.serialize(() => {
      db.get(totalEntriesQuery, (err, totalEntriesRow) => {
        if (err) {
          return res.status(500).json({ error: err.message });
        }

        db.get(totalLettersQuery, (err, totalLettersRow) => {
          if (err) {
            return res.status(500).json({ error: err.message });
          }

          db.get(totalFilesQuery, (err, totalFilesRow) => {
            if (err) {
              return res.status(500).json({ error: err.message });
            }

            res.json({
              total_entries: totalEntriesRow.total_entries,
              total_letters: totalLettersRow.total_letters,
              total_files: totalFilesRow.total_files,
            });
          });
        });
      });
    });
  });

  // Server route modifications
  app.post("/api/update-entry", (req, res) => {
    const { entry_id, file_number, status } = req.body;
    if (!entry_id || !file_number || !status) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    const query = `
        UPDATE entries_tbl
        SET file_number = ?, status = ?
        WHERE entry_id = ?;
    `;
    db.run(query, [file_number, status, entry_id], function (err) {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      if (this.changes === 0) {
        return res.status(404).json({ error: "Entry not found" });
      }
      res.json({ message: "Entry updated successfully" });
    });
  });

  // USER MANAGEMENT SECTION
  // GET ALL USERS
  app.get("/api/users", (req, res) => {
    const query = `
      SELECT user_id, username, user_role, user_creation_date, email, full_name, department, phone, last_login_date, is_active, login_attempts, locked_until, password_changed_date, created_by
      FROM users_tbl
      ORDER BY user_creation_date DESC;
    `;
    db.all(query, [], (err, rows) => {
      if (err) {
        console.error("Error fetching users:", err.message);
        return res.status(500).json({ error: err.message });
      }
      res.json({ data: rows });
    });
  });

  // GET USER STATISTICS
  app.get("/api/users/stats", (req, res) => {
    const totalUsersQuery = `SELECT COUNT(*) AS total_users FROM users_tbl`;
    const adminUsersQuery = `SELECT COUNT(*) AS admin_users FROM users_tbl WHERE user_role = 'Administrator'`;
    const regularUsersQuery = `SELECT COUNT(*) AS regular_users FROM users_tbl WHERE user_role = 'User'`;

    db.serialize(() => {
      db.get(totalUsersQuery, (err, totalUsersRow) => {
        if (err) {
          return res.status(500).json({ error: err.message });
        }

        db.get(adminUsersQuery, (err, adminUsersRow) => {
          if (err) {
            return res.status(500).json({ error: err.message });
          }

          db.get(regularUsersQuery, (err, regularUsersRow) => {
            if (err) {
              return res.status(500).json({ error: err.message });
            }

            res.json({
              total_users: totalUsersRow.total_users,
              admin_users: adminUsersRow.admin_users,
              regular_users: regularUsersRow.regular_users,
            });
          });
        });
      });
    });
  });

  // GET SINGLE USER
  app.get("/api/users/:userId", (req, res) => {
    const { userId } = req.params;
    const query = `
      SELECT user_id, username, user_role, user_creation_date, email, full_name, department, phone, last_login_date, is_active, login_attempts, locked_until, password_changed_date, created_by
      FROM users_tbl
      WHERE user_id = ?;
    `;
    db.get(query, [userId], (err, row) => {
      if (err) {
        console.error("Error fetching user:", err.message);
        return res.status(500).json({ error: err.message });
      }
      if (!row) {
        return res.status(404).json({ error: "User not found" });
      }
      res.json({ data: row });
    });
  });

  // CREATE NEW USER
  app.post("/api/users", async (req, res) => {
    try {
      const { username, password, user_role } = req.body;

      // Validate input data
      const validation = validateUserData({ username, password, user_role });
      if (!validation.isValid) {
        return res.status(400).json({ error: validation.errors.join(", ") });
      }

      // Sanitize inputs
      const sanitizedUsername = sanitizeInput(username);
      const sanitizedRole = sanitizeInput(user_role);

      // Check if username already exists
      db.get(
        "SELECT username FROM users_tbl WHERE username = ?",
        [sanitizedUsername],
        async (err, row) => {
          if (err) {
            console.error("Error checking username:", err.message);
            return res.status(500).json({ error: err.message });
          }
          if (row) {
            return res.status(409).json({ error: "Username already exists" });
          }

          // Hash password
          const hashedPassword = await bcrypt.hash(password, 10);

          // Insert new user
          const query = `
          INSERT INTO users_tbl (username, password, user_role, user_creation_date)
          VALUES (?, ?, ?, datetime('now'));
        `;
          db.run(
            query,
            [sanitizedUsername, hashedPassword, sanitizedRole],
            function (err) {
              if (err) {
                console.error("Error creating user:", err.message);
                return res.status(500).json({ error: err.message });
              }

              // Log the user creation event
              auditLogger.logUserManagementEvent(
                "system",
                "create_user",
                sanitizedUsername,
                {
                  user_id: this.lastID,
                  role: sanitizedRole,
                }
              );

              res.status(201).json({
                message: "User created successfully",
                user_id: this.lastID,
              });
            }
          );
        }
      );
    } catch (error) {
      console.error("Error in user creation:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // UPDATE USER
  app.put("/api/users/:userId", async (req, res) => {
    try {
      const { userId } = req.params;
      const {
        username,
        password,
        user_role,
        full_name,
        email,
        department,
        phone,
      } = req.body;

      // Validate input data
      const validation = validateUserData(
        { username, password, user_role },
        true
      ); // isUpdate = true
      if (!validation.isValid) {
        return res.status(400).json({ error: validation.errors.join(", ") });
      }

      // Use sanitized data from validation
      const sanitizedUsername = validation.sanitizedData.username;
      const sanitizedRole = validation.sanitizedData.user_role;
      const sanitizedFullName = full_name ? sanitizeInput(full_name) : null;
      const sanitizedEmail = email ? sanitizeInput(email) : null;
      const sanitizedDepartment = department ? sanitizeInput(department) : null;
      const sanitizedPhone = phone ? sanitizeInput(phone) : null;

      // Debug logging
      console.log("User update request:", {
        userId,
        originalUsername: username,
        sanitizedUsername,
        originalRole: user_role,
        sanitizedRole,
        full_name,
        email,
        department,
        phone,
      });

      // Additional validation debugging
      console.log("Validation result:", validation);
      console.log("Sanitized data from validation:", validation.sanitizedData);

      // Check if user exists
      db.get(
        "SELECT username FROM users_tbl WHERE user_id = ?",
        [userId],
        async (err, row) => {
          if (err) {
            console.error("Error checking user:", err.message);
            return res.status(500).json({ error: err.message });
          }
          if (!row) {
            return res.status(404).json({ error: "User not found" });
          }

          // Check if new username conflicts with existing users (excluding current user)
          db.get(
            "SELECT username FROM users_tbl WHERE username = ? AND user_id != ?",
            [sanitizedUsername, userId],
            async (err, conflictRow) => {
              if (err) {
                console.error("Error checking username conflict:", err.message);
                return res.status(500).json({ error: err.message });
              }
              if (conflictRow) {
                return res
                  .status(409)
                  .json({ error: "Username already exists" });
              }

              // Prepare update query
              let query, params;
              if (password) {
                // Update with password
                const hashedPassword = await bcrypt.hash(password, 10);
                query = `
              UPDATE users_tbl
              SET username = ?, password = ?, user_role = ?, full_name = ?, email = ?, department = ?, phone = ?
              WHERE user_id = ?;
            `;
                params = [
                  sanitizedUsername,
                  hashedPassword,
                  sanitizedRole,
                  sanitizedFullName,
                  sanitizedEmail,
                  sanitizedDepartment,
                  sanitizedPhone,
                  userId,
                ];
              } else {
                // Update without password
                query = `
              UPDATE users_tbl
              SET username = ?, user_role = ?, full_name = ?, email = ?, department = ?, phone = ?
              WHERE user_id = ?;
            `;
                params = [
                  sanitizedUsername,
                  sanitizedRole,
                  sanitizedFullName,
                  sanitizedEmail,
                  sanitizedDepartment,
                  sanitizedPhone,
                  userId,
                ];
              }

              // Debug logging for SQL query
              console.log("Executing SQL update:", {
                query,
                params,
                sanitizedUsername,
              });

              db.run(query, params, function (err) {
                if (err) {
                  console.error("Error updating user:", err.message);
                  return res.status(500).json({ error: err.message });
                }

                console.log(
                  "User update successful. Rows affected:",
                  this.changes
                );

                // Verify the update by querying the user again
                db.get(
                  "SELECT username, user_role, full_name, email, department, phone FROM users_tbl WHERE user_id = ?",
                  [userId],
                  (verifyErr, updatedUser) => {
                    if (verifyErr) {
                      console.error(
                        "Error verifying update:",
                        verifyErr.message
                      );
                    } else {
                      console.log("User after update:", updatedUser);
                    }

                    // Log the user update event
                    auditLogger.logUserManagementEvent(
                      "system",
                      "update_user",
                      sanitizedUsername,
                      {
                        user_id: userId,
                        role: sanitizedRole,
                        password_changed: !!password,
                      }
                    );

                    res.json({ message: "User updated successfully" });
                  }
                );
              });
            }
          );
        }
      );
    } catch (error) {
      console.error("Error in user update:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // DELETE USER
  app.delete("/api/users/:userId", (req, res) => {
    const { userId } = req.params;

    // Check if user exists
    db.get(
      "SELECT username FROM users_tbl WHERE user_id = ?",
      [userId],
      (err, row) => {
        if (err) {
          console.error("Error checking user:", err.message);
          return res.status(500).json({ error: err.message });
        }
        if (!row) {
          return res.status(404).json({ error: "User not found" });
        }

        // Delete user
        const query = "DELETE FROM users_tbl WHERE user_id = ?";
        db.run(query, [userId], function (err) {
          if (err) {
            console.error("Error deleting user:", err.message);
            return res.status(500).json({ error: err.message });
          }

          // Log the user deletion event
          auditLogger.logUserManagementEvent(
            "system",
            "delete_user",
            row.username,
            {
              user_id: userId,
            }
          );

          res.json({ message: "User deleted successfully" });
        });
      }
    );
  });

  // CHANGE USER PASSWORD
  app.post("/api/users/:userId/change-password", async (req, res) => {
    try {
      const { userId } = req.params;
      const { currentPassword, newPassword } = req.body;

      if (!currentPassword || !newPassword) {
        return res
          .status(400)
          .json({ error: "Current password and new password are required" });
      }

      // Validate new password
      const validation = validateUserData({
        username: "temp",
        password: newPassword,
        user_role: "user",
      });
      if (!validation.isValid) {
        return res.status(400).json({ error: validation.errors.join(", ") });
      }

      // Get user and verify current password
      db.get(
        "SELECT username, password FROM users_tbl WHERE user_id = ?",
        [userId],
        async (err, row) => {
          if (err) {
            console.error("Error fetching user:", err.message);
            return res.status(500).json({ error: err.message });
          }
          if (!row) {
            return res.status(404).json({ error: "User not found" });
          }

          // Verify current password
          const isPasswordValid = await bcrypt.compare(
            currentPassword,
            row.password
          );
          if (!isPasswordValid) {
            return res
              .status(401)
              .json({ error: "Current password is incorrect" });
          }

          // Hash new password
          const hashedPassword = await bcrypt.hash(newPassword, 10);

          // Update password
          const query = "UPDATE users_tbl SET password = ? WHERE user_id = ?";
          db.run(query, [hashedPassword, userId], function (err) {
            if (err) {
              console.error("Error updating password:", err.message);
              return res.status(500).json({ error: err.message });
            }

            // Log the password change event
            auditLogger.logSecurityEvent(
              row.username,
              "password_change",
              "user",
              {
                user_id: userId,
              }
            );

            res.json({ message: "Password changed successfully" });
          });
        }
      );
    } catch (error) {
      console.error("Error in password change:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // SESSION MANAGEMENT ENDPOINTS

  // Validate session
  app.post("/api/session/validate", async (req, res) => {
    try {
      const { sessionToken } = req.body;

      if (!sessionToken) {
        return res.status(400).json({ error: "Session token is required" });
      }

      const session = await userManagement.validateSession(sessionToken);
      if (session) {
        res.json({
          valid: true,
          user: {
            user_id: session.user_id,
            username: session.username,
            user_role: session.user_role,
          },
        });
      } else {
        res.json({ valid: false });
      }
    } catch (error) {
      console.error("Error validating session:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Logout (invalidate session)
  app.post("/api/session/logout", async (req, res) => {
    try {
      const { sessionToken } = req.body;

      if (!sessionToken) {
        return res.status(400).json({ error: "Session token is required" });
      }

      const success = await userManagement.invalidateSession(sessionToken);
      if (success) {
        res.json({ message: "Logged out successfully" });
      } else {
        res.status(404).json({ error: "Session not found" });
      }
    } catch (error) {
      console.error("Error logging out:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // ACTIVITY LOGGING ENDPOINTS

  // Get activity log
  app.get("/api/activity-log", async (req, res) => {
    try {
      const { userId, limit = 100 } = req.query;
      const activityLog = await userManagement.getActivityLog(userId, limit);
      res.json({ data: activityLog });
    } catch (error) {
      console.error("Error fetching activity log:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // PERMISSIONS ENDPOINTS

  // Get user permissions
  app.get("/api/permissions/:userRole", async (req, res) => {
    try {
      const { userRole } = req.params;
      const permissions = await userManagement.getUserPermissions(userRole);
      res.json({ permissions });
    } catch (error) {
      console.error("Error fetching permissions:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Check specific permission
  app.post("/api/permissions/check", async (req, res) => {
    try {
      const { userRole, resource, action } = req.body;

      if (!userRole || !resource || !action) {
        return res
          .status(400)
          .json({ error: "User role, resource, and action are required" });
      }

      const hasPermission = await userManagement.checkPermission(
        userRole,
        resource,
        action
      );
      res.json({ hasPermission });
    } catch (error) {
      console.error("Error checking permission:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // ENHANCED USER STATISTICS

  // Get detailed user statistics
  app.get("/api/users/stats/detailed", (req, res) => {
    const query = `
      SELECT 
        COUNT(*) as total_users,
        SUM(CASE WHEN user_role = 'Administrator' THEN 1 ELSE 0 END) as admin_users,
        SUM(CASE WHEN user_role != 'Administrator' THEN 1 ELSE 0 END) as regular_users,
        SUM(CASE WHEN is_active = 1 THEN 1 ELSE 0 END) as active_users
      FROM users_tbl;
    `;

    db.get(query, [], (err, row) => {
      if (err) {
        console.error("Error fetching user stats:", err.message);
        return res.status(500).json({ error: err.message });
      }
      res.json(row);
    });
  });

  // Get system performance stats
  app.get("/api/system/performance", (req, res) => {
    try {
      const stats = performanceMonitor.getPerformanceStats();
      const memoryLeak = performanceMonitor.getMemoryLeakDetection();

      res.json({
        ...stats,
        memoryLeak,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      console.error("Error getting performance stats:", error);
      res.status(500).json({ error: "Failed to get performance stats" });
    }
  });

  // ACCOUNT MANAGEMENT ENDPOINTS

  // Lock/Unlock user account
  app.post("/api/users/:userId/lock", async (req, res) => {
    try {
      const { userId } = req.params;
      const { lockDuration = 30 } = req.body; // Default 30 minutes

      const success = await userManagement.lockAccount(userId, lockDuration);
      if (success) {
        await userManagement.logActivity(
          userId,
          "account_locked",
          "Account locked by administrator",
          req.ip,
          req.get("User-Agent")
        );
        res.json({ message: "Account locked successfully" });
      } else {
        res.status(404).json({ error: "User not found" });
      }
    } catch (error) {
      console.error("Error locking account:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Unlock user account
  app.post("/api/users/:userId/unlock", async (req, res) => {
    try {
      const { userId } = req.params;

      const success = await userManagement.resetLoginAttempts(userId);
      if (success) {
        await userManagement.logActivity(
          userId,
          "account_unlocked",
          "Account unlocked by administrator",
          req.ip,
          req.get("User-Agent")
        );
        res.json({ message: "Account unlocked successfully" });
      } else {
        res.status(404).json({ error: "User not found" });
      }
    } catch (error) {
      console.error("Error unlocking account:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Activate/Deactivate user account
  app.post("/api/users/:userId/status", async (req, res) => {
    try {
      const { userId } = req.params;
      const { isActive } = req.body;
      const ipAddress = req.ip || req.connection.remoteAddress;
      const userAgent = req.get("User-Agent");

      console.log(
        `Status update request: userId=${userId}, isActive=${isActive}`
      );

      if (typeof isActive !== "boolean") {
        return res.status(400).json({ error: "isActive must be a boolean" });
      }

      db.run(
        "UPDATE users_tbl SET is_active = ? WHERE user_id = ?",
        [isActive ? 1 : 0, userId],
        async function (err) {
          if (err) {
            console.error("Error updating user status:", err.message);
            return res.status(500).json({ error: err.message });
          }

          console.log(`Database update result: changes=${this.changes}`);

          if (this.changes > 0) {
            // Log the status change activity (with error handling)
            try {
              await userManagement.logActivity(
                userId,
                "status_change",
                `Account ${
                  isActive ? "activated" : "deactivated"
                } by administrator`,
                ipAddress,
                userAgent
              );
            } catch (logError) {
              console.error(
                "Error logging activity (non-critical):",
                logError.message
              );
              // Continue with the response even if logging fails
            }

            res.json({
              message: `Account ${
                isActive ? "activated" : "deactivated"
              } successfully`,
            });
          } else {
            res.status(404).json({ error: "User not found" });
          }
        }
      );
    } catch (error) {
      console.error("Error updating user status:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Start the server and handle potential port conflict
  const server = app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
  });

  // Error handling middleware (must be last)
  app.use((error, req, res, next) => {
    console.error("Unhandled error:", error);

    // Log error with audit logger if available
    if (userManagement && req.user) {
      userManagement
        .logActivity(
          req.user.user_id,
          "system_error",
          `Error: ${error.message}`,
          req.ip,
          req.get("User-Agent")
        )
        .catch((err) => console.error("Error logging system error:", err));
    }

    res.status(500).json({
      error: "Internal server error",
      message:
        process.env.NODE_ENV === "development"
          ? error.message
          : "Something went wrong",
    });
  });
}

// Start the server when the app starts
startServer();

// END SERVER ROUTES

let splashWindow;
let mainWindow;

// Helper function to send update status to whichever window is available
function sendStatusToWindow(message) {
  if (mainWindow) {
    mainWindow.webContents.send('update-message', message);
  } else if (splashWindow) {
    splashWindow.webContents.send('update-message', message);
  }
}

// AutoUpdater event listeners
autoUpdater.on('checking-for-update', () => {
  sendStatusToWindow('Checking for update...');
});

autoUpdater.on('update-available', () => {
  sendStatusToWindow('Update available.');
});

autoUpdater.on('update-not-available', () => {
  sendStatusToWindow('Update not available.');
});

autoUpdater.on('error', (err) => {
  sendStatusToWindow(`Error in auto-updater: ${err === null ? 'unknown' : err.toString()}`);
});

autoUpdater.on('download-progress', (progressObj) => {
  const logMessage = `Download speed: ${progressObj.bytesPerSecond} - Downloaded ${progressObj.percent.toFixed(2)}% (${progressObj.transferred}/${progressObj.total})`;
  sendStatusToWindow(logMessage);
});

autoUpdater.on('update-downloaded', () => {
  sendStatusToWindow('Update downloaded; restart to install.');
  if (mainWindow) {
    mainWindow.webContents.send('update-downloaded');
  } else if (splashWindow) {
    splashWindow.webContents.send('update-downloaded');
  }
  dialog
    .showMessageBox({
      type: 'info',
      buttons: ['Restart', 'Later'],
      title: 'Update Ready',
      message: 'A new version has been downloaded. Restart now to apply the update?'
    })
    .then((returnValue) => {
      if (returnValue.response === 0) {
        autoUpdater.quitAndInstall();
      }
    });
});

ipcMain.on('restart_app', () => {
  autoUpdater.quitAndInstall();
});

function createSplashWindow() {
  splashWindow = new BrowserWindow({
    width: 900,
    height: 600,
    frame: false,
    transparent: true,
    // alwaysOnTop: true,
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      enableRemoteModule: false,
      nodeIntegration: true,
    },
    icon: path.join(__dirname, "assets/icons/ico/icon-exe.ico"),
  });

  splashWindow.loadFile("src/splash-page/splash.html");
}

// IPC event for handling login attempts
ipcMain.on("login-attempt", async (event, credentials) => {
  const { username, password } = credentials;

  // Query the database for the user
  db.get(
    "SELECT * FROM users_tbl WHERE username = ?",
    [username],
    async (err, row) => {
      if (err) {
        console.error("Error querying database:", err);
        event.reply("login-response", {
          success: false,
          message: "Database error.",
        });
      } else if (row) {
        try {
          // Check if password is hashed (starts with $2b$)
          const isPasswordHashed = row.password.startsWith("$2b$");

          let passwordValid = false;

          if (isPasswordHashed) {
            // Compare with hashed password
            passwordValid = await bcrypt.compare(password, row.password);
          } else {
            // Legacy plain text password (for backward compatibility)
            passwordValid = password === row.password;

            // If login successful with plain text, hash the password for future use
            if (passwordValid) {
              const hashedPassword = await bcrypt.hash(password, 10);
              const updateQuery =
                "UPDATE users_tbl SET password = ? WHERE username = ?";
              db.run(updateQuery, [hashedPassword, username], (updateErr) => {
                if (updateErr) {
                  console.error(
                    "Error updating password hash:",
                    updateErr.message
                  );
                } else {
                  console.log("Password hashed for user:", username);
                }
              });
            }
          }

          if (passwordValid) {
            // Successful login
            const userData = {
              username: row.username,
              role: row.user_role, // Assuming you have a role field in your table
            };
            event.reply("login-response", { success: true, userData });
            splashWindow.close();
            createMainWindow(userData); // Pass the userData to the main window
          } else {
            // Invalid credentials
            event.reply("login-response", {
              success: false,
              message: "Incorrect username or password.",
            });
          }
        } catch (error) {
          console.error("Error during password verification:", error);
          event.reply("login-response", {
            success: false,
            message: "Authentication error.",
          });
        }
      } else {
        // Invalid credentials
        event.reply("login-response", {
          success: false,
          message: "Incorrect username or password.",
        });
      }
    }
  );
});

// Handle login success and pass userData to the main window
ipcMain.on("login-success", (event, userData) => {
  // Close the splash window
  if (splashWindow) {
    splashWindow.close();
  }

  // Create and show the main window, and pass user data
  createMainWindow(userData); // Pass userData when creating the main window
});

function createMainWindow(userData) {
  mainWindow = new BrowserWindow({
    width: 1920,
    height: 1080,
    frame: true,
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      enableRemoteModule: false,
      nodeIntegration: false,
    },
    autoHideMenuBar: true,
    icon: path.join(__dirname, "assets/icons/ico/icon-exe.ico"),
  });

  mainWindow.loadFile("src/index.ejs");
  // Once the window is ready, send the userData to the renderer process
  mainWindow.webContents.on("did-finish-load", () => {
    mainWindow.webContents.send("user-data", userData); // Send user data to renderer process
  });

  mainWindow.on("closed", function () {
    mainWindow = null;
  });
}

// // Handle the 'sign-out' event from the renderer
// ipcMain.on('sign-out', () => {
//   // Close the main window
//   if (mainWindow) {
//       mainWindow.close();
//       mainWindow = null; // Clear the reference
//   }

//   // Reopen the splash window
//   if (!splashWindow) {
//       createSplashWindow();
//   } else {
//       splashWindow.show();
//   }
// });

app.whenReady().then(() => {
  createSplashWindow();
  autoUpdater.checkForUpdates();
});

app.on("activate", () => {
  if (BrowserWindow.getAllWindows().length === 0) createSplashWindow();
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});
