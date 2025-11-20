/**
 * @deprecated Legacy module - replaced by replication system
 *
 * This module is kept as a stub for backward compatibility with older tests.
 * New code should use the replication system instead.
 *
 * See: src/services/replication/
 */

/**
 * Update an entry in local state
 * @deprecated Use replication system instead
 */
export const localStateManager = {
  async updateEntry(_entryId: number, _data: any): Promise<void> {
    console.warn('localStateManager.updateEntry is deprecated - use replication system');
    // Stub implementation for tests
  },

  async clearPendingChange(_entryId: number): Promise<void> {
    console.warn('localStateManager.clearPendingChange is deprecated - use replication system');
    // Stub implementation for tests
  },

  hasPendingChange(_entryId: number): boolean {
    console.warn('localStateManager.hasPendingChange is deprecated - use replication system');
    // Stub implementation for tests
    return false;
  }
};
