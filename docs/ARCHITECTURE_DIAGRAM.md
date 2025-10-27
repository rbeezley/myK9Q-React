# myK9Q Three-Tier Architecture Diagram

**Purpose:** Visual documentation of the data flow through the application's three-tier architecture: **Stores → Services → Database**

**Generated:** 2025-10-25

---

## 🏛️ Architectural Overview

myK9Q follows a strict three-tier separation of concerns:

1. **Stores (Zustand)** - Client-side state management
2. **Services** - Business logic and API communication
3. **Database (Supabase)** - PostgreSQL with real-time subscriptions

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           USER INTERFACE LAYER                              │
│                         (React Components / Pages)                          │
└─────────────────────────────────────────────────────────────────────────────┘
                                     │
                                     │ hooks (useEntryStore, useScoringStore)
                                     ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                            STORE LAYER (Zustand)                            │
│                                                                             │
│  entryStore.ts          scoringStore.ts        offlineQueueStore.ts        │
│  nationalsStore.ts      timerStore.ts          announcementStore.ts        │
│                                                                             │
│  - Client-side state    - Actions/mutations    - Devtools middleware       │
│  - Filter/pagination    - Derived selectors    - LocalStorage persistence  │
└─────────────────────────────────────────────────────────────────────────────┘
                                     │
                                     │ calls service functions
                                     ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                          SERVICE LAYER (Business Logic)                     │
│                                                                             │
│  entryService.ts        placementService.ts    nationalsScoring.ts         │
│  authService.ts         syncManager.ts         announcementService.ts      │
│                                                                             │
│  - API calls            - Data transformation  - Validation                │
│  - Real-time subs       - Error handling       - Multi-tenant filtering    │
└─────────────────────────────────────────────────────────────────────────────┘
                                     │
                                     │ Supabase client (REST + Realtime)
                                     ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                        DATABASE LAYER (Supabase/PostgreSQL)                 │
│                                                                             │
│  shows → trials → classes → entries → results                              │
│                                                                             │
│  - Row-level security   - Real-time triggers   - Multi-tenant isolation    │
│  - Foreign key refs     - CHECK constraints    - Indexes for performance   │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 📊 Detailed Data Flow Diagrams

### 1. Entry Management Flow

