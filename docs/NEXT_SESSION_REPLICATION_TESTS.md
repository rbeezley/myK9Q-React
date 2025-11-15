# Next Session: Replication Test Fixes

**Date Created:** 2025-11-15
**Status:** Tests configured but not yet running

---

## Work Completed This Session

### ✅ Configuration Improvements

1. **[vite.config.ts](../vite.config.ts:12-13)**
   - Increased `hookTimeout` from 10s to 30s for IndexedDB cleanup
   - Added `testTimeout` of 15s for individual tests

2. **[src/test/setup.ts](../src/test/setup.ts)**
   - Removed invalid vi.mock() calls from setup file (must be at test file level)
   - Kept IndexedDB polyfill (fake-indexeddb) configuration

3. **[src/services/replication/__tests__/test-helpers.ts](../src/services/replication/__tests__/test-helpers.ts)**
   - Created `cleanupReplicationTest()` for comprehensive async cleanup
   - Added `waitForIndexedDB()` to wait for pending operations
   - Added utility functions for delays and waiting for conditions

### ✅ Test File Updates

Updated all 8 replication test files with:
- Improved cleanup using `cleanupReplicationTest()` helper
- Added missing `resolveConflict()` abstract method implementation
- Added vi.mock() calls for required dependencies:
  - `@/utils/logger`
  - `@/config/featureFlags`
  - `@/utils/indexedDBDiagnostics`

**Files Updated:**
- [issue-01-concurrent-init.test.ts](../src/services/replication/__tests__/issue-01-concurrent-init.test.ts)
- [issue-02-transaction-stampede.test.ts](../src/services/replication/__tests__/issue-02-transaction-stampede.test.ts)
- [issue-03-retry-promise-overwrite.test.ts](../src/services/replication/__tests__/issue-03-retry-promise-overwrite.test.ts)
- [issue-04-concurrent-subscription-setup.test.ts](../src/services/replication/__tests__/issue-04-concurrent-init.test.ts)
- [issue-05-optimistic-update-race.test.ts](../src/services/replication/__tests__/issue-05-optimistic-update-race.test.ts) - also fixed jest.fn → vi.fn
- [issue-06-notification-flood.test.ts](../src/services/replication/__tests__/issue-06-notification-flood.test.ts)
- [issue-11-query-timeout-cancel.test.ts](../src/services/replication/__tests__/issue-11-query-timeout-cancel.test.ts)
- [issue-12-localstorage-backup-race.test.ts](../src/services/replication/__tests__/issue-12-localstorage-backup-race.test.ts)

---

## Current Blocker: "No test suite found"

### Problem

All replication test files fail with:
```
Error: No test suite found in file [...]/issue-XX-*.test.ts
```

This affects:
- All 8 replication test files in `src/services/replication/__tests__/`
- All test files in `src/services/replication/tables/__tests__/`

### Root Cause Analysis

1. **Module Loading Issue**: Vitest cannot load the test files due to import errors
2. **Missing Dependencies**: ReplicatedTable imports modules that need to be mocked:
   - `@/utils/logger`
   - `@/config/featureFlags`
   - `@/utils/indexedDBDiagnostics`
   - `@/lib/supabase` (via SyncEngine)

3. **vi.mock() Hoisting**: vi.mock() calls are hoisted to the top and apply globally, which can break other tests

4. **TypeScript Compilation**: Tests have TypeScript errors that prevent them from running:
   - Missing `resolveConflict()` abstract method implementation ✅ FIXED
   - Missing `sync()` abstract method implementation ✅ FIXED

---

## Next Steps to Fix

### Option 1: Use Dynamic Imports (Recommended)

Instead of using vi.mock(), use dynamic imports and manual mocking:

