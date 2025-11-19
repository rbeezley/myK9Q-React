# Phase 1, Week 2: Utility Extraction - Master Plan

> **Created**: 2025-01-18
> **Last Updated**: 2025-01-18
> **Current Status**: Part 2 Complete (90 Tests Passing) ✅
> **Next**: Part 3 - Refactor usePrefetch.ts

---

## 🎯 Quick Status Overview

**Where We Are**: Phase 1, Week 2 - Part 2 Complete (Testing)
**What's Done**:
- ✅ Part 1: Extracted 3 utility modules (651 lines)
- ✅ Part 2: Created 90 comprehensive unit tests (1,376 lines)

**What's Next**:
- 🔄 Part 3: Refactor usePrefetch.ts to use extracted utilities
- 🔄 Part 4: Analyze entryService.ts for more extractable utilities
- 🔄 Part 5: Push all commits to remote

**Git Status**: 7 commits ahead of origin/main (clean working tree)

---

## 📋 Complete Week 2 Plan

### Part 1: Extract Pure Utilities ✅ COMPLETE
**Status**: ✅ Completed
**Commit**: `c27740a`
**Time Invested**: ~2 hours
**Files Created**: 3 utility modules (651 lines)

#### Files Created:
1. **[src/utils/cacheHelpers.ts](../../src/utils/cacheHelpers.ts)** (213 lines)
   - 10 pure functions for cache management
   - TTL validation, cache age, key filtering
   - Stale-while-revalidate pattern support
   - Zero dependencies on React or DOM APIs

2. **[src/utils/queueHelpers.ts](../../src/utils/queueHelpers.ts)** (233 lines)
   - 9 pure functions for priority queue operations
   - Priority-based insertion and sorting
   - Batch dequeue, search, statistics
   - Zero dependencies on React or DOM APIs

3. **[src/utils/idleCallbackHelpers.ts](../../src/utils/idleCallbackHelpers.ts)** (205 lines)
   - 7 functions for idle callback scheduling
   - Cross-browser compatibility (Safari fallback)
   - Priority scheduling with timeout guarantees
   - globalThis fallback for SSR compatibility

#### Functions Extracted:

**Cache Helpers (10 functions)**:
- `isCacheValid()` - Check if cache entry is still fresh
- `getCacheAge()` - Get age of cache entry in seconds
- `getRemainingTTL()` - Get remaining time-to-live
- `createCacheEntry()` - Create new cache entry with timestamp
- `filterKeysByPattern()` - Filter cache keys by string or regex
- `secondsToMs()` / `msToSeconds()` - Time conversions
- `createCacheKey()` / `parseCacheKey()` - Cache key management
- `shouldRefresh()` - Determine if cache should be refreshed

**Queue Helpers (9 functions)**:
- `insertWithPriority()` - Insert item maintaining priority order
- `updatePriority()` - Update priority and re-sort
- `updatePriorityIfHigher()` - Conditionally update priority
- `dequeueN()` - Remove N highest priority items
- `findInQueue()` / `hasKey()` - Search operations
- `removeFromQueue()` - Remove specific item
- `getQueueStats()` - Get queue statistics
- `clearQueue()` - Remove all items

**Idle Callback Helpers (7 functions)**:
- `isIdleCallbackSupported()` - Feature detection
- `scheduleIdleTask()` - Schedule task during idle time
- `cancelIdleTask()` - Cancel scheduled task
- `schedulePriorityTask()` - Schedule with priority levels
- `scheduleIdleTaskWithTimeout()` - Guarantee execution time
- `batchScheduleIdleTasks()` - Schedule multiple tasks
- `createIdleTaskScheduler()` - Create scheduler instance

---

### Part 2: Comprehensive Testing ✅ COMPLETE
**Status**: ✅ Completed
**Commit**: `4eb0141`
**Time Invested**: ~3 hours
**Files Created**: 3 test files (1,376 lines)
**Test Results**: 90/90 passing (100%)

#### Test Files Created:

