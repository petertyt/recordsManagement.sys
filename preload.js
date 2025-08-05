
const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  sendLoginAttempt: (credentials) => ipcRenderer.send('login-attempt', credentials),
  onLoginResponse: (callback) => ipcRenderer.once('login-response', (_event, response) => callback(response)),
  onUserData: (callback) => ipcRenderer.on('user-data', (_event, userData) => callback(userData))
});
