import express from 'express';
import cors from 'cors';
import { readdir, readFile, stat } from 'fs/promises';
import { join, relative, resolve } from 'path';
import { makeAST } from './lib/makeAST';
import { makeSemanticGraph } from './lib/makeSemanticGraph';
import { translateGraph } from './lib/translationDictionary';

const app = express();
const PORT = 3002;

app.use(cors());
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
    const translation = translateGraph(semanticGraph);

    res.json({
      sourceCode,
      translation,
      path: pathString
    });
  } catch (error) {
    console.error('Error in file endpoint:', error);
    res.status(500).json({ error: 'Failed to read file' });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
  console.log('Registered routes:');
  console.log('  POST /api/load-repo');
  console.log('  GET /api/tree');
  console.log('  GET /api/file/*');
});