1. **[src/utils/cacheHelpers.test.ts](../../src/utils/cacheHelpers.test.ts)** (459 lines, 35 tests)
   ```
   ✓ isCacheValid (4 tests)
   ✓ getCacheAge (3 tests)
   ✓ getRemainingTTL (3 tests)
   ✓ createCacheEntry (3 tests)
   ✓ filterKeysByPattern (5 tests)
   ✓ secondsToMs (1 test)
   ✓ msToSeconds (1 test)
   ✓ createCacheKey (3 tests)
   ✓ parseCacheKey (4 tests)
   ✓ shouldRefresh (5 tests)
   ✓ Integration: Cache lifecycle (2 tests)
   ```

2. **[src/utils/queueHelpers.test.ts](../../src/utils/queueHelpers.test.ts)** (469 lines, 32 tests)
   ```
   ✓ insertWithPriority (3 tests)
   ✓ updatePriority (3 tests)
   ✓ updatePriorityIfHigher (4 tests)
   ✓ dequeueN (4 tests)
   ✓ findInQueue (3 tests)
   ✓ hasKey (3 tests)
   ✓ removeFromQueue (4 tests)
   ✓ getQueueStats (4 tests)
   ✓ clearQueue (2 tests)
   ✓ Integration: Queue workflow (2 tests)
   ```

3. **[src/utils/idleCallbackHelpers.test.ts](../../src/utils/idleCallbackHelpers.test.ts)** (448 lines, 23 tests)
   ```
   ✓ isIdleCallbackSupported (2 tests)
   ✓ scheduleIdleTask (6 tests)
   ✓ cancelIdleTask (2 tests)
   ✓ schedulePriorityTask (3 tests)
   ✓ scheduleIdleTaskWithTimeout (2 tests)
   ✓ batchScheduleIdleTasks (4 tests)
   ✓ createIdleTaskScheduler (4 tests)
   ```

#### Technical Challenges Solved:

1. **Test Framework Integration**
   - Issue: Tests not recognized by Vitest
   - Solution: Removed imports, used Vitest globals (`globals: true`)
   - Result: Clean test structure, proper integration

2. **TypeScript Type Narrowing**
   - Issue: `window` narrowed to `never` after conditional checks
   - Solution: globalThis fallback pattern
   - Result: Zero TypeScript errors, SSR compatibility

3. **Browser API Mocking**
   - Issue: JSDOM doesn't provide `requestIdleCallback`
   - Solution: Proper beforeEach/afterEach cleanup, API restoration
   - Result: Isolated tests, no cross-contamination

4. **Cross-Environment Compatibility**
   - Issue: `setTimeout` returns objects in Node, numbers in browsers
   - Solution: Changed assertions to `toBeDefined()` instead of type checks
   - Result: Tests pass in all environments

---

### Part 3: Refactor usePrefetch.ts 🔄 PENDING
**Status**: 🔄 Not Started
**Estimated Time**: 1-2 hours
**Dependencies**: Parts 1 & 2 (Complete)

#### Objective:
Replace inline cache/queue/idle logic in [src/hooks/usePrefetch.ts](../../src/hooks/usePrefetch.ts) with the extracted utilities.

#### Current usePrefetch.ts Structure (needs analysis):
```typescript
// Current file likely contains:
// - Inline TTL validation logic → Replace with isCacheValid()
// - Manual cache age calculation → Replace with getCacheAge()
// - Custom priority queue logic → Replace with queueHelpers
// - Custom idle scheduling → Replace with scheduleIdleTask()
```

#### Refactoring Steps:
1. **Read Current Implementation**
   ```bash
   # Read the file to understand current logic
   cat src/hooks/usePrefetch.ts
   ```

2. **Identify Replacement Opportunities**
   - Cache validation → `isCacheValid()`
   - TTL checks → `shouldRefresh()`
   - Priority queue → `insertWithPriority()`, `dequeueN()`
   - Idle scheduling → `scheduleIdleTask()`, `cancelIdleTask()`