```
┌──────────────────────────────────────────────────────────────────────────┐
│  USER ACTION: Judge clicks on a class to view entries                   │
└──────────────────────────────────────────────────────────────────────────┘
                                  │
                                  ▼
┌──────────────────────────────────────────────────────────────────────────┐
│  COMPONENT: ClassDetail.tsx                                              │
│  ────────────────────────────────────────────────────────────────────────│
│  useEffect(() => {                                                       │
│    const loadEntries = async () => {                                     │
│      const entries = await entryService.getClassEntries(classId, key);   │
│      entryStore.setEntries(entries);                                     │
│    };                                                                     │
│  }, [classId]);                                                          │
└──────────────────────────────────────────────────────────────────────────┘
                                  │
                                  ▼
┌──────────────────────────────────────────────────────────────────────────┐
│  SERVICE: entryService.ts                                                │
│  ────────────────────────────────────────────────────────────────────────│
│  export async function getClassEntries(                                  │
│    classIds: number | number[],                                         │
│    licenseKey: string                                                    │
│  ): Promise<Entry[]> {                                                   │
│    // Step 1: Query database with proper joins                          │
│    const { data } = await supabase                                       │
│      .from('entries')                                                    │
│      .select(`                                                           │
│        *,                                                                │
│        classes!inner (                                                   │
│          element, level, section,                                        │
│          trials!inner (                                                  │
│            trial_date, trial_number,                                     │
│            shows!inner (license_key)                                     │
│          )                                                               │
│        )                                                                 │
│      `)                                                                  │
│      .in('class_id', classIdArray)                                       │
│      .eq('classes.trials.shows.license_key', licenseKey); ──┐            │
│                                                             │            │
│    // Step 2: Fetch results separately                     │            │
│    const { data: resultsData } = await supabase            │            │
│      .from('results')                                      │            │
│      .select('entry_id, is_scored, search_time_seconds')  │            │
│      .in('entry_id', entryIds);                            │            │
│                                                             │            │
│    // Step 3: Transform DB format to TS interface          │            │
│    return viewData.map(row => ({                           │            │
│      id: row.id,                                           │            │
│      armband: row.armband_number, ◄────────────────────────┘            │
│      callName: row.dog_call_name,  // snake_case → camelCase            │
│      status: row.entry_status,     // DB ENUM → TS union type           │
│      isScored: result?.is_scored,  // Join results data                 │
│      timeLimit: secondsToTimeString(classData.time_limit_seconds) ◄──┐  │
│      // ... more transformations                                    │  │
│    }));                                                               │  │
│  }                                                                    │  │
└───────────────────────────────────────────────────────────────────────┼──┘
                                  │                                     │
                                  ▼                           TIME CONVERSION
┌──────────────────────────────────────────────────────────────────────────┐
│  DATABASE: Supabase PostgreSQL                                           │
│  ────────────────────────────────────────────────────────────────────────│
│                                                                          │
│  SELECT e.*, c.element, c.level, t.trial_date, s.license_key            │
│  FROM entries e                                                          │
│  INNER JOIN classes c ON e.class_id = c.id                              │
│  INNER JOIN trials t ON c.trial_id = t.id                               │
│  INNER JOIN shows s ON t.show_id = s.id                                 │
│  WHERE s.license_key = 'myK9Q1-...' ◄─── Multi-tenant filtering         │
│    AND e.class_id IN (275, 276)                                          │
│  ORDER BY e.armband_number ASC;                                          │
│                                                                          │
│  ┌─────────────────────┐     ┌─────────────────────┐                    │
│  │ entries             │     │ results             │                    │
│  ├─────────────────────┤     ├─────────────────────┤                    │
│  │ id: 6714            │────►│ entry_id: 6714      │ ◄─── 1:1           │
│  │ armband_number: 101 │     │ is_scored: false    │                    │
│  │ dog_call_name: Max  │     │ search_time_sec: 0  │                    │
│  │ entry_status: none  │     │ result_status: pend │                    │
│  │ class_id: 275       │     └─────────────────────┘                    │
│  └─────────────────────┘                                                 │
│          │                                                               │
│          └─► classes.id = 275 (Interior Novice A)                        │
│                  │                                                       │
│                  └─► trials.id = 42 (Trial 1, 2025-10-20)                │
│                          │                                               │
│                          └─► shows.id = 8 (license_key: myK9Q1-...)      │
└──────────────────────────────────────────────────────────────────────────┘
                                  │
                                  ▼
┌──────────────────────────────────────────────────────────────────────────┐
│  STORE: entryStore.ts (Zustand)                                          │
│  ────────────────────────────────────────────────────────────────────────│
│  setEntries: (entries) => {                                              │
│    set({                                                                 │
│      entries,                       ◄─── Update state                   │
│      totalEntries: entries.length,  ◄─── Derived count                  │
│      currentPage: 1                 ◄─── Reset pagination                │
│    });                                                                   │
│  }                                                                       │
│                                                                          │
│  State after update:                                                     │
│  {                                                                       │
│    entries: [                                                            │
│      { id: 6714, armband: 101, callName: 'Max', status: 'none', ... },  │
│      { id: 6715, armband: 102, callName: 'Bella', status: 'checked-in' }│
│    ],                                                                    │
│    totalEntries: 2,                                                      │
│    isLoading: false                                                      │
│  }                                                                       │
└──────────────────────────────────────────────────────────────────────────┘
                                  │
                                  ▼
┌──────────────────────────────────────────────────────────────────────────┐
│  COMPONENT RE-RENDER: ClassDetail.tsx                                    │
│  ────────────────────────────────────────────────────────────────────────│
│  const entries = useEntryStore(state => state.entries);                  │
│                                                                          │
│  return (                                                                │
│    <div>                                                                 │
│      {entries.map(entry => (                                             │
│        <DogCard key={entry.id} entry={entry} />                          │
│      ))}                                                                 │
│    </div>                                                                │
│  );                                                                      │
└──────────────────────────────────────────────────────────────────────────┘
```

