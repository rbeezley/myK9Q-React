# Status Color & Icon Standardization

## Overview

This document defines the standardized system for status colors and icons across the entire application.

## Single Source of Truth

**File**: [`src/constants/statusConfig.ts`](../src/constants/statusConfig.ts)

This file contains ALL status definitions with:
- Status values (e.g., `'checked-in'`, `'in-progress'`)
- Display labels (e.g., `'Checked-in'`, `'In Progress'`)
- CSS variable references (e.g., `'--checkin-checked-in'`)
- Icon names from Lucide React (e.g., `'Check'`, `'Target'`)
- Descriptions for documentation

## Status Categories

### 1. Class Status (Trial/Class Progress)

Used for: Class state, trial progress, scheduling

| Status | Label | Color | Icon | Description |
|--------|-------|-------|------|-------------|
| `setup` | Setup | Orange (#f97316) | Settings | Class is being set up |
| `briefing` | Briefing | Teal (#14b8a6) | Users | Judge briefing exhibitors |
| `break` | Break | Purple (#8b5cf6) | Coffee | Class on break |
| `start-time` | Start Time | Purple (#6610f2) | Clock | Class scheduled to start |
| `in-progress` | In Progress | Blue (primary) | Play | Class actively running |
| `completed` | Completed | Green (#10b981) | CheckCircle | Class finished |

### 2. Check-in Status (Individual Entry Status)

Used for: Entry check-in flow, exhibitor tracking

**Traffic Light System Progression:**
Gray → Green → Orange → Red → Purple → Blue

| Status | Label | Color | Icon | Description |
|--------|-------|-------|------|-------------|
| `no-status` | No Status | Gray (#6b7280) | Circle | Dog has not checked in yet |
| `checked-in` | Checked-in | Green (#10b981) | Check | Dog is ready to compete |
| `conflict` | Conflict | Orange (#f97316) | AlertTriangle | Dog entered in multiple classes |
| `pulled` | Pulled | Red (#dc3545) | XCircle | Dog has been withdrawn from class |
| `at-gate` | At Gate | Purple (#6f42c1) | Star | Dog is waiting at the ring entrance |
| `come-to-gate` | Come to Gate | Purple (#6f42c1) | Bell | Gate steward calling exhibitor |
| `in-ring` | In Ring | Blue (#3b82f6 / #60a5fa) | Target | Dog is currently competing in the ring |
| `completed` | Completed | Green (#10b981) | CheckCircle | Dog has finished competing (no score) |

### 3. Result Status (Scoring Results)

Used for: Final results, placement, qualifications

| Status | Label | Short | Color | Description |
|--------|-------|-------|-------|-------------|
| `qualified` | Qualified | Q | Green (#10b981) | Qualified run |
| `not-qualified` | Not Qualified | NQ | Red (#ef4444) | Did not qualify |
| `excused` | Excused | EX | Yellow (#fef3c7) | Excused by judge |
| `absent` | Absent | ABS | Purple (#7c3aed) | Did not show up |
| `withdrawn` | Withdrawn | WD | Purple (#7c3aed) | Withdrawn by handler |

## CSS Variables

All colors are defined in [`src/styles/design-tokens.css`](../src/styles/design-tokens.css) with automatic light/dark mode support.

### Naming Convention

**Class Status:**
- `--status-{name}` - Background color
- `--status-{name}-text` - Text color

**Check-in Status:**
- `--checkin-{name}` - Background color
- `--checkin-{name}-text` - Text color

**Result Status:**
- `--status-{name}` or `--token-result-{name}` - Background color
- `--status-{name}-text` - Text color

## Icon System

All icons are from [Lucide React](https://lucide.dev/).

### Icon Mapping

**Class Status Icons:**
- Setup → Settings
- Briefing → Users
- Break → Coffee
- Start Time → Clock
- In Progress → Play
- Completed → CheckCircle

**Check-in Status Icons:**
- No Status → Circle
- Checked-in → Check
- Conflict → AlertTriangle
- Pulled → XCircle
- At Gate → Star
- Come to Gate → Bell
- In Ring → Target (bullseye)
- Completed → CheckCircle

## Usage Guidelines

### ✅ DO

1. **Always import from statusConfig.ts:**
   ```typescript
   import { CHECKIN_STATUS, getCheckinStatus } from '@/constants/statusConfig';

   const status = CHECKIN_STATUS.CHECKED_IN;
   console.log(status.label); // "Checked-in"
   console.log(status.icon);  // "Check"
   ```

2. **Use CSS variables for colors:**
   ```css
   .badge {
     background: var(--checkin-checked-in);
     color: var(--checkin-checked-in-text);
   }
   ```

3. **Use icon name from config:**
   ```typescript
   import { Check } from 'lucide-react';
   const status = CHECKIN_STATUS.CHECKED_IN;
   // Render: <Check /> based on status.icon
   ```

### ❌ DON'T

1. **Don't hardcode colors:**
   ```css
   /* WRONG */
   .badge { background: #10b981; }

   /* RIGHT */
   .badge { background: var(--checkin-checked-in); }
   ```

2. **Don't hardcode icon names:**
   ```typescript
   // WRONG
   if (status === 'checked-in') return <Check />;

   // RIGHT
   const statusConfig = getCheckinStatus(status);
   // Use statusConfig.icon
   ```

3. **Don't create duplicate status definitions:**
   - All status definitions must be in `statusConfig.ts`
   - No local constants for colors or labels

## Migration Strategy

To standardize existing code:

1. **Identify hardcoded colors**
   - Search for hex codes: `#[0-9a-f]{6}`
   - Replace with CSS variables

2. **Identify hardcoded icons**
   - Search for icon switch statements
   - Replace with statusConfig lookup

3. **Update components**
   - Import from `statusConfig.ts`
   - Use config objects instead of hardcoded values

4. **Verify consistency**
   - Same status → same color everywhere
   - Same status → same icon everywhere
   - Same status → same label everywhere

## Benefits

✅ **Single Source of Truth** - Change color once, updates everywhere
✅ **Type Safety** - TypeScript ensures correct status values
✅ **Documentation** - All statuses documented in one place
✅ **Consistency** - Impossible to have mismatched colors/icons
✅ **Dark Mode** - CSS variables handle theme switching automatically
✅ **Maintainability** - Easy to add new statuses or modify existing ones

## Example: Adding a New Status

```typescript
// 1. Add to statusConfig.ts
export const CHECKIN_STATUS = {
  // ... existing statuses ...
  ON_DECK: {
    value: 'on-deck',
    label: 'On Deck',
    colorVar: '--checkin-on-deck',
    textColorVar: '--checkin-on-deck-text',
    icon: 'ArrowRight',
    description: 'Next dog to compete'
  }
} as const;

// 2. Add to design-tokens.css
/* Light mode */
--checkin-on-deck: #3b82f6;
--checkin-on-deck-text: #ffffff;

/* Dark mode */
.theme-dark {
  --checkin-on-deck: #60a5fa;
  --checkin-on-deck-text: #1a1a1a;
}

// 3. Use everywhere automatically
const status = CHECKIN_STATUS.ON_DECK;
// Icon, color, label all defined!
```

## Related Files

- **Config**: [`src/constants/statusConfig.ts`](../src/constants/statusConfig.ts)
- **Colors**: [`src/styles/design-tokens.css`](../src/styles/design-tokens.css)
- **Utils**: [`src/utils/statusUtils.ts`](../src/utils/statusUtils.ts)
- **Components**: `StatusBadge`, `CheckInStatusBadge`, `ClassStatusDialog`, `CheckinStatusDialog`
