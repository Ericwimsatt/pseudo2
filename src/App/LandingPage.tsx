import { useCallback, useRef, useState } from 'react';
import FolderBrowser from './components/FolderBrowser';

interface LandingPageProps {
  onLoadRepo: (path: string) => Promise<void>;
  loading: boolean;
  loadError: string | null;
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

export default function LandingPage({ onLoadRepo, loading, loadError }: LandingPageProps) {
  const [showBrowser, setShowBrowser] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const loadingRef = useRef(loading);
  loadingRef.current = loading;

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
      return;
    }

    try {
      const files = await readEntry(dirEntry);

      if (files.length === 0) {
        return;
      }

      const data = await window.electronAPI.uploadFolder({ files });
      onLoadRepo(data.path);
    } catch {
      // handled by parent
    }
  }, [onLoadRepo]);

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
          <span className="text-lg">📂</span>
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
              <p className="text-3xl mb-2">📁</p>
              <p>Drop a folder here</p>
            </>
          )}
        </div>
      </div>

      {showBrowser && (
        <FolderBrowser
          onSelect={(path) => {
            setShowBrowser(false);
            onLoadRepo(path);
          }}
          onClose={() => setShowBrowser(false)}
        />
      )}
    </div>
  );
}
