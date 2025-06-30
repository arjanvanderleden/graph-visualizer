"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const electron_1 = require("electron");
// Define the API that will be exposed to the renderer process
const electronAPI = {
    // File operations
    saveFile: (data, defaultName) => electron_1.ipcRenderer.invoke('save-file', data, defaultName),
    loadFile: () => electron_1.ipcRenderer.invoke('load-file'),
    // Export operations
    exportAsPNG: (dataUrl, defaultName) => electron_1.ipcRenderer.invoke('export-png', dataUrl, defaultName),
    exportAsSVG: (svgData, defaultName) => electron_1.ipcRenderer.invoke('export-svg', svgData, defaultName),
    copyToClipboard: (dataUrl) => electron_1.ipcRenderer.invoke('copy-to-clipboard', dataUrl),
    // App info
    getVersion: () => electron_1.ipcRenderer.invoke('get-version'),
    // Platform detection
    platform: process.platform,
};
// Expose the API to the renderer process
electron_1.contextBridge.exposeInMainWorld('electron', electronAPI);
//# sourceMappingURL=preload.js.map