```typescript
// Before each test
beforeAll(async () => {
  // Mock modules before importing
  vi.doMock('@/utils/logger', () => ({
    logger: { log: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn() }
  }));

  vi.doMock('@/config/featureFlags', () => ({
    getTableTTL: vi.fn(() => 300000),
    FEATURE_FLAGS: { enableReplication: false }
  }));

  vi.doMock('@/utils/indexedDBDiagnostics', () => ({
    logDiagnosticReport: vi.fn()
  }));

  // Then dynamically import
  const { ReplicatedTable } = await import('../ReplicatedTable');
});
```

### Option 2: Create Test-Specific Implementations

Create stub implementations of the required modules in the test directory:

```typescript
// src/services/replication/__tests__/__mocks__/@/utils/logger.ts
export const logger = {
  log: () => {},
  warn: () => {},
  error: () => {},
  debug: () => {}
};
```

### Option 3: Use Vitest's unstubbed imports

Use `vi.importActual()` to import real implementations selectively:

```typescript
vi.mock('@/utils/logger', async () => {
  const actual = await vi.importActual<typeof import('@/utils/logger')>('@/utils/logger');
  return {
    ...actual,
    logger: {
      log: vi.fn(),
      warn: vi.fn(),
      error: vi.fn(),
      debug: vi.fn()
    }
  };
});
```

### Option 4: Refactor Dependencies (Long-term)

Consider refactoring ReplicatedTable to accept dependencies via constructor injection instead of importing them directly:

```typescript
constructor(
  tableName: string,
  private logger = defaultLogger,
  private getTTL = getTableTTL
) { }
```

---

## Test Execution Status

**Current:** 0/65 tests passing (all failing with "No test suite found")

**Target:** 80%+ tests passing (52+/65)

**Coverage Goal:** 90%+ for replication system

---

## Files Modified

### Configuration
- ✅ [vite.config.ts](../vite.config.ts) - hookTimeout and testTimeout increased
- ✅ [src/test/setup.ts](../src/test/setup.ts) - removed invalid vi.mock() calls

### Test Helpers
- ✅ [src/services/replication/__tests__/test-helpers.ts](../src/services/replication/__tests__/test-helpers.ts) - NEW FILE

### Test Files
- ✅ [issue-01-concurrent-init.test.ts](../src/services/replication/__tests__/issue-01-concurrent-init.test.ts)
- ✅ [issue-02-transaction-stampede.test.ts](../src/services/replication/__tests__/issue-02-transaction-stampede.test.ts)
- ✅ [issue-03-retry-promise-overwrite.test.ts](../src/services/replication/__tests__/issue-03-retry-promise-overwrite.test.ts)
- ✅ [issue-05-optimistic-update-race.test.ts](../src/services/replication/__tests__/issue-05-optimistic-update-race.test.ts)
- ✅ [issue-06-notification-flood.test.ts](../src/services/replication/__tests__/issue-06-notification-flood.test.ts)
- ✅ [issue-11-query-timeout-cancel.test.ts](../src/services/replication/__tests__/issue-11-query-timeout-cancel.test.ts)
- ✅ [issue-12-localstorage-backup-race.test.ts](../src/services/replication/__tests__/issue-12-localstorage-backup-race.test.ts)

---

## Immediate Action Required

**Start next session with Option 1 (Dynamic Imports)** - it's the most straightforward and doesn't require global mocking changes.

1. Remove vi.mock() calls from test files
2. Add beforeAll() hooks with vi.doMock() calls
3. Use dynamic imports for ReplicatedTable
4. Test one file first (issue-01) to validate approach
5. Apply to all test files if successful

---

## Reference Documents

- [docs/PHASE_3_TESTING_STATUS.md](PHASE_3_TESTING_STATUS.md) - Full testing status
- [docs/REPLICATION_REFACTORING_PROGRESS.md](REPLICATION_REFACTORING_PROGRESS.md) - Overall progress
- [docs/REPLICATION_REFACTORING_PLAN.md](REPLICATION_REFACTORING_PLAN.md) - Original plan

---

**Document Status:** Current
**Next Update:** After resolving "No test suite found" error
**Author:** Claude Code
**Date:** 2025-11-15
