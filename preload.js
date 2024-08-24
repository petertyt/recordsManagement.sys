const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  sendLoginSuccess: () => ipcRenderer.send('login-success'),
  signOut: () => ipcRenderer.send('sign-out'), // New function to handle sign-out
});
