# Scoresheet Refactoring Plan

**Created**: 2025-11-25
**Status**: ✅ Complete
**Estimated Effort**: Completed in 2 days
**Line Reduction**: ~2,050 lines deleted (total codebase reduction)

## Progress Update (2025-11-26)

| Phase | Status | Details |
|-------|--------|---------|
| Phase 1: Extract Hooks | ✅ Complete | `useScoresheetCore`, `useEntryNavigation` created |
| Phase 3a: Refactor Base | ✅ Complete | AKCScentWorkScoresheet: 1,118 → 692 lines (-38%) |
| Phase 3b: Delete Enhanced | ✅ Complete | Redundant dual-mode file removed (-1,296 lines) |
| Phase 3c: Refactor Nationals | ✅ Complete | AKCNationalsScoresheet: 1,175 → 847 lines (-28%) |

## Executive Summary

**Decision**: Simplified from 3 files to 2 files:
- **Base scoresheet** (`AKCScentWorkScoresheet.tsx`) - Regular shows (refactored, 692 lines)
- **Nationals scoresheet** (`AKCNationalsScoresheet.tsx`) - Nationals only (pending refactor)

The "Enhanced" file was redundant - it handled both regular and Nationals modes, duplicating functionality. Deleted to reduce maintenance burden.

| File | Before | After | Status |
|------|--------|-------|--------|
| `AKCScentWorkScoresheet.tsx` | 1,118 | 692 | ✅ Refactored |
| `AKCScentWorkScoresheet-Enhanced.tsx` | 1,296 | 0 | ✅ Deleted |
| `AKCNationalsScoresheet.tsx` | 1,175 | 847 | ✅ Refactored |
| **Shared hooks** | 0 | ~500 | ✅ Created |
| **Total** | 3,589 | ~2,039 | **-43%** |

---

## Current Architecture Problems

### 1. Duplicated State Management
All three files declare identical state:
```typescript
// Repeated in ALL 3 files (lines 73-98)
const [areas, setAreas] = useState<AreaScore[]>([]);
const [qualifying, setQualifying] = useState<QualifyingResult | ''>('');
const [nonQualifyingReason, setNonQualifyingReason] = useState<string>('');
const [totalTime, setTotalTime] = useState<string>('');
const [isSubmitting, setIsSubmitting] = useState(false);
const [showConfirmation, setShowConfirmation] = useState(false);
const [faultCount, setFaultCount] = useState(0);
const [trialDate, setTrialDate] = useState<string>('');
const [trialNumber, setTrialNumber] = useState<string>('');
const [isLoadingEntry, setIsLoadingEntry] = useState(true);
```

### 2. Duplicated Stopwatch Logic
Timer/stopwatch code repeated in all files:
```typescript
// Repeated in ALL 3 files (lines 103-130)
const [stopwatchTime, setStopwatchTime] = useState(0);
const [isStopwatchRunning, setIsStopwatchRunning] = useState(false);
const [stopwatchInterval, setStopwatchInterval] = useState<NodeJS.Timeout | null>(null);
```

### 3. Duplicated Entry Navigation
Loading entries, navigating between them - identical in all files.

### 4. Duplicated Submission Logic
Score validation, optimistic updates, and API calls are nearly identical.

---

## Proposed Architecture

```
src/pages/scoresheets/
├── hooks/
│   ├── useScoresheetCore.ts      # State, submission, navigation
│   ├── useStopwatch.ts           # Already exists - enhance
│   └── useEntryNavigation.ts     # Entry loading, prev/next
├── components/
│   ├── ScoresheetLayout.tsx      # Shell with header, timer, footer
│   ├── ScoreSubmitDialog.tsx     # Confirmation dialog
│   ├── TimerDisplay.tsx          # Stopwatch UI
│   └── AreaInputs.tsx            # Area score inputs
└── AKC/
    ├── AKCScentWorkScoresheet.tsx    # ~300 lines
    ├── AKCEnhancedScoresheet.tsx     # ~400 lines
    └── AKCNationalsScoresheet.tsx    # ~350 lines
```

---

## Phase 1: Extract `useScoresheetCore` Hook (Day 1)

### New File: `src/pages/scoresheets/hooks/useScoresheetCore.ts`

