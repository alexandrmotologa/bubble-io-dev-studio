import { app, BrowserWindow, ipcMain, shell, Menu, MenuItemConstructorOptions, dialog, clipboard } from 'electron';
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
          label: 'Contact Author via Email (mtlg.labs.contact@gmail.com)',
          click: async () => {
            const authorEmail = 'mtlg.labs.contact@gmail.com';
            clipboard.writeText(authorEmail);
            if (mainWindow) {
              mainWindow.webContents.send('toast:show', {
                type: 'success',
                title: 'Email Copied to Clipboard',
                message: `Author email (${authorEmail}) has been copied to your clipboard.`
              });
              dialog.showMessageBox(mainWindow, {
                type: 'info',
                title: 'Email Copied',
                message: 'Author Email Copied to Clipboard!',
                detail: `The contact address "${authorEmail}" was copied to your clipboard.\n\nWould you also like to open your default email client?`,
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
                message: 'Bubble.io Dev Studio v1.4.0',
                detail: 'All-in-one Developer Studio & GUI for Bubble.io (DevOps, Schema, Dead Code Audit, AI Translation, Visual QA)\n\nAuthor: Alexandr Motologa | MTLG Labs\nSupport: https://buymeacoffee.com/mtlg\nEmail: mtlg.labs.contact@gmail.com\nGitHub: https://github.com/alexandrmotologa',
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
  if (url && (url.startsWith('https://') || url.startsWith('http://'))) {
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
