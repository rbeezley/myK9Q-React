/**
 * Replication Helper Utilities
 *
 * Provides utilities to ensure replication is properly initialized
 * before accessing replicated data, especially after recovery scenarios.
 */

import { getReplicationManager, ReplicationManager } from '../services/replication';

/**
 * Gets the replication manager, attempting to initialize it if not ready.
 * This is especially important after database recovery when replication
 * may have been disabled and re-enabled.
 *
 * @returns The initialized ReplicationManager or throws an error
 */
export async function ensureReplicationManager(): Promise<ReplicationManager> {
  console.log('[ReplicationHelper] ensureReplicationManager called');

  // Try to get existing manager
  let manager = getReplicationManager();
  console.log('[ReplicationHelper] Initial manager check:', manager ? 'exists' : 'null');

  if (!manager) {
    console.warn('[ReplicationHelper] Manager not ready, attempting initialization...');

    try {
      // Try to initialize replication if it's not ready
      console.log('[ReplicationHelper] Importing initializeReplication...');
      const { initializeReplication } = await import('../services/replication/initReplication');

      console.log('[ReplicationHelper] Calling initializeReplication...');
      await initializeReplication();
      console.log('[ReplicationHelper] initializeReplication completed');

      // Try to get manager again
      manager = getReplicationManager();
      console.log('[ReplicationHelper] Manager after initialization:', manager ? 'exists' : 'still null');

      if (!manager) {
        console.error('[ReplicationHelper] Failed to initialize manager after initializeReplication()');
        throw new Error('Replication manager not initialized. Please refresh the page.');
      }

      console.log('[ReplicationHelper] Successfully initialized replication manager');
    } catch (error) {
      console.error('[ReplicationHelper] Error during initialization:', error);
      throw error;
    }
  }

  console.log('[ReplicationHelper] Returning manager:', manager);
  return manager;
}

/**
 * Checks if replication is enabled and ready
 */
export function isReplicationReady(): boolean {
  const manager = getReplicationManager();
  return manager !== null;
}