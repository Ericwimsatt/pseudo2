import { useCallback, useEffect, useRef, useState } from 'react';
import { HashRouter, Routes, Route, useNavigate, useParams } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import CodeTable from './components/CodeTable';
import FolderBrowser from './components/FolderBrowser';

declare global {
  interface Window {
    electronAPI: {
      loadRepo: (path: string) => Promise<{ tree: FileNode[]; path: string }>;
      getTree: () => Promise<{ tree: FileNode[] }>;
      getFile: (path: string) => Promise<FileData>;
      browseDirectory: (path?: string) => Promise<BrowseData>;
      uploadFolder: (files: { path: string; content: string }[]) => Promise<{ tree: FileNode[]; path: string }>;
      dialogOpenDirectory: () => Promise<string | null>;
      onMenuLoadFolder: (callback: (path: string) => void) => () => void;
    };
  }
}

interface FileNode {
  name: string;
  path: string;
  type: 'file' | 'directory';
  children?: FileNode[];
}

interface BrowseData {
  currentPath: string;
  parentPath: string | null;
  directories: { name: string; path: string }[];
}

interface TranslationItem {
  text: string;
  endLine: number;
}

interface FileData {
  sourceCode: string;
  translationsByLine: Record<number, TranslationItem[]>;
  path: string;
}

function FileView({ tree, onFileSelect }: { tree: FileNode[]; onFileSelect: (path: string) => void }) {
  const params = useParams();
  const path = params['*'];
  const [fileData, setFileData] = useState<FileData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  useEffect(() => {
    console.log('FileView: path changed to', path);
    if (path) {
      setFileData(null);
      setError(null);
      window.electronAPI.getFile(path)
        .then(data => {
          console.log('FileView: file data received', data);
          setFileData(data);
        })
        .catch(err => {
          console.error('Failed to load file:', err);
          setError(err.message);
        });
    }
  }, [path]);

  return (
    <div className="flex h-screen">
      <Sidebar
        tree={tree}
        onFileSelect={onFileSelect}
        selectedFile={path || null}
        collapsed={sidebarCollapsed}
        onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
      />
      {error ? (
        <div className="flex-1 flex items-center justify-center text-red-500">
          Error: {error}
        </div>
      ) : fileData ? (
        <CodeTable
          sourceCode={fileData.sourceCode}
          translationsByLine={fileData.translationsByLine}
          fileName={fileData.path}
        />
      ) : (
        <div className="flex-1 flex items-center justify-center text-gray-500">
          {path ? 'Loading...' : 'Select a file to view'}
        </div>
      )}
    </div>
  );
}

function readEntry(entry: FileSystemEntry): Promise<{ path: string; content: string }[]> {
  return new Promise((resolve, reject) => {
    if (entry.isFile) {
      (entry as FileSystemFileEntry).file(file => {
        const reader = new FileReader();
        reader.onload = () => {
          const base64 = btoa(
            new Uint8Array(reader.result as ArrayBuffer)
              .reduce((data, byte) => data + String.fromCharCode(byte), '')
          );
          const relativePath = entry.fullPath.startsWith('/') ? entry.fullPath.slice(1) : entry.fullPath;
          resolve([{ path: relativePath, content: base64 }]);
        };
        reader.onerror = () => reject(reader.error);
        reader.readAsArrayBuffer(file);
      }, reject);
    } else if (entry.isDirectory) {
      const reader = (entry as FileSystemDirectoryEntry).createReader();
      const allEntries: FileSystemEntry[] = [];
      const readBatch = () => {
        reader.readEntries(async (entries) => {
          if (entries.length === 0) {
            const results = await Promise.all(allEntries.map(e => readEntry(e)));
            resolve(results.flat());
          } else {
            allEntries.push(...entries);
            readBatch();
          }
        }, reject);
      };
      readBatch();
    } else {
      resolve([]);
    }
  });
}

