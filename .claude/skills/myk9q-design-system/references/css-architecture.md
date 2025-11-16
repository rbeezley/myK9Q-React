# CSS Architecture Guidelines

Complete guide to writing CSS in the myK9Q application. These rules ensure consistency, maintainability, and optimal performance.

## Core Philosophy

**Simple, Clean, Fast**
- Semantic CSS class names (NOT utility-first like Tailwind)
- Design tokens via CSS variables for all spacing/colors
- Consolidated files (30 total, not 100+)
- One media query block per breakpoint per file

## File Organization

### Global Styles (`src/styles/`)

```
src/styles/
├── design-tokens.css         # All CSS variables (SINGLE SOURCE OF TRUTH)
├── shared-components.css      # Reusable component patterns
├── page-container.css         # Page layout system
└── utilities.css              # Utility classes (.sr-only, .truncate)
```

**Purpose of each file**:

- **`design-tokens.css`** - All CSS variables. NEVER modify other files to add new tokens - they all go here.
- **`shared-components.css`** - Patterns used across multiple pages (cards, badges, buttons)
- **`page-container.css`** - Page layout structure (headers, containers, sections)
- **`utilities.css`** - Helper classes with `!important` allowed (only file where it's permitted)

### Page Styles (`src/pages/*/`)

**Rule**: ONE CSS file per page route

```
src/pages/
├── Home/
│   └── Home.css              # ONLY Home page styles
├── ClassList/
│   └── ClassList.css         # ONLY ClassList page styles
├── EntryList/
│   └── EntryList.css         # ONLY EntryList page styles
└── Settings/
    └── Settings.css          # ONLY Settings page styles
```

**What goes in page CSS files**:
- ✅ Page-specific layout
- ✅ Page-specific component variations
- ✅ Page-specific responsive behavior
- ❌ NOT reusable patterns (those go in shared-components.css)
- ❌ NOT design tokens (those go in design-tokens.css)

### Component Styles

**Decision tree**:

```
Is the component < 100 lines of unique CSS?
├─ YES → Use src/components/ui/shared-ui.css
└─ NO  → Create own CSS file (e.g., DogCard.css)

Is the component a dialog?
├─ YES → Use src/components/dialogs/shared-dialog.css
└─ NO  → Follow above rule
```

**Examples**:

```
✅ GOOD: Simple Button component
   - Uses shared-ui.css
   - < 50 lines of CSS
   - Variants use modifier classes

✅ GOOD: Complex MultiTimer component
   - Has own MultiTimer.css file
   - 150+ lines of unique styles
   - Complex state-dependent styling

❌ BAD: Creating SimpleCard.css
   - Only 30 lines of CSS
   - Should use shared-components.css pattern
```

## Mobile-First Responsive Design

### Base Styles (Mobile)

**Always start with mobile** - NO media query wrapper:

```css
/* ✅ GOOD: Mobile-first (base styles) */
.my-component {
  padding: var(--token-space-lg);     /* 12px mobile */
  font-size: var(--token-font-md);    /* 14px */
  flex-direction: column;              /* Stack on mobile */
}
```

```css
/* ❌ BAD: Desktop-first */
@media (max-width: 1024px) {
  .my-component {
    padding: var(--token-space-lg);  /* Don't use max-width! */
  }
}
```

### Breakpoints (Progressive Enhancement)

Use **min-width** to enhance for larger screens:

```css
/* Mobile: < 640px (base styles, NO media query) */
.container {
  padding: 0 var(--token-space-lg);  /* 12px */
}

/* Tablet: 640px+ */
@media (min-width: 640px) {
  .container {
    padding: 0 var(--token-space-3xl);  /* 24px */
  }
}

/* Desktop: 1024px+ */
@media (min-width: 1024px) {
  .container {
    padding: 0 var(--token-space-3xl);  /* 24px (same as tablet) */
    max-width: 1440px;
    margin: 0 auto;
  }
}

/* Large: 1440px+ (rarely needed) */
@media (min-width: 1440px) {
  .container {
    max-width: 1600px;
  }
}
```

**Standard Breakpoints**:
- **Mobile**: `< 640px` (base, no media query)
- **Tablet**: `@media (min-width: 640px)`
- **Desktop**: `@media (min-width: 1024px)`
- **Large**: `@media (min-width: 1440px)` (use sparingly)

### Media Query Consolidation

**CRITICAL RULE**: One media query block per breakpoint per file

```css
/* ✅ GOOD: Consolidated */
.component-a { padding: var(--token-space-lg); }
.component-b { margin: var(--token-space-md); }
.component-c { gap: var(--token-space-sm); }

/* Tablet: ALL tablet styles in ONE block */
@media (min-width: 640px) {
  .component-a { padding: var(--token-space-xl); }
  .component-b { margin: var(--token-space-lg); }
  .component-c { gap: var(--token-space-md); }
}

/* Desktop: ALL desktop styles in ONE block */
@media (min-width: 1024px) {
  .component-a { padding: var(--token-space-3xl); }
  .component-b { margin: var(--token-space-xl); }
}
```

```css
/* ❌ BAD: Scattered media queries */
.component-a { padding: var(--token-space-lg); }

@media (min-width: 640px) {
  .component-a { padding: var(--token-space-xl); }
}

.component-b { margin: var(--token-space-md); }

@media (min-width: 640px) {  /* Duplicate breakpoint! */
  .component-b { margin: var(--token-space-lg); }
}
```

## CSS Structure Template

Every CSS file should follow this structure:

```css
/* ===== COMPONENT_NAME.css ===== */

/* Section 1: CSS Variables (if needed) */
:root {
  /* Component-specific variables (prefer design-tokens.css) */
  --component-custom-var: value;
}

/* Section 2: Base/Mobile Styles (NO media query wrapper) */
.component {
  padding: var(--token-space-lg);
  color: var(--foreground);
  background: var(--card);
}

.component-header {
  font-size: var(--token-font-xl);
  font-weight: var(--token-font-weight-semibold);
}

.component-content {
  margin-top: var(--token-space-md);
}

/* Section 3: Tablet (ONE block only) */
@media (min-width: 640px) {
  .component {
    padding: var(--token-space-xl);
  }
  .component-header {
    font-size: var(--token-font-2xl);
  }
}

/* Section 4: Desktop (ONE block only) */
@media (min-width: 1024px) {
  .component {
    padding: var(--token-space-3xl);
  }
  .component-content {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
  }
}

/* Section 5: Accessibility */
@media (prefers-reduced-motion: reduce) {
  .component {
    animation: none;
    transition: none;
  }
}

/* Section 6: Dark Theme (if needed) */
.theme-dark .component {
  /* Usually not needed - use design tokens which auto-switch */
}
```

## Horizontal Alignment System

**Critical for visual consistency**: All sections must align at the left edge.

### Container Padding

```css
/* Mobile: 12px */
.page-container {
  padding: 0 var(--token-space-lg);  /* 12px */
}

/* Desktop: 24px */
@media (min-width: 1024px) {
  .page-container {
    padding: 0 var(--token-space-3xl);  /* 24px */
  }
}
```

### Section Alignment

All page sections should use the same horizontal padding:

```css
/* ✅ GOOD: Aligned sections */
.header { padding: 0 var(--token-space-lg); }
.content { padding: 0 var(--token-space-lg); }
.footer { padding: 0 var(--token-space-lg); }

/* Desktop */
@media (min-width: 1024px) {
  .header { padding: 0 var(--token-space-3xl); }
  .content { padding: 0 var(--token-space-3xl); }
  .footer { padding: 0 var(--token-space-3xl); }
}
```

```css
/* ❌ BAD: Misaligned sections */
.header { padding: 0 12px; }       /* Hardcoded */
.content { padding: 0 16px; }      /* Different value */
.footer { padding: 0 var(--token-space-xl); }  /* Different token */
```

## Semantic Class Naming

Use **descriptive, purpose-based names** (NOT utility classes):

```css
/* ✅ GOOD: Semantic names */
.class-card { }
.class-card-header { }
.class-card-status-badge { }
.status-badge--in-progress { }
.entry-list-item { }
.dialog-overlay { }
```

```css
/* ❌ BAD: Utility-style names (this is NOT Tailwind) */
.flex-col { }
.gap-4 { }
.text-sm { }
.bg-blue-500 { }
.rounded-lg { }
```

### BEM-Style Modifiers

Use double-dash (`--`) for variants:

```css
.button { }
.button--primary { }
.button--secondary { }
.button--large { }

.status-badge { }
.status-badge--in-progress { }
.status-badge--completed { }
```

## Design Token Usage

**NEVER hardcode values** - always use design tokens:

```css
/* ✅ GOOD: Using design tokens */
.component {
  padding: var(--token-space-lg);
  margin: var(--token-space-md);
  gap: var(--token-space-sm);
  color: var(--token-text-secondary);
  background: var(--card);
  border: 1px solid var(--border);
  border-radius: var(--token-radius-md);
  box-shadow: var(--token-shadow-sm);
  font-size: var(--token-font-md);
  font-weight: var(--token-font-weight-semibold);
  transition: var(--token-transition-normal);
}
```

```css
/* ❌ BAD: Hardcoded values */
.component {
  padding: 12px;               /* ❌ Use var(--token-space-lg) */
  margin: 8px;                 /* ❌ Use var(--token-space-md) */
  gap: 4px;                    /* ❌ Use var(--token-space-sm) */
  color: #374151;              /* ❌ Use var(--token-text-secondary) */
  background: white;           /* ❌ Use var(--card) */
  border: 1px solid #e5e7eb;   /* ❌ Use var(--border) */
  border-radius: 8px;          /* ❌ Use var(--token-radius-md) */
  box-shadow: 0 1px 3px #ccc;  /* ❌ Use var(--token-shadow-sm) */
  font-size: 14px;             /* ❌ Use var(--token-font-md) */
  font-weight: 600;            /* ❌ Use var(--token-font-weight-semibold) */
  transition: all 0.3s;        /* ❌ Use var(--token-transition-normal) */
}
```

## Specificity & !important

### No !important Rule

**NEVER use `!important`** except in utility classes:

```css
/* ✅ GOOD: Utility class (only place !important is allowed) */
.sr-only {
  position: absolute !important;
  width: 1px !important;
  height: 1px !important;
}

.truncate {
  overflow: hidden !important;
  text-overflow: ellipsis !important;
  white-space: nowrap !important;
}
```

```css
/* ❌ BAD: Using !important in regular CSS */
.component {
  color: red !important;     /* ❌ Never do this */
  padding: 20px !important;  /* ❌ Specificity war */
}
```

### Proper Specificity

Use **single class selectors** when possible:

```css
/* ✅ GOOD: Low specificity */
.button { }
.button--primary { }
.card-header { }
```

```css
/* ❌ BAD: Overly specific */
div.container .card .button.primary { }  /* Too specific */
#header .nav ul li a { }                 /* Avoid IDs, deeply nested */
```

## When to Create a New CSS File

### Create New CSS File When:

✅ **Component has 100+ lines of unique CSS**
```
Example: MultiTimer component
- Complex grid layouts
- Multiple state-dependent styles
- Custom animations
- Many media query variations
→ Create MultiTimer.css
```

✅ **Component has complex state-dependent styling**
```
Example: ClassCard component
- Different states (pending, in-progress, completed)
- Hover effects, transitions
- Status-specific colors
- Badge positioning
→ Create ClassCard.css (even if < 100 lines)
```

✅ **Page-specific styles**
```
Example: ClassList page
- Page layout
- Page-specific responsive behavior
→ Create ClassList.css (always one per page)
```

### Use Shared CSS When:

✅ **Component is < 100 lines**
```
Example: Simple Button
- 3-4 variants
- Basic hover effects
→ Use shared-ui.css
```

✅ **Component follows existing pattern**
```
Example: InfoCard (similar to existing card pattern)
- Standard card structure
- Uses existing card pattern with minor tweaks
→ Use shared-components.css pattern
```

✅ **Component is a dialog**
```
Example: ConfirmationDialog
- Follows dialog structure
- Uses shared overlay, header, footer
→ Use shared-dialog.css
```

## Common Patterns

### Card Pattern

```css
.card-base {
  background: var(--card);
  border: 1px solid var(--border);
  border-radius: var(--token-radius-xl);
  padding: var(--token-space-lg);
  box-shadow: var(--token-shadow-sm);
  transition: var(--token-transition-normal);
}

.card-base:hover {
  box-shadow: var(--token-shadow-md);
  transform: var(--token-hover-lift);
}

@media (min-width: 1024px) {
  .card-base {
    padding: var(--token-space-xl);
  }
}
```

### Status Badge Pattern

```css
.status-badge {
  display: inline-flex;
  align-items: center;
  gap: var(--token-space-xs);
  padding: var(--token-space-sm) var(--token-space-lg);
  border-radius: var(--token-radius-lg);
  font-size: var(--token-font-sm);
  font-weight: var(--token-font-weight-semibold);
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.status-badge--in-progress {
  background: var(--status-in-progress);
  color: var(--status-in-progress-text);
}

.status-badge--completed {
  background: var(--status-completed);
  color: var(--status-completed-text);
}
```

### Button Pattern

```css
.btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: var(--token-space-sm);
  padding: var(--token-space-md) var(--token-space-xl);
  border: none;
  border-radius: var(--token-radius-md);
  font-weight: var(--token-font-weight-semibold);
  font-size: var(--token-font-md);
  transition: var(--token-transition-normal);
  cursor: pointer;
  min-height: var(--min-touch-target);
}

.btn--primary {
  background: var(--primary);
  color: var(--primary-foreground);
}

.btn:hover:not(:disabled) {
  transform: var(--token-hover-scale-sm);
  box-shadow: var(--token-hover-shadow);
}

.btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
```

## Dark Theme Support

**Use design tokens** - they handle theme switching automatically:

```css
/* ✅ GOOD: Tokens auto-switch */
.component {
  background: var(--card);      /* White in light, dark in dark */
  color: var(--foreground);     /* Black in light, white in dark */
  border: 1px solid var(--border);
}
```

```css
/* ❌ BAD: Manual theme switching */
.component {
  background: white;
  color: black;
}

.theme-dark .component {
  background: #1a1d23;
  color: white;
}
```

**Only use `.theme-dark` when**:
- Component-specific dark theme adjustments
- Shadows need different opacity
- Special dark-mode-only effects

```css
/* ✅ GOOD: Component-specific dark adjustment */
.theme-dark .glass-card {
  backdrop-filter: blur(30px);  /* Stronger blur in dark */
}
```

## Accessibility

### Reduced Motion

**ALWAYS include** for animations:

```css
@media (prefers-reduced-motion: reduce) {
  * {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}
```

### Focus States

```css
.button:focus-visible {
  outline: 2px solid var(--primary);
  outline-offset: 2px;
}

/* NEVER remove outline without replacement */
.button:focus {
  outline: none;  /* ❌ Only if you add custom focus style */
}
```

## Common Pitfalls

### ❌ Pitfall 1: Scattered Media Queries

```css
/* ❌ BAD */
.component-a { }
@media (min-width: 640px) { .component-a { } }

.component-b { }
@media (min-width: 640px) { .component-b { } }  /* Duplicate! */
```

**Fix**: Consolidate into one block per breakpoint

### ❌ Pitfall 2: Hardcoded Values

```css
/* ❌ BAD */
.component {
  padding: 12px;
  color: #374151;
}
```

**Fix**: Use design tokens

### ❌ Pitfall 3: Max-Width Media Queries

```css
/* ❌ BAD: Desktop-first */
@media (max-width: 1024px) { }
```

**Fix**: Use min-width (mobile-first)

### ❌ Pitfall 4: Overly Specific Selectors

```css
/* ❌ BAD */
div.container .card .header h2 { }
```

**Fix**: Use semantic class names with low specificity

### ❌ Pitfall 5: Creating Tiny CSS Files

```css
/* ❌ BAD: SimpleCard.css (only 20 lines) */
```

**Fix**: Use shared-components.css for small components

## Pre-Commit Checklist

Before committing CSS changes:

- [ ] All spacing uses design tokens (no hardcoded px/rem)
- [ ] All colors use design tokens (no hardcoded hex)
- [ ] Zero `!important` declarations (except utility classes)
- [ ] Media queries consolidated (one block per breakpoint)
- [ ] Mobile-first approach (base styles, then min-width)
- [ ] Tested at 375px, 768px, 1024px, 1440px
- [ ] Light and dark theme both work
- [ ] Reduced motion support added for animations
- [ ] Left-edge alignment verified across sections
- [ ] Semantic class names (not utility-first)

---

**Remember**: These rules exist to ensure consistency, maintainability, and performance. When in doubt, reference existing patterns before creating new ones!