---

### 2. Score Submission Flow

```
┌──────────────────────────────────────────────────────────────────────────┐
│  USER ACTION: Judge submits a score on a scoresheet                      │
└──────────────────────────────────────────────────────────────────────────┘
                                  │
                                  ▼
┌──────────────────────────────────────────────────────────────────────────┐
│  COMPONENT: AKCScentWorkScoresheet.tsx                                   │
│  ────────────────────────────────────────────────────────────────────────│
│  const handleSubmit = async () => {                                      │
│    const scoreData = {                                                   │
│      resultText: 'Qualified',                                            │
│      searchTime: '1:32',        ◄─── MM:SS format                        │
│      faultCount: 0,                                                      │
│      areaTimes: ['1:32']        ◄─── Multi-area times                    │
│    };                                                                    │
│                                                                          │
│    await entryService.submitScore(entryId, scoreData);                   │
│    scoringStore.submitScore({ entryId, ...scoreData });                  │
│  };                                                                      │
└──────────────────────────────────────────────────────────────────────────┘
                                  │
                                  ▼
┌──────────────────────────────────────────────────────────────────────────┐
│  SERVICE: entryService.ts                                                │
│  ────────────────────────────────────────────────────────────────────────│
│  export async function submitScore(entryId, scoreData) {                 │
│    // Step 1: Map user-friendly values to DB enums                      │
│    let resultStatus = 'pending';                                         │
│    if (scoreData.resultText === 'Qualified') {                           │
│      resultStatus = 'qualified'; ◄─── UI value → DB ENUM                 │
│    }                                                                     │
│                                                                          │
│    // Step 2: Transform time format                                     │
│    const searchTimeSeconds = convertTimeToSeconds(scoreData.searchTime); │
│    // '1:32' → 92 seconds ◄─── String → Number                          │
│                                                                          │
│    // Step 3: Build DB payload (snake_case)                             │
│    const resultData = {                                                  │
│      entry_id: entryId,                                                  │
│      result_status: resultStatus,      // 'qualified'                    │
│      search_time_seconds: 92,          // numeric                        │
│      is_scored: true,                  // boolean                        │
│      is_in_ring: false,                // boolean                        │
│      scoring_completed_at: new Date().toISOString() // timestamptz       │
│    };                                                                    │
│                                                                          │
│    // Step 4: Handle multi-area times                                   │
│    if (scoreData.areaTimes?.length > 0) {                                │
│      resultData.area1_time_seconds = convertTimeToSeconds(               │
│        scoreData.areaTimes[0]                                            │
│      ); // '1:32' → 92                                                   │
│    }                                                                     │
│                                                                          │
│    // Step 5: Upsert to database                                        │
│    const { error } = await supabase                                      │
│      .from('results')                                                    │
│      .upsert(resultData, {                                               │
│        onConflict: 'entry_id',    ◄─── 1:1 relationship enforcement      │
│        ignoreDuplicates: false                                           │
│      });                                                                 │
│                                                                          │
│    // Step 6: Recalculate placements for entire class                   │
│    await placementService.recalculatePlacementsForClass(                 │
│      classId, licenseKey, isNationals                                    │
│    );                                                                    │
│                                                                          │
│    // Step 7: Update class completion status                            │
│    await checkAndUpdateClassCompletion(classId);                         │
│  }                                                                       │
└──────────────────────────────────────────────────────────────────────────┘
                                  │
                                  ▼
┌──────────────────────────────────────────────────────────────────────────┐
│  DATABASE: Supabase PostgreSQL                                           │
│  ────────────────────────────────────────────────────────────────────────│
│  -- UPSERT operation                                                     │
│  INSERT INTO results (                                                   │
│    entry_id,                                                             │
│    result_status,                                                        │
│    search_time_seconds,                                                  │
│    area1_time_seconds,                                                   │
│    is_scored,                                                            │
│    scoring_completed_at                                                  │
│  ) VALUES (                                                              │
│    6714,                                                                 │
│    'qualified',             ◄─── CHECK constraint validated              │
│    92,                      ◄─── numeric type                            │
│    92,                                                                   │
│    true,                                                                 │
│    '2025-10-25T14:32:00Z'                                                │
│  )                                                                       │
│  ON CONFLICT (entry_id) DO UPDATE ◄─── 1:1 enforcement                   │
│  SET result_status = EXCLUDED.result_status,                             │
│      search_time_seconds = EXCLUDED.search_time_seconds,                 │
│      is_scored = EXCLUDED.is_scored,                                     │
│      updated_at = now();                                                 │
│                                                                          │
│  -- Trigger fires: updated_at auto-set                                  │
│  -- Real-time subscription broadcasts change                            │
└──────────────────────────────────────────────────────────────────────────┘
                                  │
                                  ▼
┌──────────────────────────────────────────────────────────────────────────┐
│  SERVICE: placementService.ts                                            │
│  ────────────────────────────────────────────────────────────────────────│
│  export async function recalculatePlacementsForClass(                    │
│    classId, licenseKey, isNationals                                      │
│  ) {                                                                     │
│    // Fetch all qualified results for this class                        │
│    const results = await supabase                                        │
│      .from('results')                                                    │
│      .select('*, entries!inner(class_id)')                               │
│      .eq('entries.class_id', classId)                                    │
│      .eq('result_status', 'qualified');                                  │
│                                                                          │
│    // Sort by faults (asc), then time (asc)                             │
│    const sorted = results.sort((a, b) => {                               │
│      if (a.total_faults !== b.total_faults) {                            │
│        return a.total_faults - b.total_faults;                           │
│      }                                                                   │
│      return a.search_time_seconds - b.search_time_seconds;               │
│    });                                                                   │
│                                                                          │
│    // Assign placements: 1st, 2nd, 3rd, 4th                             │
│    for (let i = 0; i < sorted.length; i++) {                             │
│      await supabase                                                      │
│        .from('results')                                                  │
│        .update({ final_placement: i + 1 })                               │
│        .eq('entry_id', sorted[i].entry_id);                              │
│    }                                                                     │
│  }                                                                       │
└──────────────────────────────────────────────────────────────────────────┘
                                  │
                                  ▼
┌──────────────────────────────────────────────────────────────────────────┐
│  REAL-TIME SUBSCRIPTION: syncManager.ts                                  │
│  ────────────────────────────────────────────────────────────────────────│
│  supabase                                                                │
│    .channel('results-changes')                                           │
│    .on('postgres_changes',                                               │
│      { event: 'UPDATE', schema: 'public', table: 'results' },            │
│      (payload) => {                                                      │
│        console.log('Real-time update:', payload.new);                    │
│        // Broadcast to subscribers                                      │
│        onUpdate(payload);                                                │
│      }                                                                   │
│    )                                                                     │
│    .subscribe();                                                         │
│                                                                          │
│  Payload received:                                                       │
│  {                                                                       │
│    eventType: 'UPDATE',                                                  │
│    new: {                                                                │
│      entry_id: 6714,                                                     │
│      result_status: 'qualified',                                         │
│      is_scored: true,                                                    │
│      final_placement: 1  ◄─── Updated by placementService                │
│    },                                                                    │
│    old: { ... }                                                          │
│  }                                                                       │
└──────────────────────────────────────────────────────────────────────────┘
                                  │
                                  ▼
┌──────────────────────────────────────────────────────────────────────────┐
│  STORE: entryStore.ts                                                    │
│  ────────────────────────────────────────────────────────────────────────│
│  updateEntry: (entryId, updates) => {                                    │
│    set((state) => ({                                                     │
│      entries: state.entries.map(entry =>                                 │
│        entry.id === entryId                                              │
│          ? { ...entry, ...updates }  ◄─── Merge updates                  │
│          : entry                                                         │
│      )                                                                   │
│    }));                                                                  │
│  }                                                                       │
│                                                                          │
│  // Called via real-time subscription                                   │
│  updateEntry(6714, {                                                     │
│    isScored: true,                                                       │
│    resultText: 'qualified',                                              │
│    searchTime: '1:32',                                                   │
│    placement: 1                                                          │
│  });                                                                     │
└──────────────────────────────────────────────────────────────────────────┘
                                  │
                                  ▼
┌──────────────────────────────────────────────────────────────────────────┐
│  COMPONENT RE-RENDER: DogCard.tsx                                        │
│  ────────────────────────────────────────────────────────────────────────│
│  const entry = useEntryStore(state =>                                    │
│    state.entries.find(e => e.id === 6714)                                │
│  );                                                                      │
│                                                                          │
│  return (                                                                │
│    <div className="dog-card">                                            │
│      <h3>#{entry.armband} - {entry.callName}</h3>                        │
│      <Badge status="scored">Qualified</Badge> ◄─── Updates instantly     │
│      <div className="placement">1st Place</div>  ◄─── Placement shown    │
│    </div>                                                                │
│  );                                                                      │
└──────────────────────────────────────────────────────────────────────────┘
```

