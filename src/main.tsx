import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import { registerSW } from 'virtual:pwa-register'
import { serviceWorkerManager } from './utils/serviceWorkerUtils'
import { initializeReplication } from './services/replication/initReplication'

const updateSW = registerSW({
  onNeedRefresh() {
    // In development, don't auto-prompt for refresh to avoid interrupting work
    if (import.meta.env.DEV) {
      console.log('🔄 New service worker available (auto-refresh disabled in dev mode)')
      return
    }

    // In production, prompt user for update
    if (confirm('New content available. Reload?')) {
      updateSW(true)
    }
  },
  onOfflineReady() {
    console.log('App ready to work offline')
    // Initialize service worker manager when offline-ready
    serviceWorkerManager.initialize().catch(console.error)

    // Initialize replication system
    initializeReplication().catch(console.error)
  },
  onRegistered() {
    console.log('Service Worker registered')
    // Also initialize here to be safe
    serviceWorkerManager.initialize().catch(console.error)

    // Initialize replication system
    initializeReplication().catch(console.error)
  }
})

// Also initialize replication immediately for faster startup
initializeReplication().catch(console.error)

// Expose debug functions
if (typeof window !== 'undefined') {
  // Force full sync
  (window as any).debugForceFullSync = async () => {
    const { triggerFullSync } = await import('./services/replication/initReplication')
    const auth = JSON.parse(localStorage.getItem('myK9Q_auth') || '{}')
    const licenseKey = auth.showContext?.licenseKey
    if (!licenseKey) {
      console.error('❌ No license key found')
      return
    }
    console.log('🔄 Forcing full sync for all tables...')
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
    console.log(`📦 Total ${tableName} in cache:`, allRecords.length)
    if (allRecords.length > 0) {
      console.log('Sample record:', allRecords[0])
      if (tableName === 'classes') {
        const trialIds = [...new Set(allRecords.map((c: any) => c.trial_id))]
        console.log('Trial IDs found:', trialIds)
        console.log('Trial ID types:', trialIds.map((id: any) => `${id} (${typeof id})`))
      }
    }
    return allRecords
  }

  console.log('🛠️ Debug functions available:')
  console.log('  - window.debugForceFullSync() - Force full sync')
  console.log('  - window.debugInspectCache(tableName) - Inspect cache (default: "classes")')
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)