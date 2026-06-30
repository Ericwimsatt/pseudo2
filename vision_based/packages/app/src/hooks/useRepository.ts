import { useState, useEffect } from 'react'
import type { Repository, SourceFile } from '@pseudo2/shared'
import type { Diagnostic, LogEntry, PerformanceMetric } from '../controllers/RepositoryController'
import { useControllers } from './useControllers'

export function useRepository() {
  const { repository: controller } = useControllers()
  const [repo, setRepo] = useState<Repository | null>(null)
  const [loading, setLoading] = useState(false)
  const [diagnostics, setDiagnostics] = useState<Diagnostic[]>([])
  const [logs, setLogs] = useState<LogEntry[]>([])
  const [metrics, setMetrics] = useState<PerformanceMetric[]>([])

  useEffect(() => {
    setRepo(controller.getRepository())
  }, [controller])

  const loadRepository = async (root: string, files: Map<string, string>) => {
    setLoading(true)
    try {
      const newRepo = await controller.loadRepository(root, files)
      setRepo(newRepo)
      setDiagnostics([...controller.diagnostics])
      setLogs([...controller.logs])
      setMetrics([...controller.metrics])
      return newRepo
    } finally {
      setLoading(false)
    }
  }

  return {
    repository: repo,
    loading,
    loadRepository,
    files: repo?.getAllFiles() || [],
    diagnostics,
    logs,
    metrics
  }
}
