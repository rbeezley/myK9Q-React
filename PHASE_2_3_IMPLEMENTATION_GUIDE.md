# Phase 2.3: Loading State Management - Implementation Guide

## ✅ What's Been Created

### 1. Stale-While-Revalidate Hook
**File:** `src/hooks/useStaleWhileRevalidate.ts`

**Purpose:** Show cached data instantly while refreshing in background

**Usage Example:**
```typescript
import { useStaleWhileRevalidate } from '@/hooks/useStaleWhileRevalidate';

const { data, isStale, isRefreshing, error, refresh } = useStaleWhileRevalidate(
  `entries-class-${classId}`, // Unique cache key
  () => getClassEntries(classId, licenseKey), // Fetcher function
  {
    ttl: 60000, // Cache for 1 minute
    refetchOnFocus: true, // Refresh when window regains focus
    refetchOnReconnect: true // Refresh when network reconnects
  }
);

// data is available IMMEDIATELY from cache (< 10ms)
// isStale tells you if it's being refreshed
// isRefreshing shows background refresh status
```

### 2. Background Refresh Indicator
**Files:**
- `src/components/ui/RefreshIndicator.tsx`
- `src/components/ui/RefreshIndicator.css`

**Purpose:** Subtle indicator showing when data is being refreshed

**Usage Example:**
```typescript
import { RefreshIndicator } from '@/components/ui';

<RefreshIndicator
  isRefreshing={isRefreshing}
  position="top"
  message="Updating..."
/>
```

### 3. Exported from UI Components
Updated `src/components/ui/index.ts` to export `RefreshIndicator`

---

## 🎯 How to Apply to Entry List

### Current Flow (Slow):
```
User clicks Entry List → White screen → Wait 500ms-2s → Show entries
                                ↑
                           Loading delay
```

### New Flow (Instant):
```
User clicks Entry List → Show cached entries INSTANTLY → Background refresh → Update if changed
                              ↑                               ↑
                         Cache hit < 10ms              Invisible to user
```

### Implementation Steps:

#### Step 1: Replace `loadEntries` with stale-while-revalidate

**Before (EntryList.tsx):**
```typescript
const [entries, setEntries] = useState<Entry[]>([]);
const [isLoading, setIsLoading] = useState(true);

useEffect(() => {
  if (classId && showContext?.licenseKey) {
    loadEntries(); // Async, causes loading delay
  }
}, [classId, showContext]);

const loadEntries = async () => {
  setIsLoading(true);
  const data = await getClassEntries(classId, licenseKey);
  setEntries(data);
  setIsLoading(false);
};
```

**After (with stale-while-revalidate):**
```typescript
import { useStaleWhileRevalidate } from '@/hooks/useStaleWhileRevalidate';
import { RefreshIndicator } from '@/components/ui';

const {
  data: entries,
  isStale,
  isRefreshing,
  error
} = useStaleWhileRevalidate(
  `entries-class-${classId}`,
  async () => {
    if (!classId || !showContext?.licenseKey) return [];
    return await getClassEntries(parseInt(classId), showContext.licenseKey);
  },
  {
    ttl: 60000, // 1 minute cache
    fetchOnMount: true,
    refetchOnFocus: true,
    refetchOnReconnect: true
  }
);

// Show refresh indicator when updating in background
<RefreshIndicator
  isRefreshing={isRefreshing && isStale}
  position="top"
/>
```

#### Step 2: Remove loading states

**Before:**
```typescript
if (isLoading) {
  return <div className="loading">Loading entries...</div>;
}
```

**After:**
```typescript
// NO loading screen!
// Show cached data immediately or skeleton if no cache
if (!entries || entries.length === 0) {
  return <DogCardSkeletonList count={5} />;
}
```

#### Step 3: Show skeleton loaders for first-time loads

```typescript
import { DogCardSkeletonList } from '@/components/skeletons';

// Only show skeleton if NO cached data exists
if (!entries) {
  return <DogCardSkeletonList count={5} />;
}

// Otherwise show entries immediately (even if stale)
```

---

## 🚀 Benefits

### 1. **Instant Navigation**
- Cached data appears in < 10ms
- No white screens or loading spinners
- Feels native-app fast

### 2. **Always Fresh**
- Background refresh ensures data is current
- Auto-refresh on focus (when judge returns to tab)
- Auto-refresh on reconnect (after WiFi comes back)

### 3. **Offline Resilient**
- Shows last cached data even when offline
- Queues refresh for when connection returns
- Never shows "Network Error" blank screens

### 4. **Smart Caching**
- 1-minute TTL (configurable)
- Automatic cache invalidation
- Memory-efficient (LRU-style cleanup)

---

## 📋 Next Steps to Complete Phase 2.3

### Priority 1: Apply to Entry List ⚡
1. Update `EntryList.tsx` to use `useStaleWhileRevalidate`
2. Add `RefreshIndicator` component
3. Replace loading spinner with skeleton loaders
4. Test with network throttling

### Priority 2: Apply to Class List
1. Update `ClassList.tsx` with stale-while-revalidate
2. Use `ClassCardSkeletonList` for first load
3. Show background refresh indicator

### Priority 3: Apply to Home Page
1. Cache announcements (already have 5-min TTL)
2. Cache class counts
3. Instant navigation everywhere

### Priority 4: Error States with Retry
Create `ErrorState` component:
```typescript
<ErrorState
  error={error}
  onRetry={() => refresh(true)}
  message="Failed to load entries"
/>
```

---

## 🧪 Testing Checklist

- [ ] Navigate to Entry List → Should show cached data instantly
- [ ] Wait 1 minute → Background refresh should trigger
- [ ] Switch tabs → Should refresh when returning
- [ ] Go offline → Should show cached data (not blank screen)
- [ ] Reconnect → Should auto-refresh
- [ ] Clear cache → Should show skeleton, then data
- [ ] Check network tab → Should only fetch when stale

---

## 📊 Expected Performance Gains

**Current (without caching):**
- Entry List load time: 500ms-2s
- White screen visible: Yes
- Perceived wait: **Slow**

**After Implementation:**
- Entry List load time: < 10ms (from cache)
- White screen visible: No
- Perceived wait: **Instant** ✨

**Impact on a typical show:**
- Judge views Entry List 50+ times per day
- **Savings: 25-100 seconds per show** of eliminated waiting
- **Perceived improvement: Feels "native-app fast"**

---

## 💡 Pro Tips

1. **Cache Keys:** Use descriptive, unique keys like `entries-class-${classId}`
2. **TTL:** Shorter TTL (30s-60s) for frequently changing data, longer (5min) for static data
3. **Refresh Triggers:** Enable `refetchOnFocus` for real-time feel
4. **Error Handling:** Always show cached data on error (don't break the app)
5. **Manual Refresh:** Provide pull-to-refresh or refresh button for users

---

## 🎯 Status

- ✅ Hook created (`useStaleWhileRevalidate.ts`)
- ✅ Component created (`RefreshIndicator`)
- ✅ Exported from UI library
- ⏳ Not yet applied to pages (ready to implement)
- ⏳ Testing pending

**Ready to apply!** The infrastructure is built, now we just need to integrate it into the pages.
