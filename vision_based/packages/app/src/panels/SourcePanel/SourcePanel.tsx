import React from 'react'
import type { SourceFile } from '@pseudo2/shared'

interface SourcePanelProps {
  file: SourceFile | null
}

export function SourcePanel({ file }: SourcePanelProps) {
  if (!file) {
    return (
      <div style={{ padding: '16px', color: '#858585', fontSize: '13px' }}>
        No file selected
      </div>
    )
  }

  const lines = file.content.split('\n')

  return (
    <div style={{ padding: '16px' }}>
      <div style={{
        fontSize: '11px',
        fontWeight: 600,
        color: '#cccccc',
        textTransform: 'uppercase',
        marginBottom: '12px'
      }}>
        Source
      </div>
      <div style={{
        fontFamily: 'Monaco, Menlo, monospace',
        fontSize: '12px',
        lineHeight: '1.5',
        backgroundColor: '#1e1e1e',
        padding: '12px',
        borderRadius: '4px',
        overflow: 'auto',
        maxHeight: '400px'
      }}>
        {lines.map((line: string, i: number) => (
          <div key={i} style={{ display: 'flex' }}>
            <span style={{
              color: '#858585',
              width: '40px',
              textAlign: 'right',
              paddingRight: '12px',
              userSelect: 'none'
            }}>
              {i + 1}
            </span>
            <span style={{ color: '#d4d4d4', flex: 1 }}>{line}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
