import { useEffect, useRef, useState } from 'react';
import { HashRouter, Routes, Route, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import type { ViewModel } from '../main/translationService/renderable/types';
import type { ElectronAPI, FileNode } from '../shared/api';
import Sidebar from './components/Sidebar';
import CodeTable from './components/CodeTable';
import { FilePathContext } from './lib/filePathContext';
import LandingPage from './LandingPage';

declare global {
  interface Window {
    electronAPI: ElectronAPI;
  }
}

function FileView({ tree, onFileSelect }: { tree: FileNode[]; onFileSelect: (path: string) => void }) {
  const params = useParams();
  const [searchParams] = useSearchParams();
  const path = params['*'];
  const [viewModel, setViewModel] = useState<ViewModel | null>(null);
  const [filePath, setFilePath] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  const targetSourceLine = searchParams.get('sourceLine')
    ? Number(searchParams.get('sourceLine'))
    : null;
  const targetTransLine = searchParams.get('transLine')
    ? Number(searchParams.get('transLine'))
    : null;
  const targetVar = searchParams.get('var');

  useEffect(() => {
    if (path) {
      setViewModel(null);
      setFilePath(null);
      setError(null);
      Promise.all([
        window.electronAPI.loadFileSource({ path }),
        window.electronAPI.loadFileTranslation({ path }),
      ])
        .then(([_sourceResult, translationResult]) => {
          setFilePath(translationResult.path);
          setViewModel(translationResult.viewModel);
          console.log('Loaded file translation for', translationResult.path);
          console.log(translationResult.viewModel);
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
      ) : viewModel ? (
        <FilePathContext.Provider value={filePath ?? ''}>
          <CodeTable
            viewModel={viewModel}
            fileName={filePath ?? ''}
            targetSourceLine={targetSourceLine}
            targetTransLine={targetTransLine}
            targetVar={targetVar}
          />
        </FilePathContext.Provider>
      ) : (
        <div className="flex-1 flex items-center justify-center text-gray-500">
          {path ? 'Loading...' : 'Select a file to view'}
        </div>
      )}
    </div>
  );
}

function App() {
  const [tree, setTree] = useState<FileNode[]>([]);
  const [repoPath, setRepoPath] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const navigate = useNavigate();

  const loadRepo = async (path: string) => {
    if (!path.trim()) {
      setLoadError('Please enter a valid path');
      return;
    }
    setLoading(true);
    setLoadError(null);
    try {
      const data = await window.electronAPI.loadProject({ path });
      setTree(data.tree);
      setRepoPath(data.path);
      window.electronAPI.setLastProjectPath(data.path);
      const savedFilePath = await window.electronAPI.getLastFilePath();
      if (savedFilePath) {
        navigate(`/file/${savedFilePath}`);
      }
    } catch (err: any) {
      console.error('Failed to load repo:', err);
      setLoadError(err.message || 'Failed to load repository');
      window.electronAPI.clearLastProjectPath();
    } finally {
      setLoading(false);
    }
  };

  const loadRepoRef = useRef(loadRepo);
  loadRepoRef.current = loadRepo;

  useEffect(() => {
    window.electronAPI.getLastProjectPath().then((savedPath) => {
      if (savedPath) {
        loadRepoRef.current(savedPath);
      }
    });
  }, []);

  useEffect(() => {
    const cleanup = window.electronAPI.onMenuLoadFolder((path) => {
      loadRepoRef.current(path);
    });
    return cleanup;
  }, []);

  const handleFileSelect = (path: string) => {
    navigate(`/file/${path}`);
    window.electronAPI.setLastFilePath(path);
  };

  if (!repoPath) {
    return (
      <LandingPage
        onLoadRepo={loadRepo}
        loading={loading}
        loadError={loadError}
      />
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
