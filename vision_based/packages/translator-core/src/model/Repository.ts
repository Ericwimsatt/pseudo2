import type {
  Repository as IRepository,
  SourceFile,
  SymbolGraph,
  SemanticGraph as ISemanticGraph,
  RepositoryMetadata,
  LanguageServices
} from '@pseudo2/shared'
import { SemanticGraph } from './SemanticGraph'

export class Repository implements IRepository {
  root: string
  name: string
  files = new Map<string, SourceFile>()
  symbolGraph: SymbolGraph = {
    symbols: new Map(),
    relationships: []
  }
  semanticGraph: ISemanticGraph = new SemanticGraph()
  metadata: RepositoryMetadata = {
    language: 'typescript'
  }
  languageServices: LanguageServices

  constructor(
    root: string,
    name: string,
    languageServices: LanguageServices
  ) {
    this.root = root
    this.name = name
    this.languageServices = languageServices
  }

  addFile(file: SourceFile): void {
    this.files.set(file.path, file)
  }

  getFile(path: string): SourceFile | undefined {
    return this.files.get(path)
  }

  removeFile(path: string): void {
    this.files.delete(path)
  }

  getAllFiles(): SourceFile[] {
    return Array.from(this.files.values())
  }

  clear(): void {
    this.files.clear()
    this.symbolGraph = {
      symbols: new Map(),
      relationships: []
    }
    this.semanticGraph.clear()
  }
}
