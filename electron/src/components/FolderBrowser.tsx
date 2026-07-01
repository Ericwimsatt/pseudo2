import { useEffect, useState } from 'react';

interface BrowseData {
  currentPath: string;
  parentPath: string | null;
  directories: { name: string; path: string }[];
}

interface FolderBrowserProps {
  onSelect: (path: string) => void;
  onClose: () => void;
}

export default function FolderBrowser({ onSelect, onClose }: FolderBrowserProps) {
  const [browseData, setBrowseData] = useState<BrowseData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const browse = async (path?: string) => {
    setLoading(true);
    setError(null);
    try {
      const data = await window.electronAPI.browseDirectory(path);
      setBrowseData(data);
    } catch (err: any) {
      setError(err.message || 'Failed to browse directory');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    browse();
  }, []);

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-[500px] max-h-[80vh] flex flex-col">
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200">
          <h2 className="text-lg font-semibold">Select Folder</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-xl leading-none"
          >
            &times;
          </button>
        </div>

        <div className="px-4 py-2 border-b border-gray-100">
          <div className="flex items-center gap-2 text-sm text-gray-600">
            {browseData?.parentPath && (
              <button
                onClick={() => browse(browseData.parentPath!)}
                className="px-2 py-1 text-xs bg-gray-100 hover:bg-gray-200 rounded"
              >
                .. Up
              </button>
            )}
            <span className="truncate font-mono text-xs">{browseData?.currentPath || '...'}</span>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-2 py-2">
          {loading && (
            <div className="text-center text-gray-500 py-8">Loading...</div>
          )}
          {error && (
            <div className="text-center text-red-500 py-8">{error}</div>
          )}
          {!loading && !error && browseData && (
            browseData.directories.length === 0 ? (
              <div className="text-center text-gray-400 py-8">No subdirectories</div>
            ) : (
              browseData.directories.map(dir => (
                <button
                  key={dir.path}
                  onClick={() => browse(dir.path)}
                  className="w-full text-left px-3 py-2 rounded hover:bg-blue-50 flex items-center gap-2 text-sm"
                >
                  <span className="text-blue-500 text-base">&#128193;</span>
                  <span>{dir.name}</span>
                </button>
              ))
            )
          )}
        </div>

        <div className="px-4 py-3 border-t border-gray-200 flex justify-end gap-2">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800"
          >
            Cancel
          </button>
          <button
            onClick={() => browseData && onSelect(browseData.currentPath)}
            disabled={!browseData}
            className="px-4 py-2 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-gray-400"
          >
            Select This Folder
          </button>
        </div>
      </div>
    </div>
  );
}
