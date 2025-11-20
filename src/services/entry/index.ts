/**
 * Entry Service Module Exports
 *
 * This directory contains the refactored entry service modules,
 * extracted from the monolithic entryService.ts file.
 *
 * **Phase 1 - Data Layer** (Complete ✅):
 * - entryReplication.ts - Fetch from IndexedDB cache
 * - entryDataFetching.ts - Fetch from Supabase
 * - entryDataLayer.ts - Unified interface (this is what you import!)
 *
 * **Phase 2 - Business Logic** (Complete ✅):
 * - scoreSubmission.ts - Score submission logic (Task 2.1)
 * - entryStatusManagement.ts - Status update operations (Task 2.2)
 * - classCompletionService.ts - Class completion tracking (Task 2.3)
 *
 * **Usage**:
 * ```ts
 * // Data fetching
 * import { getClassEntries, getTrialEntries } from '@/services/entry';
 *
 * // Score submission
 * import { submitScore, submitBatchScores } from '@/services/entry';
 *
 * // Status management
 * import { markInRing, resetEntryScore } from '@/services/entry';
 *
 * // Class completion
 * import { checkAndUpdateClassCompletion } from '@/services/entry';
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

// Class Completion API (Phase 2, Task 2.3)
export {
  checkAndUpdateClassCompletion,
  manuallyCheckClassCompletion,
} from './classCompletionService';

// Entry Status Management API (Phase 2, Task 2.2)
export {
  markInRing,
  markEntryCompleted,
  updateEntryCheckinStatus,
  resetEntryScore,
} from './entryStatusManagement';

// Score Submission API (Phase 2, Task 2.1)
export {
  submitScore,
  submitBatchScores,
} from './scoreSubmission';

// Re-export types
export type { Entry } from './entryDataLayer';
export type { ScoreData, ResultData } from './scoreSubmission';
