import { ipcMain, dialog, BrowserWindow, clipboard, nativeImage } from 'electron';
import * as fs from 'fs/promises';

export function setupExportHandlers() {
  // Export as PNG handler
  ipcMain.handle('export-png', async (event, dataUrl: string, defaultName: string) => {
    const win = BrowserWindow.fromWebContents(event.sender);
    if (!win) return { success: false, error: 'No window found' };

    try {
      const result = await dialog.showSaveDialog(win, {
        defaultPath: defaultName,
        filters: [
          { name: 'PNG Images', extensions: ['png'] },
          { name: 'All Files', extensions: ['*'] }
        ]
      });

      if (result.canceled || !result.filePath) {
        return { success: false, canceled: true };
      }

      // Convert data URL to buffer
      const base64Data = dataUrl.replace(/^data:image\/png;base64,/, '');
      const buffer = Buffer.from(base64Data, 'base64');
      
      await fs.writeFile(result.filePath, buffer);
      return { success: true, filePath: result.filePath };
    } catch (error) {
      console.error('Export PNG error:', error);
      return { success: false, error: error instanceof Error ? error.message : String(error) };
    }
  });

  // Export as SVG handler
  ipcMain.handle('export-svg', async (event, svgData: string, defaultName: string) => {
    const win = BrowserWindow.fromWebContents(event.sender);
    if (!win) return { success: false, error: 'No window found' };

    try {
      const result = await dialog.showSaveDialog(win, {
        defaultPath: defaultName,
        filters: [
          { name: 'SVG Images', extensions: ['svg'] },
          { name: 'All Files', extensions: ['*'] }
        ]
      });

      if (result.canceled || !result.filePath) {
        return { success: false, canceled: true };
      }

      await fs.writeFile(result.filePath, svgData, 'utf-8');
      return { success: true, filePath: result.filePath };
    } catch (error) {
      console.error('Export SVG error:', error);
      return { success: false, error: error instanceof Error ? error.message : String(error) };
    }
  });

  // Copy to clipboard handler
  ipcMain.handle('copy-to-clipboard', async (event, dataUrl: string) => {
    try {
      const image = nativeImage.createFromDataURL(dataUrl);
      clipboard.writeImage(image);
      return { success: true };
    } catch (error) {
      console.error('Copy to clipboard error:', error);
      return { success: false, error: error instanceof Error ? error.message : String(error) };
    }
  });

  // Get app version
  ipcMain.handle('get-version', () => {
    return { version: process.env.npm_package_version || '1.0.0' };
  });
}

