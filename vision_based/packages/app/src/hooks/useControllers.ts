import { createContext, useContext } from 'react'
import { RepositoryController } from '../controllers/RepositoryController'
import { NavigationController } from '../controllers/NavigationController'
import { TranslationController } from '../controllers/TranslationController'
import { InspectorController } from '../controllers/InspectorController'

interface Controllers {
  repository: RepositoryController
  navigation: NavigationController
  translation: TranslationController
  inspector: InspectorController
}

const ControllersContext = createContext<Controllers | null>(null)

export function useControllers(): Controllers {
  const context = useContext(ControllersContext)
  if (!context) {
    throw new Error('useControllers must be used within ControllersProvider')
  }
  return context
}

export { ControllersContext }
export type { Controllers }
