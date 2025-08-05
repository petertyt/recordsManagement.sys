const { app, BrowserWindow, ipcMain, dialog } = require("electron");
const path = require("path");
const ejs = require("ejs-electron");
const { autoUpdater } = require("electron-updater");
const fs = require("fs");

// SERVER ROUTES
const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const bodyParser = require('body-parser');
const { setUser, authorize } = require('./middleware/auth');

// Print userData path for debugging
console.log('userData path:', app.getPath('userData'));

// Determine the correct path for the database
let dbPath;
if (app.isPackaged) {
  // Production mode: Store the database in the userData folder
  dbPath = path.join(app.getPath('userData'), 'recordsmgmtsys.db');

  // Check if the database exists in userData; if not, copy it from resources
  if (!fs.existsSync(dbPath)) {
    const sourceDbPath = path.join(process.resourcesPath, 'database/recordsmgmtsys.db');
    console.log('Source DB Path:', sourceDbPath); // Debugging the source path

    try {
      if (fs.existsSync(sourceDbPath)) {
        fs.copyFileSync(sourceDbPath, dbPath);
        console.log('Database copied to userData folder:', dbPath);
      } else {
        console.error('Source database file not found at:', sourceDbPath);
      }
    } catch (err) {
      console.error('Error copying database file:', err.message);
    }
  } else {
    console.log('Database already exists in userData folder:', dbPath);
  }
} else {
  // Development mode: Use the local database path
  dbPath = path.resolve(__dirname, './database/recordsmgmtsys.db');
  console.log('Development mode DB Path:', dbPath); // Debugging the development path
}

// Initialize the database
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Error connecting to the database:', err.message);
  } else {
    console.log('Connected to the SQLite database at', dbPath);
  }
});
// Start Express server
function startServer() {
  const app = express();
  const PORT = process.env.PORT || 49200;

  // Middleware setup
  app.use(bodyParser.json());
  app.use(bodyParser.urlencoded({ extended: true }));
  app.use(setUser);


  // API route for user authentication (login)
  app.post('/api/login', (req, res) => {
    const { username, password } = req.body;
    if (!username || !password) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const query = `
      SELECT * FROM users_tbl WHERE username = ? AND password = ?;
    `;
    db.get(query, [username, password], (err, row) => {
      if (err) {
        console.error('Error checking user credentials:', err.message);
        return res.status(500).json({ error: err.message });
      }

      if (row) {
        res.json({ message: 'Login successful', user: row });
      } else {
        res.status(401).json({ error: 'Invalid username or password' });
      }
    });
  });

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

  // REPORTS ROUTE
  app.get('/api/make-reports', (req, res) => {
    const { start_date, end_date, officer_assigned, status, file_number, category } = req.query;
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
    if (status) {
      query += ' AND status = ?';
      params.push(status);
    }
    if (file_number) {
      query += ' AND file_number = ?';
      params.push(file_number);
    }
    if (category) {
      query += ' AND entry_category = ?';
      params.push(category);
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
  app.post('/api/add-file', authorize(['admin']), (req, res) => {
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
app.post('/api/update-file', authorize(['admin']), (req, res) => {
  const { 
    entry_id,
    entry_date,
    file_number,
    subject,
    officer_assigned,
    status,
    recieved_date,    // Correct spelling here: received_date
    date_sent,
    reciepient,        // Correct spelling here
    file_type,
    description
  } = req.body;

  // Check only for required fields
  if (!entry_id || !entry_date || !file_number || !subject || !officer_assigned || !status || !date_sent || !file_type) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  // Use null for optional fields if not provided
  const reciepientValue = reciepient || null;  // Correct spelling here
  const recievedDateValue = recieved_date || null;  // Correct spelling here
  const descriptionValue = description || null;

  const query = `
    UPDATE entries_tbl
    SET entry_date = ?, file_number = ?, subject = ?, officer_assigned = ?, recieved_date = ?, date_sent = ?, reciepient = ?, file_type = ?, description = ?, status = ?
    WHERE entry_id = ? AND entry_category = 'File';
  `;

  db.run(query, [
    entry_date,
    file_number,
    subject,
    officer_assigned,
    recievedDateValue,  // Corrected: received date
    date_sent,
    reciepientValue,     // Corrected: recipient
    file_type,
    descriptionValue,
    status,
    entry_id
  ], function (err) {
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
  app.post('/api/add-letter', authorize(['admin']), (req, res) => {
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
  app.post('/api/update-letter', authorize(['admin']), (req, res) => {
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
  app.delete('/api/delete-file/:entry_id', authorize(['admin']), (req, res) => {
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
      res.status(200).json({ message: 'File deleted successfully' });
    });
  });
  // DELETE ENTRY IN TABLE
  app.delete('/api/delete-letter/:entry_id', authorize(['admin']), (req, res) => {
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
      res.status(200).json({ message: 'Letter deleted successfully' });
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
  app.post('/api/update-entry', authorize(['admin']), (req, res) => {
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

// END SERVER ROUTES

let splashWindow;
let mainWindow;

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
ipcMain.on('login-attempt', (event, credentials) => {
  const { username, password } = credentials;

  // Query the database for the provided credentials
  db.get('SELECT * FROM users_tbl WHERE username = ? AND password = ?', [username, password], (err, row) => {
    if (err) {
      console.error('Error querying database:', err);
      event.reply('login-response', { success: false, message: 'Database error.' });
    } else if (row) {
      // Successful login
      const userData = {
        username: row.username,
        role: row.user_role // Assuming you have a role field in your table
      };
      event.reply('login-response', { success: true, userData });
      splashWindow.close();
      createMainWindow(userData); // Pass the userData to the main window
    } else {
      // Invalid credentials
      event.reply('login-response', { success: false, message: 'Incorrect username or password.' });
    }
  });
});

// Handle login success and pass userData to the main window
ipcMain.on("login-success", (event, userData) => {
  // Close the splash window
  if (splashWindow) {
    splashWindow.close();
  }

  // Create and show the main window, and pass user data
  createMainWindow(userData);  // Pass userData when creating the main window
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
  mainWindow.webContents.on('did-finish-load', () => {
    mainWindow.webContents.send('user-data', userData);  // Send user data to renderer process
  });

  mainWindow.on('closed', function () {
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

app.whenReady().then(createSplashWindow);

app.on("activate", () => {
  if (BrowserWindow.getAllWindows().length === 0) createSplashWindow();
});


app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});
