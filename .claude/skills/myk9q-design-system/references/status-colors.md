# Status & Color System Reference

Complete guide to the status color system used throughout myK9Q.

## Philosophy

Status colors provide **instant visual feedback** about the state of classes, entries, and results. The system is designed for:
- **Quick recognition** - Colors have clear meanings
- **Accessibility** - WCAG AA contrast ratios in both light and dark themes
- **Consistency** - Same status = same color everywhere
- **Traffic light progression** - Green (good) → Yellow/Orange (warning) → Red (problem)

## Entry Status Colors (Check-in Flow)

These colors represent the check-in status of individual entries in a class.

### Status Codes and Colors

```css
/* No Status - Gray */
--status-no-status: #9ca3af;
--status-no-status-text: #ffffff;
```
**When used**: Entry has not been checked in yet
**Visual**: Gray badge with white text
**Database value**: `0` or null

---

```css
/* Checked In - Green */
--status-checked-in: #10b981;
--status-checked-in-text: #ffffff;
```
**When used**: Entry is checked in and ready to compete
**Visual**: Green badge with white text
**Database value**: `1`
**Traffic light**: Green = Go / Ready

---

```css
/* At Gate - Purple */
--status-at-gate: #8b5cf6;
--status-at-gate-text: #ffffff;
```
**When used**: Entry is waiting at the gate
**Visual**: Purple badge with white text
**Database value**: `2`
**Traffic light**: Purple = Waiting / Queued

---

```css
/* Come to Gate - Blue */
--status-come-to-gate: #3b82f6;
--status-come-to-gate-text: #ffffff;
```
**When used**: Entry has been called to the gate
**Visual**: Blue badge with white text
**Database value**: Not stored (derived from announcement system)
**Traffic light**: Blue = Active / Called

---

```css
/* In Ring - Blue */
--checkin-in-ring: #3b82f6;
--status-in-ring-text: #ffffff;
```
**When used**: Entry is currently competing
**Visual**: Blue badge with white text
**Database value**: `3`
**Traffic light**: Blue = Active / Running

---

```css
/* Conflict - Orange */
--status-conflict: #f59e0b;
--status-conflict-text: #ffffff;
```
**When used**: Entry has a scheduling conflict (multiple classes at same time)
**Visual**: Orange badge with white text
**Database value**: Not stored (calculated from class schedules)
**Traffic light**: Orange = Warning / Attention needed

---

```css
/* Pulled/Withdrawn - Red */
--status-pulled: #ef4444;
--status-pulled-text: #ffffff;
```
**When used**: Entry has been withdrawn from the class
**Visual**: Red badge with white text
**Database value**: Entry marked as withdrawn
**Traffic light**: Red = Stopped / Withdrawn

### Entry Status Badge Pattern

```tsx
<div className={`entry-status-badge entry-status-badge--${status}`}>
  {statusIcon}
  <span>{statusLabel}</span>
</div>
```

```css
.entry-status-badge {
  display: inline-flex;
  align-items: center;
  gap: var(--token-space-xs);
  padding: var(--token-space-sm) var(--token-space-lg);
  border-radius: var(--token-radius-lg);
  font-size: var(--token-font-sm);
  font-weight: var(--token-font-weight-semibold);
}

.entry-status-badge--checked-in {
  background: var(--status-checked-in);
  color: var(--status-checked-in-text);
}

.entry-status-badge--at-gate {
  background: var(--status-at-gate);
  color: var(--status-at-gate-text);
}

/* etc. for other statuses */
```

## Class Status Colors (Class Progress)

These colors represent the current state of an entire class.

### Status Colors

```css
/* None - Gray */
--status-none: #9ca3af;
```
**When used**: No specific status set
**Visual**: Gray indicator

---

```css
/* Setup - Deep Amber/Brown */
--status-setup: #b45309;
--status-setup-text: #ffffff;
```
**When used**: Class is being set up (ring preparation, course building)
**Visual**: Deep amber/brown badge
**Progression**: First stage of class lifecycle

---

```css
/* Briefing - Bright Orange */
--status-briefing: #ff6b00;
--status-briefing-text: #ffffff;
```
**When used**: Judge is giving class briefing/walkthrough
**Visual**: Bright orange badge
**Progression**: After setup, before competition starts

---

```css
/* Break - Magenta/Purple */
--status-break: #c000ff;
--status-break-text: #ffffff;
```
**When used**: Class is on break (lunch, equipment issue, etc.)
**Visual**: Magenta/purple badge
**Progression**: Temporary pause during competition

---

```css
/* Start Time - Teal/Cyan */
--status-start-time: #14b8a6;
--status-start-time-text: #ffffff;
```
**When used**: Class start time has been announced
**Visual**: Teal/cyan badge
**Progression**: Time set, ready to begin

---

```css
/* In Progress - Blue */
--status-in-progress: #0066ff;
--status-in-progress-text: #ffffff;
```
**When used**: Class is actively running (dogs competing)
**Visual**: Blue badge
**Progression**: Active competition phase
**Traffic light**: Blue = Active

---

