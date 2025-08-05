const { app, BrowserWindow, ipcMain, dialog } = require("electron");
const path = require("path");
const ejs = require("ejs-electron");
const { autoUpdater } = require("electron-updater");
const fs = require("fs");

// SERVER ROUTES
const sqlite3 = require('sqlite3').verbose();

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
// Initialize Express server
const createServerApp = require('./src/server/app');
const serverApp = createServerApp(db);
const PORT = process.env.PORT || 49200;
serverApp.listen(PORT, () => {
  console.log('Server is running on port ' + PORT);
});

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
