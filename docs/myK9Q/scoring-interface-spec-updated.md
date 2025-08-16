# myK9Q Scoring Interface Specifications (Updated)
## Based on Flutter App Analysis

### Overview
This document defines the exact specifications for the scoring interface based on analysis of the existing Flutter myK9Q app. The interface supports 7 competition types with proven UX patterns optimized for judges at ringside.

---

## Competition Types Supported

Based on Flutter analysis, the interface must support:
1. **AKC Scent Work** - Multi-area timing (1-3 areas)
2. **AKC Scent Work National** - Enhanced rules
3. **AKC Fast CAT** - Speed scoring with health checks  
4. **UKC Obedience** - Point-based scoring (decimal)
5. **UKC Rally** - Fault counting system
6. **UKC Nosework** - Time + faults combination
7. **ASCA Scent** - Specialty organization rules

---

## Core Interface Components

### 1. App Header
**Purpose**: Show competition context and navigation

```
┌──────────────────────────────────────────────────┐
│ ← Back  |  UKC Obedience Scoresheet  |  ☰ Menu  │
│         Ring 2 • Judge: Jane Smith              │
└──────────────────────────────────────────────────┘
```

**Specifications** (from Flutter):
- Height: 120px for mobile visibility
- Background: App theme color (`FlutterFlowTheme.of(context).appBar`)
- Title: Competition type + "Scoresheet"
- White text on dark background for contrast
- Back button: Full 60px touch target with haptic feedback
- Font: 20pt medium weight system font

### 2. Competitor Information Card
**Purpose**: Display current competitor being scored

```
┌──────────────────────────────────────────────────┐
│  Armband #42                    [Progress 3/15]  │
│  ┌────────┐                                      │
│  │ [Photo]│  Champion Max                        │
│  │        │  Golden Retriever • Male             │
│  └────────┘  Handler: Jane Smith                 │
│              Owner: John Doe                     │
└──────────────────────────────────────────────────┘
```

**Specifications** (from Flutter data model):
- Fields from `ViewEntryClassJoinDistinctRow`:
  - `armband` (int) - Competitor number
  - `callName` (String) - Dog's call name
  - `breed` (String) - Dog breed
  - `handler` (String) - Handler name
- Progress indicator showing current position in class
- Photo optional (may be null in database)
- High contrast text for outdoor visibility

### 3. Timer Interface (For Timed Events)
**Purpose**: Precision timing for Scent Work, Fast CAT

```
┌──────────────────────────────────────────────────┐
│  Search Time Limit: 03:00                       │
│  ┌────────────────────────────────────────────┐  │
│  │                02:34.56                    │  │
│  │  ████████████████░░░░░░░  85%              │  │
│  └────────────────────────────────────────────┘  │
│  [▶ Start] [⏸ Pause] [⏹ Stop] [🔄 Reset]      │
└──────────────────────────────────────────────────┘
```

**Specifications** (from Flutter `stop_watch_timer`):
- **Timer precision**: Milliseconds (MM:SS.ms format)
- **Display font**: 48pt monospace for readability
- **Progress bar**: Visual countdown (`percent_indicator`)
- **Audio alerts**: Sound when time expires (`just_audio`)
- **Multi-area support**: 1-3 simultaneous timers for Scent Work
- **Control buttons**: 60px height, haptic feedback
- **Time limits**: Read from `timeLimit`, `timeLimit2`, `timeLimit3` fields

### 4. Scoring Input Methods

#### 4A. Point-Based Scoring (UKC Obedience)
```
┌──────────────────────────────────────────────────┐
│  Final Score                                     │
│  ┌──────────────────────────────────────────────┐│
│  │                185.5                         ││
│  └──────────────────────────────────────────────┘│
│  Format: ###.# (Max 200.0)                      │
└──────────────────────────────────────────────────┘
```

