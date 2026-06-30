import React from 'react'
import ReactDOM from 'react-dom/client'
import { App } from './App'
import { ControllersContext } from './hooks/useControllers'
import { RepositoryController } from './controllers/RepositoryController'
import { NavigationController } from './controllers/NavigationController'
import { TranslationController } from './controllers/TranslationController'
import { InspectorController } from './controllers/InspectorController'

const controllers = {
  repository: new RepositoryController(),
  navigation: new NavigationController(),
  translation: new TranslationController(),
  inspector: new InspectorController()
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ControllersContext.Provider value={controllers}>
      <App />
    </ControllersContext.Provider>
  </React.StrictMode>
)