```typescript
import { useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useScoringStore, useEntryStore } from '../../../stores';
import { useOptimisticScoring } from '../../../hooks/useOptimisticScoring';
import { useClassCompletion } from '../../../hooks/useClassCompletion';
import type { AreaScore } from '../../../services/scoresheets/areaInitialization';
import type { QualifyingResult } from '../../../stores/scoringStore';

export interface ScoresheetCoreConfig {
  /** Additional result types beyond Q/NQ/EX/ABS */
  extendedResults?: string[];
  /** Whether to show alerts correct/incorrect (Nationals) */
  showAlerts?: boolean;
  /** Whether to show finish call errors (Nationals) */
  showFinishCallErrors?: boolean;
}

export interface ScoresheetCoreState {
  // Identifiers
  classId: string;
  entryId: string;

  // Score state
  areas: AreaScore[];
  setAreas: (areas: AreaScore[]) => void;
  qualifying: QualifyingResult | '';
  setQualifying: (q: QualifyingResult | '') => void;
  nonQualifyingReason: string;
  setNonQualifyingReason: (r: string) => void;
  faultCount: number;
  setFaultCount: (c: number) => void;

  // UI state
  isSubmitting: boolean;
  showConfirmation: boolean;
  setShowConfirmation: (show: boolean) => void;
  isLoadingEntry: boolean;

  // Sync state
  isSyncing: boolean;
  hasError: boolean;

  // Actions
  submitScore: (scoreData: ScoreData) => Promise<void>;
  navigateToEntry: (entryId: string) => void;
  navigateToClass: () => void;

  // Components
  CelebrationModal: React.FC;
}

export function useScoresheetCore(config: ScoresheetCoreConfig = {}): ScoresheetCoreState {
  const { classId, entryId } = useParams<{ classId: string; entryId: string }>();
  const navigate = useNavigate();

  // Core state (extracted from all 3 files)
  const [areas, setAreas] = useState<AreaScore[]>([]);
  const [qualifying, setQualifying] = useState<QualifyingResult | ''>('');
  const [nonQualifyingReason, setNonQualifyingReason] = useState('');
  const [faultCount, setFaultCount] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [isLoadingEntry, setIsLoadingEntry] = useState(true);

  // Hooks
  const { submitScoreOptimistically, isSyncing, hasError } = useOptimisticScoring();
  const { CelebrationModal, checkCompletion } = useClassCompletion(classId);

  // Submission handler
  const submitScore = useCallback(async (scoreData: ScoreData) => {
    setIsSubmitting(true);
    try {
      await submitScoreOptimistically(scoreData);
      await checkCompletion();
      navigate(`/class/${classId}`);
    } finally {
      setIsSubmitting(false);
    }
  }, [classId, submitScoreOptimistically, checkCompletion, navigate]);

  // Navigation
  const navigateToEntry = useCallback((targetEntryId: string) => {
    navigate(`/class/${classId}/score/${targetEntryId}`);
  }, [classId, navigate]);

  const navigateToClass = useCallback(() => {
    navigate(`/class/${classId}`);
  }, [classId, navigate]);

  return {
    classId: classId!,
    entryId: entryId!,
    areas, setAreas,
    qualifying, setQualifying,
    nonQualifyingReason, setNonQualifyingReason,
    faultCount, setFaultCount,
    isSubmitting,
    showConfirmation, setShowConfirmation,
    isLoadingEntry,
    isSyncing,
    hasError,
    submitScore,
    navigateToEntry,
    navigateToClass,
    CelebrationModal,
  };
}
```

### Changes to Existing Files

**AKCScentWorkScoresheet.tsx** - Replace ~100 lines with:
```typescript
const {
  classId, entryId,
  areas, setAreas,
  qualifying, setQualifying,
  // ... all state from hook
} = useScoresheetCore();
```

---

## Phase 2: Extract `ScoresheetLayout` Component (Day 2)

### New File: `src/pages/scoresheets/components/ScoresheetLayout.tsx`

```typescript
interface ScoresheetLayoutProps {
  // Header
  title: string;
  entry: Entry | null;
  onClose: () => void;

  // Timer
  timerValue: number;
  isRunning: boolean;
  onTimerToggle: () => void;
  onTimerReset: () => void;
  warningSeconds?: number;

  // Content
  children: React.ReactNode;

  // Footer
  onSubmit: () => void;
  isSubmitting: boolean;
  canSubmit: boolean;
}

export const ScoresheetLayout: React.FC<ScoresheetLayoutProps> = ({
  title,
  entry,
  onClose,
  timerValue,
  isRunning,
  onTimerToggle,
  onTimerReset,
  warningSeconds = 30,
  children,
  onSubmit,
  isSubmitting,
  canSubmit,
}) => {
  return (
    <div className="scoresheet-container">
      {/* Header with dog info */}
      <header className="scoresheet-header">
        <button onClick={onClose}><X /></button>
        <h1>{title}</h1>
        {entry && <DogCard entry={entry} compact />}
      </header>

      {/* Timer display */}
      <TimerDisplay
        value={timerValue}
        isRunning={isRunning}
        onToggle={onTimerToggle}
        onReset={onTimerReset}
        warningSeconds={warningSeconds}
      />

      {/* Sport-specific content */}
      <main className="scoresheet-content">
        {children}
      </main>

      {/* Submit footer */}
      <footer className="scoresheet-footer">
        <button
          onClick={onSubmit}
          disabled={!canSubmit || isSubmitting}
          className="submit-button"
        >
          {isSubmitting ? 'Submitting...' : 'Submit Score'}
        </button>
      </footer>
    </div>
  );
};
```

---

## Phase 3: Refactor Individual Scoresheets (Days 3-4)

### AKCScentWorkScoresheet.tsx (After Refactor)