**Specifications** (from Flutter `MaskTextInputFormatter`):
- Input mask: `###.#` (three digits, one decimal)
- Large text field: 48pt numeric font
- Automatic decimal formatting
- Validation: Max 200.0 points

#### 4B. Time-Based Scoring (Scent Work)
```
┌──────────────────────────────────────────────────┐
│  Area 1 Time                                     │
│  ┌──────────────────────────────────────────────┐│
│  │              01:23.45                        ││
│  └──────────────────────────────────────────────┘│
│  Area 2 Time                                     │
│  ┌──────────────────────────────────────────────┐│
│  │              02:15.67                        ││
│  └──────────────────────────────────────────────┘│
└──────────────────────────────────────────────────┘
```

**Specifications** (from Flutter multi-area logic):
- **Areas**: 1-3 based on `areas` field in database
- **Format**: MM:SS.ms with millisecond precision
- **Auto-populate**: Timer results fill fields automatically
- **Manual entry**: Allow judge corrections
- **Time limits**: Different per area (from `timeLimit` fields)

#### 4C. Fault Counting (Rally)
```
┌──────────────────────────────────────────────────┐
│  Faults                                          │
│  ┌───────────────┬─────────────┬─────────────────┐│
│  │      [-]      │      3      │      [+]       ││
│  └───────────────┴─────────────┴─────────────────┘│
│  Station Faults: 1 • Course Faults: 2           │
└──────────────────────────────────────────────────┘
```

**Specifications** (from Flutter increment/decrement):
- Large +/- buttons: 60px height
- Current fault count: 24pt center display
- Separate tracking for different fault types
- Haptic feedback on tap
- Reset to zero capability

#### 4D. Qualifying Results (Binary)
```
┌──────────────────────────────────────────────────┐
│  Result                                          │
│  ┌──────────┬──────────┬──────────┬──────────────┐│
│  │    Q     │   NQ     │   EX     │     DQ       ││
│  │ (Green)  │  (Red)   │(Yellow)  │   (Red)      ││
│  └──────────┴──────────┴──────────┴──────────────┘│
└──────────────────────────────────────────────────┘
```

**Specifications** (from Flutter `FlutterFlowChoiceChips`):
- **Q**: Qualifying - Green background when selected
- **NQ**: Non-qualifying - Red background when selected  
- **EX**: Excused - Yellow/orange background when selected
- **DQ**: Disqualified - Red background when selected
- Button height: 60px for easy selection
- Single selection only (radio button behavior)

### 5. Health Check Interface (Fast CAT)
**Purpose**: Mandatory health verification for speed events

```
┌──────────────────────────────────────────────────┐
│  Pre-Run Health Check                            │
│  ┌────────────────────────────────────────────┐  │
│  │  ✅ Dog appears healthy and ready to run  │  │
│  │  ✅ No visible lameness or distress       │  │
│  │  ✅ Handler confirms dog's condition      │  │
│  └────────────────────────────────────────────┘  │
│  Judge Comments (Optional):                      │
│  ┌────────────────────────────────────────────┐  │
│  │  All systems go - dog eager and alert     │  │
│  └────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────┘
```

**Specifications** (from Flutter FastCAT logic):
- **Required fields**: Health status checkboxes
- **Timestamp**: Auto-recorded when checked (`fastcat_health_timestamp`)
- **Comments**: Optional text area (`fastcat_health_comment`)
- **Validation**: Must be completed before scoring
- **Database fields**: `fastcatHealthStatus`, `fastcatHealthTimestamp`, `fastcatHealthComment`

### 6. Action Buttons
**Purpose**: Common judge actions during scoring

```
┌──────────────────────────────────────────────────┐
│  [🚫 Absent] [⚠️ Excused] [❌ DQ] [📝 Notes]   │
└──────────────────────────────────────────────────┘
```