3. **Import Utilities**
   ```typescript
   import {
     isCacheValid,
     shouldRefresh,
     createCacheEntry,
     getCacheAge
   } from '../utils/cacheHelpers';

   import {
     insertWithPriority,
     updatePriorityIfHigher,
     dequeueN
   } from '../utils/queueHelpers';

   import {
     scheduleIdleTask,
     cancelIdleTask
   } from '../utils/idleCallbackHelpers';
   ```

4. **Replace Inline Logic**
   - Replace cache validation checks
   - Replace priority queue operations
   - Replace idle callback scheduling

5. **Verify Changes**
   ```bash
   npm run typecheck  # Should pass with 0 errors
   npm run lint       # Should pass with 0 errors
   npm test          # All tests should pass
   ```

#### Expected Results:
- Reduced file size (estimate: 50-100 lines eliminated)
- Improved maintainability (using tested utilities)
- Better separation of concerns
- Zero TypeScript/ESLint errors

---

### Part 4: Analyze entryService.ts 🔄 PENDING
**Status**: 🔄 Not Started
**Estimated Time**: 1-2 hours
**Dependencies**: None (can run in parallel with Part 3)

#### Objective:
Analyze [src/services/entryService.ts](../../src/services/entryService.ts) to identify more utilities that can be extracted.

#### Analysis Steps:

1. **Read Current Implementation**
   ```bash
   # Read the service file
   cat src/services/entryService.ts | wc -l  # Check line count
   ```

2. **Identify Pure Functions**
   Look for functions that:
   - ✅ Don't use React hooks
   - ✅ Don't access DOM directly
   - ✅ Don't maintain state
   - ✅ Are used in multiple places
   - ✅ Have clear single responsibility

3. **Categorize Extractable Utilities**
   Potential categories:
   - **Validation utilities** (input validation, data validation)
   - **Transformation utilities** (data formatting, normalization)
   - **Calculation utilities** (scoring, time calculations)
   - **Comparison utilities** (sorting, filtering predicates)

4. **Create Extraction Plan**
   Document findings in analysis report:
   ```markdown
   ## entryService.ts Analysis Report

   ### Current Size: [X] lines

   ### Extractable Functions:
   1. [functionName] → [targetModule]
      - Why: [reason]
      - Used in: [locations]
      - Complexity: [low/medium/high]
   ```

5. **Prioritize Extractions**
   - High priority: Used in 3+ places
   - Medium priority: Complex logic, good for testing
   - Low priority: Single use, but improves organization

#### Expected Outcomes:
- Analysis report documenting extractable functions
- Extraction plan for Week 3 or Week 4
- Potential new utility modules identified

---

### Part 5: Push Commits to Remote 🔄 PENDING
**Status**: 🔄 Not Started
**Estimated Time**: 5 minutes
**Dependencies**: Parts 3 & 4 (or can push incremental)

#### Current Git Status:
```bash
# 7 commits ahead of origin/main
git log --oneline -7

# Expected output:
# 0c0d74c docs: Add comprehensive Phase 1, Week 2 documentation
# 4eb0141 test: Add comprehensive unit tests for cache, queue, and idle helpers
# c27740a refactor: Extract cache, queue, and idle callback utilities
# [Previous commits...]
```

#### Push Strategy:

**Option A: Push After All Parts Complete** (Recommended)
```bash
# After Parts 3 & 4 are complete
git push origin main
```

**Option B: Push Incrementally**
```bash
# Push Part 1 & 2 commits now
git push origin main

# Continue work on Parts 3 & 4
# Push again when complete
```

#### Pre-Push Checklist:
- ✅ All tests passing (90/90)
- ✅ TypeScript compilation successful
- ✅ ESLint validation clean
- ✅ Production build successful
- ✅ Documentation complete
- 🔄 usePrefetch.ts refactored (Part 3)
- 🔄 entryService.ts analyzed (Part 4)

---

## 📊 Progress Metrics

### Code Changes Summary

| Metric | Value |
|--------|-------|
| **New Utility Files** | 3 modules (651 lines) |
| **New Test Files** | 3 files (1,376 lines) |
| **Total New Code** | 2,027 lines |
| **Functions Extracted** | 26 pure functions |
| **Test Coverage** | 90 tests (100% passing) |
| **TypeScript Errors** | 0 |
| **ESLint Errors** | 0 |
| **Time Invested** | ~5 hours (Parts 1-2) |