---

### 3. Real-time Subscription Flow

```
┌──────────────────────────────────────────────────────────────────────────┐
│  USER ACTION: Gate steward checks in a dog on their device               │
└──────────────────────────────────────────────────────────────────────────┘
                                  │
                                  ▼
┌──────────────────────────────────────────────────────────────────────────┐
│  DEVICE A (Gate Steward): Updates entry status                           │
│  ────────────────────────────────────────────────────────────────────────│
│  await entryService.updateEntryCheckinStatus(6714, 'checked-in');        │
└──────────────────────────────────────────────────────────────────────────┘
                                  │
                                  ▼
┌──────────────────────────────────────────────────────────────────────────┐
│  DATABASE: entries table updated                                         │
│  ────────────────────────────────────────────────────────────────────────│
│  UPDATE entries                                                          │
│  SET entry_status = 'checked-in', updated_at = now()                     │
│  WHERE id = 6714;                                                        │
│                                                                          │
│  ┌─────────────────────┐                                                 │
│  │ entries             │                                                 │
│  ├─────────────────────┤                                                 │
│  │ id: 6714            │                                                 │
│  │ entry_status: none  │ ──► entry_status: 'checked-in' ◄─── CHANGED    │
│  │ updated_at: old     │ ──► updated_at: now()          ◄─── TRIGGER    │
│  └─────────────────────┘                                                 │
│                                                                          │
│  Real-time trigger broadcasts to ALL subscribed clients                  │
└──────────────────────────────────────────────────────────────────────────┘
                                  │
                     ┌────────────┴────────────┐
                     │                         │
                     ▼                         ▼
┌────────────────────────────┐   ┌────────────────────────────┐
│ DEVICE B (Judge's Tablet)  │   │ DEVICE C (TV Display)      │
│ ────────────────────────── │   │ ────────────────────────── │
│ syncManager receives:      │   │ syncManager receives:      │
│                            │   │                            │
│ {                          │   │ {                          │
│   eventType: 'UPDATE',     │   │   eventType: 'UPDATE',     │
│   table: 'entries',        │   │   table: 'entries',        │
│   new: {                   │   │   new: {                   │
│     id: 6714,              │   │     id: 6714,              │
│     entry_status:          │   │     entry_status:          │
│       'checked-in'         │   │       'checked-in'         │
│   },                       │   │   },                       │
│   old: {                   │   │   old: {                   │
│     entry_status: 'none'   │   │     entry_status: 'none'   │
│   }                        │   │   }                        │
│ }                          │   │ }                          │
│                            │   │                            │
│ ↓ Callback triggers        │   │ ↓ Callback triggers        │
│                            │   │                            │
│ entryStore.updateEntry(    │   │ entryStore.updateEntry(    │
│   6714,                    │   │   6714,                    │
│   { status: 'checked-in' } │   │   { status: 'checked-in' } │
│ );                         │   │ );                         │
│                            │   │                            │
│ ↓ Component re-renders     │   │ ↓ Component re-renders     │
│                            │   │                            │
│ <DogCard>                  │   │ <TVDisplay>                │
│   <Badge>Checked In</Badge>│   │   ✅ #101 Max - Ready      │
│ </DogCard>                 │   │ </TVDisplay>               │
└────────────────────────────┘   └────────────────────────────┘
```

