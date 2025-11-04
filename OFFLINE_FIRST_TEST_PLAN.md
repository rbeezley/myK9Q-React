# Offline-First Unit Test Plan

## Test Strategy

### What to Test:
1. **Optimistic Updates**: UI changes immediately before sync
2. **Silent Failures**: No errors/alerts when offline
3. **No Rollbacks**: Optimistic updates persist even when sync fails
4. **Real-time Confirmation**: Pending changes clear when subscription fires
5. **Pattern Consistency**: All three scenarios behave identically

### What NOT to Test:
- Real Supabase connection (use mocks)
- Actual network connectivity (mock online/offline state)
- Real-time subscription timing (mock subscription callbacks)

---

## Test Files to Create

### 1. `src/hooks/__tests__/useOptimisticScoring.test.ts`
Tests the scoring flow

### 2. `src/pages/EntryList/__tests__/EntryList.status-changes.test.tsx`
Tests status change flows (normal, in-ring, completed)

### 3. `src/pages/EntryList/__tests__/EntryList.reset-score.test.tsx`
Tests reset score flow

### 4. `src/services/__tests__/localStateManager.test.ts`
Tests the local state manager (already exists?)

---

## Test Scenarios (Apply to All Three Operations)

### Scenario 1: Online - Successful Sync
```typescript
describe('when online and sync succeeds', () => {
  it('updates UI immediately (optimistic)', async () => {
    // Arrange: Mock online state, mock successful API call
    // Act: Perform action (score/status change/reset)
    // Assert: UI updates within 50ms (before API resolves)
  });

  it('does not manually call refresh()', async () => {
    // Arrange: Spy on refresh function
    // Act: Perform action
    // Assert: refresh() was NOT called by action handler
  });

  it('syncs with database in background', async () => {
    // Arrange: Mock API endpoint
    // Act: Perform action
    // Assert: API was called with correct data
  });

  it('clears pending change when real-time subscription fires', async () => {
    // Arrange: Mock real-time subscription
    // Act: Perform action, then trigger subscription callback
    // Assert: Pending change is cleared from localStateManager
  });
});
```

### Scenario 2: Offline - Silent Failure
```typescript
describe('when offline', () => {
  it('updates UI immediately (optimistic)', async () => {
    // Arrange: Mock offline state
    // Act: Perform action
    // Assert: UI updates immediately
  });

  it('does not show error alert to user', async () => {
    // Arrange: Mock offline state, spy on console.error and alert
    // Act: Perform action
    // Assert: No alert() called, only console.error
  });

  it('does not rollback optimistic update', async () => {
    // Arrange: Mock offline state
    // Act: Perform action, wait for sync failure
    // Assert: UI still shows optimistic update
  });

  it('keeps pending change in localStateManager', async () => {
    // Arrange: Mock offline state
    // Act: Perform action
    // Assert: Pending change exists in localStateManager
  });

  it('retries sync when back online', async () => {
    // Arrange: Start offline, then go online
    // Act: Perform action while offline, then trigger online event
    // Assert: Sync retries automatically
  });
});
```

### Scenario 3: Connection Drops Mid-Sync
```typescript
describe('when connection drops during sync', () => {
  it('does not rollback optimistic update', async () => {
    // Arrange: Mock API that times out
    // Act: Perform action
    // Assert: UI keeps optimistic update
  });

  it('does not show error to user', async () => {
    // Arrange: Mock API failure
    // Act: Perform action
    // Assert: No alert shown
  });
});
```

### Scenario 4: Multiple Rapid Actions
```typescript
describe('when performing multiple rapid actions', () => {
  it('applies all optimistic updates immediately', async () => {
    // Arrange: Mock online state
    // Act: Perform 3 actions quickly
    // Assert: All 3 UI updates visible immediately
  });

  it('queues all syncs correctly', async () => {
    // Arrange: Mock slow API
    // Act: Perform 3 actions quickly
    // Assert: 3 API calls made (not deduplicated incorrectly)
  });

  it('does not cause race conditions', async () => {
    // Arrange: Mock varying API response times
    // Act: Perform actions in order A → B → C
    // Assert: Final state reflects C (last action wins)
  });
});
```

