import { globalEventBus } from '@pseudo2/shared'

export interface NavigationState {
  selectedFile: string | null
  expandedFolders: Set<string>
  searchQuery: string
}

export class NavigationController {
  private state: NavigationState = {
    selectedFile: null,
    expandedFolders: new Set(),
    searchQuery: ''
  }

  selectFile(path: string): void {
    this.state.selectedFile = path
    globalEventBus.emit('navigation:file-selected', { path })
  }

  getSelectedFile(): string | null {
    return this.state.selectedFile
  }

  expandFolder(path: string): void {
    this.state.expandedFolders.add(path)
    globalEventBus.emit('navigation:folder-expanded', { path })
  }

  collapseFolder(path: string): void {
    this.state.expandedFolders.delete(path)
    globalEventBus.emit('navigation:folder-collapsed', { path })
  }

  toggleFolder(path: string): void {
    if (this.state.expandedFolders.has(path)) {
      this.collapseFolder(path)
    } else {
      this.expandFolder(path)
    }
  }

  isFolderExpanded(path: string): boolean {
    return this.state.expandedFolders.has(path)
  }

  setSearchQuery(query: string): void {
    this.state.searchQuery = query
  }

  getSearchQuery(): string {
    return this.state.searchQuery
  }

  getState(): NavigationState {
    return { ...this.state }
  }
}
