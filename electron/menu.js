"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createMenu = createMenu;
const electron_1 = require("electron");
function createMenu(mainWindow) {
    const isMac = process.platform === 'darwin';
    const template = [
        ...(isMac ? [{
                label: electron_1.app.getName(),
                submenu: [
                    { role: 'about' },
                    { type: 'separator' },
                    { role: 'services', submenu: [] },
                    { type: 'separator' },
                    { role: 'hide' },
                    { role: 'hideOthers' },
                    { role: 'unhide' },
                    { type: 'separator' },
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
                { type: 'separator' },
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
                { type: 'separator' },
                isMac ? { role: 'close' } : { role: 'quit' }
            ]
        },
        {
            label: 'Edit',
            submenu: [
                { role: 'undo' },
                { role: 'redo' },
                { type: 'separator' },
                { role: 'cut' },
                { role: 'copy' },
                { role: 'paste' },
                ...(isMac ? [
                    { role: 'pasteAndMatchStyle' },
                    { role: 'delete' },
                    { role: 'selectAll' },
                ] : [
                    { role: 'delete' },
                    { type: 'separator' },
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
                { type: 'separator' },
                { role: 'resetZoom' },
                { role: 'zoomIn' },
                { role: 'zoomOut' },
                { type: 'separator' },
                { role: 'togglefullscreen' }
            ]
        },
        {
            label: 'Window',
            submenu: [
                { role: 'minimize' },
                { role: 'close' },
                ...(isMac ? [
                    { type: 'separator' },
                    { role: 'front' },
                    { type: 'separator' },
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
                        electron_1.shell.openExternal('https://github.com/your-repo/graph-visualizer');
                    }
                },
                {
                    label: 'Learn More',
                    click: () => {
                        electron_1.shell.openExternal('https://electronjs.org');
                    }
                }
            ]
        }
    ];
    return electron_1.Menu.buildFromTemplate(template);
}
//# sourceMappingURL=menu.js.map