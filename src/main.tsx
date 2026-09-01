import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { App } from './App'
import './i18n'

const rootElement = document.getElementById('root')
if (!rootElement) {
  throw new Error('Hainyah could not find its root element.')
}

createRoot(rootElement).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
