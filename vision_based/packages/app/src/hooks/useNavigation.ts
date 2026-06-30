import { useState, useEffect, useCallback } from 'react'
import type { NavigationState } from '../controllers/NavigationController'
import { useControllers } from './useControllers'
import { globalEventBus } from '@pseudo2/shared'

export function useNavigation() {
  const { navigation } = useControllers()
  const [state, setState] = useState<NavigationState>(navigation.getState())

  const updateState = useCallback(() => {
    setState({ ...navigation.getState() })
  }, [navigation])

  useEffect(() => {
    const sub1 = globalEventBus.on('navigation:file-selected', updateState)
    const sub2 = globalEventBus.on('navigation:folder-expanded', updateState)
    const sub3 = globalEventBus.on('navigation:folder-collapsed', updateState)

    return () => {
      sub1.unsubscribe()
      sub2.unsubscribe()
      sub3.unsubscribe()
    }
  }, [updateState])

  return {
    selectedFile: state.selectedFile,
    expandedFolders: state.expandedFolders,
    searchQuery: state.searchQuery,
    selectFile: (path: string) => navigation.selectFile(path),
    toggleFolder: (path: string) => navigation.toggleFolder(path),
    setSearchQuery: (query: string) => navigation.setSearchQuery(query)
  }
}
