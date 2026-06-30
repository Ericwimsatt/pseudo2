import { Repository } from '@pseudo2/translator-core'
import { TypeScriptParser, TypeScriptAdapter, SymbolExtractor } from '@pseudo2/language-typescript'
import type { SourceFile } from '@pseudo2/shared'
import { globalEventBus } from '@pseudo2/shared'

export interface Diagnostic {
  type: 'error' | 'warning' | 'info'
  message: string
  source?: string
}

export interface LogEntry {
  timestamp: number
  level: 'info' | 'warn' | 'error' | 'debug'
  message: string
}

export interface PerformanceMetric {
  name: string
  duration: number
  count?: number
}

export class RepositoryController {
  private repository: Repository | null = null
  private parser = new TypeScriptParser()
  private adapter = new TypeScriptAdapter()
  private symbolExtractor = new SymbolExtractor()
  private _diagnostics: Diagnostic[] = []
  private _logs: LogEntry[] = []
  private _metrics: PerformanceMetric[] = []

  get diagnostics(): Diagnostic[] {
    return this._diagnostics
  }

  get logs(): LogEntry[] {
    return this._logs
  }

  get metrics(): PerformanceMetric[] {
    return this._metrics
  }

  private log(level: LogEntry['level'], message: string): void {
    this._logs.push({ timestamp: Date.now(), level, message })
  }

  async loadRepository(root: string, files: Map<string, string>): Promise<Repository> {
    this._diagnostics = []
    this._logs = []
    this._metrics = []

    const totalStart = performance.now()

    const languageServices = {
      parser: this.parser,
      visitors: [],
      adapters: [this.adapter]
    }

    this.repository = new Repository(root, this.getRepoName(root), languageServices)

    this.log('info', `Loading repository: ${root}`)

    for (const [path, content] of files) {
      const sourceFile: SourceFile = {
        path,
        content,
        language: 'typescript'
      }
      this.repository.addFile(sourceFile)
    }

    this.log('info', `Indexed ${files.size} files`)

    const indexStart = performance.now()
    await this.indexRepository()
    const indexDuration = performance.now() - indexStart

    this._metrics.push({
      name: 'Repository Indexing',
      duration: indexDuration,
      count: files.size
    })

    const totalDuration = performance.now() - totalStart

    this._metrics.push({
      name: 'Total Load Time',
      duration: totalDuration
    })

    this.log('info', `Repository loaded in ${totalDuration.toFixed(2)}ms`)

    globalEventBus.emit('repository:loaded', {
      root,
      fileCount: files.size
    })

    return this.repository
  }

  getRepository(): Repository | null {
    return this.repository
  }

  private async indexRepository(): Promise<void> {
    if (!this.repository) return

    const files = this.repository.getAllFiles()
    let parsedCount = 0
    let totalNodes = 0

    const parseStart = performance.now()

    for (const file of files) {
      await this.parseFile(file)
      parsedCount++
      totalNodes += file.semanticNodes?.length || 0
    }

    const parseDuration = performance.now() - parseStart

    this._metrics.push({
      name: 'AST Parsing',
      duration: parseDuration,
      count: parsedCount
    })

    this._metrics.push({
      name: 'Semantic Generation',
      duration: parseDuration,
      count: totalNodes
    })

    this.log('info', `Parsed ${parsedCount} files, generated ${totalNodes} semantic nodes`)
  }

  async parseFile(file: SourceFile): Promise<void> {
    if (!this.repository) return

    try {
      const ast = await this.parser.parse(file.content, file.path)
      file.ast = ast

      const symbols = this.symbolExtractor.extract(ast, file.path)
      for (const symbol of symbols) {
        this.repository.symbolGraph.symbols.set(symbol.id, symbol)
      }

      const semanticNodes = this.adapter.adapt(ast)
      file.semanticNodes = semanticNodes

      for (const node of semanticNodes) {
        this.repository.semanticGraph.addNode(node)
      }

      globalEventBus.emit('translation:completed', {
        file: file.path,
        nodeCount: semanticNodes.length
      })
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error'

      this._diagnostics.push({
        type: 'error',
        message: `Failed to parse ${file.path}: ${message}`,
        source: file.path
      })

      this.log('error', `Parse error in ${file.path}: ${message}`)

      globalEventBus.emit('translation:error', {
        file: file.path,
        error: message
      })
    }
  }

  private getRepoName(root: string): string {
    const parts = root.split('/')
    return parts[parts.length - 1] || 'repository'
  }
}
