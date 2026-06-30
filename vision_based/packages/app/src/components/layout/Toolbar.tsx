import React from 'react'

interface ToolbarProps {
  title?: string
}

export function Toolbar({ title = 'Pseudo2 - Code Explorer' }: ToolbarProps) {
  return (
    <div style={{
      height: '40px',
      backgroundColor: '#2d2d30',
      color: '#cccccc',
      display: 'flex',
      alignItems: 'center',
      padding: '0 16px',
      borderBottom: '1px solid #3e3e42',
      fontSize: '13px'
    }}>
      <span style={{ fontWeight: 500 }}>{title}</span>
    </div>
  )
}
