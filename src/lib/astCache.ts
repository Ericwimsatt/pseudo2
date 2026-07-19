import { SourceFile, Node } from 'ts-morph';
import type { QueryAnswer } from './renderable/types';

export class AstCache {
  private sourceFile: SourceFile;
  private nodeByOffset = new Map<number, Node | null>();
  private answerCache = new Map<string, QueryAnswer>();

  constructor(sourceFile: SourceFile) {
    this.sourceFile = sourceFile;
  }

  /**
   * Answer a single enrichment query.
   * Results are cached per (kind, refPos) so repeated calls are O(1).
   */
  answer(refPos: number, kind: string): QueryAnswer {
    const key = `${kind}:${refPos}`;
    const cached = this.answerCache.get(key);
    if (cached) return cached;

    let answer: QueryAnswer;
    try {
      switch (kind) {
        case 'definition':
          answer = this.answerDefinition(refPos);
          break;
        case 'references':
          answer = this.answerReferences(refPos);
          break;
        case 'type':
          answer = this.answerType(refPos);
          break;
        default:
          throw new Error(`Unknown query kind: ${kind}`);
      }
    } catch {
      answer = emptyAnswer(kind);
    }

    this.answerCache.set(key, answer);
    return answer;
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

  // ── Definition ────────────────────────────────────────────────────

  private answerDefinition(refPos: number): QueryAnswer {
    const node = this.lookupNode(refPos);
    if (!node) return emptyAnswer('definition');

    const symbol = node.getSymbol?.();
    if (!symbol) return emptyAnswer('definition');

    const decls = symbol.getDeclarations();
    if (decls.length === 0) return emptyAnswer('definition');

    const decl = decls[0];
    return {
      kind: 'definition',
      data: {
        line: decl.getStartLineNumber(),
        text: firstLine(decl.getText()),
      },
    };
  }

  // ── References ────────────────────────────────────────────────────

  private answerReferences(refPos: number): QueryAnswer {
    const node = this.lookupNode(refPos);
    if (!node) return { kind: 'references', data: { list: [] } };

    const symbol = node.getSymbol?.();
    if (!symbol) return { kind: 'references', data: { list: [] } };

    let refNodes: Node[];
    try {
      refNodes = (node as any).findReferencesAsNodes();
    } catch {
      return { kind: 'references', data: { list: [] } };
    }

    const declOffsets = new Set(
      symbol.getDeclarations().map((d: Node) => d.getStart()),
    );

    const list = refNodes
      .filter((r) => !declOffsets.has(r.getStart()))
      .map((r) => ({
        line: r.getStartLineNumber(),
        isWrite: isWriteReference(r),
      }));

    return { kind: 'references', data: { list } };
  }

  // ── Type ──────────────────────────────────────────────────────────

  private answerType(refPos: number): QueryAnswer {
    const node = this.lookupNode(refPos);
    if (!node) return { kind: 'type', data: null };

    try {
      const typeText = node.getType().getText();
      return { kind: 'type', data: { text: typeText } };
    } catch {
      return { kind: 'type', data: null };
    }
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

function emptyAnswer(kind: string): QueryAnswer {
  switch (kind) {
    case 'definition':
      return { kind: 'definition', data: null };
    case 'references':
      return { kind: 'references', data: { list: [] } };
    case 'type':
      return { kind: 'type', data: null };
    default:
      throw new Error(`Unknown query kind: ${kind}`);
  }
}
