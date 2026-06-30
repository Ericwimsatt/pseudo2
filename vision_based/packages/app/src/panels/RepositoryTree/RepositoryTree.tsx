import React, { useMemo, useState, useCallback } from 'react'
import type { SourceFile } from '@pseudo2/shared'
import { useNavigation } from '../../hooks/useNavigation'

interface RepositoryTreeProps {
  files: SourceFile[]
}

interface TreeNode {
  name: string
  path: string
  isFile: boolean
  children: TreeNode[]
}

interface TreeNodeItemProps {
  node: TreeNode
  depth: number
  isExpanded: boolean
  isSelected: boolean
  onSelect: (path: string, isFile: boolean) => void
}

const TreeNodeItem = React.memo(function TreeNodeItem({
  node,
  depth,
  isExpanded,
  isSelected,
  onSelect
}: TreeNodeItemProps) {
  const handleClick = useCallback(() => {
    onSelect(node.path, node.isFile)
  }, [node.path, node.isFile, onSelect])

  const handleMouseEnter = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (!isSelected) {
      e.currentTarget.style.backgroundColor = '#2a2d2e'
    }
  }, [isSelected])

  const handleMouseLeave = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (!isSelected) {
      e.currentTarget.style.backgroundColor = 'transparent'
    }
  }, [isSelected])

  return (
    <div
      onClick={handleClick}
      style={{
        padding: '4px 8px',
        paddingLeft: `${depth * 16 + 8}px`,
        cursor: 'pointer',
        backgroundColor: isSelected ? '#094771' : 'transparent',
        color: '#cccccc',
        fontSize: '13px',
        display: 'flex',
        alignItems: 'center',
        gap: '4px',
        userSelect: 'none'
      }}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {!node.isFile && (
        <span style={{ fontSize: '10px', width: '10px', flexShrink: 0 }}>
          {isExpanded ? '▼' : '▶'}
        </span>
      )}
      <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
        {node.name}
      </span>
    </div>
  )
})

interface TreeNodeGroupProps {
  node: TreeNode
  depth: number
  expandedFolders: Set<string>
  selectedFile: string | null
  forceExpand: boolean
  onSelect: (path: string, isFile: boolean) => void
}

const TreeNodeGroup = React.memo(function TreeNodeGroup({
  node,
  depth,
  expandedFolders,
  selectedFile,
  forceExpand,
  onSelect
}: TreeNodeGroupProps) {
  const isExpanded = forceExpand || expandedFolders.has(node.path)
  const isSelected = selectedFile === node.path

  return (
    <div>
      <TreeNodeItem
        node={node}
        depth={depth}
        isExpanded={isExpanded}
        isSelected={isSelected}
        onSelect={onSelect}
      />
      {!node.isFile && isExpanded && (
        <div>
          {node.children.map(child => (
            <TreeNodeGroup
              key={child.path}
              node={child}
              depth={depth + 1}
              expandedFolders={expandedFolders}
              selectedFile={selectedFile}
              forceExpand={forceExpand}
              onSelect={onSelect}
            />
          ))}
        </div>
      )}
    </div>
  )
})

export function RepositoryTree({ files }: RepositoryTreeProps) {
  const { selectedFile, selectFile, expandedFolders, toggleFolder } = useNavigation()
  const [searchQuery, setSearchQuery] = useState('')

  const filteredFiles = useMemo(() => {
    if (!searchQuery) return files
    const query = searchQuery.toLowerCase()
    return files.filter(f => f.path.toLowerCase().includes(query))
  }, [files, searchQuery])

  const tree = useMemo(() => {
    const root: TreeNode = { name: 'root', path: '', isFile: false, children: [] }

    for (const file of filteredFiles) {
      const parts = file.path.split('/')
      let current = root

      for (let i = 0; i < parts.length; i++) {
        const part = parts[i]
        const isLast = i === parts.length - 1
        const path = parts.slice(0, i + 1).join('/')

        let child = current.children.find(c => c.name === part)

        if (!child) {
          child = {
            name: part,
            path,
            isFile: isLast,
            children: []
          }
          current.children.push(child)
        }

        current = child
      }
    }

    return root.children
  }, [filteredFiles])

  const handleSelect = useCallback((path: string, isFile: boolean) => {
    if (isFile) {
      selectFile(path)
    } else {
      toggleFolder(path)
    }
  }, [selectFile, toggleFolder])

  const handleSearchChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value)
  }, [])

  return (
    <div style={{ padding: '8px 0' }}>
      <div style={{
        padding: '8px 16px',
        fontSize: '11px',
        fontWeight: 600,
        color: '#cccccc',
        textTransform: 'uppercase'
      }}>
        Explorer
      </div>
      <div style={{ padding: '0 8px 8px' }}>
        <input
          type="text"
          placeholder="Search files..."
          value={searchQuery}
          onChange={handleSearchChange}
          style={{
            width: '100%',
            padding: '6px 8px',
            backgroundColor: '#3c3c3c',
            border: '1px solid #555',
            borderRadius: '4px',
            color: '#cccccc',
            fontSize: '12px',
            outline: 'none',
            boxSizing: 'border-box'
          }}
        />
      </div>
      {tree.map(node => (
        <TreeNodeGroup
          key={node.path}
          node={node}
          depth={0}
          expandedFolders={expandedFolders}
          selectedFile={selectedFile}
          forceExpand={searchQuery.length > 0}
          onSelect={handleSelect}
        />
      ))}
    </div>
  )
}
