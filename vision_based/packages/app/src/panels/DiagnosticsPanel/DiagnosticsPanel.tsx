import React from 'react'

interface Diagnostic {
  type: 'error' | 'warning' | 'info'
  message: string
  source?: string
}

interface DiagnosticsPanelProps {
  diagnostics: Diagnostic[]
}

export function DiagnosticsPanel({ diagnostics }: DiagnosticsPanelProps) {
  if (diagnostics.length === 0) {
    return (
      <div style={{ padding: '16px', color: '#858585', fontSize: '13px' }}>
        No diagnostics
      </div>
    )
  }

  const getColor = (type: Diagnostic['type']) => {
    switch (type) {
      case 'error': return '#f48771'
      case 'warning': return '#cca700'
      case 'info': return '#75beff'
    }
  }

  const getIcon = (type: Diagnostic['type']) => {
    switch (type) {
      case 'error': return '⊗'
      case 'warning': return '⚠'
      case 'info': return 'ℹ'
    }
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
        Diagnostics ({diagnostics.length})
      </div>
      <div style={{
        backgroundColor: '#1e1e1e',
        padding: '12px',
        borderRadius: '4px',
        fontSize: '12px'
      }}>
        {diagnostics.map((diag, i) => (
          <div key={i} style={{
            marginBottom: '8px',
            display: 'flex',
            alignItems: 'flex-start',
            gap: '8px'
          }}>
            <span style={{ color: getColor(diag.type), fontSize: '14px' }}>
              {getIcon(diag.type)}
            </span>
            <div style={{ flex: 1 }}>
              <div style={{ color: '#d4d4d4' }}>{diag.message}</div>
              {diag.source && (
                <div style={{ color: '#858585', fontSize: '11px', marginTop: '2px' }}>
                  {diag.source}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
