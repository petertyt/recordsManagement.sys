const { app, BrowserWindow, ipcMain } = require("electron");
const path = require("path");
const ejs = require("ejs-electron");
const { spawn } = require("child_process");

// Import the Express server directly
const express = require("express");
const sqlite3 = require("sqlite3").verbose();
const bodyParser = require("body-parser");

// Start Express server
function startServer() {
    const app = express();
    const PORT = process.env.PORT || 3000;

    // Path to the SQLite database
    const dbPath = path.resolve(__dirname, './database/recordsmgmtsys.db');
    const db = new sqlite3.Database(dbPath, (err) => {
        if (err) {
            console.error('Error connecting to the database:', err.message);
        } else {
            console.log('Connected to the SQLite database.');
        }
    });

    // Middleware setup
    app.use(bodyParser.json());
    app.use(bodyParser.urlencoded({ extended: true }));

    // Define routes here
    app.get('/api/recent-entries', (req, res) => {
        const query = `
            SELECT entry_id, entry_date, entry_category, file_number, file_subject, officer_assigned, status
            FROM entries_tbl
            ORDER BY entry_date DESC
            LIMIT 10;
        `;
        db.all(query, [], (err, rows) => {
            if (err) {
                return res.status(500).json({ error: err.message });
            }
            res.json({ data: rows });
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


    app.get('/api/entries', (req, res) => {
        const { category } = req.query;
        const query = `
            SELECT *
            FROM entries_tbl
            WHERE entry_category = ?;
        `;
        db.all(query, [category], (err, rows) => {
            if (err) {
                return res.status(500).json({ error: err.message });
            }
            res.json({ data: rows });
        });
    });

    // Start the server and handle potential port conflict
    const server = app.listen(PORT, () => {
        console.log(`Server is running on port ${PORT}`);
    });

    server.on('error', (error) => {
        if (error.code === 'EADDRINUSE') {
            console.log(`Port ${PORT} is already in use. Trying another port...`);
            server.listen(0); // This will assign a random available port
        } else {
            console.error('Server error:', error);
        }
    });
}

// Start the server when the app starts
startServer();


let splashWindow;
let mainWindow;

function createSplashWindow() {
  splashWindow = new BrowserWindow({
    width: 900,
    height: 600,
    frame: false,
    transparent: true,
    alwaysOnTop: true,
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

function createMainWindow() {
  mainWindow = new BrowserWindow({
    width: 1920,
    height: 1080,
    frame: true,
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      enableRemoteModule: false,
      nodeIntegration: true,
    },
    autoHideMenuBar: true,
    icon: path.join(__dirname, "assets/icons/ico/icon-exe.ico"),
  });

  mainWindow.loadFile("src/index.ejs");
}

ipcMain.on("login-success", () => {
  if (splashWindow) splashWindow.close();
  createMainWindow();
});

ipcMain.on("sign-out", () => {
  if (mainWindow) {
    mainWindow.close();
    mainWindow = null;
  }
  createSplashWindow();
});

app.whenReady().then(createSplashWindow);

app.on("activate", () => {
  if (BrowserWindow.getAllWindows().length === 0) createSplashWindow();
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});