```css
/* Completed - Emerald Green */
--status-completed: #00cc66;
--status-completed-text: #ffffff;
```
**When used**: Class has finished, all results entered
**Visual**: Emerald green badge
**Progression**: Final stage
**Traffic light**: Green = Done

### Class Status Badge Pattern

```tsx
<div className={`class-status-badge class-status-badge--${status}`}>
  {statusIcon}
  <span>{statusLabel}</span>
</div>
```

```css
.class-status-badge {
  display: inline-flex;
  align-items: center;
  gap: var(--token-space-sm);
  padding: var(--token-space-sm) var(--token-space-lg);
  border-radius: var(--token-radius-lg);
  font-size: var(--token-font-sm);
  font-weight: var(--token-font-weight-semibold);
}

.class-status-badge--in-progress {
  background: var(--status-in-progress);
  color: var(--status-in-progress-text);
}

.class-status-badge--completed {
  background: var(--status-completed);
  color: var(--status-completed-text);
}

/* etc. for other statuses */
```

## Result Status Colors

These colors represent the outcome of a run/performance.

```css
/* Qualified - Green */
--token-result-qualified: #10b981;
--token-result-qualified-text: #ffffff;
```
**When used**: Entry met qualifying criteria (Q, QQ, MACH points, etc.)
**Visual**: Green badge
**Traffic light**: Green = Success

---

```css
/* Non-Qualifying - Red */
--token-result-nq: #dc2626;
--token-result-nq-text: #ffffff;
```
**When used**: Entry did not qualify (NQ, faults, over time, etc.)
**Visual**: Red badge
**Traffic light**: Red = Did not succeed

---

```css
/* Absent - Purple */
--token-result-absent: #7c3aed;
--token-result-absent-text: #ffffff;
```
**When used**: Entry did not run (absent, scratched)
**Visual**: Purple badge
**Meaning**: Neutral (not a performance result)

---

```css
/* Excused - Red */
--token-result-excused: #dc2626;
--token-result-excused-text: #ffffff;
```
**When used**: Entry was excused by judge (behavior, safety, etc.)
**Visual**: Red badge (same as NQ)
**Traffic light**: Red = Stopped

### Result Badge Pattern

```tsx
<div className={`result-badge result-badge--${result}`}>
  <span>{resultLabel}</span>
</div>
```

```css
.result-badge {
  display: inline-flex;
  align-items: center;
  padding: var(--token-space-xs) var(--token-space-md);
  border-radius: var(--token-radius-md);
  font-size: var(--token-font-xs);
  font-weight: var(--token-font-weight-bold);
  text-transform: uppercase;
}

.result-badge--qualified {
  background: var(--token-result-qualified);
  color: var(--token-result-qualified-text);
}

.result-badge--nq {
  background: var(--token-result-nq);
  color: var(--token-result-nq-text);
}

/* etc. */
```

## Semantic Colors

General-purpose semantic colors for UI feedback.

```css
/* Success - Green */
--token-success: #34C759;
--token-success-contrast: #ffffff;
```
**When used**: Success messages, confirmations, positive actions
**Examples**: "Saved successfully", "Check-in complete"

---

```css
/* Warning - Orange */
--token-warning: #FF9500;
--token-warning-contrast: #ffffff;
```
**When used**: Warning messages, caution states, potential issues
**Examples**: "Unsaved changes", "Low battery", "Conflict detected"

---

```css
/* Error - Red */
--token-error: #FF3B30;
--token-error-contrast: #ffffff;
```
**When used**: Error messages, destructive actions, failures
**Examples**: "Failed to save", "Invalid input", "Connection lost"

---

```css
/* Info - Blue */
--token-info: #007AFF;
--token-info-contrast: #ffffff;
```
**When used**: Informational messages, tips, neutral notifications
**Examples**: "New feature available", "Tip: Use keyboard shortcuts"

### Alert Pattern

```tsx
<div className={`alert alert--${type}`}>
  {icon}
  <div className="alert-content">
    <h4>{title}</h4>
    <p>{message}</p>
  </div>
</div>
```

```css
.alert {
  display: flex;
  gap: var(--token-space-lg);
  padding: var(--token-space-lg);
  border-radius: var(--token-radius-md);
  border-left: 4px solid;
}

.alert--success {
  background: rgba(52, 199, 89, 0.1);
  border-color: var(--token-success);
  color: var(--foreground);
}

.alert--warning {
  background: rgba(255, 149, 0, 0.1);
  border-color: var(--token-warning);
  color: var(--foreground);
}

.alert--error {
  background: rgba(255, 59, 48, 0.1);
  border-color: var(--token-error);
  color: var(--foreground);
}

.alert--info {
  background: rgba(0, 122, 255, 0.1);
  border-color: var(--token-info);
  color: var(--foreground);
}
```

## Placement Colors (Rankings)

Colors for placement indicators (1st, 2nd, 3rd, 4th).

```css
--token-placement-1: #3b82f6;  /* 1st place - Blue */
--token-placement-2: #dc2626;  /* 2nd place - Red */
--token-placement-3: #f59e0b;  /* 3rd place - Gold */
--token-placement-4: #6b7280;  /* 4th place - Gray */
```

