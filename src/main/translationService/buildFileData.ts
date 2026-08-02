import { Project } from "ts-morph";
import { makeSemanticGraph } from './makeSemanticGraph';
import { buildViewModel } from './renderable/viewModel';
import { AstCache } from './cache/astCache';
import type { ViewModel } from './renderable/types';

export interface BuildFileResult {
  viewModel: ViewModel;
  path: string;
  astCache: AstCache;
}

export function buildFileData(sourceCode: string, filePath: string): BuildFileResult {
  const project = new Project();
  const sourceFile = project.createSourceFile(filePath, sourceCode, {
    overwrite: true,
    scriptKind: filePath.endsWith('.tsx') ? 4 : 3,
  });
  const semanticGraph = makeSemanticGraph(sourceFile);
  const astCache = new AstCache(sourceFile);
  const viewModel = buildViewModel(semanticGraph, sourceCode, filePath);
  return { viewModel, path: filePath, astCache };
}
