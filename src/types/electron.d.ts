// Type definitions for Electron API exposed to renderer

export interface ElectronAPI {
  // File operations
  saveFile: (data: string, defaultName: string) => Promise<{
    success: boolean;
    filePath?: string;
    canceled?: boolean;
    error?: string;
  }>;
  
  loadFile: () => Promise<{
    success: boolean;
    data?: string;
    fileName?: string;
    filePath?: string;
    canceled?: boolean;
    error?: string;
  }>;
  
  // Export operations
  exportAsPNG: (dataUrl: string, defaultName: string) => Promise<{
    success: boolean;
    filePath?: string;
    canceled?: boolean;
    error?: string;
  }>;
  
  exportAsSVG: (svgData: string, defaultName: string) => Promise<{
    success: boolean;
    filePath?: string;
    canceled?: boolean;
    error?: string;
  }>;
  
  copyToClipboard: (dataUrl: string) => Promise<{
    success: boolean;
    error?: string;
  }>;
  
  // App info
  getVersion: () => Promise<{ version: string }>;
  
  // Platform
  platform: NodeJS.Platform;
}

declare global {
  interface Window {
    electron: ElectronAPI;
  }
}