**Usage**: Results page, scoreboards, leaderboards

```css
.placement-badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: var(--token-space-3xl);
  height: var(--token-space-3xl);
  border-radius: var(--token-radius-full);
  font-size: var(--token-font-sm);
  font-weight: var(--token-font-weight-bold);
  color: white;
}

.placement-badge--1 {
  background: var(--token-placement-1);
}

.placement-badge--2 {
  background: var(--token-placement-2);
}

.placement-badge--3 {
  background: var(--token-placement-3);
}

.placement-badge--4 {
  background: var(--token-placement-4);
}
```

## Accessibility Guidelines

### Contrast Ratios

All status colors meet **WCAG AA** requirements:
- **Normal text**: 4.5:1 minimum
- **Large text (18px+)**: 3:1 minimum
- **UI components**: 3:1 minimum

All status colors use white text (#ffffff) for maximum contrast.

### Dark Theme Support

Status colors **remain the same** in dark theme - they're already designed to work on both light and dark backgrounds. The design token system handles theme switching automatically.

```css
/* Light theme - defined in :root */
--status-checked-in: #10b981;

/* Dark theme - uses same value */
.theme-dark {
  --status-checked-in: #10b981;
}
```

### Color Blindness Considerations

- **Never rely on color alone** - always pair with text labels or icons
- **Use distinct shapes/icons** for different statuses
- **Provide text alternatives** for all status indicators

Good example:
```tsx
<div className="status-badge status-badge--checked-in">
  <CheckCircle size={14} /> {/* Icon */}
  <span>Checked In</span> {/* Text label */}
</div>
```

Bad example:
```tsx
<div className="status-badge status-badge--checked-in">
  {/* Color only - no icon or text */}
</div>
```

## Common Mistakes to Avoid

❌ **DON'T:**
```css
/* Hardcoded status colors */
.my-status {
  background: #10b981;  /* ❌ Use var(--status-checked-in) */
  color: white;         /* ❌ Use var(--status-checked-in-text) */
}

/* Color-only indicators */
<div style={{ background: 'green' }} /> {/* ❌ No text/icon */}

/* Inconsistent status colors */
.checked-in-badge { background: #10b981; }  /* ✓ Correct green */
.checked-in-card { background: #22c55e; }   /* ❌ Different green! */
```

✅ **DO:**
```css
/* Use design tokens */
.my-status {
  background: var(--status-checked-in);
  color: var(--status-checked-in-text);
}
```

```tsx
/* Color + icon + text */
<div className="status-badge status-badge--checked-in">
  <CheckCircle size={14} />
  <span>Checked In</span>
</div>
```

## Testing Checklist

Before committing status color changes:

- [ ] All status badges visible in light theme
- [ ] All status badges visible in dark theme
- [ ] Contrast ratios meet WCAG AA (use browser DevTools)
- [ ] Text labels present (not just colors)
- [ ] Icons used for additional clarity
- [ ] Consistent colors across all instances of same status
- [ ] Design tokens used (no hardcoded values)
- [ ] Hover/focus states have sufficient contrast
- [ ] Mobile touch targets meet 44x44px minimum

## Quick Reference Table

| Status Category | Status | Color | Hex | Usage |
|----------------|--------|-------|-----|-------|
| **Entry** | No Status | Gray | #9ca3af | Not checked in |
| **Entry** | Checked In | Green | #10b981 | Ready to compete |
| **Entry** | At Gate | Purple | #8b5cf6 | Waiting at gate |
| **Entry** | In Ring | Blue | #3b82f6 | Currently competing |
| **Entry** | Conflict | Orange | #f59e0b | Scheduling conflict |
| **Entry** | Pulled | Red | #ef4444 | Withdrawn |
| **Class** | Setup | Amber | #b45309 | Ring preparation |
| **Class** | Briefing | Orange | #ff6b00 | Judge briefing |
| **Class** | Break | Magenta | #c000ff | On break |
| **Class** | Start Time | Teal | #14b8a6 | Time announced |
| **Class** | In Progress | Blue | #0066ff | Active competition |
| **Class** | Completed | Green | #00cc66 | Finished |
| **Result** | Qualified | Green | #10b981 | Met criteria |
| **Result** | NQ | Red | #dc2626 | Did not qualify |
| **Result** | Absent | Purple | #7c3aed | Did not run |
| **Result** | Excused | Red | #dc2626 | Judge excused |
| **Semantic** | Success | Green | #34C759 | Positive feedback |
| **Semantic** | Warning | Orange | #FF9500 | Caution |
| **Semantic** | Error | Red | #FF3B30 | Failure |
| **Semantic** | Info | Blue | #007AFF | Information |
| **Placement** | 1st | Blue | #3b82f6 | First place |
| **Placement** | 2nd | Red | #dc2626 | Second place |
| **Placement** | 3rd | Gold | #f59e0b | Third place |
| **Placement** | 4th | Gray | #6b7280 | Fourth place |

---

**Remember**: Status colors are a critical part of the UX. Use them consistently, pair them with text/icons, and always test for accessibility!
