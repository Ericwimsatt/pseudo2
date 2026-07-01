import { useState } from 'react';

interface FileNode {
  name: string;
  path: string;
  type: 'file' | 'directory';
  children?: FileNode[];
}

interface SidebarProps {
  tree: FileNode[];
  onFileSelect: (path: string) => void;
  selectedFile: string | null;
}

function FileTreeItem({ node, onFileSelect, selectedFile, depth = 0 }: {
  node: FileNode;
  onFileSelect: (path: string) => void;
  selectedFile: string | null;
  depth?: number;
}) {
  const [isOpen, setIsOpen] = useState(false);

  if (node.type === 'directory') {
    return (
      <div>
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="w-full text-left px-2 py-1 hover:bg-gray-100 flex items-center gap-1 text-sm"
          style={{ paddingLeft: `${depth * 12 + 8}px` }}
        >
          <span className="text-xs">{isOpen ? '▼' : '▶'}</span>
          <span className="font-medium">{node.name}</span>
        </button>
        {isOpen && node.children && (
          <div>
            {node.children.map(child => (
              <FileTreeItem
                key={child.path}
                node={child}
                onFileSelect={onFileSelect}
                selectedFile={selectedFile}
                depth={depth + 1}
              />
            ))}
          </div>
        )}
      </div>
    );
  }

  return (
    <button
      onClick={() => onFileSelect(node.path)}
      className={`w-full text-left px-2 py-1 hover:bg-blue-50 text-sm ${
        selectedFile === node.path ? 'bg-blue-100 text-blue-900' : ''
      }`}
      style={{ paddingLeft: `${depth * 12 + 20}px` }}
    >
      {node.name}
    </button>
  );
}

export default function Sidebar({ tree, onFileSelect, selectedFile }: SidebarProps) {
  return (
    <div className="w-64 bg-gray-50 border-r border-gray-200 overflow-y-auto h-screen">
      <div className="p-3 border-b border-gray-200">
        <h2 className="font-semibold text-sm text-gray-700">Files</h2>
      </div>
      <div className="py-2">
        {tree.map(node => (
          <FileTreeItem
            key={node.path}
            node={node}
            onFileSelect={onFileSelect}
            selectedFile={selectedFile}
          />
        ))}
      </div>
    </div>
  );
}
