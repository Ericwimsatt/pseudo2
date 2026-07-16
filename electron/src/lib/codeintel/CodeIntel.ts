import { Project, SourceFile, TypeChecker } from 'ts-morph';

export interface SymbolLocation {
  filePath: string;
  line: number;
  column: number;
  type: 'definition' | 'reference';
  symbolName: string;
  contextSnippet: string;
}

export interface NavigationEntry {
  filePath: string;
  line: number;
  column: number;
  symbolName?: string;
}

export class CodeIntelProject {
  private project: Project;
  private sourceFiles: Map<string, SourceFile> = new Map();

  constructor() {
    this.project = new Project({
      useInMemoryFileSystem: true,
      compilerOptions: {
        target: 'es2020',
        module: 'esnext',
        jsx: 'react-jsx',
        moduleResolution: 'bundler',
        strict: true,
      },
    });
  }

  addSourceFile(filePath: string, content: string): SourceFile {
    const existing = this.sourceFiles.get(filePath);
    if (existing) {
      existing.replaceWithText(content);
      return existing;
    }
    const sourceFile = this.project.createSourceFile(filePath, content, {
      overwrite: true,
    });
    this.sourceFiles.set(filePath, sourceFile);
    return sourceFile;
  }

  getSourceFile(filePath: string): SourceFile | undefined {
    return this.sourceFiles.get(filePath);
  }

  getTypeChecker(): TypeChecker {
    return this.project.getTypeChecker();
  }

  findDefinition(filePath: string, position: { line: number; column: number }): SymbolLocation | null {
    const sourceFile = this.sourceFiles.get(filePath);
    if (!sourceFile) return null;

    const node = sourceFile.getDescendantAtPos(
      sourceFile.getPositionFromLineAndColumn(position.line, position.column)
    );
    if (!node) return null;

    const symbol = node.getSymbol();
    if (!symbol) return null;

    const declarations = symbol.getDeclarations();
    if (declarations.length === 0) return null;

    const decl = declarations[0];
    const declSourceFile = decl.getSourceFile();

    return {
      filePath: declSourceFile.getFilePath(),
      line: declSourceFile.getLineAndCharacterOfPosition(decl.getStart()).line + 1,
      column: declSourceFile.getLineAndCharacterOfPosition(decl.getStart()).character + 1,
      type: 'definition',
      symbolName: symbol.getName(),
      contextSnippet: decl.getText().slice(0, 100),
    };
  }

  findReferences(filePath: string, position: { line: number; column: number }): SymbolLocation[] {
    const sourceFile = this.sourceFiles.get(filePath);
    if (!sourceFile) return [];

    const node = sourceFile.getDescendantAtPos(
      sourceFile.getPositionFromLineAndColumn(position.line, position.column)
    );
    if (!node) return [];

    const symbol = node.getSymbol();
    if (!symbol) return [];

    const references = symbol.findReferencesAsNodes();
    const locations: SymbolLocation[] = [];

    for (const ref of references) {
      const refSourceFile = ref.getSourceFile();
      const start = ref.getStart();
      const lineChar = refSourceFile.getLineAndCharacterOfPosition(start);

      locations.push({
        filePath: refSourceFile.getFilePath(),
        line: lineChar.line + 1,
        column: lineChar.character + 1,
        type: ref.getKind() === 8 ? 'definition' : 'reference',
        symbolName: symbol.getName(),
        contextSnippet: ref.getText().slice(0, 100),
      });
    }

    return locations;
  }

  getSymbolAtPosition(filePath: string, position: { line: number; column: number }): string | null {
    const sourceFile = this.sourceFiles.get(filePath);
    if (!sourceFile) return null;

    const node = sourceFile.getDescendantAtPos(
      sourceFile.getPositionFromLineAndColumn(position.line, position.column)
    );
    if (!node) return null;

    const symbol = node.getSymbol();
    return symbol?.getName() ?? null;
  }
}

export class NavigationHistory {
  private backStack: NavigationEntry[] = [];
  private forwardStack: NavigationEntry[] = [];
  private current: NavigationEntry | null = null;

  push(entry: NavigationEntry): void {
    if (this.current) {
      this.backStack.push(this.current);
    }
    this.current = entry;
    this.forwardStack = [];
  }

  back(): NavigationEntry | null {
    if (this.backStack.length === 0) return null;
    if (this.current) {
      this.forwardStack.push(this.current);
    }
    this.current = this.backStack.pop()!;
    return this.current;
  }

  forward(): NavigationEntry | null {
    if (this.forwardStack.length === 0) return null;
    if (this.current) {
      this.backStack.push(this.current);
    }
    this.current = this.forwardStack.pop()!;
    return this.current;
  }

  canBack(): boolean {
    return this.backStack.length > 0;
  }

  canForward(): boolean {
    return this.forwardStack.length > 0;
  }

  getCurrent(): NavigationEntry | null {
    return this.current;
  }
}
