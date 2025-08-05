const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const bodyParser = require('body-parser');
const path = require('path');

// Start Express server
function startServer() {
  const app = express();
  const PORT = process.env.PORT || 49200;

  // Path to the SQLite database
  const dbPath = path.resolve(__dirname, './database/recordsmgmtsys.db');
  const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
      console.error('Error connecting to the database:', err.message);
    } else {
      console.log('Connected to the SQLite database.');
    }
  });

  let dbClosed = false;
  const closeDatabase = () => {
    if (dbClosed) return;
    db.close((err) => {
      if (err) {
        console.error('Error closing database:', err.message);
      } else {
        console.log('Database connection closed.');
      }
    });
    dbClosed = true;
  };

  process.on('SIGINT', () => {
    closeDatabase();
    process.exit(0);
  });
  process.on('SIGTERM', () => {
    closeDatabase();
    process.exit(0);
  });
  process.on('exit', closeDatabase);

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
  const { entry_date, file_number, subject, officer_assigned, status, recieved_date, date_sent, file_type, reciepient, description } = req.body;

  // Check only for required fields
  if (!entry_date || !file_number || !subject || !officer_assigned || !status || !date_sent || !file_type) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  // Use null for optional fields if not provided
  const reciepientValue = reciepient || null;
  const recievedDateValue = recieved_date || null;
  const descriptionValue = description || null;

  const query = `
    INSERT INTO entries_tbl (entry_date, entry_category, file_number, subject, officer_assigned, recieved_date, date_sent, file_type, reciepient, description, status)
    VALUES (?, 'File', ?, ?, ?, ?, ?, ?, ?, ?, ?);
  `;
  db.run(query, [entry_date, file_number, subject, officer_assigned, recievedDateValue, date_sent, file_type, reciepientValue, descriptionValue, status], function (err) {
    if (err) {
      console.error("Error inserting new file:", err.message);
      return res.status(500).json({ error: err.message });
    }
    res.status(201).json({ message: 'File added successfully', entry_id: this.lastID });
  });
});

// UPDATE FILE IN TABLE
app.post('/api/update-file', (req, res) => {
  const { entry_id, entry_date, file_number, subject, officer_assigned, status, recieved_date, date_sent, reciepient, file_type, folio_number, description } = req.body;

  // Check only for required fields
  if (!entry_id || !entry_date || !file_number || !subject || !officer_assigned || !status || !date_sent || !file_type) {
    return res.status(400).json({ error: 'Missing required fields' });
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
  db.run(query, [entry_date, file_number, subject, officer_assigned, recieved_date, date_sent, file_type, recievedDateValue,reciepientValue, descriptionValue, status, entry_id], function (err) {
    if (err) {
      console.error("Error updating file:", err.message);
      return res.status(500).json({ error: err.message });
    }
    res.status(200).json({ message: 'File updated successfully' });
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
  const { entry_date, file_number, subject, officer_assigned, status, recieved_date, letter_date, letter_type, folio_number, description } = req.body;

  // Check only for required fields
  if (!entry_date || !file_number || !subject || !officer_assigned || !status || !recieved_date || !letter_date || !letter_type) {
      return res.status(400).json({ error: 'Missing required fields' });
  }

  // Use null for optional fields if not provided
  const folioNumberValue = folio_number || null;
  const descriptionValue = description || null;

  const query = `
      INSERT INTO entries_tbl (entry_date, entry_category, file_number, subject, officer_assigned, recieved_date, letter_date, letter_type, folio_number, description, status)
      VALUES (?, 'Letter', ?, ?, ?, ?, ?, ?, ?, ?, ?);
  `;
  db.run(query, [entry_date, file_number, subject, officer_assigned, recieved_date, letter_date, letter_type, folioNumberValue, descriptionValue, status], function (err) {
      if (err) {
          console.error("Error inserting new letter:", err.message);
          return res.status(500).json({ error: err.message });
      }
      res.status(201).json({ message: 'Letter added successfully', entry_id: this.lastID });
  });
});


  // UPDATE LETTER IN TABLE
app.post('/api/update-letter', (req, res) => {
  const { entry_id, entry_date, file_number, subject, officer_assigned, status, recieved_date, letter_date, letter_type, folio_number, description } = req.body;

  // Check only for required fields
  if (!entry_id || !entry_date || !file_number || !subject || !officer_assigned || !status || !recieved_date || !letter_date || !letter_type) {
      return res.status(400).json({ error: 'Missing required fields' });
  }

  // Use null for optional fields if not provided
  const folioNumberValue = folio_number || null;
  const descriptionValue = description || null;

  const query = `
      UPDATE entries_tbl
      SET entry_date = ?, file_number = ?, subject = ?, officer_assigned = ?, recieved_date = ?, letter_date = ?, letter_type = ?, folio_number = ?, description = ?, status = ?
      WHERE entry_id = ? AND entry_category = 'Letter';
  `;
  db.run(query, [entry_date, file_number, subject, officer_assigned, recieved_date, letter_date, letter_type, folioNumberValue, descriptionValue, status, entry_id], function (err) {
      if (err) {
          console.error("Error updating letter:", err.message);
          return res.status(500).json({ error: err.message });
      }
      res.status(200).json({ message: 'Letter updated successfully' });
  });
});


  // DELETE ENTRY IN TABLE
  app.delete('/api/delete-entry/:entry_id', (req, res) => {
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
      res.status(200).json({ message: 'Entry deleted successfully' });
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


  // Server route modifications
  app.post('/api/update-entry', (req, res) => {
    const { entry_id, file_number, status } = req.body;
    if (!entry_id || !file_number || !status) {
      return res.status(400).json({ error: 'Missing required fields' });
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
        return res.status(404).json({ error: 'Entry not found' });
      }
      res.json({ message: 'Entry updated successfully' });
    });
  });

  // Start the server and handle potential port conflict
  const server = app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
  });
}

// Start the server when the app starts
startServer();
