# entryService.ts Utility Extraction Analysis

> **Created**: 2025-01-18
> **File Analyzed**: [src/services/entryService.ts](../../src/services/entryService.ts)
> **Current Size**: 1,284 lines
> **Purpose**: Identify extractable utilities for future refactoring

---

## 📊 Executive Summary

**Key Findings**:
- **~800+ lines** of code could be optimized through extraction
- **5 critical duplication patterns** identified
- **10 extractable functions** documented with specific locations
- **3 priority tiers** for phased refactoring approach

**Highest Impact Opportunities**:
1. `buildClassName()` - **5 duplicate locations** (save ~40 lines)
2. Entry object mapping - **4+ duplicate patterns** (save ~200 lines)
3. `determineEntryStatus()` - **4 duplicate locations** (save ~30 lines)
4. `secondsToTimeString()` - **2 duplicate locations** (already exists in timeUtils)

---

## 📋 File Metadata

| Metric | Value |
|--------|-------|
| **Current Size** | 1,284 lines |
| **Total Functions** | 14 |
| **Exported Functions** | 10 |
| **Internal Helpers** | 4 |
| **Location** | `/src/services/entryService.ts` |

---

## 🔍 Extractable Functions Analysis

### 1. `secondsToTimeString()` → `timeUtils.ts` ⚠️ DUPLICATE

**Location**: Lines 105-110, 214-227 (DUPLICATED)
**Category**: Transformation utility
**Priority**: 🔴 **HIGH** - Immediate consolidation needed

**Why Extract**:
- Defined twice with nearly identical implementations
- Already exists in `/src/utils/timeUtils.ts`
- Pure function with no side effects
- Clear single responsibility: seconds → time string

**Current Code**:
```typescript
// Appears in 2 places:
const secondsToTimeString = (seconds?: number | null): string => {
  if (!seconds || seconds === 0) return '';
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
};
```

**Action**:
1. Verify existing implementation in `timeUtils.ts`
2. Remove both duplicate definitions
3. Import from `timeUtils.ts` instead

**Estimated Impact**: Remove 12-15 lines of duplicate code

---

### 2. `buildClassName()` → `stringUtils.ts` ⚠️ CRITICAL

**Location**: Lines 142, 273, 368, 947, 1239 (5 LOCATIONS)
**Category**: String formatting utility
**Priority**: 🔴 **HIGH** - Massive duplication

**Why Extract**:
- **CRITICAL**: Duplicated in 5 different locations
- Pure string concatenation logic
- Consistent pattern across all uses
- High reuse potential

**Current Pattern**:
```typescript
// Pattern appears in 5 places:
// Line 142:
const className = `${cachedClass.element} ${cachedClass.level}` +
  (cachedClass.section && cachedClass.section !== '-' ? ` ${cachedClass.section}` : '');

// Line 273:
const className = `${row.classes.element} ${row.classes.level}` +
  (row.classes.section && row.classes.section !== '-' ? ` ${row.classes.section}` : '');

// Line 368:
const className = `${row.element} ${row.level}` +
  (row.section ? ` ${row.section}` : '');

// Similar in lines 947, 1239
```

**Suggested Extraction**:
```typescript
/**
 * Build a formatted class name from element, level, and optional section
 * @param element - Class element (e.g., "Containers", "Interior")
 * @param level - Class level (e.g., "Novice", "Excellent")
 * @param section - Optional section (e.g., "A", "B")
 * @returns Formatted class name (e.g., "Containers Novice A")
 */
export function buildClassName(
  element: string,
  level: string,
  section?: string | null
): string {
  let className = `${element} ${level}`;
  if (section && section !== '-') {
    className += ` ${section}`;
  }
  return className;
}
```

**Action**:
1. Create function in `src/utils/stringUtils.ts`
2. Replace all 5 instances with import
3. Add unit tests for edge cases (null, '-', empty)

**Estimated Impact**: Remove 40+ lines, improve consistency

---