```typescript
import { useScoresheetCore } from '../hooks/useScoresheetCore';
import { useStopwatch } from '../../../hooks/useStopwatch';
import { ScoresheetLayout } from '../components/ScoresheetLayout';
import { AreaInputs } from '../components/AreaInputs';
import { ResultChoiceChips } from '../../../components/scoring/ResultChoiceChips';

export const AKCScentWorkScoresheet: React.FC = () => {
  // Shared core functionality
  const core = useScoresheetCore();
  const stopwatch = useStopwatch({ warningSeconds: 30 });

  // Sport-specific: Just the result types and validation
  const validResults: QualifyingResult[] = ['Q', 'NQ', 'EX', 'ABS'];

  const canSubmit = core.qualifying !== '' &&
    (core.qualifying !== 'NQ' || core.nonQualifyingReason);

  return (
    <ScoresheetLayout
      title="AKC Scent Work"
      entry={core.currentEntry}
      onClose={core.navigateToClass}
      timerValue={stopwatch.time}
      isRunning={stopwatch.isRunning}
      onTimerToggle={stopwatch.toggle}
      onTimerReset={stopwatch.reset}
      onSubmit={() => core.setShowConfirmation(true)}
      isSubmitting={core.isSubmitting}
      canSubmit={canSubmit}
    >
      {/* Sport-specific inputs */}
      <AreaInputs
        areas={core.areas}
        onChange={core.setAreas}
        maxTime={getMaxTimeForClass(core.classInfo)}
      />

      <ResultChoiceChips
        value={core.qualifying}
        onChange={core.setQualifying}
        options={validResults}
      />

      {core.qualifying === 'NQ' && (
        <textarea
          value={core.nonQualifyingReason}
          onChange={(e) => core.setNonQualifyingReason(e.target.value)}
          placeholder="Reason for NQ..."
        />
      )}

      {/* Celebration on class completion */}
      <core.CelebrationModal />
    </ScoresheetLayout>
  );
};
```

### AKCNationalsScoresheet.tsx (After Refactor)

```typescript
import { useScoresheetCore } from '../hooks/useScoresheetCore';
import { ScoresheetLayout } from '../components/ScoresheetLayout';

export const AKCNationalsScoresheet: React.FC = () => {
  const core = useScoresheetCore({
    extendedResults: ['1st', '2nd', '3rd', '4th'],
    showAlerts: true,
    showFinishCallErrors: true,
  });

  // Nationals-specific state (only what's unique)
  const [alertsCorrect, setAlertsCorrect] = useState(0);
  const [alertsIncorrect, setAlertsIncorrect] = useState(0);
  const [finishCallErrors, setFinishCallErrors] = useState(0);

  return (
    <ScoresheetLayout {...commonProps}>
      {/* Nationals-specific: Points display */}
      <NationalsPointsDisplay
        alertsCorrect={alertsCorrect}
        alertsIncorrect={alertsIncorrect}
        finishCallErrors={finishCallErrors}
      />

      {/* Nationals-specific: Alert inputs */}
      <AlertInputs
        correct={alertsCorrect}
        incorrect={alertsIncorrect}
        onCorrectChange={setAlertsCorrect}
        onIncorrectChange={setAlertsIncorrect}
      />

      {/* Shared: Area inputs, result chips */}
      <AreaInputs areas={core.areas} onChange={core.setAreas} />
      <ResultChoiceChips {...resultProps} />
    </ScoresheetLayout>
  );
};
```

---

## Phase 4: Testing & Cleanup (Day 5)

### Test Strategy
1. **Unit tests** for new hooks (`useScoresheetCore.test.ts`)
2. **Component tests** for `ScoresheetLayout`
3. **Integration tests** ensuring each scoresheet type still works
4. **Manual testing** of all score submission flows

### Files to Delete After Verification
- None immediately - keep old files until new architecture is stable
- Mark old files as deprecated with comments

### Migration Path
1. Implement new hooks and components alongside existing code
2. Refactor one scoresheet at a time (start with `AKCScentWorkScoresheet.tsx`)
3. Run full test suite after each migration
4. Remove old code once all three are migrated

---

## Risk Assessment

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| Breaking score submission | Medium | High | Keep old code during migration, A/B test |
| Timer accuracy issues | Low | Medium | Extract from working `useStopwatch` hook |
| State sync bugs | Medium | Medium | Comprehensive unit tests before migration |
| CSS style conflicts | Low | Low | Keep existing CSS, refactor later |

---

## Success Metrics

- [ ] All 3 scoresheets use shared hooks
- [ ] Total lines reduced by 50%+
- [ ] All existing tests pass
- [ ] No regressions in manual testing
- [ ] New hooks have 80%+ test coverage

---

## Appendix: Files to Create

| File | Purpose | Est. Lines |
|------|---------|------------|
| `src/pages/scoresheets/hooks/useScoresheetCore.ts` | Core state & submission | 150 |
| `src/pages/scoresheets/hooks/useEntryNavigation.ts` | Entry loading/navigation | 100 |
| `src/pages/scoresheets/components/ScoresheetLayout.tsx` | Shell component | 120 |
| `src/pages/scoresheets/components/ScoreSubmitDialog.tsx` | Confirmation modal | 80 |
| **Total new shared code** | | **450** |
