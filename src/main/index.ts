import { app, BrowserWindow, dialog, Menu } from 'electron';
import { join } from 'path';
import { registerProjectHandlers } from './project/projectController';
import { registerSourceHandlers } from './sourceService/sourceController';
import { registerTranslationHandlers } from './translationService/translationController';
import { registerTooltipHandlers } from './tooltip/tooltipController';
import { registerProjectSelectHandlers } from './project/projectSelectController';
import { registerStoreHandlers } from './store/storeController';

const isDev = !app.isPackaged;
const DEV_PORT = process.env.DEV_PORT || '5173';
const DEV_URL = `http://localhost:${DEV_PORT}`;

function setupMenu() {
  const isMac = process.platform === 'darwin';

  const template: Electron.MenuItemConstructorOptions[] = [
    ...(isMac ? [{ role: 'appMenu' as const }] : []),
    {
      label: 'File',
      submenu: [
        {
          label: 'Load New Folder',
          accelerator: 'CmdOrCtrl+O',
          click: async (_menuItem, browserWindow) => {
            if (!(browserWindow instanceof BrowserWindow)) return;
            const result = await dialog.showOpenDialog(browserWindow, {
              properties: ['openDirectory'],
            });
            if (!result.canceled && result.filePaths.length > 0) {
              browserWindow.webContents.send('menu-load-folder', result.filePaths[0]);
            }
          },
        },
        ...(isMac ? [{ role: 'close' as const }] : [{ role: 'quit' as const }]),
      ],
    },
    { role: 'editMenu' },
    { role: 'viewMenu' },
    { role: 'windowMenu' },
  ];

  const menu = Menu.buildFromTemplate(template);
  Menu.setApplicationMenu(menu);
}

function createWindow() {
  const win = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      preload: join(__dirname, 'preload.cjs'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  if (isDev) {
    win.loadURL(DEV_URL);
    win.webContents.openDevTools();
  } else {
    win.loadFile(join(__dirname, '../dist/index.html'));
  }
}

app.whenReady().then(() => {
  setupMenu();
  registerProjectHandlers();
  registerSourceHandlers();
  registerTranslationHandlers();
  registerTooltipHandlers();
  registerProjectSelectHandlers();
  registerStoreHandlers();
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
