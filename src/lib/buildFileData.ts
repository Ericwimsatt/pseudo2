import { Project } from "ts-morph";
import { makeSemanticGraph } from './makeSemanticGraph';
import { buildViewModel } from './renderable/viewModel';
import type { ViewModel } from './renderable/types';

export function buildFileData(sourceCode: string, filePath: string): { viewModel: ViewModel; path: string } {
  const project = new Project();
  const sourceFile = project.createSourceFile(filePath, sourceCode, {
    overwrite: true,
    scriptKind: filePath.endsWith('.tsx') ? 4 : 3,
  });
  const semanticGraph = makeSemanticGraph(sourceFile);
  const viewModel = buildViewModel(semanticGraph, sourceCode);
  return { viewModel, path: filePath };
}
