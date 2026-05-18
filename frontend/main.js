import { app, BrowserWindow, screen, ipcMain } from 'electron';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const isDev = process.env.NODE_ENV === 'development';

// IPC communication to support overlay interaction and resizing
ipcMain.on('set-ignore-mouse-events', (event, ignore, options) => {
  const win = BrowserWindow.fromWebContents(event.sender);
  if (win) {
    win.setIgnoreMouseEvents(ignore, options);
  }
});

ipcMain.on('resize-window', (event, width, height) => {
  const win = BrowserWindow.fromWebContents(event.sender);
  if (win) {
    win.setSize(width, height);
  }
});

function createWindow() {
  const primaryDisplay = screen.getPrimaryDisplay();
  const { width, height } = primaryDisplay.workAreaSize;

  // We want a widget that stays on top, transparent, frameless.
  // We boot at 130 height because the widget is initially minimized.
  const win = new BrowserWindow({
    width: 340,
    height: 130,
    x: width - 360, // Top right corner
    y: 20,
    transparent: true,
    frame: false,
    alwaysOnTop: true,
    focusable: false,
    skipTaskbar: true,
    resizable: true,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true
    }
  });

  // Stays on top of everything, including fullscreen apps
  try {
    win.setAlwaysOnTop(true, 'screen-saver');
  } catch (err) {
    console.error("Failed to set always-on-top screen-saver level:", err);
    try {
      win.setAlwaysOnTop(true);
    } catch (e) {
      console.error("Failed to set basic always-on-top:", e);
    }
  }

  try {
    win.setVisibleOnAllWorkspaces(true, { visibleOnFullScreen: true });
  } catch (err) {
    console.error("Failed to set visible on all workspaces:", err);
  }

  // Make the window ignore mouse events if we want it strictly as an overlay, 
  // but we want it interactive, so we don't use win.setIgnoreMouseEvents(true) entirely.
  // We rely on CSS drag regions and dynamic IPC mouse-tracking.

  if (isDev) {
    win.loadURL('http://localhost:5173');
    // win.webContents.openDevTools({ mode: 'detach' });
  } else {
    win.loadFile(path.join(__dirname, 'dist', 'index.html'));
  }
}

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});