---

## 🗂️ Store Inventory

### Core Stores

| Store | Location | Purpose | Persistence |
|-------|----------|---------|-------------|
| `entryStore` | [src/stores/entryStore.ts](../src/stores/entryStore.ts) | Entry data, filters, pagination | None (session-only) |
| `scoringStore` | [src/stores/scoringStore.ts](../src/stores/scoringStore.ts) | Active scoring sessions, timer state | LocalStorage (persist middleware) |
| `offlineQueueStore` | [src/stores/offlineQueueStore.ts](../src/stores/offlineQueueStore.ts) | Offline sync queue | LocalStorage |
| `nationalsStore` | [src/stores/nationalsStore.ts](../src/stores/nationalsStore.ts) | Nationals-specific scoring state | None |
| `timerStore` | [src/stores/timerStore.ts](../src/stores/timerStore.ts) | Multi-timer management | None |
| `announcementStore` | [src/stores/announcementStore.ts](../src/stores/announcementStore.ts) | Push notification state | None |

---

## 🛠️ Service Inventory

### Core Services

| Service | Location | Responsibilities |
|---------|----------|------------------|
| `entryService` | [src/services/entryService.ts](../src/services/entryService.ts) | Entry CRUD, score submission, real-time subscriptions |
| `placementService` | [src/services/placementService.ts](../src/services/placementService.ts) | Placement calculation, tie-breaking logic |
| `authService` | [src/services/authService.ts](../src/services/authService.ts) | Passcode-based authentication, role derivation |
| `nationalsScoring` | [src/services/nationalsScoring.ts](../src/services/nationalsScoring.ts) | Nationals-specific scoring rules |
| `syncManager` | [src/services/syncManager.ts](../src/services/syncManager.ts) | Real-time subscription management |
| `announcementService` | [src/services/announcementService.ts](../src/services/announcementService.ts) | Push notification CRUD |

