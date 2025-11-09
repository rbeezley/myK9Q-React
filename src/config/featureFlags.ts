/**
 * Feature Flags for Full Table Replication System
 *
 * Controls gradual rollout of table replication to replace the hybrid
 * LocalStateManager + React Query + IndexedDB cache architecture.
 *
 * Phase 1-2: Infrastructure (Days 1-10)
 * Phase 3: Core tables (Days 11-15) - entries, classes, trials, shows
 * Phase 4: Secondary tables (Days 16-20) - visibility, announcements, stats
 * Phase 5: Rollout & cleanup (Days 21-27)
 */

import { logger } from '@/utils/logger';

/**
 * Table names that can be replicated
 */
export type ReplicatedTableName =
  // Core tables (Phase 3 - Days 11-15)
  | 'entries'
  | 'classes'
  | 'trials'
  | 'shows'
  | 'class_requirements'

  // Visibility config (Phase 3 Day 15)
  | 'show_result_visibility_defaults'
  | 'trial_result_visibility_overrides'
  | 'class_result_visibility_overrides'

  // Announcements (Phase 4 Day 16)
  | 'announcements'
  | 'announcement_reads'

  // Push notifications (Phase 4 Day 17)
  | 'push_notification_config'
  | 'push_subscriptions'

  // Nationals (Phase 4 Day 19)
  | 'event_statistics'
  | 'nationals_rankings'

  // Cached views (Phase 4 Day 18, 20)
  | 'view_stats_summary'
  | 'view_audit_log';

/**
 * Table-specific feature flag configuration
 */
interface TableReplicationConfig {
  enabled: boolean;           // Is replication enabled for this table?
  rolloutPercentage: number;  // Percentage of users who get replication (0-100)
  priority: 'critical' | 'high' | 'medium' | 'low'; // Sync priority
  ttl: number;                // Cache TTL in milliseconds
}

/**
 * Replication feature flags per table
 */
const replicationFlags: Record<ReplicatedTableName, TableReplicationConfig> = {
  // Core tables - Critical for offline scoring
  entries: {
    enabled: false,
    rolloutPercentage: 0,
    priority: 'critical',
    ttl: 30 * 60 * 1000, // 30 minutes
  },
  classes: {
    enabled: false,
    rolloutPercentage: 0,
    priority: 'critical',
    ttl: 30 * 60 * 1000,
  },
  trials: {
    enabled: false,
    rolloutPercentage: 0,
    priority: 'critical',
    ttl: 30 * 60 * 1000,
  },
  shows: {
    enabled: false,
    rolloutPercentage: 0,
    priority: 'critical',
    ttl: 60 * 60 * 1000, // 1 hour (changes infrequently)
  },
  class_requirements: {
    enabled: false,
    rolloutPercentage: 0,
    priority: 'high',
    ttl: 24 * 60 * 60 * 1000, // 24 hours (static data)
  },

  // Visibility config - Admin features
  show_result_visibility_defaults: {
    enabled: false,
    rolloutPercentage: 0,
    priority: 'high',
    ttl: 24 * 60 * 60 * 1000,
  },
  trial_result_visibility_overrides: {
    enabled: false,
    rolloutPercentage: 0,
    priority: 'high',
    ttl: 24 * 60 * 60 * 1000,
  },
  class_result_visibility_overrides: {
    enabled: false,
    rolloutPercentage: 0,
    priority: 'high',
    ttl: 24 * 60 * 60 * 1000,
  },

  // Announcements - Real-time features
  announcements: {
    enabled: false,
    rolloutPercentage: 0,
    priority: 'high',
    ttl: 5 * 60 * 1000, // 5 minutes (changes frequently)
  },
  announcement_reads: {
    enabled: false,
    rolloutPercentage: 0,
    priority: 'medium',
    ttl: 60 * 60 * 1000, // 1 hour
  },

  // Push notifications
  push_notification_config: {
    enabled: false,
    rolloutPercentage: 0,
    priority: 'medium',
    ttl: 24 * 60 * 60 * 1000,
  },
  push_subscriptions: {
    enabled: false,
    rolloutPercentage: 0,
    priority: 'medium',
    ttl: 24 * 60 * 60 * 1000,
  },

  // Nationals (dormant)
  event_statistics: {
    enabled: false,
    rolloutPercentage: 0,
    priority: 'low',
    ttl: 60 * 60 * 1000,
  },
  nationals_rankings: {
    enabled: false,
    rolloutPercentage: 0,
    priority: 'low',
    ttl: 60 * 60 * 1000,
  },

  // Cached views
  view_stats_summary: {
    enabled: false,
    rolloutPercentage: 0,
    priority: 'low',
    ttl: 60 * 60 * 1000, // 1 hour
  },
  view_audit_log: {
    enabled: false,
    rolloutPercentage: 0,
    priority: 'low',
    ttl: 60 * 60 * 1000,
  },
};

