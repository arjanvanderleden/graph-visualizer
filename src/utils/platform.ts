// Platform detection and abstraction for web/electron differences

export const isElectron = (): boolean => {
  return typeof window !== "undefined" && window.electron !== undefined;
};

export const isWeb = (): boolean => {
  return !isElectron();
};

// File operations abstraction
export const fileOperations = {
  canSaveNatively: (): boolean => isElectron(),
  canLoadNatively: (): boolean => isElectron(),

  saveFile: async (
    data: string,
    defaultName: string
  ): Promise<{ success: boolean; filePath?: string; error?: string }> => {
    if (isElectron()) {
      return window.electron.saveFile(data, defaultName);
    } else {
      // Web fallback - download file
      try {
        const blob = new Blob([data], { type: "application/json" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = defaultName;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        return { success: true };
      } catch (error) {
        return { success: false, error: error instanceof Error ? error.message : String(error) };
      }
    }
  },

  loadFile: async (): Promise<{ success: boolean; data?: string; fileName?: string; error?: string }> => {
    if (isElectron()) {
      return window.electron.loadFile();
    } else {
      // Web fallback - file input
      return new Promise((resolve) => {
        const input = document.createElement("input");
        input.type = "file";
        input.accept = ".json";
        input.onchange = async (e) => {
          const file = (e.target as HTMLInputElement).files?.[0];
          if (!file) {
            resolve({ success: false, error: "No file selected" });
            return;
          }
          try {
            const data = await file.text();
            resolve({ success: true, data, fileName: file.name });
          } catch (error) {
            resolve({ success: false, error: error instanceof Error ? error.message : String(error) });
          }
        };
        input.click();
      });
    }
  },
};

// Export operations abstraction
export const exportOperations = {
  exportPNG: async (
    dataUrl: string,
    defaultName: string
  ): Promise<{ success: boolean; filePath?: string; error?: string }> => {
    if (isElectron()) {
      return window.electron.exportAsPNG(dataUrl, defaultName);
    } else {
      // Web fallback
      try {
        const a = document.createElement("a");
        a.href = dataUrl;
        a.download = defaultName;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        return { success: true };
      } catch (error) {
        return { success: false, error: error instanceof Error ? error.message : String(error) };
      }
    }
  },

  exportSVG: async (
    svgData: string,
    defaultName: string
  ): Promise<{ success: boolean; filePath?: string; error?: string }> => {
    if (isElectron()) {
      return window.electron.exportAsSVG(svgData, defaultName);
    } else {
      // Web fallback
      try {
        const blob = new Blob([svgData], { type: "image/svg+xml" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = defaultName;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        return { success: true };
      } catch (error) {
        return { success: false, error: error instanceof Error ? error.message : String(error) };
      }
    }
  },

  copyToClipboard: async (dataUrl: string): Promise<{ success: boolean; error?: string }> => {
    if (isElectron()) {
      return window.electron.copyToClipboard(dataUrl);
    } else {
      // Web fallback using Clipboard API
      try {
        const response = await fetch(dataUrl);
        const blob = await response.blob();
        const item = new ClipboardItem({ [blob.type]: blob });
        await navigator.clipboard.write([item]);
        return { success: true };
      } catch (error) {
        return { success: false, error: error instanceof Error ? error.message : String(error) };
      }
    }
  },
};
