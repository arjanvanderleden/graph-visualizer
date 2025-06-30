import { ipcMain, dialog, BrowserWindow } from 'electron';
import * as fs from 'fs/promises';
import * as path from 'path';

export function setupFileHandlers() {
  // Save file handler
  ipcMain.handle('save-file', async (event, data: string, defaultName: string) => {
    const win = BrowserWindow.fromWebContents(event.sender);
    if (!win) return { success: false, error: 'No window found' };

    try {
      const result = await dialog.showSaveDialog(win, {
        defaultPath: defaultName,
        filters: [
          { name: 'JSON Files', extensions: ['json'] },
          { name: 'All Files', extensions: ['*'] }
        ]
      });

      if (result.canceled || !result.filePath) {
        return { success: false, canceled: true };
      }

      await fs.writeFile(result.filePath, data, 'utf-8');
      return { success: true, filePath: result.filePath };
    } catch (error) {
      console.error('Save file error:', error);
      return { success: false, error: error instanceof Error ? error.message : String(error) };
    }
  });

  // Load file handler
  ipcMain.handle('load-file', async (event) => {
    const win = BrowserWindow.fromWebContents(event.sender);
    if (!win) return { success: false, error: 'No window found' };

    try {
      const result = await dialog.showOpenDialog(win, {
        properties: ['openFile'],
        filters: [
          { name: 'JSON Files', extensions: ['json'] },
          { name: 'All Files', extensions: ['*'] }
        ]
      });

      if (result.canceled || result.filePaths.length === 0) {
        return { success: false, canceled: true };
      }

      const filePath = result.filePaths[0];
      const data = await fs.readFile(filePath, 'utf-8');
      const fileName = path.basename(filePath);
      
      return { 
        success: true, 
        data, 
        fileName,
        filePath 
      };
    } catch (error) {
      console.error('Load file error:', error);
      return { success: false, error: error instanceof Error ? error.message : String(error) };
    }
  });
}

