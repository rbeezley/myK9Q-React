# Dependency Injection Implementation for Replication System

**Date:** 2025-11-15
**Status:** Implemented, tests still failing with "No test suite found"

---

## What Was Done

### ✅ Implemented Dependency Injection (Option 4)

Instead of using vi.mock() for testing, we refactored ReplicatedTable to accept dependencies via constructor injection. This is the proper architectural pattern for testability.

### Files Modified

1. **[src/services/replication/dependencies.ts](../src/services/replication/dependencies.ts)** - NEW FILE
   - Created interfaces for all injectable dependencies
   - Provided no-op implementations for testing
   - Type-safe dependency contracts

2. **[src/services/replication/ReplicatedTable.ts](../src/services/replication/ReplicatedTable.ts)**
   - Updated imports to use defaults
   - Added dependency fields to class
   - Modified constructor to accept `ReplicatedTableDependencies` parameter
   - Replaced all `logger.x` with `this.logger.x`
   - Replaced `logDiagnosticReport()` with `this.logDiagnosticsFn()`

3. **[src/services/replication/__tests__/test-helpers.ts](../src/services/replication/__tests__/test-helpers.ts)**
   - Added `createTestDependencies()` helper function
   - Returns no-op implementations for all dependencies

4. **Test Files Updated (3 of 8)**
   - [issue-01-concurrent-init.test.ts](../src/services/replication/__tests__/issue-01-concurrent-init.test.ts)
   - [issue-05-optimistic-update-race.test.ts](../src/services/replication/__tests__/issue-05-optimistic-update-race.test.ts)
   - [issue-11-query-timeout-cancel.test.ts](../src/services/replication/__tests__/issue-11-query-timeout-cancel.test.ts)

---

## How It Works

### Before (vi.mock approach - problematic)

```typescript
// ❌ Global mocks that affect all tests
vi.mock('@/utils/logger', () => ({
  logger: { log: vi.fn(), warn: vi.fn() }
}));

import { ReplicatedTable } from '../ReplicatedTable';

class TestTable extends ReplicatedTable<{ id: string }> {
  constructor() {
    super('test');
  }
}
```

### After (Dependency Injection - clean)

```typescript
// ✅ No global mocks needed
import { ReplicatedTable } from '../ReplicatedTable';
import { createTestDependencies } from './test-helpers';

class TestTable extends ReplicatedTable<{ id: string }> {
  constructor() {
    super('test', undefined, createTestDependencies());
  }
}
```

### Production Code (unchanged)

```typescript
// Production code doesn't pass dependencies - uses defaults automatically
class ReplicatedAnnouncementsTable extends ReplicatedTable<Announcement> {
  constructor() {
    super('announcements'); // Uses real logger, getTableTTL, etc.
  }
}
```

---

## Dependency Contract

```typescript
// src/services/replication/dependencies.ts

export interface Logger {
  log: (...args: any[]) => void;
  warn: (...args: any[]) => void;
  error: (...args: any[]) => void;
  debug?: (...args: any[]) => void;
}

export type GetTableTTL = (tableName: string) => number;
export type LogDiagnostics = (report: any) => void;

export interface ReplicatedTableDependencies {
  logger?: Logger;
  getTableTTL?: GetTableTTL;
  logDiagnostics?: LogDiagnostics;
}
```

---

## Current Issue: "No test suite found"

Tests are still failing with the same error despite dependency injection being implemented. This suggests a different root cause than module mocking.

### Possible Causes

1. **Circular dependencies**: ReplicatedTable might have circular imports
2. **Missing exports**: Dependencies module might not be exported correctly
3. **Vitest configuration**: Test runner might not be resolving modules properly
4. **TypeScript compilation**: Type errors preventing code from loading

### Evidence

- TypeScript compiler shows errors: "Cannot find module '@/utils/logger'"
- This happens even with dependency injection
- Suggests path alias resolution issue or missing module exports

---

## Next Steps

### Option A: Fix Module Resolution (Recommended)

The real issue appears to be that vitest cannot resolve the `@/` path alias or the modules don't exist in the test environment.

**Actions:**
1. Check vite.config.ts resolve.alias configuration
2. Verify test setup correctly configures path aliases
3. Try using relative imports instead of `@/` in test files
4. Check if dependencies.ts exports are correct

### Option B: Remove Real Dependencies

Instead of importing real implementations as defaults, provide them at runtime:

```typescript
// ReplicatedTable.ts
constructor(
  tableName: string,
  customTTL?: number,
  dependencies?: ReplicatedTableDependencies
) {
  // Lazy load defaults only when needed
  this.logger = dependencies?.logger ?? (await import('@/utils/logger')).logger;
  // ... etc
}
```

### Option C: Stub the Real Modules

Create stub files in the test directory:

```
src/services/replication/__tests__/
  __stubs__/
    logger.ts  // Stub implementation
    featureFlags.ts  // Stub implementation
    diagnostics.ts  // Stub implementation
```

---

## Benefits of Current Approach

Despite tests not running yet, the dependency injection refactor provides:

1. **Better Architecture**: Dependencies are explicit, not hidden
2. **Easier Testing**: No global mocks needed
3. **More Flexible**: Easy to swap implementations (e.g., console logger vs file logger)
4. **Type Safe**: TypeScript ensures correct dependency contracts
5. **Production Ready**: Production code unchanged, uses real implementations

---

## Test Files Remaining

Need to update these 5 test files with dependency injection:

- [ ] issue-02-transaction-stampede.test.ts
- [ ] issue-03-retry-promise-overwrite.test.ts
- [ ] issue-04-concurrent-subscription-setup.test.ts
- [ ] issue-06-notification-flood.test.ts
- [ ] issue-12-localstorage-backup-race.test.ts

But FIRST, need to resolve the "No test suite found" error on the 3 files already updated.

---

## References

- [NEXT_SESSION_REPLICATION_TESTS.md](NEXT_SESSION_REPLICATION_TESTS.md) - Previous session notes
- [PHASE_3_TESTING_STATUS.md](PHASE_3_TESTING_STATUS.md) - Overall testing status
- [vite.config.ts](../vite.config.ts) - Test configuration

---

**Document Status:** Current
**Next Update:** After resolving "No test suite found" error
**Author:** Claude Code
**Date:** 2025-11-15
