import React, { useState } from 'react'
import type { SourceFile } from '@pseudo2/shared'

interface AstPanelProps {
  file: SourceFile | null
}

export function AstPanel({ file }: AstPanelProps) {
  const [expanded, setExpanded] = useState<Set<string>>(new Set())

  if (!file || !file.ast) {
    return (
      <div style={{ padding: '16px', color: '#858585', fontSize: '13px' }}>
        No AST available
      </div>
    )
  }

  const toggleNode = (path: string) => {
    const newExpanded = new Set(expanded)
    if (newExpanded.has(path)) {
      newExpanded.delete(path)
    } else {
      newExpanded.add(path)
    }
    setExpanded(newExpanded)
  }

  const renderNode = (node: any, path: string, depth: number = 0): React.ReactNode => {
    if (!node || typeof node !== 'object') {
      return (
        <div key={path} style={{ paddingLeft: `${depth * 16}px`, color: '#ce9178' }}>
          {String(node)}
        </div>
      )
    }

    const isExpanded = expanded.has(path)
    const keys = Object.keys(node).filter(k => !k.startsWith('_'))

    if (keys.length === 0) {
      return (
        <div key={path} style={{ paddingLeft: `${depth * 16}px`, color: '#858585' }}>
          {'{}'}
        </div>
      )
    }

    return (
      <div key={path}>
        <div
          onClick={() => toggleNode(path)}
          style={{
            paddingLeft: `${depth * 16}px`,
            cursor: 'pointer',
            color: '#569cd6',
            fontSize: '12px',
            userSelect: 'none'
          }}
        >
          <span style={{ fontSize: '10px', marginRight: '4px' }}>
            {isExpanded ? '▼' : '▶'}
          </span>
          {node.kind ? `Node (${node.kind})` : 'Object'}
        </div>
        {isExpanded && (
          <div>
            {keys.map(key => (
              <div key={`${path}.${key}`} style={{ paddingLeft: `${(depth + 1) * 16}px` }}>
                <span style={{ color: '#9cdcfe' }}>{key}: </span>
                {renderNode(node[key], `${path}.${key}`, depth + 1)}
              </div>
            ))}
          </div>
        )}
      </div>
    )
  }

  return (
    <div style={{ padding: '16px' }}>
      <div style={{
        fontSize: '11px',
        fontWeight: 600,
        color: '#cccccc',
        textTransform: 'uppercase',
        marginBottom: '12px'
      }}>
        AST
      </div>
      <div style={{
        fontFamily: 'Monaco, Menlo, monospace',
        fontSize: '12px',
        backgroundColor: '#1e1e1e',
        padding: '12px',
        borderRadius: '4px',
        overflow: 'auto',
        maxHeight: '400px'
      }}>
        {renderNode(file.ast, 'root')}
      </div>
    </div>
  )
}