### Test Coverage Breakdown

| Module | Functions | Tests | Coverage |
|--------|-----------|-------|----------|
| cacheHelpers | 10 | 35 | 100% |
| queueHelpers | 9 | 32 | 100% |
| idleCallbackHelpers | 7 | 23 | 100% |
| **Total** | **26** | **90** | **100%** |

### Quality Metrics

| Metric | Status |
|--------|--------|
| **TypeScript Strict Mode** | ✅ Passing |
| **ESLint Validation** | ✅ Passing |
| **Production Build** | ✅ Successful |
| **Test Pass Rate** | ✅ 100% (90/90) |
| **JSDoc Coverage** | ✅ 100% (all functions) |

---

## 🔄 How to Resume This Work

### Starting a New Session

**Step 1: Read This Document**
```bash
# First thing in new session
cat docs/architecture/PHASE1-WEEK2-MASTER-PLAN.md
```

**Step 2: Check Current Status**
```bash
# Check git status
git status

# Check test status
npm test -- cacheHelpers queueHelpers idleCallbackHelpers

# Check build status
npm run typecheck && npm run build
```

**Step 3: Identify Next Task**
Based on checklist above:
- ✅ Part 1 Complete → Skip
- ✅ Part 2 Complete → Skip
- 🔄 Part 3 Pending → **Start here**
- 🔄 Part 4 Pending → Can run in parallel
- 🔄 Part 5 Pending → Final step

**Step 4: Continue with Part 3**
```bash
# Read usePrefetch.ts to understand current implementation
cat src/hooks/usePrefetch.ts

# Plan refactoring approach
# Replace inline logic with extracted utilities
```

### If Tests Are Failing

```bash
# Run tests with verbose output
npm test -- --reporter=verbose

# Check specific module
npm test -- cacheHelpers.test.ts
npm test -- queueHelpers.test.ts
npm test -- idleCallbackHelpers.test.ts
```

### If TypeScript Errors Appear

```bash
# Run full typecheck
npm run typecheck

# Check specific file
npx tsc --noEmit src/utils/cacheHelpers.ts
```

---

## 📝 Lessons Learned (Parts 1-2)

### What Went Well ✅

1. **Pure Utility Extraction**
   - Clean separation of concerns
   - Zero dependencies on React/DOM
   - Highly testable functions
   - Reusable across entire codebase

2. **Comprehensive Testing**
   - 100% test pass rate achieved
   - Edge cases thoroughly covered
   - Integration tests for complete workflows
   - Proper test isolation with cleanup

3. **TypeScript Type Safety**
   - Zero type errors in final code
   - Proper generic usage for flexibility
   - Strict typing for all parameters
   - Excellent IDE support

4. **Documentation**
   - JSDoc for all functions with examples
   - Clear parameter descriptions
   - Return value documentation
   - Usage notes for complex functions

### Challenges Overcome 💪

1. **Test Framework Integration**
   - **Problem**: Vitest globals not recognized
   - **Solution**: Removed unnecessary imports
   - **Takeaway**: Trust the framework configuration

2. **TypeScript Type Narrowing**
   - **Problem**: `window` narrowed to `never`
   - **Solution**: globalThis fallback pattern
   - **Takeaway**: Always consider SSR compatibility

3. **Browser API Mocking**
   - **Problem**: JSDOM missing requestIdleCallback
   - **Solution**: Proper cleanup in beforeEach/afterEach
   - **Takeaway**: Test isolation is critical

4. **Cross-Environment Testing**
   - **Problem**: Different return types (Node vs browser)
   - **Solution**: Assertion flexibility
   - **Takeaway**: Test for behavior, not implementation

### Best Practices Established 🌟

