import { app, BrowserWindow, Menu, shell } from 'electron';
import * as path from 'path';
import { setupFileHandlers } from './ipc/fileHandlers';
import { setupExportHandlers } from './ipc/exportHandlers';
import { createMenu } from './menu';

// __dirname is available in CommonJS

let mainWindow: BrowserWindow | null = null;
const isDev = process.env.NODE_ENV !== 'production';

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
    titleBarStyle: 'default',
    title: 'Graph Visualizer',
    icon: path.join(__dirname, '../public/icon.png'), // Add an icon later
  });

  // Load the app
  if (isDev) {
    mainWindow.loadURL('http://localhost:5173');
    mainWindow.webContents.openDevTools();
  } else {
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'));
  }

  // Set up the menu
  const menu = createMenu(mainWindow);
  Menu.setApplicationMenu(menu);

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

// Security: Prevent new window creation
app.on('web-contents-created', (event, contents) => {
  contents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: 'deny' };
  });
});

app.whenReady().then(() => {
  // Set up IPC handlers
  setupFileHandlers();
  setupExportHandlers();
  
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// Handle protocol for production builds
if (!isDev) {
  app.setAsDefaultProtocolClient('graph-visualizer');
}