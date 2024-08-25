const { app, BrowserWindow, ipcMain } = require("electron");
const path = require("path");
const ejs = require("ejs-electron");

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
    autoHideMenuBar: true, // This hides the menu bar by default
    icon: path.join(__dirname, "assets/icons/ico/icon-exe.ico"),

  });

  mainWindow.loadFile("src/index.ejs");
}

// Handle Log In Authentication
ipcMain.on("login-success", () => {
  if (splashWindow) {
    splashWindow.close();
  }

  createMainWindow();
});

// Handle sign out request
ipcMain.on("sign-out", () => {
  if (mainWindow) {
    mainWindow.close();
    mainWindow = null;
  }
  createSplashWindow(); // Reopen the splash screen
});

app.whenReady().then(createSplashWindow);

app.on("activate", () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createSplashWindow();
  }
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});
