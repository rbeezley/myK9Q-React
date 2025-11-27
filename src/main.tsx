import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import { registerSW } from 'virtual:pwa-register'
import { serviceWorkerManager } from './utils/serviceWorkerUtils'
import { initializeReplication } from './services/replication/initReplication'

// App version for debugging cache issues
const APP_VERSION = '2024-11-25-v4';
// Track if user has been prompted about this update (persist across sessions)
const getLastPromptedVersion = () => localStorage.getItem('sw_prompted_version');
const setLastPromptedVersion = () => localStorage.setItem('sw_prompted_version', APP_VERSION);

const updateSW = registerSW({
  onNeedRefresh() {
    // In development, don't auto-prompt for refresh to avoid interrupting work
    if (import.meta.env.DEV) {
      return
    }

    // Only prompt once per app version (persists across sessions/refreshes)
    // This prevents repeated prompts during PTR or page navigation
    const lastPrompted = getLastPromptedVersion();
    if (lastPrompted === APP_VERSION) {
      return
    }

    setLastPromptedVersion();

    // In production, prompt user for update
    if (confirm('New content available. Reload?')) {
      updateSW(true)
    }
  },
  onOfflineReady() {
    // Initialize service worker manager when offline-ready
    serviceWorkerManager.initialize().catch(console.error)
  },
  onRegistered() {
    // Also initialize here to be safe
    serviceWorkerManager.initialize().catch(console.error)
  }
})

// Also initialize replication immediately for faster startup
initializeReplication().catch(console.error)

// Expose debug functions (development only)
if (import.meta.env.DEV && typeof window !== 'undefined') {
  // Force full sync
  (window as any).debugForceFullSync = async () => {
    const { triggerFullSync } = await import('./services/replication/initReplication')
    const auth = JSON.parse(localStorage.getItem('myK9Q_auth') || '{}')
    const licenseKey = auth.showContext?.licenseKey
    if (!licenseKey) {
      console.error('❌ No license key found')
      return
    }
    await triggerFullSync(licenseKey)
  }

  // Inspect cache contents
  (window as any).debugInspectCache = async (tableName = 'classes') => {
    const { getReplicationManager } = await import('./services/replication/initReplication')
    const manager = getReplicationManager()
    if (!manager) {
      console.error('❌ ReplicationManager not initialized')
      return
    }
    const table = manager.getTable(tableName)
    if (!table) {
      console.error(`❌ Table "${tableName}" not found`)
      return
    }
    const allRecords = await table.getAll()
    return allRecords
  }
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)