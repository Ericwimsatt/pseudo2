import React from 'react'
import type { PseudoCodeLine } from '@pseudo2/shared'
import { useInspector } from '../../hooks/useInspector'

interface PseudoCodeViewProps {
  lines: PseudoCodeLine[]
  filename?: string
}

export function PseudoCodeView({ lines, filename }: PseudoCodeViewProps) {
  const { selectLine, selectedLine } = useInspector()

  if (lines.length === 0) {
    return (
      <div style={{
        padding: '16px',
        color: '#858585',
        fontSize: '13px'
      }}>
        {filename ? 'No pseudocode generated' : 'Select a file to view pseudocode'}
      </div>
    )
  }

  return (
    <div style={{ padding: '16px' }}>
      {filename && (
        <div style={{
          marginBottom: '16px',
          fontSize: '13px',
          color: '#cccccc',
          fontWeight: 500
        }}>
          {filename}
        </div>
      )}
      <div style={{
        fontFamily: 'Monaco, Menlo, "Ubuntu Mono", monospace',
        fontSize: '13px',
        lineHeight: '1.6'
      }}>
        {lines.map((line) => (
          <Line
            key={line.id}
            line={line}
            isSelected={selectedLine?.id === line.id}
            onClick={() => selectLine(line)}
          />
        ))}
      </div>
    </div>
  )
}

interface LineProps {
  line: PseudoCodeLine
  isSelected: boolean
  onClick: () => void
}

function Line({ line, isSelected, onClick }: LineProps) {
  return (
    <div
      onClick={onClick}
      style={{
        padding: '2px 8px',
        paddingLeft: `${line.indent * 20 + 8}px`,
        cursor: 'pointer',
        backgroundColor: isSelected ? '#264f78' : 'transparent',
        color: '#d4d4d4',
        borderRadius: '2px'
      }}
      onMouseEnter={(e) => {
        if (!isSelected) {
          e.currentTarget.style.backgroundColor = '#2a2d2e'
        }
      }}
      onMouseLeave={(e) => {
        if (!isSelected) {
          e.currentTarget.style.backgroundColor = 'transparent'
        }
      }}
    >
      {line.content}
    </div>
  )
}