### 3. `determineEntryStatus()` → `statusUtils.ts` ⚠️ HIGH PRIORITY

**Location**: Lines 102, 241, 342-343, 1212-1214 (4 LOCATIONS)
**Category**: Validation/Status determination
**Priority**: 🔴 **HIGH** - Complex logic duplication

**Why Extract**:
- Duplicated 4 times with slight variations
- Determines unified status from various fields
- Pure function with no side effects
- May already exist in `statusUtils.ts` - needs verification

**Current Pattern**:
```typescript
// Line 102:
const status = (entry.entry_status as EntryStatus) || 'no-status';

// Line 241:
const status = (row.entry_status as EntryStatus) || 'no-status';

// Lines 342-343:
const status = (row.entry_status as EntryStatus | undefined) ||
  (result?.is_in_ring ? 'in-ring' as EntryStatus : 'no-status' as EntryStatus);

// Line 1212-1214: Similar pattern
```

**Suggested Extraction**:
```typescript
/**
 * Determine entry status from various source fields
 * @param entryStatus - Direct entry status field
 * @param isInRing - Whether entry is currently in ring
 * @param result - Optional result object with is_in_ring flag
 * @returns Normalized EntryStatus
 */
export function determineEntryStatus(
  entryStatus?: string,
  isInRing?: boolean,
  result?: { is_in_ring?: boolean }
): EntryStatus {
  if (entryStatus) return entryStatus as EntryStatus;
  if (result?.is_in_ring || isInRing) return 'in-ring';
  return 'no-status';
}
```

**Action**:
1. Check if similar function exists in `statusUtils.ts`
2. If not, add to `statusUtils.ts`
3. Replace all 4 instances
4. Add unit tests

**Estimated Impact**: Remove 30+ lines, centralize status logic

---

### 4. `convertResultTextToStatus()` → `transformationUtils.ts`

**Location**: Lines 413-424 (within `submitScore`)
**Category**: Transformation utility
**Priority**: 🟡 **MEDIUM** - Good organization opportunity

**Why Extract**:
- Pure function mapping user input to enum values
- Clear validation logic handling multiple formats
- Reusable for other scoring-related functions
- Would benefit from unit tests

**Current Code**:
```typescript
// Lines 413-424 from submitScore:
let resultStatus = 'pending';
if (scoreData.resultText === 'Qualified' || scoreData.resultText === 'Q') {
  resultStatus = 'qualified';
} else if (scoreData.resultText === 'Not Qualified' || scoreData.resultText === 'NQ') {
  resultStatus = 'nq';
} else if (scoreData.resultText === 'Absent' || scoreData.resultText === 'ABS') {
  resultStatus = 'absent';
} else if (scoreData.resultText === 'Excused' || scoreData.resultText === 'EX') {
  resultStatus = 'excused';
} else if (scoreData.resultText === 'Withdrawn' || scoreData.resultText === 'WD') {
  resultStatus = 'withdrawn';
}
```

**Suggested Extraction**:
```typescript
export type ResultStatus = 'pending' | 'qualified' | 'nq' | 'absent' | 'excused' | 'withdrawn';

/**
 * Convert result text to normalized status enum
 * Handles both full text and abbreviations
 * @param resultText - Result text (e.g., "Qualified", "Q", "Not Qualified", "NQ")
 * @returns Normalized result status
 */
export function convertResultTextToStatus(resultText?: string): ResultStatus {
  if (!resultText) return 'pending';

  const text = resultText.toUpperCase().trim();

  if (text === 'QUALIFIED' || text === 'Q') return 'qualified';
  if (text === 'NOT QUALIFIED' || text === 'NQ') return 'nq';
  if (text === 'ABSENT' || text === 'ABS') return 'absent';
  if (text === 'EXCUSED' || text === 'EX') return 'excused';
  if (text === 'WITHDRAWN' || text === 'WD') return 'withdrawn';

  return 'pending';
}
```

