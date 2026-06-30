import React, { useState, useEffect } from 'react'
import { Layout, Toolbar, MainContent, Panel } from './components/layout'
import { RepositoryTree } from './panels/RepositoryTree'
import { PseudoCodeView } from './panels/PseudoCodeView'
import { Inspector } from './panels/Inspector'
import { SourcePanel } from './panels/SourcePanel'
import { AstPanel } from './panels/AstPanel'
import { SemanticPanel } from './panels/SemanticPanel'
import { DiagnosticsPanel } from './panels/DiagnosticsPanel'
import { LogsPanel } from './panels/LogsPanel'
import { PerformancePanel } from './panels/PerformancePanel'
import { useRepository } from './hooks/useRepository'
import { useNavigation } from './hooks/useNavigation'
import { useTranslation } from './hooks/useTranslation'
import type { SourceFile } from '@pseudo2/shared'

function LoadingOverlay({ message }: { message: string }) {
  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(30, 30, 30, 0.85)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000,
      flexDirection: 'column',
      gap: '16px'
    }}>
      <div style={{
        width: '32px',
        height: '32px',
        border: '3px solid #3e3e42',
        borderTop: '3px solid #007acc',
        borderRadius: '50%',
        animation: 'pseudo2-spin 0.8s linear infinite'
      }} />
      <div style={{
        color: '#cccccc',
        fontSize: '14px'
      }}>
        {message}
      </div>
      <style>{`
        @keyframes pseudo2-spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  )
}

export function App() {
  const { repository, loading, loadRepository, files, diagnostics, logs, metrics } = useRepository()
  const { selectedFile } = useNavigation()
  const [activeDevTab, setActiveDevTab] = useState<'source' | 'ast' | 'semantic' | 'diagnostics' | 'logs' | 'performance'>('source')
  const [hasLoaded, setHasLoaded] = useState<boolean>(false)

  useEffect(() => {
    if (hasLoaded) {
      return
    }

    setHasLoaded(true)

    const loadRepo = async () => {
      try {
        const response = await fetch('/api/repo/files')
        const data = await response.json()
        const fileMap = new Map<string, string>(Object.entries(data.files))
        await loadRepository(data.root, fileMap)
      } catch (error) {
        console.error('Failed to load repository:', error)
      }
    }

    loadRepo()
  }, [hasLoaded, loadRepository])

  const currentFile = selectedFile
    ? files.find((f: SourceFile) => f.path === selectedFile) || null
    : null

  const semanticNodes = currentFile?.semanticNodes || []
  const pseudoCode = useTranslation(semanticNodes, currentFile?.path || '')

  if (!repository && !loading) {
    return (
      <Layout>
        <Toolbar />
        <div style={{
          flex: 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#1e1e1e',
          color: '#cccccc'
        }}>
          <LoadingOverlay message="Connecting to repository..." />
        </div>
      </Layout>
    )
  }

  return (
    <Layout>
      {loading && <LoadingOverlay message="Parsing repository..." />}
      <Toolbar title={`Pseudo2 - ${repository?.name || ''} (${files.length} files)`} />
      <MainContent>
        <Panel width="250px" minWidth="200px" borderRight>
          <RepositoryTree files={files} />
        </Panel>

        <Panel width="100%" borderRight>
          <PseudoCodeView
            lines={pseudoCode?.lines || []}
            filename={currentFile?.path}
          />
        </Panel>

        <Panel width="300px" minWidth="250px" borderLeft>
          <Inspector />
        </Panel>
      </MainContent>

      <div style={{
        height: '300px',
        backgroundColor: '#252526',
        borderTop: '1px solid #3e3e42',
        display: 'flex',
        flexDirection: 'column'
      }}>
        <div style={{
          display: 'flex',
          backgroundColor: '#2d2d30',
          borderBottom: '1px solid #3e3e42'
        }}>
          {(['source', 'ast', 'semantic', 'diagnostics', 'logs', 'performance'] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setActiveDevTab(tab)}
              style={{
                padding: '8px 16px',
                backgroundColor: activeDevTab === tab ? '#1e1e1e' : 'transparent',
                color: activeDevTab === tab ? '#ffffff' : '#858585',
                border: 'none',
                borderBottom: activeDevTab === tab ? '2px solid #007acc' : '2px solid transparent',
                cursor: 'pointer',
                fontSize: '12px',
                textTransform: 'capitalize'
              }}
            >
              {tab}
            </button>
          ))}
        </div>

        <div style={{ flex: 1, overflow: 'auto' }}>
          {activeDevTab === 'source' && <SourcePanel file={currentFile} />}
          {activeDevTab === 'ast' && <AstPanel file={currentFile} />}
          {activeDevTab === 'semantic' && <SemanticPanel nodes={semanticNodes} />}
          {activeDevTab === 'diagnostics' && <DiagnosticsPanel diagnostics={diagnostics} />}
          {activeDevTab === 'logs' && <LogsPanel logs={logs} />}
          {activeDevTab === 'performance' && <PerformancePanel metrics={metrics} />}
        </div>
      </div>
    </Layout>
  )
}