**Specifications** (from Flutter error states):
- **Button height**: 50px with rounded corners
- **Haptic feedback**: `HapticFeedback.heavyImpact()` on critical actions
- **Error states**: Visual indicators when validation fails
- **Confirmation**: DQ requires confirmation dialog
- **State tracking**: Updates `FFAppState` error flags

### 7. Score Confirmation Dialog
**Purpose**: Final review before submission

```
┌──────────────────────────────────────────────────┐
│  Confirm Score Submission                        │
│  ┌────────────────────────────────────────────┐  │
│  │  Armband: #42                              │  │
│  │  Dog: Champion Max                         │  │
│  │  Handler: Jane Smith                       │  │
│  │  ────────────────────────────────────────  │  │
│  │  Result: Q                                 │  │
│  │  Score: 185.5                             │  │
│  │  Time: 01:23.45                          │  │
│  │  ────────────────────────────────────────  │  │
│  │  Notes: Excellent heeling                 │  │
│  └────────────────────────────────────────────┘  │
│  [Cancel] [Submit Score]                        │
└──────────────────────────────────────────────────┘
```

**Specifications** (from Flutter confirmation components):
- **Modal dialog**: Blocks interaction until resolved
- **Summary display**: All key scoring data
- **Animation**: Scale effect on appearance
- **Button styling**: Submit button uses primary color
- **Keyboard shortcut**: Enter to submit (web)

### 8. Navigation Controls
**Purpose**: Move between competitors in class

```
┌──────────────────────────────────────────────────┐
│  ┌──────────────┬──────────────┬──────────────────┐│
│  │   Previous   │     Save     │      Next        ││
│  │    (#41)     │              │     (#43)        ││
│  └──────────────┴──────────────┴──────────────────┘│
└──────────────────────────────────────────────────┘
```

**Specifications** (from Flutter navigation logic):
- **Previous/Next**: Show adjacent armband numbers
- **Save button**: 50% width, primary color
- **Auto-save**: On navigation away from entry
- **Disabled states**: Gray out when at first/last entry
- **Swipe gestures**: Left/right navigation support

---

## Competition-Specific Interfaces

### AKC Scent Work Interface
```
┌──────────────────────────────────────────────────┐
│  Multi-Area Scent Work Scoresheet               │
│  ──────────────────────────────────────────────  │
│  Area 1: Interior  [02:34.56] [✅ Found]        │
│  Area 2: Exterior  [01:45.23] [❌ Not Found]    │
│  Area 3: Vehicle   [00:30.12] [✅ Found]        │
│  ──────────────────────────────────────────────  │
│  Total Time: 04:49.91                           │
│  Correct: 2/3 • Result: NQ                      │
└──────────────────────────────────────────────────┘
```

### UKC Obedience Interface
```
┌──────────────────────────────────────────────────┐
│  UKC Obedience Scoresheet                       │
│  ──────────────────────────────────────────────  │
│  Final Score:                                    │
│  ┌────────────────────────────────────────────┐  │
│  │                185.5                       │  │
│  └────────────────────────────────────────────┘  │
│  ──────────────────────────────────────────────  │
│  Result: [Q] [NQ] [EX] [DQ]                     │
│  Reason: ________________________               │
└──────────────────────────────────────────────────┘
```

### Fast CAT Interface
```
┌──────────────────────────────────────────────────┐
│  Fast CAT Scoresheet                             │
│  ──────────────────────────────────────────────  │
│  Health Check: ✅ Complete                      │
│  ──────────────────────────────────────────────  │
│  Run Time: 00:15.234                            │
│  Speed: 23.45 MPH                               │
│  Handicap: Senior (7+ years)                    │
│  ──────────────────────────────────────────────  │
│  Result: [Complete] [No Finish] [DQ]            │
└──────────────────────────────────────────────────┘
```

---

## Real-time Features

