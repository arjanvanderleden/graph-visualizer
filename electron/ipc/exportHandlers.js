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
exports.setupExportHandlers = setupExportHandlers;
const electron_1 = require("electron");
const fs = __importStar(require("fs/promises"));
function setupExportHandlers() {
    // Export as PNG handler
    electron_1.ipcMain.handle('export-png', async (event, dataUrl, defaultName) => {
        const win = electron_1.BrowserWindow.fromWebContents(event.sender);
        if (!win)
            return { success: false, error: 'No window found' };
        try {
            const result = await electron_1.dialog.showSaveDialog(win, {
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
        }
        catch (error) {
            console.error('Export PNG error:', error);
            return { success: false, error: error instanceof Error ? error.message : String(error) };
        }
    });
    // Export as SVG handler
    electron_1.ipcMain.handle('export-svg', async (event, svgData, defaultName) => {
        const win = electron_1.BrowserWindow.fromWebContents(event.sender);
        if (!win)
            return { success: false, error: 'No window found' };
        try {
            const result = await electron_1.dialog.showSaveDialog(win, {
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
        }
        catch (error) {
            console.error('Export SVG error:', error);
            return { success: false, error: error instanceof Error ? error.message : String(error) };
        }
    });
    // Copy to clipboard handler
    electron_1.ipcMain.handle('copy-to-clipboard', async (event, dataUrl) => {
        try {
            const image = electron_1.nativeImage.createFromDataURL(dataUrl);
            electron_1.clipboard.writeImage(image);
            return { success: true };
        }
        catch (error) {
            console.error('Copy to clipboard error:', error);
            return { success: false, error: error instanceof Error ? error.message : String(error) };
        }
    });
    // Get app version
    electron_1.ipcMain.handle('get-version', () => {
        return { version: process.env.npm_package_version || '1.0.0' };
    });
}
//# sourceMappingURL=exportHandlers.js.map