---

## 🔄 Data Transformation Pipeline

### Read Flow (Database → UI)

```
┌──────────────────────────────────────────────────────────────────────────┐
│  STEP 1: Database Query (snake_case columns)                             │
└──────────────────────────────────────────────────────────────────────────┘
  {
    id: 6714,
    armband_number: 101,          ◄─── PostgreSQL column names
    dog_call_name: 'Max',
    entry_status: 'checked-in',
    class_id: 275
  }
                                  │
                                  ▼
┌──────────────────────────────────────────────────────────────────────────┐
│  STEP 2: Service Layer Transformation (camelCase properties)             │
└──────────────────────────────────────────────────────────────────────────┘
  {
    id: 6714,
    armband: 101,                 ◄─── Mapped to camelCase
    callName: 'Max',
    status: 'checked-in',         ◄─── ENUM validated
    classId: 275
  }
                                  │
                                  ▼
┌──────────────────────────────────────────────────────────────────────────┐
│  STEP 3: Store Updates State (Entry interface)                           │
└──────────────────────────────────────────────────────────────────────────┘
  entryStore.setEntries([...])
                                  │
                                  ▼
┌──────────────────────────────────────────────────────────────────────────┐
│  STEP 4: Component Renders (React)                                       │
└──────────────────────────────────────────────────────────────────────────┘
  <DogCard entry={entry} />
```