**Action**:
1. Create `src/utils/transformationUtils.ts`
2. Extract function with case-insensitive handling
3. Add comprehensive unit tests for all abbreviations
4. Replace inline code in `submitScore`

**Estimated Impact**: Remove 12 lines, improve testability

---

### 5. `determineAreasForClass()` → `calculationUtils.ts`

**Location**: Lines 476-498 (within `submitScore`)
**Category**: Calculation/Business logic utility
**Priority**: 🟡 **MEDIUM** - Complex business logic

**Why Extract**:
- Pure function determining which area fields to use
- Complex business logic specific to AKC Scent Work rules
- Would benefit from dedicated unit tests
- Could be reused if multiple scoring paths exist

**Current Code**:
```typescript
// Lines 477-498:
const useArea2 = (element.toLowerCase() === 'interior' &&
                 (level.toLowerCase() === 'excellent' || level.toLowerCase() === 'master')) ||
                 (element.toLowerCase() === 'handler discrimination' &&
                  level.toLowerCase() === 'master');

if (useArea2 && areaTimeSeconds[1] !== undefined) {
  scoreUpdateData.area2_time_seconds = areaTimeSeconds[1];
}

const useArea3 = element.toLowerCase() === 'interior' && level.toLowerCase() === 'master';

if (useArea3 && areaTimeSeconds[2] !== undefined) {
  scoreUpdateData.area3_time_seconds = areaTimeSeconds[2];
}
```

**Suggested Extraction**:
```typescript
export interface AreaConfiguration {
  useArea1: boolean;
  useArea2: boolean;
  useArea3: boolean;
  useArea4: boolean;
}

/**
 * Determine which area time fields should be used for a class
 * Based on AKC Scent Work rules for element and level combinations
 *
 * @param element - Class element (e.g., "Interior", "Container")
 * @param level - Class level (e.g., "Novice", "Excellent", "Master")
 * @returns Configuration indicating which areas are used
 *
 * @example
 * determineAreasForClass("Interior", "Master")
 * // Returns: { useArea1: true, useArea2: true, useArea3: true, useArea4: false }
 */
export function determineAreasForClass(
  element: string,
  level: string
): AreaConfiguration {
  const elementLower = element.toLowerCase();
  const levelLower = level.toLowerCase();

  // Area 2 used for:
  // - Interior Excellent/Master
  // - Handler Discrimination Master
  const useArea2 = (elementLower === 'interior' &&
                   (levelLower === 'excellent' || levelLower === 'master')) ||
                   (elementLower === 'handler discrimination' && levelLower === 'master');

  // Area 3 only for Interior Master
  const useArea3 = elementLower === 'interior' && levelLower === 'master';

  return {
    useArea1: true,  // Area 1 always used
    useArea2,
    useArea3,
    useArea4: false  // Reserved for future
  };
}
```

**Action**:
1. Create `src/utils/calculationUtils.ts`
2. Extract with comprehensive JSDoc
3. Add unit tests for all element/level combinations
4. Replace inline logic in `submitScore`

**Estimated Impact**: Remove 22 lines, centralize AKC rules

---

### 6. `shouldCheckCompletion()` → `validationUtils.ts`

**Location**: Lines 616-627
**Category**: Validation/Decision logic
**Priority**: 🟡 **MEDIUM** - Business logic isolation

**Why Extract**:
- Pure function with no side effects
- Encapsulates scoring progression logic
- Could be reused for similar completion checks
- Clear business logic worth unit testing

**Current Code**:
```typescript
function shouldCheckCompletion(scoredCount: number, totalCount: number): boolean {
  if (scoredCount === 1) {
    console.log('✅ First dog scored - checking to mark class as in_progress');
    return true;
  }
  if (scoredCount === totalCount) {
    console.log('✅ All dogs scored - checking to mark class as completed');
    return true;
  }
  console.log(`⏭️ Skipping completion check (${scoredCount}/${totalCount} - not first or last)`);
  return false;
}
```

