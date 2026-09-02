import { contextBridge, ipcRenderer } from 'electron';

export interface ElectronAPI {
  platform: string;
  versions: {
    node: string;
    chrome: string;
    electron: string;
  };
  sendToMain: (channel: string, data: any) => void;
  receiveFromMain: (channel: string, func: (...args: any[]) => void) => () => void;
  openExternal: (url: string) => Promise<void>;
  fetchHttp: (url: string, headers?: Record<string, string>) => Promise<{ ok: boolean; status?: number; data?: any; error?: string }>;
  secureEncrypt: (plainText: string) => Promise<string>;
  secureDecrypt: (cipherText: string) => Promise<string>;
  isEncryptionAvailable: () => Promise<boolean>;
  capturePage: (url: string, width: number, height: number, headers?: Record<string, string>) => Promise<{ success: boolean; dataUrl?: string; error?: string; width?: number; height?: number }>;
}

const api: ElectronAPI = {
  platform: process.platform,
  versions: {
    node: process.versions.node,
    chrome: process.versions.chrome,
    electron: process.versions.electron
  },
  sendToMain: (channel, data) => {
    ipcRenderer.send(channel, data);
  },
  receiveFromMain: (channel, func) => {
    const subscription = (_event: any, ...args: any[]) => func(...args);
    ipcRenderer.on(channel, subscription);
    return () => {
      ipcRenderer.removeListener(channel, subscription);
    };
  },
  openExternal: async (url: string) => {
    return ipcRenderer.invoke('shell:open-external', url);
  },
  fetchHttp: async (url: string, headers?: Record<string, string>) => {
    return ipcRenderer.invoke('http:fetch', url, headers);
  },
  secureEncrypt: async (plainText: string) => {
    return ipcRenderer.invoke('secure:encrypt', plainText);
  },
  secureDecrypt: async (cipherText: string) => {
    return ipcRenderer.invoke('secure:decrypt', cipherText);
  },
  isEncryptionAvailable: async () => {
    return ipcRenderer.invoke('secure:is-available');
  },
  capturePage: async (url: string, width: number, height: number, headers?: Record<string, string>) => {
    return ipcRenderer.invoke('visual:capture-page', url, width, height, headers);
  }
};

contextBridge.exposeInMainWorld('electronAPI', api);
