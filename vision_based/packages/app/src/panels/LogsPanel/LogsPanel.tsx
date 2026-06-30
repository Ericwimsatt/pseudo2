import React from 'react'

interface LogEntry {
  timestamp: number
  level: 'info' | 'warn' | 'error' | 'debug'
  message: string
  data?: any
}

interface LogsPanelProps {
  logs: LogEntry[]
}

export function LogsPanel({ logs }: LogsPanelProps) {
  if (logs.length === 0) {
    return (
      <div style={{ padding: '16px', color: '#858585', fontSize: '13px' }}>
        No logs
      </div>
    )
  }

  const getColor = (level: LogEntry['level']) => {
    switch (level) {
      case 'error': return '#f48771'
      case 'warn': return '#cca700'
      case 'info': return '#75beff'
      case 'debug': return '#858585'
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
        Logs ({logs.length})
      </div>
      <div style={{
        fontFamily: 'Monaco, Menlo, monospace',
        fontSize: '11px',
        backgroundColor: '#1e1e1e',
        padding: '12px',
        borderRadius: '4px',
        overflow: 'auto',
        maxHeight: '400px'
      }}>
        {logs.map((log, i) => (
          <div key={i} style={{
            marginBottom: '4px',
            display: 'flex',
            gap: '8px'
          }}>
            <span style={{ color: '#858585' }}>
              {new Date(log.timestamp).toLocaleTimeString()}
            </span>
            <span style={{ color: getColor(log.level), fontWeight: 500 }}>
              [{log.level.toUpperCase()}]
            </span>
            <span style={{ color: '#d4d4d4', flex: 1 }}>{log.message}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
