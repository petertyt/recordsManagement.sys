const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("electronAPI", {
  sendLoginAttempt: (credentials) =>
    ipcRenderer.send("login-attempt", credentials),
  onLoginResponse: (callback) =>
    ipcRenderer.on("login-response", (event, response) => callback(response)),
  onUserData: (callback) =>
    ipcRenderer.on("user-data", (event, userData) => callback(userData)),
  onUpdateMessage: (callback) =>
    ipcRenderer.on("update-message", (event, message) => callback(message)),
  onUpdateDownloaded: (callback) =>
    ipcRenderer.on("update-downloaded", () => callback()),
  restartApp: () => ipcRenderer.send("restart_app"),
  signOut: (sessionToken) => ipcRenderer.send("sign-out", sessionToken),
  onShowCloseButton: (callback) =>
    ipcRenderer.on("show-close-button", () => callback()),
  closeApp: () => ipcRenderer.send("close-app"),
});
