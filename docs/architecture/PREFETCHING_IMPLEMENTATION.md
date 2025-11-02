# Prefetching Implementation

## Overview
Implemented aggressive data prefetching to make navigation feel instant by anticipating user actions and loading data before it's needed.

## Implementation Date
January 2025

## Core Hook: `usePrefetch`

**Location:** [src/hooks/usePrefetch.ts](src/hooks/usePrefetch.ts)

### Features
- **Hover prefetching** (desktop): Load data when user hovers over link/card
- **Touch prefetching** (mobile): Load data when user touches link/card
- **Smart prefetch queue**: Priority-based queue for batch processing
- **TTL-based caching**: Configurable time-to-live for cached data
- **Deduplication**: Prevents duplicate prefetches for same resource
- **Global cache**: Shared cache across all components

### API

```typescript
const {
  prefetch,          // Prefetch and cache data
  queuePrefetch,     // Add to queue for later
  processQueue,      // Process queued prefetches
  getCached,         // Get cached data
  clearCache,        // Clear cache (by pattern)
  cancel,            // Cancel ongoing prefetches
  isPrefetching,     // Boolean: currently prefetching
  cacheSize,         // Number of cached items
  queueSize          // Number of queued items
} = usePrefetch();
```

### Usage Patterns

#### Pattern 1: Direct Prefetching
```typescript
import { usePrefetch } from '@/hooks/usePrefetch';
import { getClassEntries } from '@/services/entryService';

function ClassCard({ classId }) {
  const { prefetch } = usePrefetch();

  const handleMouseEnter = () => {
    prefetch(
      `class-entries-${classId}`,
      () => getClassEntries(classId, licenseKey),
      { ttl: 60, priority: 1 }
    );
  };

  return (
    <div onMouseEnter={handleMouseEnter}>
      ...
    </div>
  );
}
```

#### Pattern 2: Using Helper Hook
```typescript
import { useLinkPrefetch } from '@/hooks/usePrefetch';

function ClassCard({ classId }) {
  const prefetchProps = useLinkPrefetch(
    `class-entries-${classId}`,
    () => getClassEntries(classId, licenseKey),
    { ttl: 60 }
  );

  return <div {...prefetchProps}>...</div>;
}
```

#### Pattern 3: Component Integration (Recommended)
```typescript
import { DogCard } from '@/components/DogCard';
import { usePrefetch } from '@/hooks/usePrefetch';

function EntryList({ entries }) {
  const { prefetch } = usePrefetch();

  return entries.map(entry => (
    <DogCard
      key={entry.id}
      {...entry}
      onPrefetch={() => prefetch(
        `entry-${entry.id}`,
        () => fetchEntryDetails(entry.id),
        { ttl: 60 }
      )}
      onClick={() => navigate(`/entry/${entry.id}`)}
    />
  ));
}
```

## Integration Points

### 1. DogCard Component ✅
**File:** [src/components/DogCard.tsx](src/components/DogCard.tsx)

Added `onPrefetch` prop that triggers on:
- `onMouseEnter` (desktop hover)
- `onTouchStart` (mobile touch)

**Usage:**
```tsx
<DogCard
  armband={123}
  callName="Max"
  breed="Border Collie"
  handler="John Doe"
  onPrefetch={() => prefetchEntryData(123)}
  onClick={() => navigate('/entry/123')}
/>
```

## Prefetch Strategy

### When to Prefetch

1. **On Hover (Desktop)**
   - User hovers over card/link
   - Typical delay: 200-500ms before click
   - Perfect time to load data

2. **On Touch Start (Mobile)**
   - User touches element (before release)
   - Typical delay: 100-300ms before navigation
   - Saves round-trip time

3. **On Idle (Background)**
   - Prefetch top 3-5 most likely next actions
   - Use `requestIdleCallback` to avoid blocking UI
   - Low priority prefetches

4. **On Visible (Intersection Observer)**
   - Prefetch when card enters viewport
   - Good for long lists
   - Requires additional implementation

### What to Prefetch

**High Priority (Priority 3)**
- Entry details when hovering over dog card
- Class entries when hovering over class card
- Scoresheet data when entering scoring flow

