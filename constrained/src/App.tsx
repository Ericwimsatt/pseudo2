import { useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route, useNavigate, useParams } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import SourcePanel from './components/SourcePanel';
import TranslationPanel from './components/TranslationPanel';

interface FileNode {
  name: string;
  path: string;
  type: 'file' | 'directory';
  children?: FileNode[];
}

interface FileData {
  sourceCode: string;
  translation: string[];
  path: string;
}

function FileView({ tree, onFileSelect }: { tree: FileNode[]; onFileSelect: (path: string) => void }) {
  const params = useParams();
  const path = params['*'];
  const [fileData, setFileData] = useState<FileData | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    console.log('FileView: path changed to', path);
    if (path) {
      setFileData(null);
      setError(null);
      fetch(`http://localhost:3002/api/file/${path}`)
        .then(res => {
          if (!res.ok) {
            throw new Error(`HTTP error! status: ${res.status}`);
          }
          return res.json();
        })
        .then(data => {
          console.log('FileView: file data received', data);
          if (data.error) {
            setError(data.error);
          } else {
            setFileData(data);
          }
        })
        .catch(err => {
          console.error('Failed to load file:', err);
          setError(err.message);
        });
    }
  }, [path]);

  return (
    <div className="flex h-screen">
      <Sidebar tree={tree} onFileSelect={onFileSelect} selectedFile={path || null} />
      {error ? (
        <div className="flex-1 flex items-center justify-center text-red-500">
          Error: {error}
        </div>
      ) : fileData ? (
        <>
          <SourcePanel sourceCode={fileData.sourceCode} fileName={fileData.path} />
          <TranslationPanel translation={fileData.translation} fileName={fileData.path} />
        </>
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
      const res = await fetch('http://localhost:3002/api/load-repo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ path })
      });
      const data = await res.json();
      if (!res.ok || data.error) {
        setLoadError(data.error || 'Failed to load repository');
        return;
      }
      setTree(data.tree);
      setRepoPath(path);
    } catch (err) {
      console.error('Failed to load repo:', err);
      setLoadError('Failed to connect to server. Make sure the backend is running on port 3002.');
    } finally {
      setLoading(false);
    }
  };

  const handleFileSelect = (path: string) => {
    navigate(`/file/${path}`);
  };

  if (!repoPath) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="bg-white p-8 rounded-lg shadow-md w-96">
          <h1 className="text-2xl font-bold mb-4">Load Repository</h1>
          {loadError && (
            <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded text-sm">
              {loadError}
            </div>
          )}
          <input
            type="text"
            placeholder="Enter repository path (e.g., /Users/name/repo)"
            defaultValue="../../stemwise"
            className="w-full px-3 py-2 border border-gray-300 rounded mb-4"
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                loadRepo((e.target as HTMLInputElement).value);
              }
            }}
            id="repo-path-input"
          />
          <button
            onClick={() => {
              const input = document.getElementById('repo-path-input') as HTMLInputElement;
              loadRepo(input.value);
            }}
            disabled={loading}
            className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700 disabled:bg-gray-400"
          >
            {loading ? 'Loading...' : 'Load Repository'}
          </button>
        </div>
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
    <BrowserRouter>
      <App />
    </BrowserRouter>
  );
}

export default AppWrapper;
