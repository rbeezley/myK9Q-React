import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import { registerSW } from 'virtual:pwa-register'
import { serviceWorkerManager } from './utils/serviceWorkerUtils'

const updateSW = registerSW({
  onNeedRefresh() {
    if (confirm('New content available. Reload?')) {
      updateSW(true)
    }
  },
  onOfflineReady() {
    console.log('App ready to work offline')
    // Initialize service worker manager when offline-ready
    serviceWorkerManager.initialize().catch(console.error)
  },
  onRegistered() {
    console.log('Service Worker registered')
    // Also initialize here to be safe
    serviceWorkerManager.initialize().catch(console.error)
  }
})

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)