**Medium Priority (Priority 2)**
- Next/previous entries in list
- Related data (class info when viewing entry)
- Top 3 classes on home page

**Low Priority (Priority 1)**
- Prefetch during idle time
- Background sync of stale cache
- Predictive prefetching based on user patterns

### Cache Strategy

**TTL Guidelines:**
- **Static data** (class info, requirements): 300 seconds (5 minutes)
- **Semi-static** (entry lists, class entries): 60 seconds (1 minute)
- **Dynamic data** (scoring results, check-in status): 30 seconds
- **Real-time data** (in-ring status): 10 seconds or don't cache

**Cache Invalidation:**
```typescript
// Clear specific pattern
clearCache(/^class-entries-/); // Clear all class entry caches

// Clear all on logout
clearCache(); // Clear everything

// Clear on mutation
onScoreSubmit(() => {
  clearCache(`entry-${entryId}`);
  clearCache(`class-entries-${classId}`);
});
```

## Example Implementations

### Example 1: Home Page - Prefetch Top Classes
```typescript
// src/pages/Home/Home.tsx

import { usePrefetch, useIdleCallback } from '@/hooks/usePrefetch';

export function Home() {
  const { queuePrefetch, processQueue } = usePrefetch();
  const trials = useTrials();

  // Queue prefetches for likely next actions
  useEffect(() => {
    trials.slice(0, 3).forEach((trial, index) => {
      queuePrefetch(
        `trial-classes-${trial.id}`,
        () => fetchTrialClasses(trial.id),
        3 - index // Higher priority for first trial
      );
    });
  }, [trials]);

  // Process queue during idle time
  const scheduleProcess = useIdleCallback(() => {
    processQueue(3); // Process top 3
  }, [processQueue]);

  useEffect(() => {
    scheduleProcess();
  }, []);

  return (
    <div>
      {trials.map(trial => (
        <TrialCard
          key={trial.id}
          {...trial}
          onPrefetch={() => prefetch(
            `trial-classes-${trial.id}`,
            () => fetchTrialClasses(trial.id),
            { priority: 3 }
          )}
          onClick={() => navigate(`/trial/${trial.id}`)}
        />
      ))}
    </div>
  );
}
```

### Example 2: Class List - Prefetch Entry Lists
```typescript
// src/pages/ClassList/ClassList.tsx

import { usePrefetch } from '@/hooks/usePrefetch';

export function ClassList({ trialId }) {
  const { prefetch } = usePrefetch();
  const classes = useClasses(trialId);

  const handleClassHover = (classId: number) => {
    prefetch(
      `class-entries-${classId}`,
      () => getClassEntries(classId, licenseKey),
      {
        ttl: 60,
        priority: 2
      }
    );
  };

  return (
    <div>
      {classes.map(cls => (
        <ClassCard
          key={cls.id}
          {...cls}
          onMouseEnter={() => handleClassHover(cls.id)}
          onTouchStart={() => handleClassHover(cls.id)}
          onClick={() => navigate(`/class/${cls.id}/entries`)}
        />
      ))}
    </div>
  );
}
```

### Example 3: Entry List - Prefetch Scoresheets
```typescript
// src/pages/EntryList/EntryList.tsx

import { usePrefetch } from '@/hooks/usePrefetch';

export function EntryList({ classId }) {
  const { prefetch } = usePrefetch();
  const entries = useEntries(classId);

  const handleEntryHover = (entry: Entry) => {
    // Prefetch scoresheet data
    prefetch(
      `scoresheet-${entry.id}`,
      () => fetchScoresheetData(entry.id),
      {
        ttl: 30,
        priority: 3 // High priority - likely to score
      }
    );
  };

  return (
    <div>
      {entries.map(entry => (
        <DogCard
          key={entry.id}
          {...entry}
          onPrefetch={() => handleEntryHover(entry)}
          onClick={() => navigate(`/scoresheet/${entry.id}`)}
        />
      ))}
    </div>
  );
}
```

## Performance Benefits

### Before Prefetching
1. User hovers over card (0ms)
2. User clicks (300ms)
3. Navigation starts (300ms)
4. API request sent (350ms)
5. API response received (550ms) ⬅️ 550ms wait time
6. UI renders (600ms)

