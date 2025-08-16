# myK9Q Scoring Interface Specifications
## Unified Design for Mobile and Web Scoring

### Overview
This document defines the exact specifications for the scoring interface that will be implemented identically in both myK9Q (React Native mobile app) and myK9Show (React web app). The interface is optimized for touch input and quick scoring at ringside.

---

## Core Interface Components

### 1. Header Bar
**Purpose**: Show current context and navigation

```
┌──────────────────────────────────────────┐
│ ← Back  |  Open B - Ring 2  |  Menu ≡   │
│         Judge: Jane Smith                │
└──────────────────────────────────────────┘
```

**Specifications**:
- Height: 120px (mobile) / 80px (web)
- Background: Primary brand color with 95% opacity
- Font: System font, 18pt bold for class/ring
- Back button: 44x44px touch target
- Menu button: Opens judge options (logout, settings, help)

### 2. Competitor Card
**Purpose**: Display current dog being scored

```
┌──────────────────────────────────────────┐
│  ┌────────┐                              │
│  │ [Photo]│  #42 · Max                   │
│  │        │  Golden Retriever · Male · 3y │
│  └────────┘  Owner: John Smith           │
│              Handler: Jane Doe            │
└──────────────────────────────────────────┘
```

**Specifications**:
- Height: 140px minimum
- Photo: 100x100px, rounded corners (8px)
- Armband number: 24pt bold, high contrast
- Dog name: 20pt semibold
- Breed/details: 16pt regular, secondary color
- Padding: 16px all sides
- Background: White with subtle shadow

### 3. Scoring Grid
**Purpose**: Primary scoring interface

#### 3A. Standard Point Scoring
```
┌──────────────────────────────────────────┐
│  Heeling (40 pts)                        │
│  ┌─┬─┬─┬─┬─┬─┬─┬─┬─┬─┐                 │
│  │0│5│10│15│20│25│30│35│38│40│          │
│  └─┴─┴─┴─┴─┴─┴─┴─┴─┴─┘                 │
│                                          │
│  Recall (30 pts)                         │
│  ┌─┬─┬─┬─┬─┬─┬─┐                        │
│  │0│5│10│15│20│25│30│                   │
│  └─┴─┴─┴─┴─┴─┴─┘                        │
└──────────────────────────────────────────┘
```

**Specifications**:
- Button size: Minimum 44x44px
- Button spacing: 4px gap
- Selected state: Primary color background, white text
- Unselected: Light gray background
- Font size: 16pt for points
- Exercise name: 18pt semibold
- Total points shown in parentheses

#### 3B. Qualifying Score Toggle
```
┌──────────────────────────────────────────┐
│  Overall Performance                      │
│  ┌────────────┬────────────┬────────────┐│
│  │     NQ     │     Q      │    Q+      ││
│  └────────────┴────────────┴────────────┘│
└──────────────────────────────────────────┘
```

**Specifications**:
- Button height: 60px
- Equal width distribution
- NQ: Red background when selected
- Q: Green background when selected
- Q+: Gold background when selected

#### 3C. Time-Based Scoring
```
┌──────────────────────────────────────────┐
│  Course Time                              │
│  ┌──────────────────────────────────────┐│
│  │         02:34.56                      ││
│  └──────────────────────────────────────┘│
│  [Start/Stop] [+Fault] [Reset]           │
└──────────────────────────────────────────┘
```

**Specifications**:
- Timer display: 48pt monospace font
- Control buttons: 50px height
- Start/Stop: Green/Red toggle
- Fault button: Adds 5 seconds
- Large touch targets for gloved hands

### 4. Comments Section
**Purpose**: Add judge's notes

```
┌──────────────────────────────────────────┐
│  Comments                                 │
│  ┌──────────────────────────────────────┐│
│  │ Tap to add comments...                ││
│  └──────────────────────────────────────┘│
│  [🎤 Voice Note] [📷 Photo]              │
└──────────────────────────────────────────┘
```

**Specifications**:
- Text area: Minimum 3 lines (100px)
- Font: 16pt for input
- Voice note: 44x44px button
- Photo: 44x44px button
- Auto-save on blur

### 5. Navigation Controls
**Purpose**: Move between competitors

```
┌──────────────────────────────────────────┐
│  ┌──────────┬─────────────┬─────────────┐│
│  │ Previous │  Save Score  │    Next     ││
│  │   (41)   │              │    (43)     ││
│  └──────────┴─────────────┴─────────────┘│
└──────────────────────────────────────────┘
```

**Specifications**:
- Button height: 60px
- Save button: 50% width, primary color
- Previous/Next: 25% width each
- Show armband numbers in parentheses
- Disabled state when at first/last
- Swipe gestures also supported

