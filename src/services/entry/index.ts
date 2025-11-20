/**
 * Entry Service Module Exports
 *
 * This directory contains the refactored entry service modules,
 * extracted from the monolithic entryService.ts file.
 *
 * **Phase 1 - Data Layer** (Complete):
 * - entryReplication.ts - Fetch from IndexedDB cache
 * - entryDataFetching.ts - Fetch from Supabase
 * - entryDataLayer.ts - Unified interface (this is what you import!)
 *
 * **Usage**:
 * ```ts
 * import { getClassEntries, getTrialEntries } from '@/services/entry';
 * ```
 *
 * See: docs/architecture/ENTRYSERVICE-REFACTORING-PLAN.md
 */

// Primary Data Layer API - Import these in your components/hooks
export {
  getClassEntries,
  getTrialEntries,
  getEntriesByArmband,
  triggerSync,
} from './entryDataLayer';

// Re-export types
export type { Entry } from './entryDataLayer';
