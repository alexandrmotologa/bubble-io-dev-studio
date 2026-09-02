import { app, BrowserWindow, ipcMain, shell, Menu, MenuItemConstructorOptions, dialog, clipboard, safeStorage } from 'electron';
import path from 'path';

let mainWindow: BrowserWindow | null = null;

const isDev = process.env.NODE_ENV === 'development' || !app.isPackaged;

function createAppMenu() {
  const isMac = process.platform === 'darwin';

  const template: MenuItemConstructorOptions[] = [
    ...(isMac ? [{
      label: app.name,
      submenu: [
        { role: 'about' as const },
        { type: 'separator' as const },
        { role: 'services' as const },
        { type: 'separator' as const },
        { role: 'hide' as const },
        { role: 'hideOthers' as const },
        { role: 'unhide' as const },
        { type: 'separator' as const },
        { role: 'quit' as const }
      ]
    }] : []),
    {
      label: 'File',
      submenu: [
        {
          label: 'New Project...',
          accelerator: 'CmdOrCtrl+N',
          click: () => {
            if (mainWindow) {
              mainWindow.webContents.send('menu:new-project');
            }
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
        { role: 'selectAll' }
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
      label: 'Help',
      submenu: [
        {
          label: 'MTLG Labs (mtlglabs.space)',
          click: async () => {
            await shell.openExternal('https://mtlglabs.space');
          }
        },
        {
          label: 'Author Portfolio (mtlg.site)',
          click: async () => {
            await shell.openExternal('https://mtlg.site');
          }
        },
        {
          label: 'Author GitHub (@alexandrmotologa)',
          click: async () => {
            await shell.openExternal('https://github.com/alexandrmotologa');
          }
        },
        {
          label: 'Buy Me a Coffee (Support Project)',
          click: async () => {
            await shell.openExternal('https://buymeacoffee.com/mtlg');
          }
        },
        {
          label: 'Contact Support via Email (contact@mtlglabs.space)',
          click: async () => {
            const authorEmail = 'contact@mtlglabs.space';
            clipboard.writeText(authorEmail);
            if (mainWindow) {
              mainWindow.webContents.send('toast:show', {
                type: 'success',
                title: 'Email Copied to Clipboard',
                message: `Contact email (${authorEmail}) has been copied to your clipboard.`
              });
              dialog.showMessageBox(mainWindow, {
                type: 'info',
                title: 'Email Copied',
                message: 'Contact Email Copied to Clipboard!',
                detail: `The address "${authorEmail}" was copied to your clipboard.\n\nWould you also like to open your default email client?`,
                buttons: ['OK (Just Copied)', 'Open Email Client']
              }).then(res => {
                if (res.response === 1) {
                  shell.openExternal(`mailto:${authorEmail}?subject=Bubble.io%20Dev%20Studio%20Inquiry`);
                }
              });
            }
          }
        },
        { type: 'separator' },
        {
          label: 'GitHub Repository',
          click: async () => {
            await shell.openExternal('https://github.com/alexandrmotologa/bubble-io-dev-studio');
          }
        },
        {
          label: 'Documentation & Guides',
          click: async () => {
            await shell.openExternal('https://github.com/alexandrmotologa/bubble-io-dev-studio#readme');
          }
        },
        { type: 'separator' },
        {
          label: 'About Bubble.io Dev Studio',
          click: () => {
            if (mainWindow) {
              dialog.showMessageBox(mainWindow, {
                type: 'info',
                title: 'About Bubble.io Dev Studio',
                message: 'Bubble.io Dev Studio v3.0.0 (Production Stable)',
                detail: 'All-in-one Developer Studio & GUI for Bubble.io (DevOps, Schema, Dead Code Audit, AI Translation, Visual QA)\n\nAuthor: Alexandr Motologa | MTLG Labs\nStudio: https://mtlglabs.space\nPersonal Hub: https://mtlg.site\nGitHub: https://github.com/alexandrmotologa\nSupport: https://buymeacoffee.com/mtlg\nEmail: contact@mtlglabs.space',
                buttons: ['OK']
              });
            }
          }
        }
      ]
    }
  ];

  const menu = Menu.buildFromTemplate(template);
  Menu.setApplicationMenu(menu);
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1380,
    height: 900,
    minWidth: 1080,
    minHeight: 700,
    title: 'Bubble.io Dev Studio',
    icon: process.platform === 'win32'
      ? path.join(__dirname, '../build/icon.ico')
      : path.join(__dirname, '../build/icon.png'),
    backgroundColor: '#080b11',
    titleBarStyle: process.platform === 'darwin' ? 'hiddenInset' : 'default',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: false
    }
  });

  createAppMenu();

  if (isDev) {
    mainWindow.loadURL('http://localhost:5173');
    // mainWindow.webContents.openDevTools({ mode: 'detach' });
  } else {
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'));
  }

  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  // Handle external links opening in user's default browser
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    if (url.startsWith('https:') || url.startsWith('http:') || url.startsWith('mailto:')) {
      shell.openExternal(url);
    }
    return { action: 'deny' };
  });
}

