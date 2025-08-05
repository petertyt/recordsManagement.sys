const express = require("express");
const sqlite3 = require("sqlite3").verbose();
const bodyParser = require("body-parser");
const path = require("path");
const bcrypt = require("bcrypt");
const { validateUserData, sanitizeInput } = require("./utils/validation");
const auditLogger = require("./utils/audit");

// Start Express server
function startServer() {
  const app = express();
  const PORT = process.env.PORT || 49200;

  // Path to the SQLite database
  const dbPath = path.resolve(__dirname, "./database/recordsmgmtsys.db");
  const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
      console.error("Error connecting to the database:", err.message);
    } else {
      console.log("Connected to the SQLite database.");
    }
  });

  // Middleware setup
  app.use(bodyParser.json());
  app.use(bodyParser.urlencoded({ extended: true }));

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

  app.get("/api/make-reports", (req, res) => {
    const { start_date, end_date, officer_assigned, file_number } = req.query;
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
    if (file_number) {
      query += " AND file_number = ?";
      params.push(file_number);
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
      recieved_date,
      date_sent,
      reciepient,
      file_type,
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
      !date_sent ||
      !file_type
    ) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    // Use null for optional fields if not provided
    const reciepientValue = reciepient || null;
    const recievedDateValue = folio_number || null;
    const descriptionValue = description || null;

    const query = `
    UPDATE entries_tbl
    SET entry_date = ?, file_number = ?, subject = ?, officer_assigned = ?, recieved_date = ?, date_sent = ?, reciepient = ?, file_type = ?, folio_number = ?, description = ?, status = ?
    WHERE entry_id = ? AND entry_category = 'File';
  `;
    db.run(
      query,
      [
        entry_date,
        file_number,
        subject,
        officer_assigned,
        recieved_date,
        date_sent,
        file_type,
        recievedDateValue,
        reciepientValue,
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
        res
          .status(201)
          .json({
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
  app.delete("/api/delete-entry/:entry_id", (req, res) => {
    const entryId = req.params.entry_id;
    const query = `
          DELETE FROM entries_tbl
          WHERE entry_id = ?;
      `;
    db.run(query, [entryId], function (err) {
      if (err) {
        console.error("Error deleting Entry:", err.message);
        return res.status(500).json({ error: err.message });
      }
      res.status(200).json({ message: "Entry deleted successfully" });
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
      SELECT user_id, username, user_role, user_creation_date
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

  // GET SINGLE USER
  app.get("/api/users/:userId", (req, res) => {
    const { userId } = req.params;
    const query = `
      SELECT user_id, username, user_role, user_creation_date
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
      const { username, password, user_role } = req.body;

      // Validate input data
      const validation = validateUserData({ username, password, user_role });
      if (!validation.isValid) {
        return res.status(400).json({ error: validation.errors.join(", ") });
      }

      // Sanitize inputs
      const sanitizedUsername = sanitizeInput(username);
      const sanitizedRole = sanitizeInput(user_role);

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
              SET username = ?, password = ?, user_role = ?
              WHERE user_id = ?;
            `;
                params = [
                  sanitizedUsername,
                  hashedPassword,
                  sanitizedRole,
                  userId,
                ];
              } else {
                // Update without password
                query = `
              UPDATE users_tbl
              SET username = ?, user_role = ?
              WHERE user_id = ?;
            `;
                params = [sanitizedUsername, sanitizedRole, userId];
              }

              db.run(query, params, function (err) {
                if (err) {
                  console.error("Error updating user:", err.message);
                  return res.status(500).json({ error: err.message });
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

  // Start the server and handle potential port conflict
  const server = app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
  });
}

// Start the server when the app starts
startServer();
