/**
 * Quick Recovery Script for Production
 *
 * This script provides a one-liner that users can run in the console
 * to automatically fix database corruption issues.
 */

export function setupQuickRecovery() {
  // Make recovery function available globally
  if (typeof window !== 'undefined') {
    // Import replication config
    import('../services/replication/replicationConfig').then(({
      disableReplication,
      enableReplication,
      getReplicationStatus
    }) => {
      // Add replication control functions
      (window as any).disableReplication = () => {
        disableReplication('Manual disable via console');
};

      (window as any).enableReplication = () => {
        enableReplication();
};

      (window as any).replicationStatus = () => {
        const status = getReplicationStatus();
return status;
      };
    });

    // One-liner function users can run
    (window as any).fixDatabase = async () => {
try {
        // Dynamically load and execute the recovery script
        const script = document.createElement('script');
        script.src = '/recovery.js';
        document.head.appendChild(script);
      } catch (error) {
        console.error('Failed to load recovery script:', error);
}
    };

    // Also provide a quick clear function
    (window as any).clearAllData = async () => {
      if (!confirm('⚠️ This will clear ALL local data. Are you sure?')) {
        return;
      }

try {
        // Clear all IndexedDB databases
        if ('databases' in indexedDB) {
          const databases = await indexedDB.databases();
          for (const db of databases) {
            if (db.name?.startsWith('myK9Q')) {
              await indexedDB.deleteDatabase(db.name);
}
          }
        }

        // Clear localStorage
        Object.keys(localStorage).forEach(key => {
          if (key.startsWith('myK9Q')) {
            localStorage.removeItem(key);
          }
        });

        // Clear service worker cache
        if ('serviceWorker' in navigator) {
          const registrations = await navigator.serviceWorker.getRegistrations();
          for (const registration of registrations) {
            await registration.unregister();
          }
        }

} catch (error) {
        console.error('Failed to clear data:', error);
      }
    };

    // Log instructions on production if database issues are detected
    if (process.env.NODE_ENV === 'production') {
      // Check for database issues after a delay
      setTimeout(async () => {
        try {
          const testOpen = indexedDB.open('myK9Q_Replication');
          testOpen.onsuccess = () => {
            testOpen.result.close();
          };
          testOpen.onerror = () => {
console.log('To fix, run this in the console:');
console.log('');
};
        } catch (_error) {
          // Ignore errors in detection
        }
      }, 5000);
    }
  }
}

// Auto-initialize on import
if (typeof window !== 'undefined') {
  setupQuickRecovery();
}