
const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  sendLoginAttempt: (credentials) => ipcRenderer.send('login-attempt', credentials),
  onLoginResponse: (callback) => ipcRenderer.on('login-response', (event, response) => callback(response)),
  onUserData: (callback) => ipcRenderer.on('user-data', (event, userData) => callback(userData)),
<<<<<<< HEAD
  onUpdateMessage: (callback) => ipcRenderer.on('update-message', (event, message) => callback(message)),
  onUpdateDownloaded: (callback) => ipcRenderer.on('update-downloaded', () => callback()),
  restartApp: () => ipcRenderer.send('restart_app')
=======
  signOut: () => ipcRenderer.send('sign-out')
>>>>>>> f197a8349e23e151d20c4c876eafef3317f8bf7a
});