### Scenario 5: Pattern Consistency Check
```typescript
describe('pattern consistency across all three operations', () => {
  it('scoring, status changes, and reset score all update UI immediately', async () => {
    // Act: Perform all three operations
    // Assert: All update within 50ms
  });

  it('none call refresh() manually', async () => {
    // Arrange: Spy on refresh
    // Act: Perform all three operations
    // Assert: refresh() never called by action handlers
  });

  it('all fail silently when offline', async () => {
    // Arrange: Mock offline state
    // Act: Perform all three operations
    // Assert: No alerts, UI shows all optimistic updates
  });

  it('all rely on real-time subscriptions for confirmation', async () => {
    // Arrange: Mock subscriptions
    // Act: Perform all three, trigger subscriptions
    // Assert: All pending changes cleared
  });
});
```

---

## Mock Setup

### Mock localStateManager
```typescript
jest.mock('@/services/localStateManager', () => ({
  localStateManager: {
    updateEntry: jest.fn(),
    clearPendingChange: jest.fn(),
    hasPendingChange: jest.fn(),
    subscribe: jest.fn(() => jest.fn()), // Returns unsubscribe
  }
}));
```

### Mock Supabase
```typescript
jest.mock('@/lib/supabase', () => ({
  supabase: {
    from: jest.fn(() => ({
      update: jest.fn(() => ({
        eq: jest.fn(() => Promise.resolve({ error: null }))
      })),
      select: jest.fn(() => ({
        eq: jest.fn(() => Promise.resolve({ data: [], error: null }))
      }))
    }))
  }
}));
```

### Mock navigator.onLine
```typescript
Object.defineProperty(window.navigator, 'onLine', {
  writable: true,
  value: true // or false for offline tests
});
```

### Mock Real-time Subscription
```typescript
const mockSubscription = {
  on: jest.fn().mockReturnThis(),
  subscribe: jest.fn()
};

jest.spyOn(supabase, 'channel').mockReturnValue(mockSubscription as any);

// Later in test:
const subscriptionCallback = mockSubscription.on.mock.calls[0][1];
subscriptionCallback({ eventType: 'UPDATE', new: { id: 1, ... }});
```

---

## Assertions to Include

### UI Timing
```typescript
// Assert optimistic update happens BEFORE API resolves
const startTime = Date.now();
await userEvent.click(button);
const uiUpdateTime = Date.now() - startTime;
expect(uiUpdateTime).toBeLessThan(50); // < 50ms
expect(screen.getByText('Updated Value')).toBeInTheDocument();
```

### No Manual Refresh
```typescript
const refreshSpy = jest.spyOn(useEntryListDataModule, 'refresh');
await performAction();
expect(refreshSpy).not.toHaveBeenCalled();
```

### Silent Failure
```typescript
const alertSpy = jest.spyOn(window, 'alert');
const consoleErrorSpy = jest.spyOn(console, 'error');

Object.defineProperty(navigator, 'onLine', { value: false });
await performAction();

expect(alertSpy).not.toHaveBeenCalled();
expect(consoleErrorSpy).toHaveBeenCalledWith(
  expect.stringContaining('failed in background')
);
```

### No Rollback
```typescript
Object.defineProperty(navigator, 'onLine', { value: false });
await userEvent.click(changeStatusButton);

// Wait for sync attempt to fail
await waitFor(() => {
  expect(consoleErrorSpy).toHaveBeenCalled();
});

// Assert UI still shows optimistic update
expect(screen.getByText('Checked-in')).toBeInTheDocument();
expect(screen.queryByText('No Status')).not.toBeInTheDocument();
```

---

## Test Coverage Goals

- **Line Coverage**: >90% for affected files
- **Branch Coverage**: >85% (cover both online/offline paths)
- **Key Files**:
  - `src/hooks/useOptimisticScoring.ts`: 95%+
  - `src/pages/EntryList/EntryList.tsx` (status handlers): 90%+
  - `src/pages/EntryList/hooks/useEntryListActions.ts`: 95%+
  - `src/services/localStateManager.ts`: 95%+