### 6. Quick Actions Bar
**Purpose**: Common judge actions

```
┌──────────────────────────────────────────┐
│ [Absent] [Excused] [DQ] [Move-up]        │
└──────────────────────────────────────────┘
```

**Specifications**:
- Height: 50px
- Button padding: 12px horizontal
- Absent/Excused: Yellow when active
- DQ: Red when active
- Confirmation required for DQ

---

## Interaction Patterns

### Touch Gestures
- **Swipe left**: Next competitor
- **Swipe right**: Previous competitor
- **Long press**: Show tooltip/help
- **Pinch**: Zoom photo
- **Double tap score**: Quick select

### Keyboard Shortcuts (Web/Tablet with keyboard)
- `Arrow Left/Right`: Navigate competitors
- `Number keys`: Quick score entry
- `Enter`: Save and next
- `Space`: Start/stop timer
- `Cmd/Ctrl + S`: Save current

### Auto-Save Behavior
- Save on navigate away
- Save every 30 seconds
- Visual indicator when saving
- Queue for sync if offline

---

## Responsive Breakpoints

### Phone (< 768px)
- Stack elements vertically
- Reduce font sizes by 2pt
- Hide secondary information
- Full-width buttons

### Tablet (768px - 1024px)
- Optimal layout (as shown above)
- All features visible
- Touch-optimized spacing

### Desktop (> 1024px)
- Add keyboard hints
- Show more competitors in sidebar
- Display running order preview
- Multi-panel view option

---

## Color Scheme

```css
:root {
  --primary: #007AFF;      /* iOS blue */
  --success: #34C759;      /* Green */
  --warning: #FF9500;      /* Orange */
  --danger: #FF3B30;       /* Red */
  --background: #F2F2F7;   /* Light gray */
  --surface: #FFFFFF;      /* White */
  --text-primary: #000000; /* Black */
  --text-secondary: #8E8E93; /* Gray */
  --border: #C6C6C8;      /* Border gray */
}
```

---

## Offline Mode Indicators

### Connection Status Badge
```
┌──────────────────────┐
│ 🟢 Online - Synced   │  // Green dot
│ 🟡 Offline - 3 pending│  // Yellow dot
│ 🔴 Sync Error        │  // Red dot
└──────────────────────┘
```

Position: Top right corner
Size: Auto-width, 30px height

### Sync Queue Indicator
Shows number of pending scores when offline
Tap to view detailed queue

---

## Accessibility Requirements

### WCAG 2.1 AA Compliance
- Minimum contrast ratio: 4.5:1
- Touch targets: 44x44px minimum
- Focus indicators visible
- Screen reader support
- Voice control compatible

### Font Scaling
- Support 85% to 200% scaling
- Maintain layout integrity
- Preserve touch target sizes

### Alternative Input
- External keyboard support
- Switch control compatible
- Voice control enabled

---

## Performance Specifications

### Response Times
- Score selection: < 100ms
- Navigation: < 200ms
- Save operation: < 500ms
- Photo load: < 1 second

### Memory Usage
- Max 100MB active memory
- Cache last 10 competitors
- Lazy load images
- Progressive enhancement

### Battery Optimization
- Dark mode option
- Reduce animations setting
- Screen wake lock during scoring
- Background sync intervals

---

## Error Handling

### Network Errors
```
┌──────────────────────────────────────────┐
│ ⚠️ Offline Mode                          │
│ Scores will sync when connected          │
│ [Continue Offline] [Retry]               │
└──────────────────────────────────────────┘
```

### Validation Errors
```
┌──────────────────────────────────────────┐
│ ❌ Invalid Score                         │
│ Score cannot exceed maximum points (40)  │
│ [OK]                                      │
└──────────────────────────────────────────┘
```

### Sync Conflicts
```
┌──────────────────────────────────────────┐
│ ⚠️ Score Conflict                        │
│ Another judge has scored this entry      │
│ Your score: 185                          │
│ Other score: 190                         │
│ [Use Mine] [Use Theirs] [Compare]        │
└──────────────────────────────────────────┘
```

---

## Platform-Specific Adaptations

### iOS
- Use native iOS controls where appropriate
- Support iOS gestures (edge swipe)
- Haptic feedback on selection
- Face ID for authentication

### Android
- Material Design components
- Android-specific animations
- Support back button navigation
- Fingerprint authentication

### Web
- Keyboard navigation emphasis
- Hover states for mouse users
- Print-friendly score sheets
- Multi-tab support

---

Last Updated: 2025-08-12
Version: 1.0.0