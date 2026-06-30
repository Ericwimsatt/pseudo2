import React from 'react'
import { useInspector } from '../../hooks/useInspector'

export function Inspector() {
  const { selectedNode, selectedLine } = useInspector()

  if (!selectedNode && !selectedLine) {
    return (
      <div style={{
        padding: '16px',
        color: '#858585',
        fontSize: '13px'
      }}>
        Select a line to inspect
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
        Inspector
      </div>

      {selectedLine && (
        <div style={{ marginBottom: '16px' }}>
          <div style={{
            fontSize: '12px',
            color: '#858585',
            marginBottom: '4px'
          }}>
            Line
          </div>
          <div style={{
            fontSize: '13px',
            color: '#d4d4d4',
            fontFamily: 'Monaco, Menlo, monospace',
            backgroundColor: '#1e1e1e',
            padding: '8px',
            borderRadius: '4px'
          }}>
            {selectedLine.content}
          </div>
        </div>
      )}

      {selectedNode && (
        <div>
          <div style={{
            fontSize: '12px',
            color: '#858585',
            marginBottom: '8px'
          }}>
            Semantic Node
          </div>

          <div style={{
            backgroundColor: '#1e1e1e',
            padding: '12px',
            borderRadius: '4px',
            fontSize: '12px',
            color: '#d4d4d4'
          }}>
            <div style={{ marginBottom: '8px' }}>
              <span style={{ color: '#569cd6' }}>Type:</span>{' '}
              <span>{selectedNode.type}</span>
            </div>

            {selectedNode.name && (
              <div style={{ marginBottom: '8px' }}>
                <span style={{ color: '#569cd6' }}>Name:</span>{' '}
                <span>{selectedNode.name}</span>
              </div>
            )}

            {selectedNode.id && (
              <div style={{ marginBottom: '8px' }}>
                <span style={{ color: '#569cd6' }}>ID:</span>{' '}
                <span style={{ fontSize: '11px', color: '#858585' }}>{selectedNode.id}</span>
              </div>
            )}

            {selectedNode.location && (
              <div style={{ marginBottom: '8px' }}>
                <span style={{ color: '#569cd6' }}>Location:</span>{' '}
                <span>
                  {selectedNode.location.start.line}:{selectedNode.location.start.column}
                </span>
              </div>
            )}

            {selectedNode.children.length > 0 && (
              <div style={{ marginBottom: '8px' }}>
                <span style={{ color: '#569cd6' }}>Children:</span>{' '}
                <span>{selectedNode.children.length}</span>
              </div>
            )}

            {selectedNode.relationships.length > 0 && (
              <div style={{ marginBottom: '8px' }}>
                <span style={{ color: '#569cd6' }}>Relationships:</span>{' '}
                <span>{selectedNode.relationships.length}</span>
              </div>
            )}

            {Object.keys(selectedNode.metadata).length > 0 && (
              <div style={{ marginTop: '12px', paddingTop: '12px', borderTop: '1px solid #3e3e42' }}>
                <div style={{ color: '#569cd6', marginBottom: '8px' }}>Metadata:</div>
                {Object.entries(selectedNode.metadata).map(([key, value]) => (
                  <div key={key} style={{ marginBottom: '4px', paddingLeft: '8px' }}>
                    <span style={{ color: '#9cdcfe' }}>{key}:</span>{' '}
                    <span style={{ color: '#ce9178' }}>{String(value)}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
