import { Project, SourceFile } from "ts-morph";

export function makeAST(sourceCode: string, fileName: string): SourceFile {
  const project = new Project();
  const isTsx = fileName.endsWith('.tsx');
  return project.createSourceFile(fileName, sourceCode, {
    overwrite: true,
    scriptKind: isTsx ? 4 : 3,
  });
}
