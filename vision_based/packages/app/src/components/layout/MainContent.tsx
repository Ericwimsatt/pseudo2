import React from 'react'

interface MainContentProps {
  children: React.ReactNode
}

export function MainContent({ children }: MainContentProps) {
  return (
    <div style={{
      display: 'flex',
      flex: 1,
      overflow: 'hidden'
    }}>
      {children}
    </div>
  )
}
