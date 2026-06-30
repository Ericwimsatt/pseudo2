import ts from 'typescript'
import type { LanguageParser } from '@pseudo2/shared'

export class TypeScriptParser implements LanguageParser {
  async parse(source: string, filename: string): Promise<ts.SourceFile> {
    const scriptKind = filename.endsWith('.tsx') ? ts.ScriptKind.TSX : ts.ScriptKind.TS

    const sourceFile = ts.createSourceFile(
      filename,
      source,
      ts.ScriptTarget.Latest,
      true,
      scriptKind
    )

    return sourceFile
  }

  validate(ast: unknown): boolean {
    if (!ast || typeof ast !== 'object') {
      return false
    }

    const sourceFile = ast as ts.SourceFile
    return sourceFile.kind === ts.SyntaxKind.SourceFile
  }
}
