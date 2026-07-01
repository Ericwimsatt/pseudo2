import express from 'express';
import { createServer as createViteServer } from 'vite';
import { createServer as createHttpServer } from 'http';
import { mkdir, mkdtemp, readdir, readFile, stat, writeFile } from 'fs/promises';
import { join, relative, resolve } from 'path';
import { homedir, tmpdir } from 'os';
import { makeAST } from './lib/makeAST';
import { makeSemanticGraph } from './lib/makeSemanticGraph';
import { translateGraph } from './lib/translationDictionary';

const isProduction = process.env.NODE_ENV === 'production';

async function findFreePort(start: number): Promise<number> {
  return new Promise((resolvePort, reject) => {
    const tryNext = (port: number) => {
      const tester = createHttpServer();
      tester.unref();
      tester.once('error', (err: NodeJS.ErrnoException) => {
        if (err.code === 'EADDRINUSE') {
          tryNext(port + 1);
        } else {
          reject(err);
        }
      });
      tester.once('listening', () => {
        tester.close(() => resolvePort(port));
      });
      tester.listen(port);
    };
    tryNext(start);
  });
}

const app = express();

app.use(express.json());

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

app.post('/api/load-repo', async (req, res) => {
  console.log('POST /api/load-repo called with:', req.body);
  try {
    const { path } = req.body;
    const absolutePath = resolve(path);
    console.log('Resolved path:', absolutePath);
    const stats = await stat(absolutePath);

    if (!stats.isDirectory()) {
      return res.status(400).json({ error: 'Path is not a directory' });
    }

    repoPath = absolutePath;
    const tree = await buildFileTree(absolutePath, absolutePath);
    console.log('Tree built successfully, nodes:', tree.length);
    res.json({ tree, path: absolutePath });
  } catch (error) {
    console.error('Error in load-repo:', error);
    res.status(500).json({ error: 'Failed to load repository' });
  }
});

app.get('/api/tree', async (req, res) => {
  try {
    if (!repoPath) {
      return res.status(400).json({ error: 'No repository loaded' });
    }

    const tree = await buildFileTree(repoPath, repoPath);
    res.json({ tree });
  } catch (error) {
    res.status(500).json({ error: 'Failed to get file tree' });
  }
});

app.get('/api/file/{*path}', async (req, res) => {
  console.log('GET /api/file called with path:', req.params.path);
  try {
    if (!repoPath) {
      return res.status(400).json({ error: 'No repository loaded' });
    }

    const pathArray = Array.isArray(req.params.path) ? req.params.path : [req.params.path];
    const filePath = join(repoPath, ...pathArray);
    const pathString = pathArray.join('/');
    console.log('Reading file:', filePath);
    const sourceCode = await readFile(filePath, 'utf-8');

    const ast = makeAST(sourceCode, pathString);
    const semanticGraph = makeSemanticGraph(ast);
    const translationsByLine = translateGraph(semanticGraph);

    res.json({
      sourceCode,
      translationsByLine,
      path: pathString
    });
  } catch (error) {
    console.error('Error in file endpoint:', error);
    res.status(500).json({ error: 'Failed to read file' });
  }
});

app.get('/api/browse', async (req, res) => {
  try {
    const requestedPath = req.query.path as string || homedir();
    const absolutePath = resolve(requestedPath);
    const stats = await stat(absolutePath);

    if (!stats.isDirectory()) {
      return res.status(400).json({ error: 'Path is not a directory' });
    }

    const entries = await readdir(absolutePath, { withFileTypes: true });
    const directories = entries
      .filter(e => e.isDirectory() && !e.name.startsWith('.'))
      .map(e => ({
        name: e.name,
        path: join(absolutePath, e.name)
      }))
      .sort((a, b) => a.name.localeCompare(b.name));

    res.json({
      currentPath: absolutePath,
      parentPath: absolutePath !== '/' ? join(absolutePath, '..') : null,
      directories
    });
  } catch (error) {
    console.error('Error in browse:', error);
    res.status(500).json({ error: 'Failed to browse directory' });
  }
});

app.post('/api/upload-folder', express.json({ limit: '500mb' }), async (req, res) => {
  try {
    const { files } = req.body as { files: { path: string; content: string }[] };
    if (!files || !files.length) {
      return res.status(400).json({ error: 'No files provided' });
    }

    const tempDir = await mkdtemp(join(tmpdir(), 'constrained-'));
    for (const file of files) {
      const filePath = join(tempDir, file.path);
      await mkdir(join(filePath, '..'), { recursive: true });
      await writeFile(filePath, Buffer.from(file.content, 'base64'));
    }

    repoPath = tempDir;
    const tree = await buildFileTree(tempDir, tempDir);
    res.json({ tree, path: tempDir });
  } catch (error) {
    console.error('Error in upload-folder:', error);
    res.status(500).json({ error: 'Failed to upload folder' });
  }
});

async function start() {
  const requestedPort = Number(process.env.PORT) || 3000;
  const PORT = await findFreePort(requestedPort);

  const httpServer = createHttpServer(app);

  if (isProduction) {
    const distPath = join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.use((req, res, next) => {
      if (req.method === 'GET' && !req.path.startsWith('/api/')) {
        res.sendFile(join(distPath, 'index.html'));
      } else {
        next();
      }
    });
  } else {
    const vite = await createViteServer({
      appType: 'spa',
      server: { middlewareMode: true, hmr: { server: httpServer } },
    });
    app.use(vite.middlewares);
  }

  httpServer.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
    console.log('Registered API routes:');
    console.log('  POST /api/load-repo');
    console.log('  GET  /api/tree');
    console.log('  GET  /api/browse');
    console.log('  POST /api/upload-folder');
    console.log('  GET  /api/file/*');
    if (!isProduction) {
      console.log(`Vite HMR active on ws://localhost:${PORT}`);
    }
  });
}

start().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