function App() {
  const [tree, setTree] = useState<FileNode[]>([]);
  const [repoPath, setRepoPath] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [showBrowser, setShowBrowser] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const savedPath = localStorage.getItem('repoPath');
    if (savedPath) {
      loadRepo(savedPath);
    }
  }, []);

  const loadRepo = async (path: string) => {
    if (!path.trim()) {
      setLoadError('Please enter a valid path');
      return;
    }
    setLoading(true);
    setLoadError(null);
    try {
      const data = await window.electronAPI.loadRepo(path);
      setTree(data.tree);
      setRepoPath(data.path);
      localStorage.setItem('repoPath', data.path);
    } catch (err: any) {
      console.error('Failed to load repo:', err);
      setLoadError(err.message || 'Failed to load repository');
      localStorage.removeItem('repoPath');
    } finally {
      setLoading(false);
    }
  };

  const loadRepoRef = useRef(loadRepo);
  loadRepoRef.current = loadRepo;

  useEffect(() => {
    const cleanup = window.electronAPI.onMenuLoadFolder((path) => {
      loadRepoRef.current(path);
    });
    return cleanup;
  }, []);

  const handleFileSelect = (path: string) => {
    navigate(`/file/${path}`);
  };

  const handleDrop = useCallback(async (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);

    const items = e.dataTransfer.items;
    const entries: FileSystemEntry[] = [];
    for (let i = 0; i < items.length; i++) {
      const entry = items[i].webkitGetAsEntry?.();
      if (entry) entries.push(entry);
    }

    const dirEntry = entries.find(e => e.isDirectory);
    if (!dirEntry) {
      setLoadError('Please drop a folder, not a file');
      return;
    }

    setLoading(true);
    setLoadError(null);
    try {
      const files = await readEntry(dirEntry);
      const tsFiles = files.filter(f => f.path.endsWith('.ts') || f.path.endsWith('.tsx'));

      if (tsFiles.length === 0) {
        setLoadError('No TypeScript files found in the dropped folder');
        return;
      }

      const data = await window.electronAPI.uploadFolder(tsFiles);
      setTree(data.tree);
      setRepoPath(data.path);
      localStorage.setItem('repoPath', data.path);
    } catch (err: any) {
      setLoadError(err.message || 'Failed to process dropped folder');
    } finally {
      setLoading(false);
    }
  }, []);

  if (!repoPath) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="bg-white p-8 rounded-lg shadow-md w-[480px]">
          <h1 className="text-2xl font-bold mb-6">Load Repository</h1>
          {loadError && (
            <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded text-sm">
              {loadError}
            </div>
          )}

          <button
            onClick={() => setShowBrowser(true)}
            className="w-full px-4 py-3 border-2 border-dashed border-gray-300 rounded-lg text-gray-600 hover:border-blue-400 hover:text-blue-600 hover:bg-blue-50 transition-colors mb-4 flex items-center justify-center gap-2"
          >
            <span className="text-lg">&#128194;</span>
            <span>Browse for a folder...</span>
          </button>

          <div className="flex items-center gap-3 my-4">
            <div className="flex-1 h-px bg-gray-200" />
            <span className="text-xs text-gray-400 uppercase">or drag & drop</span>
            <div className="flex-1 h-px bg-gray-200" />
          </div>

          <div
            onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={handleDrop}
            className={`w-full py-10 border-2 border-dashed rounded-lg text-center transition-colors ${
              dragOver
                ? 'border-blue-500 bg-blue-50 text-blue-600'
                : 'border-gray-300 text-gray-400'
            }`}
          >
            {loading ? (
              <p>Processing folder...</p>
            ) : (
              <>
                <p className="text-3xl mb-2">&#128193;</p>
                <p>Drop a folder here</p>
              </>
            )}
          </div>
        </div>

        {showBrowser && (
          <FolderBrowser
            onSelect={(path) => {
              setShowBrowser(false);
              loadRepo(path);
            }}
            onClose={() => setShowBrowser(false)}
          />
        )}
      </div>
    );
  }

  return (
    <Routes>
      <Route path="/file/*" element={<FileView tree={tree} onFileSelect={handleFileSelect} />} />
      <Route path="*" element={<FileView tree={tree} onFileSelect={handleFileSelect} />} />
    </Routes>
  );
}

function AppWrapper() {
  return (
    <HashRouter>
      <App />
    </HashRouter>
  );
}

export default AppWrapper;