### After Prefetching
1. User hovers over card (0ms)
2. **Prefetch starts** (0ms)
3. **API request sent** (50ms)
4. User clicks (300ms)
5. Navigation starts (300ms)
6. **Data already cached** (300ms) ⬅️ 0ms wait time!
7. UI renders instantly (350ms)

**Total Time Saved:** 200-300ms per navigation

## Browser Support

### Supported Features
- ✅ Hover events (desktop)
- ✅ Touch events (mobile)
- ✅ requestIdleCallback (Chrome, Edge, Safari 16.4+)
- ✅ localStorage for cache persistence (optional)

### Graceful Degradation
- Falls back to `setTimeout` if `requestIdleCallback` not available
- Prefetch failures are silent (logged to console only)
- Cache misses just trigger normal fetch

## Monitoring & Debugging

### Console Logging
```javascript
// Prefetch started
🚀 Prefetching: class-entries-123 (priority: 2)

// Cache hit
✅ Prefetch cache hit: class-entries-123

// Already in progress
⏳ Prefetch already in progress: class-entries-123

// Prefetch complete
✅ Prefetch complete: class-entries-123

// Prefetch failed
❌ Prefetch failed: class-entries-123 Error: Network error
```

### Cache Inspection
```typescript
const { cacheSize, queueSize } = usePrefetch();

console.log(`Cache: ${cacheSize} items`);
console.log(`Queue: ${queueSize} items`);
```

## Best Practices

### ✅ Do
- Prefetch on hover/touch for immediate next actions
- Use appropriate TTLs based on data volatility
- Set priorities for prefetch queue
- Clear cache on mutations
- Monitor cache size (stay under 50-100 items)

### ❌ Don't
- Don't prefetch on every scroll event (too expensive)
- Don't set TTL > 5 minutes (stale data risk)
- Don't prefetch large assets (images, videos)
- Don't prefetch without user signal (hover/touch)
- Don't cache real-time data (in-ring status)

## Future Enhancements

### 1. Predictive Prefetching
```typescript
// Learn user patterns and prefetch likely next actions
const { predictNext } = useUserBehavior();
predictNext().forEach(action => prefetch(action));
```

### 2. Intersection Observer Integration
```typescript
// Prefetch when cards become visible
useIntersectionPrefetch(entries, threshold: 0.5);
```

### 3. Service Worker Integration
```typescript
// Prefetch via service worker for offline support
navigator.serviceWorker.controller.postMessage({
  type: 'PREFETCH',
  url: '/api/class/123/entries'
});
```

### 4. Cache Persistence
```typescript
// Persist cache to localStorage/IndexedDB
usePersistentPrefetchCache();
```

## Testing

### Manual Testing Checklist
- [ ] Hover over class card → Network tab shows prefetch
- [ ] Click immediately → Data loads instantly (cached)
- [ ] Wait 2 minutes → Cache expires, fresh fetch on click
- [ ] Prefetch fails → Normal fetch still works
- [ ] Clear cache → Next prefetch repopulates

### Performance Testing
```bash
# Chrome DevTools > Network tab
1. Enable "Disable cache"
2. Hover over card (watch for prefetch request)
3. Click card (watch for instant load from cache)
4. Compare time: With prefetch vs Without prefetch
```

### Load Testing
```bash
# Simulate 100 users prefetching simultaneously
# Monitor: Memory usage, cache size, network bandwidth
```

## Integration Checklist

To add prefetching to a new page:

1. **Import hook**
   ```typescript
   import { usePrefetch } from '@/hooks/usePrefetch';
   ```

2. **Create prefetch handler**
   ```typescript
   const { prefetch } = usePrefetch();
   const handlePrefetch = () => prefetch(key, fetcher, options);
   ```

3. **Add to component**
   ```tsx
   <Component
     onMouseEnter={handlePrefetch}
     onTouchStart={handlePrefetch}
   />
   ```

4. **Test**
   - Verify network request in DevTools
   - Confirm instant navigation
   - Check cache invalidation

---

**Status:** ✅ Implemented
**Last Updated:** January 2025
**Owner:** Development Team
