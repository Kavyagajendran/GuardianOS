const { contextBridge, ipcRenderer } = require('electron');

// Expose standard IPC methods to the React frontend securely
contextBridge.exposeInMainWorld('electronAPI', {
  send: (channel, ...args) => ipcRenderer.send(channel, ...args),
  on: (channel, callback) => ipcRenderer.on(channel, (event, ...args) => callback(...args))
});
