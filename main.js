const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');

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
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      enableRemoteModule: false,
      nodeIntegration: true,
    },
    icon: path.join(__dirname, 'assets/icons/ico/icon-exe.ico'),
  });

  splashWindow.loadFile('src/splash-page/splash.html');
}

function createMainWindow() {
  mainWindow = new BrowserWindow({
    width: 1920,
    height: 1080,
    frame: false,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      enableRemoteModule: false,
      nodeIntegration: true,
    },
    icon: path.join(__dirname, 'assets/icons/ico/icon-exe.ico'),
  });

  mainWindow.loadFile('src/index.html');
}

ipcMain.on('login-success', () => {
  if (splashWindow) {
    splashWindow.close();
  }
  
  createMainWindow();
});

app.whenReady().then(createSplashWindow);

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createSplashWindow();
  }
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});