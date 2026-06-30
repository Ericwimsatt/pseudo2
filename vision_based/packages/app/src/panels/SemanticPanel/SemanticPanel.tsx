import React from 'react'
import type { SemanticNode } from '@pseudo2/shared'

interface SemanticPanelProps {
  nodes: SemanticNode[]
}

export function SemanticPanel({ nodes }: SemanticPanelProps) {
  if (nodes.length === 0) {
    return (
      <div style={{ padding: '16px', color: '#858585', fontSize: '13px' }}>
        No semantic nodes
      </div>
    )
  }

  const renderNode = (node: SemanticNode, depth: number = 0): React.ReactNode => {
    return (
      <div key={node.id} style={{ marginBottom: '8px' }}>
        <div style={{
          paddingLeft: `${depth * 16}px`,
          fontSize: '12px'
        }}>
          <span style={{ color: '#569cd6', fontWeight: 500 }}>{node.type}</span>
          {node.name && (
            <span style={{ color: '#dcdcaa', marginLeft: '8px' }}>{node.name}</span>
          )}
          <span style={{ color: '#858585', marginLeft: '8px', fontSize: '11px' }}>
            [{node.id}]
          </span>
        </div>

        {node.location && (
          <div style={{
            paddingLeft: `${(depth + 1) * 16}px`,
            fontSize: '11px',
            color: '#858585'
          }}>
            {node.location.start.line}:{node.location.start.column}
          </div>
        )}

        {Object.keys(node.metadata).length > 0 && (
          <div style={{
            paddingLeft: `${(depth + 1) * 16}px`,
            fontSize: '11px',
            color: '#ce9178',
            marginTop: '2px'
          }}>
            {Object.entries(node.metadata).map(([key, value]) => (
              <span key={key} style={{ marginRight: '8px' }}>
                {key}={String(value)}
              </span>
            ))}
          </div>
        )}

        {node.children.length > 0 && (
          <div style={{ marginTop: '4px' }}>
            {node.children.map((child: SemanticNode) => renderNode(child, depth + 1))}
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
        Semantic IR ({nodes.length} nodes)
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
        {nodes.map(node => renderNode(node))}
      </div>
    </div>
  )
}
