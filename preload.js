
const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  sendLoginAttempt: (credentials) => ipcRenderer.send('login-attempt', credentials),

  onLoginResponse: (callback) => {
    const listener = (_event, response) => callback(response);
    ipcRenderer.on('login-response', listener);
    return () => ipcRenderer.removeListener('login-response', listener);
  },

  onUserData: (callback) => {
    const listener = (_event, userData) => callback(userData);
    ipcRenderer.on('user-data', listener);
    return () => ipcRenderer.removeListener('user-data', listener);
  }
});
