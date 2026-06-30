import React from 'react'

interface PanelProps {
  children: React.ReactNode
  width?: string
  minWidth?: string
  borderRight?: boolean
  borderLeft?: boolean
}

export function Panel({
  children,
  width = 'auto',
  minWidth = '200px',
  borderRight = false,
  borderLeft = false
}: PanelProps) {
  return (
    <div style={{
      width,
      minWidth,
      height: '100%',
      overflow: 'auto',
      backgroundColor: '#252526',
      borderRight: borderRight ? '1px solid #3e3e42' : 'none',
      borderLeft: borderLeft ? '1px solid #3e3e42' : 'none'
    }}>
      {children}
    </div>
  )
}