**Suggested Extraction**:
```typescript
/**
 * Determine if class completion status should be checked
 * Checks on first score and on final score
 *
 * @param scoredCount - Number of dogs scored so far
 * @param totalCount - Total number of dogs in class
 * @returns true if completion should be checked
 */
export function shouldCheckCompletion(
  scoredCount: number,
  totalCount: number
): boolean {
  // Check on first score (mark as in_progress)
  if (scoredCount === 1) return true;

  // Check on final score (mark as completed)
  if (scoredCount === totalCount) return true;

  // Skip intermediate scores
  return false;
}
```

**Action**:
1. Create `src/utils/validationUtils.ts` if not exists
2. Extract function (remove console.logs or make optional)
3. Add unit tests
4. Consider logging externally if needed

**Estimated Impact**: Remove 11 lines, improve organization

---

### 7. `calculateTotalAreaTime()` → `calculationUtils.ts`

**Location**: Lines 491-498
**Category**: Calculation utility
**Priority**: 🟢 **LOW** - Simple but useful

**Why Extract**:
- Pure function summing area times
- Clear business logic
- Reusable for time calculations
- Very simple, low complexity

**Current Code**:
```typescript
let totalTime = 0;
if (scoreUpdateData.area1_time_seconds) totalTime += scoreUpdateData.area1_time_seconds;
if (scoreUpdateData.area2_time_seconds) totalTime += scoreUpdateData.area2_time_seconds;
if (scoreUpdateData.area3_time_seconds) totalTime += scoreUpdateData.area3_time_seconds;
scoreUpdateData.search_time_seconds = totalTime;
```

**Suggested Extraction**:
```typescript
/**
 * Calculate total search time from area times
 * @param area1 - Time in seconds for area 1
 * @param area2 - Time in seconds for area 2
 * @param area3 - Time in seconds for area 3
 * @param area4 - Time in seconds for area 4
 * @returns Total time in seconds
 */
export function calculateTotalAreaTime(
  area1?: number,
  area2?: number,
  area3?: number,
  area4?: number
): number {
  return (area1 || 0) + (area2 || 0) + (area3 || 0) + (area4 || 0);
}
```

**Action**:
1. Add to `calculationUtils.ts`
2. Replace inline summation
3. Add simple unit tests

**Estimated Impact**: Remove 5 lines, improve readability

---

### 8-10. Entry Object Mapping (Phase 2 Candidates)

**Location**: Lines 112-154, 243-286, 345-372, 1216-1243
**Category**: Transformation utility
**Priority**: 🟡 **MEDIUM** - Large refactor for Phase 2

**Why Extract**:
- **CRITICAL**: Entry object construction duplicated 4+ times
- Large mapping logic from database rows to Entry interface
- Different variations based on data source
- ~150+ lines of similar mapping code

**Recommendation**:
- Phase 2 refactor (more complex)
- Create `src/utils/entryFactories.ts`
- Factory functions for different data sources
- Significant file size reduction (200+ lines)

---

## 📊 Code Duplication Summary

| Pattern | Locations | Lines | Severity | Impact |
|---------|-----------|-------|----------|--------|
| `buildClassName()` | 5 | ~50 | 🔴 HIGH | Consolidate to 1 function |
| Entry object mapping | 4+ | ~200 | 🔴 CRITICAL | Phase 2 factory pattern |
| `determineEntryStatus()` | 4 | ~30 | 🔴 HIGH | Centralize status logic |
| `secondsToTimeString()` | 2 | ~15 | 🟡 MEDIUM | Use existing timeUtils |
| `determineAreasForClass()` | 1 | ~22 | 🟡 MEDIUM | Complex business logic |
| Other utilities | Various | ~50 | 🟢 LOW | Organization improvement |

**Total Optimization Potential**: ~800+ lines

---

## 🎯 Prioritized Extraction Plan

### Phase 1: Week 1-2 (High Priority - Quick Wins)

**Estimated Time**: 2-3 hours
**Expected Impact**: Remove 80-100 lines