### Write Flow (UI → Database)

```
┌──────────────────────────────────────────────────────────────────────────┐
│  STEP 1: Component Submits Data (user-friendly values)                   │
└──────────────────────────────────────────────────────────────────────────┘
  {
    resultText: 'Qualified',      ◄─── Human-readable
    searchTime: '1:32',           ◄─── MM:SS format
    faultCount: 0
  }
                                  │
                                  ▼
┌──────────────────────────────────────────────────────────────────────────┐
│  STEP 2: Service Transforms (DB-compatible format)                       │
└──────────────────────────────────────────────────────────────────────────┘
  {
    result_status: 'qualified',   ◄─── ENUM value
    search_time_seconds: 92,      ◄─── Numeric (seconds)
    total_faults: 0
  }
                                  │
                                  ▼
┌──────────────────────────────────────────────────────────────────────────┐
│  STEP 3: Database Insert/Update (PostgreSQL)                             │
└──────────────────────────────────────────────────────────────────────────┘
  INSERT INTO results (entry_id, result_status, search_time_seconds, ...)
  VALUES (6714, 'qualified', 92, ...)
  ON CONFLICT (entry_id) DO UPDATE ...
                                  │
                                  ▼
┌──────────────────────────────────────────────────────────────────────────┐
│  STEP 4: Real-time Broadcast (Supabase)                                  │
└──────────────────────────────────────────────────────────────────────────┘
  All subscribed clients receive UPDATE event
```

---

## 🚨 Architectural Rules

### ✅ DO

1. **Always call services from components/pages**
   ```typescript
   // ✅ CORRECT
   const entries = await entryService.getClassEntries(classId, licenseKey);
   entryStore.setEntries(entries);
   ```

2. **Use stores for client-side state only**
   ```typescript
   // ✅ CORRECT
   const filters = useEntryStore(state => state.filters);
   const setFilter = useEntryStore(state => state.setFilter);
   ```

3. **Transform data in services, not components**
   ```typescript
   // ✅ CORRECT (in service)
   const searchTime = secondsToTimeString(row.search_time_seconds);
   ```

4. **Subscribe to real-time via syncManager**
   ```typescript
   // ✅ CORRECT
   import { syncManager } from '@/services/syncManager';
   syncManager.subscribeToUpdates('entries', filter, callback);
   ```

---

### ❌ DON'T

1. **Don't call Supabase directly from components**
   ```typescript
   // ❌ WRONG
   const { data } = await supabase.from('entries').select('*');
   ```

2. **Don't store server data in stores without service layer**
   ```typescript
   // ❌ WRONG
   const rawData = await fetchFromAPI();
   entryStore.setEntries(rawData); // No transformation!
   ```

3. **Don't transform data in components**
   ```typescript
   // ❌ WRONG (in component)
   const searchTime = `${Math.floor(seconds / 60)}:${seconds % 60}`;
   ```

4. **Don't bypass multi-tenant filtering**
   ```typescript
   // ❌ WRONG (missing license_key filter)
   const { data } = await supabase.from('entries').eq('class_id', 275);
   ```

---

## 📚 Related Documentation

- [Database ERD](./DATABASE_ERD.md) - Entity relationship diagram
- [Type Mapping](./TYPE_MAPPING.md) - TypeScript ↔ PostgreSQL mappings
- [CLAUDE.md](../CLAUDE.md) - Development guide

---

**Last Updated:** 2025-10-25
**Architecture Version:** Three-tier (Stores → Services → Database)
