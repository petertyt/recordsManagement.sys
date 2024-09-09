const { contextBridge, ipcRenderer } = require('electron');

// Expose login functionality to renderer process
contextBridge.exposeInMainWorld('electronAPI', {
    sendLoginAttempt: (credentials) => ipcRenderer.send('login-attempt', credentials),
    onLoginResponse: (callback) => ipcRenderer.on('login-response', callback)
});