### Live Updates (Supabase Subscriptions)
```typescript
// From Flutter: Real-time entry updates
await actions.subscribe('tbl_entry_queue', () => {
  // Update entry list when changes occur
  safeSetState(() => _model.requestCompleter2 = null);
});

await actions.subscribe('tbl_announcements', () => {
  // Show notification dot for announcements
  FFAppState().asUnreadDot = true;
  playNotificationSound();
});
```

### Connection Status Indicator
```
┌──────────────────────────────────────────────────┐
│  🟢 Connected • Last sync: 2s ago               │
│  🟡 Offline • 3 scores queued                   │  
│  🔴 Connection Error • Tap to retry             │
└──────────────────────────────────────────────────┘
```

---

## Offline Mode Specifications

### Queue Management (from Flutter)
```dart
// Entry marked as "in_ring" for offline tracking
await TblEntryQueueTable().update(
  data: {'in_ring': false},
  matchingRows: (rows) => rows.eqOrNull('id', widget.ppEntryRow?.id)
);
```

### Data Persistence
- **Local storage**: SharedPreferences for app state
- **Queue storage**: SQLite for offline scores
- **Auto-sync**: When connection restored
- **Conflict resolution**: Timestamp-based with judge override

---

## Audio and Haptic Feedback

### Audio Alerts (from Flutter `just_audio`)
- **Timer expiration**: Custom alert sound
- **Score submission**: Confirmation beep  
- **Error states**: Warning sound
- **Volume control**: 50% by default, user adjustable

### Haptic Feedback (from Flutter `HapticFeedback`)
- **Light impact**: Button taps, navigation
- **Heavy impact**: Critical actions (DQ, submit)
- **Selection**: Choice chips, toggles

---

## Accessibility Requirements

### Visual Accessibility
- **High contrast**: White text on dark backgrounds
- **Large touch targets**: Minimum 44x44px (iOS) / 48x48dp (Android)
- **Font scaling**: Support 85%-200% system scaling
- **Dark mode**: Supported via SharedPreferences

### Motor Accessibility  
- **Large buttons**: Optimized for gloved hands
- **Gesture alternatives**: Every swipe has button equivalent
- **Voice control**: Compatible with platform voice systems

### Cognitive Accessibility
- **Clear hierarchy**: Visual importance matches task priority
- **Consistent patterns**: Same actions work identically across screens
- **Error prevention**: Validation before submission
- **Recovery paths**: Undo/edit capabilities

---

## Performance Specifications

### Timer Precision
- **Accuracy**: Millisecond precision maintained
- **Multiple timers**: Up to 3 simultaneous (Scent Work)
- **Background operation**: Continues when app backgrounded
- **Memory efficient**: No leaks during long sessions

### Data Synchronization
- **Real-time**: <2 second latency for live updates
- **Offline queue**: Unlimited local storage
- **Batch sync**: Multiple scores uploaded together
- **Retry logic**: Exponential backoff for failures

---

## Testing Requirements

### Competition Type Testing
Each scoresheet must be tested with:
- [ ] Valid score submission
- [ ] Invalid input handling  
- [ ] Timer functionality (where applicable)
- [ ] Real-time updates
- [ ] Offline mode operation

### Integration Testing
- [ ] Supabase database synchronization
- [ ] Multi-judge coordination
- [ ] Placement calculation accuracy
- [ ] Audio alert functionality
- [ ] Haptic feedback responsiveness

---

## Migration Notes

### From Flutter to React Native
- **Timer library**: Replace `stop_watch_timer` with React Native equivalent
- **Audio**: Replace `just_audio` with `react-native-sound`
- **Haptics**: Use `react-native-haptic-feedback`
- **State management**: Replace Provider with Zustand
- **Supabase**: Use `@supabase/supabase-js` (already used in myK9Show)

### Data Compatibility
All database schemas and APIs remain identical to ensure seamless integration with the existing Flutter app and myK9Show web application.

---

Last Updated: 2025-08-12 (Based on Flutter Analysis)
Version: 2.0.0