/**
 * Master kill switch for entire replication system
 */
export const features = {
  replication: {
    enabled: false, // Set to true to enable replication system
    tables: replicationFlags,
  },
};

/**
 * Stable user ID for deterministic rollout
 * Uses license key hash to ensure same user always gets same experience
 */
function getStableUserId(): string {
  // Try localStorage first (persistent across sessions)
  let userId = localStorage.getItem('myK9Q_stable_user_id');

  if (!userId) {
    // Generate stable ID from license key (consistent per user)
    const auth = JSON.parse(localStorage.getItem('myK9Q_auth') || '{}');
    if (auth.licenseKey) {
      // Hash license key to create stable user ID
      userId = hashString(auth.licenseKey).toString();
    } else {
      // Fallback: Generate UUID and persist it
      userId = crypto.randomUUID();
    }

    localStorage.setItem('myK9Q_stable_user_id', userId);
  }

  return userId;
}

/**
 * Simple string hash function for deterministic rollout
 */
function hashString(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) - hash) + str.charCodeAt(i);
    hash = hash & hash; // Convert to 32-bit integer
  }
  return Math.abs(hash);
}

/**
 * Check if replication is enabled for a specific table
 *
 * @param tableName - Name of the table to check
 * @param userId - Optional user ID (defaults to stable user ID from localStorage)
 * @returns true if replication is enabled for this user
 */
export function isTableReplicationEnabled(
  tableName: ReplicatedTableName,
  userId?: string
): boolean {
  // Check master kill switch
  if (!features.replication.enabled) {
    return false;
  }

  const tableConfig = features.replication.tables[tableName];
  if (!tableConfig || !tableConfig.enabled) {
    return false;
  }

  // Use stable user ID if not provided
  const stableUserId = userId || getStableUserId();

  // Deterministic rollout based on user ID hash
  if (tableConfig.rolloutPercentage < 100) {
    const hash = hashString(stableUserId);
    return (hash % 100) < tableConfig.rolloutPercentage;
  }

  return true;
}

/**
 * Get TTL for a specific table
 */
export function getTableTTL(tableName: ReplicatedTableName): number {
  return features.replication.tables[tableName]?.ttl || 30 * 60 * 1000;
}

/**
 * Get sync priority for a specific table
 */
export function getTablePriority(tableName: ReplicatedTableName): string {
  return features.replication.tables[tableName]?.priority || 'medium';
}

/**
 * Get list of all enabled tables (for current user)
 */
export function getEnabledTables(): ReplicatedTableName[] {
  return (Object.keys(features.replication.tables) as ReplicatedTableName[])
    .filter((tableName) => isTableReplicationEnabled(tableName));
}

/**
 * Override feature flag (for testing/debugging - dev only)
 */
export function overrideTableReplication(
  tableName: ReplicatedTableName,
  config: Partial<TableReplicationConfig>
): void {
  if (!import.meta.env.DEV) {
    logger.warn('Feature flag overrides only work in development mode');
    return;
  }

  const currentConfig = features.replication.tables[tableName];
  if (currentConfig) {
    features.replication.tables[tableName] = {
      ...currentConfig,
      ...config,
    };
    logger.log(`Table replication override for '${tableName}':`, config);
  }
}

/**
 * Enable master kill switch (dev only)
 */
export function enableReplicationSystem(enabled: boolean): void {
  if (!import.meta.env.DEV) {
    logger.warn('Feature flag overrides only work in development mode');
    return;
  }

  features.replication.enabled = enabled;
  logger.log(`Replication system ${enabled ? 'ENABLED' : 'DISABLED'}`);
}
