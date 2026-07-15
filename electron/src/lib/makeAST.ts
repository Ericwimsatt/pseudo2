import * as ts from 'typescript';

export function makeAST(sourceCode: string, fileName: string): ts.SourceFile {
  const isTsx = fileName.endsWith('.tsx');
  return ts.createSourceFile(
    fileName,
    sourceCode,
    ts.ScriptTarget.Latest,
    true,
    isTsx ? ts.ScriptKind.TSX : ts.ScriptKind.TS,
  );
}
