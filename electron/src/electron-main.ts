import { app, BrowserWindow, ipcMain, dialog, Menu } from 'electron';
import { join, relative, resolve } from 'path';
import { homedir, tmpdir } from 'os';
import { mkdir, mkdtemp, readdir, readFile, stat, writeFile } from 'fs/promises';
import { makeAST } from './lib/makeAST';
import { makeSemanticGraph } from './lib/makeSemanticGraph';
import { translateGraph } from './lib/translationDictionary';

const isDev = !app.isPackaged;
const DEV_PORT = process.env.DEV_PORT || '5173';
const DEV_URL = `http://localhost:${DEV_PORT}`;

let repoPath = '';

interface FileNode {
  name: string;
  path: string;
  type: 'file' | 'directory';
  children?: FileNode[];
}

async function buildFileTree(dirPath: string, basePath: string): Promise<FileNode[]> {
  const entries = await readdir(dirPath, { withFileTypes: true });
  const nodes: FileNode[] = [];

  for (const entry of entries) {
    if (entry.name.startsWith('.') || entry.name === 'node_modules') {
      continue;
    }

    const fullPath = join(dirPath, entry.name);
    const relativePath = relative(basePath, fullPath);

    if (entry.isDirectory()) {
      const children = await buildFileTree(fullPath, basePath);
      nodes.push({
        name: entry.name,
        path: relativePath,
        type: 'directory',
        children
      });
    } else if (entry.name.endsWith('.ts') || entry.name.endsWith('.tsx')) {
      nodes.push({
        name: entry.name,
        path: relativePath,
        type: 'file'
      });
    }
  }

  return nodes.sort((a, b) => {
    if (a.type !== b.type) {
      return a.type === 'directory' ? -1 : 1;
    }
    return a.name.localeCompare(b.name);
  });
}

function setupIPC() {
  ipcMain.handle('load-repo', async (_event, path: string) => {
    const absolutePath = resolve(path);
    const stats = await stat(absolutePath);

    if (!stats.isDirectory()) {
      throw new Error('Path is not a directory');
    }

    repoPath = absolutePath;
    const tree = await buildFileTree(absolutePath, absolutePath);
    return { tree, path: absolutePath };
  });

  ipcMain.handle('get-tree', async () => {
    if (!repoPath) {
      throw new Error('No repository loaded');
    }
    const tree = await buildFileTree(repoPath, repoPath);
    return { tree };
  });

  ipcMain.handle('get-file', async (_event, filePath: string) => {
    if (!repoPath) {
      throw new Error('No repository loaded');
    }

    const fullPath = join(repoPath, filePath);
    const sourceCode = await readFile(fullPath, 'utf-8');

    const ast = makeAST(sourceCode, filePath);
    const semanticGraph = makeSemanticGraph(ast);
    const translationsByLine = translateGraph(semanticGraph);

    return {
      sourceCode,
      translationsByLine,
      path: filePath
    };
  });

  ipcMain.handle('browse-directory', async (_event, requestedPath?: string) => {
    const browsePath = requestedPath ? resolve(requestedPath) : homedir();
    const stats = await stat(browsePath);

    if (!stats.isDirectory()) {
      throw new Error('Path is not a directory');
    }

    const entries = await readdir(browsePath, { withFileTypes: true });
    const directories = entries
      .filter(e => e.isDirectory() && !e.name.startsWith('.'))
      .map(e => ({
        name: e.name,
        path: join(browsePath, e.name)
      }))
      .sort((a, b) => a.name.localeCompare(b.name));

    return {
      currentPath: browsePath,
      parentPath: browsePath !== '/' ? join(browsePath, '..') : null,
      directories
    };
  });

  ipcMain.handle('upload-folder', async (_event, files: { path: string; content: string }[]) => {
    if (!files || !files.length) {
      throw new Error('No files provided');
    }

    const tempDir = await mkdtemp(join(tmpdir(), 'constrained-'));
    for (const file of files) {
      const filePath = join(tempDir, file.path);
      await mkdir(join(filePath, '..'), { recursive: true });
      await writeFile(filePath, Buffer.from(file.content, 'base64'));
    }

    repoPath = tempDir;
    const tree = await buildFileTree(tempDir, tempDir);
    return { tree, path: tempDir };
  });

  ipcMain.handle('dialog-open-directory', async () => {
    const result = await dialog.showOpenDialog({
      properties: ['openDirectory']
    });

    if (result.canceled || result.filePaths.length === 0) {
      return null;
    }

    return result.filePaths[0];
  });
}

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
            if (!browserWindow) return;
            const result = await dialog.showOpenDialog(browserWindow, {
              properties: ['openDirectory']
            });
            if (!result.canceled && result.filePaths.length > 0) {
              browserWindow.webContents.send('menu-load-folder', result.filePaths[0]);
            }
          }
        },
        ...(isMac ? [{ role: 'close' as const }] : [
          { role: 'quit' as const }
        ])
      ]
    },
    { role: 'editMenu' },
    { role: 'viewMenu' },
    { role: 'windowMenu' }
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
  setupIPC();
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
