import React from 'react'

interface PerformanceMetric {
  name: string
  duration: number
  count?: number
}

interface PerformancePanelProps {
  metrics: PerformanceMetric[]
}

export function PerformancePanel({ metrics }: PerformancePanelProps) {
  if (metrics.length === 0) {
    return (
      <div style={{ padding: '16px', color: '#858585', fontSize: '13px' }}>
        No performance data
      </div>
    )
  }

  const totalDuration = metrics.reduce((sum, m) => sum + m.duration, 0)

  return (
    <div style={{ padding: '16px' }}>
      <div style={{
        fontSize: '11px',
        fontWeight: 600,
        color: '#cccccc',
        textTransform: 'uppercase',
        marginBottom: '12px'
      }}>
        Performance
      </div>
      <div style={{
        backgroundColor: '#1e1e1e',
        padding: '12px',
        borderRadius: '4px',
        fontSize: '12px'
      }}>
        {metrics.map((metric, i) => (
          <div key={i} style={{
            marginBottom: '8px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}>
            <div>
              <div style={{ color: '#d4d4d4' }}>{metric.name}</div>
              {metric.count !== undefined && (
                <div style={{ color: '#858585', fontSize: '11px' }}>
                  {metric.count} operations
                </div>
              )}
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ color: '#b5cea8', fontWeight: 500 }}>
                {metric.duration.toFixed(2)}ms
              </div>
              <div style={{ color: '#858585', fontSize: '11px' }}>
                {((metric.duration / totalDuration) * 100).toFixed(1)}%
              </div>
            </div>
          </div>
        ))}
        <div style={{
          marginTop: '12px',
          paddingTop: '12px',
          borderTop: '1px solid #3e3e42',
          display: 'flex',
          justifyContent: 'space-between',
          fontWeight: 600
        }}>
          <span style={{ color: '#cccccc' }}>Total</span>
          <span style={{ color: '#b5cea8' }}>{totalDuration.toFixed(2)}ms</span>
        </div>
      </div>
    </div>
  )
}
