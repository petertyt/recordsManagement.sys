const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const bodyParser = require('body-parser');
const path = require('path');

// Start Express server
function startServer() {
  const app = express();
  const PORT = process.env.PORT || 49200;

  // Path to the SQLite database (allow override for tests)
  const resolvedPath =
    process.env.DB_PATH === ':memory:' ? ':memory:' : (process.env.DB_PATH || './database/recordsmgmtsys.db');
  const dbPath = resolvedPath === ':memory:' ? resolvedPath : path.resolve(__dirname, resolvedPath);
  const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
      console.error('Error connecting to the database:', err.message);
    } else {
      console.log('Connected to the SQLite database.');
    }
  });

  // Ensure history table exists
  db.run(`CREATE TABLE IF NOT EXISTS history_tbl (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    entry_id INTEGER,
    user_id INTEGER,
    action TEXT NOT NULL,
    changes TEXT,
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
  );`);

  // Middleware setup
  app.use(bodyParser.json());
  app.use(bodyParser.urlencoded({ extended: true }));

  // Define routes here
  app.get('/api/recent-entries', (req, res) => {
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

  app.get('/api/make-reports', (req, res) => {
    const { start_date, end_date, officer_assigned, file_number } = req.query;
    let query = `
        SELECT entry_id, entry_date, entry_category, file_number, subject, officer_assigned, status
        FROM entries_tbl
        WHERE 1=1
      `;

    const params = [];

    if (start_date) {
      query += ' AND entry_date >= ?';
      params.push(start_date);
    }
    if (end_date) {
      query += ' AND entry_date <= ?';
      params.push(end_date);
    }
    if (officer_assigned) {
      query += ' AND officer_assigned LIKE ?';
      params.push(`%${officer_assigned}%`);
    }
    if (file_number) {
      query += ' AND file_number = ?';
      params.push(file_number);
    }

    query += ' ORDER BY entry_date DESC;';

    db.all(query, params, (err, rows) => {
      if (err) {
        console.error("Error executing SQL query:", err.message);
        return res.status(500).json({ error: err.message });
      }
      res.json({ data: rows });
    });
  });

  // ENTIRES EJS ROUTE
  app.get('/api/recent-entries-full', (req, res) => {
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
app.get('/api/get-files', (req, res) => {
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
  app.post('/api/add-file', (req, res) => {
    const { entry_date, file_number, subject, officer_assigned, status, recieved_date, date_sent, file_type, reciepient, description, user_id } = req.body;

    if (!entry_date || !file_number || !subject || !officer_assigned || !status || !date_sent || !file_type) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const reciepientValue = reciepient || null;
    const recievedDateValue = recieved_date || null;
    const descriptionValue = description || null;

    const query = `
      INSERT INTO entries_tbl (entry_date, entry_category, file_number, subject, officer_assigned, recieved_date, date_sent, file_type, reciepient, description, status)
      VALUES (?, 'File', ?, ?, ?, ?, ?, ?, ?, ?, ?);
    `;

    db.serialize(() => {
      db.run('BEGIN TRANSACTION');
      db.run(query, [entry_date, file_number, subject, officer_assigned, recievedDateValue, date_sent, file_type, reciepientValue, descriptionValue, status], function (err) {
        if (err) {
          return db.run('ROLLBACK', () => {
            console.error("Error inserting new file:", err.message);
            res.status(500).json({ error: err.message });
          });
        }

        const entryId = this.lastID;
        const changes = {
          entry_date,
          file_number,
          subject,
          officer_assigned,
          status,
          recieved_date: recievedDateValue,
          date_sent,
          file_type,
          reciepient: reciepientValue,
          description: descriptionValue
        };

        db.run(
          `INSERT INTO history_tbl (entry_id, user_id, action, changes) VALUES (?, ?, ?, ?)`,
          [entryId, user_id || null, 'CREATE', JSON.stringify(changes)],
          (err2) => {
            if (err2) {
              return db.run('ROLLBACK', () => res.status(500).json({ error: err2.message }));
            }
            db.run('COMMIT', (commitErr) => {
              if (commitErr) {
                return db.run('ROLLBACK', () => res.status(500).json({ error: commitErr.message }));
              }
              res.status(201).json({ message: 'File added successfully', entry_id: entryId });
            });
          }
        );
      });
    });
  });

// UPDATE FILE IN TABLE
  app.post('/api/update-file', (req, res) => {
    const { entry_id, entry_date, file_number, subject, officer_assigned, status, recieved_date, date_sent, reciepient, file_type, folio_number, description, user_id } = req.body;

    if (!entry_id || !entry_date || !file_number || !subject || !officer_assigned || !status || !date_sent || !file_type) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const reciepientValue = reciepient || null;
    const folioNumberValue = folio_number || null;
    const descriptionValue = description || null;

    const query = `
      UPDATE entries_tbl
      SET entry_date = ?, file_number = ?, subject = ?, officer_assigned = ?, recieved_date = ?, date_sent = ?, reciepient = ?, file_type = ?, folio_number = ?, description = ?, status = ?
      WHERE entry_id = ? AND entry_category = 'File';
    `;

    db.serialize(() => {
      db.run('BEGIN TRANSACTION');
      db.run(query, [entry_date, file_number, subject, officer_assigned, recieved_date, date_sent, reciepientValue, file_type, folioNumberValue, descriptionValue, status, entry_id], function (err) {
        if (err) {
          return db.run('ROLLBACK', () => {
            console.error("Error updating file:", err.message);
            res.status(500).json({ error: err.message });
          });
        }

        const changes = {
          entry_id,
          entry_date,
          file_number,
          subject,
          officer_assigned,
          status,
          recieved_date,
          date_sent,
          reciepient: reciepientValue,
          file_type,
          folio_number: folioNumberValue,
          description: descriptionValue
        };

        db.run(
          `INSERT INTO history_tbl (entry_id, user_id, action, changes) VALUES (?, ?, ?, ?)`,
          [entry_id, user_id || null, 'UPDATE', JSON.stringify(changes)],
          (err2) => {
            if (err2) {
              return db.run('ROLLBACK', () => res.status(500).json({ error: err2.message }));
            }
            db.run('COMMIT', (commitErr) => {
              if (commitErr) {
                return db.run('ROLLBACK', () => res.status(500).json({ error: commitErr.message }));
              }
              res.status(200).json({ message: 'File updated successfully' });
            });
          }
        );
      });
    });
  });

  // LETTER MANAGEMENT SECTION
  // GET LETTERS FROM TABLE
  app.get('/api/get-letters', (req, res) => {
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
  app.post('/api/add-letter', (req, res) => {
    const { entry_date, file_number, subject, officer_assigned, status, recieved_date, letter_date, letter_type, folio_number, description, user_id } = req.body;

    if (!entry_date || !file_number || !subject || !officer_assigned || !status || !recieved_date || !letter_date || !letter_type) {
        return res.status(400).json({ error: 'Missing required fields' });
    }

    const folioNumberValue = folio_number || null;
    const descriptionValue = description || null;

    const query = `
        INSERT INTO entries_tbl (entry_date, entry_category, file_number, subject, officer_assigned, recieved_date, letter_date, letter_type, folio_number, description, status)
        VALUES (?, 'Letter', ?, ?, ?, ?, ?, ?, ?, ?, ?);
    `;

    db.serialize(() => {
      db.run('BEGIN TRANSACTION');
      db.run(query, [entry_date, file_number, subject, officer_assigned, recieved_date, letter_date, letter_type, folioNumberValue, descriptionValue, status], function (err) {
        if (err) {
          return db.run('ROLLBACK', () => {
            console.error("Error inserting new letter:", err.message);
            res.status(500).json({ error: err.message });
          });
        }

        const entryId = this.lastID;
        const changes = {
          entry_date,
          file_number,
          subject,
          officer_assigned,
          status,
          recieved_date,
          letter_date,
          letter_type,
          folio_number: folioNumberValue,
          description: descriptionValue
        };

        db.run(
          `INSERT INTO history_tbl (entry_id, user_id, action, changes) VALUES (?, ?, ?, ?)`,
          [entryId, user_id || null, 'CREATE', JSON.stringify(changes)],
          (err2) => {
            if (err2) {
              return db.run('ROLLBACK', () => res.status(500).json({ error: err2.message }));
            }
            db.run('COMMIT', (commitErr) => {
              if (commitErr) {
                return db.run('ROLLBACK', () => res.status(500).json({ error: commitErr.message }));
              }
              res.status(201).json({ message: 'Letter added successfully', entry_id: entryId });
            });
          }
        );
      });
    });
  });


  // UPDATE LETTER IN TABLE
  app.post('/api/update-letter', (req, res) => {
    const { entry_id, entry_date, file_number, subject, officer_assigned, status, recieved_date, letter_date, letter_type, folio_number, description, user_id } = req.body;

    if (!entry_id || !entry_date || !file_number || !subject || !officer_assigned || !status || !recieved_date || !letter_date || !letter_type) {
        return res.status(400).json({ error: 'Missing required fields' });
    }

    const folioNumberValue = folio_number || null;
    const descriptionValue = description || null;

    const query = `
        UPDATE entries_tbl
        SET entry_date = ?, file_number = ?, subject = ?, officer_assigned = ?, recieved_date = ?, letter_date = ?, letter_type = ?, folio_number = ?, description = ?, status = ?
        WHERE entry_id = ? AND entry_category = 'Letter';
    `;

    db.serialize(() => {
      db.run('BEGIN TRANSACTION');
      db.run(query, [entry_date, file_number, subject, officer_assigned, recieved_date, letter_date, letter_type, folioNumberValue, descriptionValue, status, entry_id], function (err) {
        if (err) {
          return db.run('ROLLBACK', () => {
            console.error("Error updating letter:", err.message);
            res.status(500).json({ error: err.message });
          });
        }

        const changes = {
          entry_id,
          entry_date,
          file_number,
          subject,
          officer_assigned,
          status,
          recieved_date,
          letter_date,
          letter_type,
          folio_number: folioNumberValue,
          description: descriptionValue
        };

        db.run(
          `INSERT INTO history_tbl (entry_id, user_id, action, changes) VALUES (?, ?, ?, ?)`,
          [entry_id, user_id || null, 'UPDATE', JSON.stringify(changes)],
          (err2) => {
            if (err2) {
              return db.run('ROLLBACK', () => res.status(500).json({ error: err2.message }));
            }
            db.run('COMMIT', (commitErr) => {
              if (commitErr) {
                return db.run('ROLLBACK', () => res.status(500).json({ error: commitErr.message }));
              }
              res.status(200).json({ message: 'Letter updated successfully' });
            });
          }
        );
      });
    });
  });


  // DELETE ENTRY IN TABLE
  app.delete('/api/delete-entry/:entry_id', (req, res) => {
    const entryId = req.params.entry_id;
    const { user_id } = req.body;
    const deleteQuery = `DELETE FROM entries_tbl WHERE entry_id = ?;`;

    db.serialize(() => {
      db.run('BEGIN TRANSACTION');
      db.get('SELECT * FROM entries_tbl WHERE entry_id = ?', [entryId], (selectErr, row) => {
        if (selectErr) {
          return db.run('ROLLBACK', () => res.status(500).json({ error: selectErr.message }));
        }

        db.run(deleteQuery, [entryId], function (err) {
          if (err) {
            return db.run('ROLLBACK', () => {
              console.error("Error deleting Entry:", err.message);
              res.status(500).json({ error: err.message });
            });
          }

          db.run(
            `INSERT INTO history_tbl (entry_id, user_id, action, changes) VALUES (?, ?, ?, ?)`,
            [entryId, user_id || null, 'DELETE', JSON.stringify(row || {})],
            (err2) => {
              if (err2) {
                return db.run('ROLLBACK', () => res.status(500).json({ error: err2.message }));
              }
              db.run('COMMIT', (commitErr) => {
                if (commitErr) {
                  return db.run('ROLLBACK', () => res.status(500).json({ error: commitErr.message }));
                }
                res.status(200).json({ message: 'Entry deleted successfully' });
              });
            }
          );
        });
      });
    });
  });




  // ALL ENTRIES ROUTE
  app.get('/api/all-entries', (req, res) => {
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
  app.get('/api/summations', (req, res) => {
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
              total_files: totalFilesRow.total_files
            });
          });
        });
      });
    });
  });

  // History retrieval with pagination and filters
  app.get('/api/history', (req, res) => {
    const { page = 1, limit = 10, entry_id, user_id, start_date, end_date } = req.query;
    let query = `SELECT * FROM history_tbl WHERE 1=1`;
    const params = [];

    if (entry_id) {
      query += ' AND entry_id = ?';
      params.push(entry_id);
    }
    if (user_id) {
      query += ' AND user_id = ?';
      params.push(user_id);
    }
    if (start_date) {
      query += ' AND timestamp >= ?';
      params.push(start_date);
    }
    if (end_date) {
      query += ' AND timestamp <= ?';
      params.push(end_date);
    }

    query += ' ORDER BY timestamp DESC LIMIT ? OFFSET ?';
    params.push(parseInt(limit), (parseInt(page) - 1) * parseInt(limit));

    db.all(query, params, (err, rows) => {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      res.json({ data: rows });
    });
  });


  // Server route modifications
  app.post('/api/update-entry', (req, res) => {
    const { entry_id, file_number, status, user_id } = req.body;
    if (!entry_id || !file_number || !status) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const query = `
        UPDATE entries_tbl
        SET file_number = ?, status = ?
        WHERE entry_id = ?;
    `;

    db.serialize(() => {
      db.run('BEGIN TRANSACTION');
      db.run(query, [file_number, status, entry_id], function (err) {
        if (err) {
          return db.run('ROLLBACK', () => res.status(500).json({ error: err.message }));
        }
        if (this.changes === 0) {
          return db.run('ROLLBACK', () => res.status(404).json({ error: 'Entry not found' }));
        }

        const changes = { file_number, status };
        db.run(
          `INSERT INTO history_tbl (entry_id, user_id, action, changes) VALUES (?, ?, ?, ?)`,
          [entry_id, user_id || null, 'UPDATE', JSON.stringify(changes)],
          (err2) => {
            if (err2) {
              return db.run('ROLLBACK', () => res.status(500).json({ error: err2.message }));
            }
            db.run('COMMIT', (commitErr) => {
              if (commitErr) {
                return db.run('ROLLBACK', () => res.status(500).json({ error: commitErr.message }));
              }
              res.json({ message: 'Entry updated successfully' });
            });
          }
        );
      });
    });
  });

  // Start the server and handle potential port conflict
  const server = app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
  });
  return { app, db, server };
}

if (require.main === module) {
  // Start the server when the app starts
  startServer();
}

module.exports = startServer;