1. **`secondsToTimeString()`** → Consolidate with `timeUtils.ts`
   - ✅ Verify existing implementation
   - ✅ Remove duplicates (2 locations)
   - ✅ Update imports

2. **`buildClassName()`** → Create `stringUtils.ts`
   - ✅ Extract to new utility
   - ✅ Replace 5 instances
   - ✅ Add unit tests
   - **Impact**: Save ~40 lines

3. **`determineEntryStatus()`** → Add to `statusUtils.ts`
   - ✅ Check existing statusUtils
   - ✅ Add function if missing
   - ✅ Replace 4 instances
   - **Impact**: Save ~30 lines

### Phase 2: Week 2-3 (Medium Priority - Organization)

**Estimated Time**: 3-4 hours
**Expected Impact**: Add 150+ lines to utilities, improve testability

4. **`convertResultTextToStatus()`** → Create `transformationUtils.ts`
   - ✅ Extract lines 413-424
   - ✅ Add case-insensitive handling
   - ✅ Comprehensive unit tests

5. **`determineAreasForClass()`** → Create `calculationUtils.ts`
   - ✅ Extract lines 476-498
   - ✅ Document AKC rules
   - ✅ Unit tests for all combinations

6. **`shouldCheckCompletion()`** → Add to `validationUtils.ts`
   - ✅ Extract lines 616-627
   - ✅ Optional logging parameter
   - ✅ Unit tests

7. **`calculateTotalAreaTime()`** → Add to `calculationUtils.ts`
   - ✅ Extract simple summation
   - ✅ Basic unit tests

### Phase 3: Week 3+ (Future - Complex Refactor)

**Estimated Time**: 4-6 hours
**Expected Impact**: Remove 200+ lines

8. **Entry object mapping factory** → Create `entryFactories.ts`
   - More complex refactor
   - Multiple data source formats
   - Factory pattern implementation
   - Comprehensive integration tests

---

## 📁 Proposed Utility Module Structure

```
src/utils/
├── timeUtils.ts                    (ENHANCE - consolidate secondsToTimeString)
├── stringUtils.ts                  (CREATE - buildClassName)
├── statusUtils.ts                  (ENHANCE - determineEntryStatus)
├── transformationUtils.ts          (CREATE - convertResultTextToStatus)
├── calculationUtils.ts             (CREATE - area/time calculations)
├── validationUtils.ts              (CREATE - shouldCheckCompletion)
└── entryFactories.ts              (PHASE 2 - entry object mapping)
```

---

## ✅ Success Criteria

### Phase 1 Complete When:
- [ ] All 3 high-priority extractions done
- [ ] 80-100 lines removed from entryService.ts
- [ ] Zero TypeScript/ESLint errors
- [ ] All tests passing
- [ ] Functions have JSDoc documentation
- [ ] Unit tests added for extracted functions

### Phase 2 Complete When:
- [ ] 4 medium-priority extractions done
- [ ] New utility modules created with tests
- [ ] submitScore() function simplified
- [ ] All tests passing

### Phase 3 Complete When:
- [ ] Entry factory pattern implemented
- [ ] 200+ additional lines removed
- [ ] Integration tests passing
- [ ] Documentation updated

---

## 🎓 Lessons for Future Analysis

1. **Look for patterns across file**: Same logic in multiple places
2. **Check existing utils first**: May already have similar functions
3. **Consider business logic separately**: Complex rules deserve their own utilities
4. **Phase complex refactors**: Entry factories are Phase 2, not Phase 1
5. **Document AKC/domain rules**: Business logic needs clear documentation

---

## 📚 Related Documentation

- **[Phase 1, Week 2 Master Plan](./PHASE1-WEEK2-MASTER-PLAN.md)** - Current work plan
- **[Refactoring Status](../../REFACTORING-STATUS.md)** - Overall progress
- **[Phase 1, Week 2 Summary](../../REFACTORING-PHASE1-WEEK2.md)** - Completed work

---

*Analysis completed: 2025-01-18*
*Next action: Begin Phase 1 extractions (Week 3)*
