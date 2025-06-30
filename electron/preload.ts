import { contextBridge, ipcRenderer } from 'electron';

// Define the API that will be exposed to the renderer process
const electronAPI = {
  // File operations
  saveFile: (data: string, defaultName: string) => 
    ipcRenderer.invoke('save-file', data, defaultName),
  
  loadFile: () => 
    ipcRenderer.invoke('load-file'),
  
  // Export operations
  exportAsPNG: (dataUrl: string, defaultName: string) => 
    ipcRenderer.invoke('export-png', dataUrl, defaultName),
  
  exportAsSVG: (svgData: string, defaultName: string) => 
    ipcRenderer.invoke('export-svg', svgData, defaultName),
  
  copyToClipboard: (dataUrl: string) => 
    ipcRenderer.invoke('copy-to-clipboard', dataUrl),
  
  // App info
  getVersion: () => 
    ipcRenderer.invoke('get-version'),
  
  // Platform detection
  platform: process.platform,
};

// Expose the API to the renderer process
contextBridge.exposeInMainWorld('electron', electronAPI);

// Type definitions for TypeScript
export type ElectronAPI = typeof electronAPI;