app.whenReady().then(() => {
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// IPC handlers
ipcMain.handle('shell:open-external', async (_event, url: string) => {
  if (url && (url.startsWith('https://') || url.startsWith('http://') || url.startsWith('mailto:'))) {
    await shell.openExternal(url);
  }
});

ipcMain.handle('http:fetch', async (_event, url: string, headers?: Record<string, string>) => {
  try {
    const res = await fetch(url, { method: 'GET', headers: headers || {} });
    const data = await res.json().catch(() => null);
    return { ok: res.ok, status: res.status, data };
  } catch (err: any) {
    return { ok: false, error: err.message };
  }
});

// Issue #4 Fix: Native safeStorage encryption for API tokens & credentials
ipcMain.handle('secure:encrypt', async (_event, plainText: string) => {
  if (!plainText || typeof plainText !== 'string') return '';
  try {
    if (safeStorage && safeStorage.isEncryptionAvailable()) {
      const encrypted = safeStorage.encryptString(plainText);
      return `enc:${encrypted.toString('base64')}`;
    }
  } catch (e) {
    console.warn('safeStorage encryption warning:', e);
  }
  return plainText;
});

ipcMain.handle('secure:decrypt', async (_event, cipherText: string) => {
  if (!cipherText || typeof cipherText !== 'string') return '';
  if (cipherText.startsWith('enc:') && safeStorage && safeStorage.isEncryptionAvailable()) {
    try {
      const buffer = Buffer.from(cipherText.slice(4), 'base64');
      return safeStorage.decryptString(buffer);
    } catch (e) {
      console.warn('safeStorage decryption warning:', e);
      return cipherText;
    }
  }
  return cipherText;
});

ipcMain.handle('secure:is-available', async () => {
  return safeStorage ? safeStorage.isEncryptionAvailable() : false;
});

// Issue #3 Fix: Real headless page screenshot capture for Bubble visual testing
ipcMain.handle('visual:capture-page', async (_event, targetUrl: string, width: number, height: number, customHeaders?: Record<string, string>) => {
  let captureWin: BrowserWindow | null = null;
  const targetW = Math.max(320, width || 1920);
  const targetH = Math.max(240, height || 1080);

  try {
    captureWin = new BrowserWindow({
      width: targetW,
      height: targetH,
      show: false,
      useContentSize: true,
      webPreferences: {
        offscreen: true,
        sandbox: true,
        webSecurity: false
      }
    });

    if (customHeaders && Object.keys(customHeaders).length > 0) {
      captureWin.webContents.session.webRequest.onBeforeSendHeaders((details, callback) => {
        callback({ requestHeaders: { ...details.requestHeaders, ...customHeaders } });
      });
    }

    await captureWin.loadURL(targetUrl);
    // Allow dynamic UI, fonts, and client workflows 1200ms to paint
    await new Promise(r => setTimeout(r, 1200));

    const image = await captureWin.webContents.capturePage({ x: 0, y: 0, width: targetW, height: targetH });
    const dataUrl = image.toDataURL();
    return { success: true, dataUrl, width: targetW, height: targetH };
  } catch (err: any) {
    return { success: false, error: err.message || 'Page capture failed' };
  } finally {
    if (captureWin) {
      captureWin.destroy();
      captureWin = null;
    }
  }
});
