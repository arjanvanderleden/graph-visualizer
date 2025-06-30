"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.setupFileHandlers = setupFileHandlers;
const electron_1 = require("electron");
const fs = __importStar(require("fs/promises"));
const path = __importStar(require("path"));
function setupFileHandlers() {
    // Save file handler
    electron_1.ipcMain.handle('save-file', async (event, data, defaultName) => {
        const win = electron_1.BrowserWindow.fromWebContents(event.sender);
        if (!win)
            return { success: false, error: 'No window found' };
        try {
            const result = await electron_1.dialog.showSaveDialog(win, {
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
        }
        catch (error) {
            console.error('Save file error:', error);
            return { success: false, error: error instanceof Error ? error.message : String(error) };
        }
    });
    // Load file handler
    electron_1.ipcMain.handle('load-file', async (event) => {
        const win = electron_1.BrowserWindow.fromWebContents(event.sender);
        if (!win)
            return { success: false, error: 'No window found' };
        try {
            const result = await electron_1.dialog.showOpenDialog(win, {
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
        }
        catch (error) {
            console.error('Load file error:', error);
            return { success: false, error: error instanceof Error ? error.message : String(error) };
        }
    });
}
//# sourceMappingURL=fileHandlers.js.map