---

## CI/CD Integration

Add to package.json:
```json
{
  "scripts": {
    "test:offline-first": "vitest run --testPathPattern='(useOptimisticScoring|EntryList.*|localStateManager)' --coverage"
  }
}
```

Add to GitHub Actions:
```yaml
- name: Test Offline-First Architecture
  run: npm run test:offline-first

- name: Check Coverage Thresholds
  run: |
    npx vitest run --coverage --coverage-thresholds.lines=90
```

---

## Example: Scoring Test

```typescript
// src/hooks/__tests__/useOptimisticScoring.test.ts
import { renderHook, act, waitFor } from '@testing-library/react';
import { useOptimisticScoring } from '../useOptimisticScoring';
import { localStateManager } from '@/services/localStateManager';

jest.mock('@/services/localStateManager');
jest.mock('@/lib/supabase');

describe('useOptimisticScoring - Offline-First Compliance', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('when online and sync succeeds', () => {
    it('updates localStateManager immediately before API call', async () => {
      const { result } = renderHook(() => useOptimisticScoring());

      let apiCalled = false;
      const submitScoreMock = jest.fn(async () => {
        apiCalled = true;
        return Promise.resolve();
      });

      await act(async () => {
        await result.current.submitScoreOptimistically({
          entryId: 1,
          scoreData: { resultText: 'Q', searchTime: '1:23.45' }
        });
      });

      // Assert localStateManager.updateEntry was called FIRST
      expect(localStateManager.updateEntry).toHaveBeenCalledWith(
        1,
        expect.objectContaining({ isScored: true, resultText: 'Q' }),
        'score'
      );

      // Then API call happens
      await waitFor(() => expect(apiCalled).toBe(true));
    });

    it('does NOT manually clear pending change after sync', async () => {
      // This should be done by real-time subscription, not the hook
      const { result } = renderHook(() => useOptimisticScoring());

      await act(async () => {
        await result.current.submitScoreOptimistically({
          entryId: 1,
          scoreData: { resultText: 'Q' }
        });
      });

      // Assert clearPendingChange was NOT called immediately
      expect(localStateManager.clearPendingChange).not.toHaveBeenCalled();
    });
  });

  describe('when offline', () => {
    beforeEach(() => {
      Object.defineProperty(navigator, 'onLine', {
        writable: true,
        value: false
      });
    });

    it('updates localStateManager immediately', async () => {
      const { result } = renderHook(() => useOptimisticScoring());

      await act(async () => {
        await result.current.submitScoreOptimistically({
          entryId: 1,
          scoreData: { resultText: 'Q' }
        });
      });

      expect(localStateManager.updateEntry).toHaveBeenCalledWith(
        1,
        expect.objectContaining({ isScored: true }),
        'score'
      );
    });

    it('does not throw error or show alert', async () => {
      const alertSpy = jest.spyOn(window, 'alert').mockImplementation();
      const { result } = renderHook(() => useOptimisticScoring());

      await act(async () => {
        await result.current.submitScoreOptimistically({
          entryId: 1,
          scoreData: { resultText: 'Q' }
        });
      });

      expect(alertSpy).not.toHaveBeenCalled();
      alertSpy.mockRestore();
    });

    it('keeps pending change in localStateManager', async () => {
      const { result } = renderHook(() => useOptimisticScoring());

      await act(async () => {
        await result.current.submitScoreOptimistically({
          entryId: 1,
          scoreData: { resultText: 'Q' }
        });
      });

      // Pending change was added
      expect(localStateManager.updateEntry).toHaveBeenCalled();
      // But NOT cleared
      expect(localStateManager.clearPendingChange).not.toHaveBeenCalled();
    });
  });
});
```

---

## Next Steps

1. **Create test files** with the patterns above
2. **Run tests**: `npm run test:offline-first`
3. **Check coverage**: Aim for >90% on critical paths
4. **Add to CI/CD**: Prevent regressions in future PRs
5. **Document findings**: Update CLAUDE.md with test commands
