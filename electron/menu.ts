import { Menu, MenuItemConstructorOptions, BrowserWindow, app, shell } from 'electron';

export function createMenu(mainWindow: BrowserWindow): Menu {
  const isMac = process.platform === 'darwin';

  const template = [
    ...(isMac ? [{
      label: app.getName(),
      submenu: [
        { role: 'about' } as const,
        { type: 'separator' } as const,
        { role: 'services', submenu: [] },
        { type: 'separator' } as const,
        { role: 'hide' },
        { role: 'hideOthers' },
        { role: 'unhide' },
        { type: 'separator' } as const,
        { role: 'quit' }
      ]
    }] : []),
    {
      label: 'File',
      submenu: [
        {
          label: 'Open...',
          accelerator: 'CmdOrCtrl+O',
          click: () => {
            mainWindow.webContents.send('menu-open-file');
          }
        },
        {
          label: 'Save...',
          accelerator: 'CmdOrCtrl+S',
          click: () => {
            mainWindow.webContents.send('menu-save-file');
          }
        },
        { type: 'separator' } as const,
        {
          label: 'Export as PNG',
          accelerator: 'CmdOrCtrl+Shift+P',
          click: () => {
            mainWindow.webContents.send('menu-export-png');
          }
        },
        {
          label: 'Export as SVG',
          accelerator: 'CmdOrCtrl+Shift+S',
          click: () => {
            mainWindow.webContents.send('menu-export-svg');
          }
        },
        { type: 'separator' } as const,
        isMac ? { role: 'close' } : { role: 'quit' }
      ]
    },
    {
      label: 'Edit',
      submenu: [
        { role: 'undo' },
        { role: 'redo' },
        { type: 'separator' } as const,
        { role: 'cut' },
        { role: 'copy' },
        { role: 'paste' },
        ...(isMac ? [
          { role: 'pasteAndMatchStyle' },
          { role: 'delete' },
          { role: 'selectAll' },
        ] : [
          { role: 'delete' },
          { type: 'separator' } as const,
          { role: 'selectAll' }
        ])
      ]
    },
    {
      label: 'View',
      submenu: [
        { role: 'reload' },
        { role: 'forceReload' },
        { role: 'toggleDevTools' },
        { type: 'separator' } as const,
        { role: 'resetZoom' },
        { role: 'zoomIn' },
        { role: 'zoomOut' },
        { type: 'separator' } as const,
        { role: 'togglefullscreen' }
      ]
    },
    {
      label: 'Window',
      submenu: [
        { role: 'minimize' },
        { role: 'close' },
        ...(isMac ? [
          { type: 'separator' } as const,
          { role: 'front' },
          { type: 'separator' } as const,
          { role: 'window' }
        ] : [])
      ]
    },
    {
      label: 'Help',
      submenu: [
        {
          label: 'About Graph Visualizer',
          click: () => {
            shell.openExternal('https://github.com/your-repo/graph-visualizer');
          }
        },
        {
          label: 'Learn More',
          click: () => {
            shell.openExternal('https://electronjs.org');
          }
        }
      ]
    }
  ];

  return Menu.buildFromTemplate(template as MenuItemConstructorOptions[]);
}

