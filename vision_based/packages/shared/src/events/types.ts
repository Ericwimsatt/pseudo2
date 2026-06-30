export interface RepositoryEvents {
  'repository:loaded': { root: string; fileCount: number }
  'repository:file-added': { path: string }
  'repository:file-removed': { path: string }
  'repository:file-changed': { path: string }
}

export interface NavigationEvents {
  'navigation:file-selected': { path: string }
  'navigation:folder-expanded': { path: string }
  'navigation:folder-collapsed': { path: string }
}

export interface TranslationEvents {
  'translation:started': { file: string }
  'translation:completed': { file: string; nodeCount: number }
  'translation:error': { file: string; error: string }
}

export interface InspectorEvents {
  'inspector:node-selected': { nodeId: string }
  'inspector:line-selected': { lineId: string }
}

export type AllEvents = RepositoryEvents & NavigationEvents & TranslationEvents & InspectorEvents