1. **Utility Module Structure**
   ```typescript
   // 1. Interfaces first
   export interface CachedData<T> { ... }

   // 2. Pure functions with JSDoc
   /**
    * Check if cache entry is still valid
    * @param cached - The cached data entry
    * @param currentTime - Optional current time (default: Date.now())
    * @returns true if cache is valid, false if expired
    */
   export function isCacheValid<T>(...) { ... }

   // 3. Helper functions at bottom
   ```

2. **Test File Structure**
   ```typescript
   // 1. Import utilities to test
   import { func1, func2, type Interface } from './module';

   // 2. Group tests by function
   describe('func1', () => {
     // 3. Setup/cleanup if needed
     beforeEach(() => { ... });
     afterEach(() => { ... });

     // 4. Test happy path first
     test('should work in normal case', () => { ... });

     // 5. Test edge cases
     test('should handle edge case', () => { ... });
   });

   // 6. Integration tests at end
   describe('Integration: Complete workflow', () => { ... });
   ```

3. **Commit Strategy**
   ```bash
   # Part 1: Utility extraction
   git commit -m "refactor: Extract [module] utilities (Phase 1, Week 2 - Part 1)"

   # Part 2: Testing
   git commit -m "test: Add comprehensive unit tests for [modules] (Phase 1, Week 2 - Part 2)"

   # Part 3: Documentation
   git commit -m "docs: Add comprehensive Phase 1, Week 2 documentation"
   ```

---

## 🎯 Success Criteria

### Part 3 (usePrefetch Refactoring)
- [ ] usePrefetch.ts uses cacheHelpers utilities
- [ ] usePrefetch.ts uses queueHelpers utilities
- [ ] usePrefetch.ts uses idleCallbackHelpers utilities
- [ ] File size reduced by 50-100 lines
- [ ] Zero TypeScript errors
- [ ] Zero ESLint errors
- [ ] All tests passing
- [ ] Production build successful

### Part 4 (entryService Analysis)
- [ ] Analysis report created
- [ ] Extractable functions identified
- [ ] Prioritization complete
- [ ] Extraction plan documented

### Part 5 (Push to Remote)
- [ ] All commits pushed to origin/main
- [ ] Remote build succeeds
- [ ] CI/CD pipeline passes (if applicable)

---

## 📚 Related Documentation

- **[REFACTORING-PHASE1-WEEK2.md](../../REFACTORING-PHASE1-WEEK2.md)** - Detailed Part 1 & 2 documentation
- **[REFACTORING_PLAN.md](./REFACTORING_PLAN.md)** - Overall refactoring strategy (Phases 1-3)
- **[src/utils/cacheHelpers.ts](../../src/utils/cacheHelpers.ts)** - Cache utility implementations
- **[src/utils/queueHelpers.ts](../../src/utils/queueHelpers.ts)** - Queue utility implementations
- **[src/utils/idleCallbackHelpers.ts](../../src/utils/idleCallbackHelpers.ts)** - Idle callback implementations

---

## 🚀 Next Steps After Week 2

### Week 3 Potential Tasks:
1. **Extract entryService utilities** (based on Part 4 analysis)
2. **Create service-specific utility modules**
3. **Add more comprehensive tests**
4. **Document utility usage patterns**

### Week 4 Potential Tasks:
1. **Performance profiling** of extracted utilities
2. **Bundle size analysis** after refactoring
3. **Create utility best practices guide**
4. **Audit other large files** for extractable utilities

---

## ✅ Completion Checklist

- [x] **Part 1**: Extract pure utilities (cacheHelpers, queueHelpers, idleCallbackHelpers)
- [x] **Part 2**: Create comprehensive unit tests (90 tests, 100% passing)
- [ ] **Part 3**: Refactor usePrefetch.ts to use extracted utilities
- [ ] **Part 4**: Analyze entryService.ts for more extractable utilities
- [ ] **Part 5**: Push all commits to remote repository

**Current Progress**: 2/5 parts complete (40%)
**Estimated Remaining Time**: 2-4 hours (Parts 3-4)
**Estimated Total Week 2 Time**: 7-9 hours

---

*Last Updated: 2025-01-18 - After completing Part 2 (Testing)*
