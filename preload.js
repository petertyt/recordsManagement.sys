
const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  sendLoginAttempt: (credentials) => ipcRenderer.send('login-attempt', credentials),
  onLoginResponse: (callback) => ipcRenderer.on('login-response', (event, response) => callback(response)),
  onUserData: (callback) => ipcRenderer.on('user-data', (event, userData) => callback(userData)),
  signOut: () => ipcRenderer.send('sign-out')
});
