import type { EnrichQuery, QueryAnswer } from '../../lib/renderable/types';
import { getCache } from '../cache/projectCache';

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

export function getNodeDetail(arg: { filePath: string; query: EnrichQuery }): QueryAnswer {
  const cache = getCache(arg.filePath);
  if (!cache) {
    return emptyAnswer(arg.query.kind);
  }
  return cache.answer(arg.query.refPos, arg.query.kind);
}
