import { SourceFile, Node } from 'ts-morph';

export interface AstDefinition {
  line: number;
  text: string;
}

export interface AstReference {
  line: number;
  isWrite: boolean;
}

export interface AstType {
  text: string;
}

export class AstCache {
  private sourceFile: SourceFile;
  private nodeByOffset = new Map<number, Node | null>();
  private resultCache = new Map<string, unknown>();

  constructor(sourceFile: SourceFile) {
    this.sourceFile = sourceFile;
  }

  // ── Node lookup (cached) ──────────────────────────────────────────

  private lookupNode(refPos: number): Node | null {
    const cached = this.nodeByOffset.get(refPos);
    if (cached !== undefined) return cached;
    let node: Node | null = null;
    try {
      node = this.sourceFile.getDescendantAtPos(refPos) ?? null;
    } catch {
      node = null;
    }
    this.nodeByOffset.set(refPos, node);
    return node;
  }

  // ── Public query methods ──────────────────────────────────────────

  getDefinition(refPos: number): AstDefinition | null {
    const key = `def:${refPos}`;
    const cached = this.resultCache.get(key) as AstDefinition | null | undefined;
    if (cached !== undefined) return cached;
    let result: AstDefinition | null = null;
    try {
      const node = this.lookupNode(refPos);
      if (node) {
        const symbol = node.getSymbol?.();
        if (symbol) {
          const decls = symbol.getDeclarations();
          const decl = decls[0];
          if (decl) {
            result = {
              line: decl.getStartLineNumber(),
              text: firstLine(decl.getText()),
            };
          }
        }
      }
    } catch { /* return null */ }

    this.resultCache.set(key, result);
    return result;
  }

  getReferences(refPos: number): AstReference[] {
    const key = `ref:${refPos}`;
    const cached = this.resultCache.get(key) as AstReference[] | undefined;
    if (cached !== undefined) return cached;
    let result: AstReference[] = [];
    try {
      const node = this.lookupNode(refPos);
      if (node) {
        const symbol = node.getSymbol?.();
        if (symbol) {
          const refNodes: Node[] = (node as any).findReferencesAsNodes();
          const declOffsets = new Set(
            symbol.getDeclarations().map((d: Node) => d.getStart()),
          );
          result = refNodes
            .filter((r) => !declOffsets.has(r.getStart()))
            .map((r) => ({
              line: r.getStartLineNumber(),
              isWrite: isWriteReference(r),
            }));
        }
      }
    } catch { /* return empty */ }

    this.resultCache.set(key, result);
    return result;
  }

  getType(refPos: number): AstType | null {
    const key = `type:${refPos}`;
    const cached = this.resultCache.get(key) as AstType | null | undefined;
    if (cached !== undefined) return cached;

    let result: AstType | null = null;
    try {
      const node = this.lookupNode(refPos);
      if (node) {
        const typeText = node.getType().getText();
        result = { text: typeText };
      }
    } catch { /* return null */ }

    this.resultCache.set(key, result);
    return result;
  }

  getSourceFile(): SourceFile {
    return this.sourceFile;
  }
}

// ── Helpers ──────────────────────────────────────────────────────────

function isWriteReference(node: Node): boolean {
  const parent = node.getParent();
  if (!parent) return false;

  // Left side of an assignment
  if (
    'getLeft' in parent &&
    typeof (parent as any).getLeft === 'function'
  ) {
    try {
      const left = (parent as any).getLeft();
      return left?.getStart() === node.getStart();
    } catch {
      return false;
    }
  }

  // ++ or -- prefix/postfix
  const parentText = parent.getText?.() ?? '';
  if (/^(?:\+\+|--)/.test(parentText)) return true;

  return false;
}

function firstLine(text: string): string {
  const idx = text.indexOf('\n');
  return idx === -1 ? text : text.slice(0, idx);
}
