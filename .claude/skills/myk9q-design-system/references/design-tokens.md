# Design Tokens Reference

This is the complete reference for all CSS variables (design tokens) used in myK9Q. **NEVER hardcode values** - always use these tokens.

## File Location

**Source**: `src/styles/design-tokens.css`

All tokens are defined as CSS custom properties (variables) in `:root` for light theme, and overridden in `.theme-dark` for dark mode.

## Spacing Tokens

**Mobile → Desktop progression**: Smaller on mobile, larger on desktop

```css
--token-space-xs: 0.125rem;   /* 2px */
--token-space-sm: 0.25rem;    /* 4px */
--token-space-md: 0.5rem;     /* 8px */
--token-space-lg: 0.75rem;    /* 12px - MOBILE CONTAINER PADDING */
--token-space-xl: 1rem;       /* 16px */
--token-space-2xl: 1.25rem;   /* 20px */
--token-space-3xl: 1.5rem;    /* 24px - DESKTOP CONTAINER PADDING */
--token-space-4xl: 2rem;      /* 32px */
```

### Key Spacing Rules

- **Container padding (mobile)**: `--token-space-lg` (12px)
- **Container padding (desktop)**: `--token-space-3xl` (24px)
- **Standard gap between elements**: `--token-space-md` (8px) or `--token-space-lg` (12px)
- **Card padding**: `--token-space-lg` (12px) mobile, `--token-space-xl` (16px) desktop

### Usage Example

```css
.my-component {
  padding: var(--token-space-lg); /* Mobile: 12px */
  gap: var(--token-space-md); /* 8px */
}

@media (min-width: 1024px) {
  .my-component {
    padding: var(--token-space-3xl); /* Desktop: 24px */
  }
}
```

## Color System

### Theme Colors (Auto-switch Light/Dark)

```css
/* Base UI Colors */
--background: #fefefe; (light) / #1a1d23 (dark)
--foreground: #0a0a0a; (light) / #ffffff (dark)
--card: #ffffff; (light) / #1a1d23 (dark)
--muted: #f6f6f6; (light) / #2a2a2a (dark)
--border: #e5e7eb; (light) / #4a5568 (dark)

/* Brand Colors */
--primary: #007AFF; /* Apple blue - consistent across themes */
--primary-foreground: #ffffff;
```

### Entry Status Colors (Traffic Light System)

```css
/* Check-in Status */
--status-no-status: #9ca3af;     /* Gray - no action */
--status-checked-in: #10b981;    /* Green - ready */
--status-at-gate: #8b5cf6;       /* Purple - waiting */
--status-come-to-gate: #3b82f6;  /* Blue - called */
--checkin-in-ring: #3b82f6;      /* Blue - competing */
--status-conflict: #f59e0b;      /* Orange - warning */
--status-pulled: #ef4444;        /* Red - withdrawn */
```

Each status color has corresponding `-text` variant (usually `#ffffff`)

### Class Status Colors

```css
--status-none: #9ca3af;          /* Gray */
--status-setup: #b45309;         /* Deep amber/brown */
--status-briefing: #ff6b00;      /* Bright orange */
--status-break: #c000ff;         /* Magenta/purple */
--status-start-time: #14b8a6;    /* Teal/cyan */
--status-in-progress: #0066ff;   /* Blue */
--status-completed: #00cc66;     /* Emerald green */
```

### Result Status Colors

```css
--token-result-qualified: #10b981;  /* Green */
--token-result-nq: #dc2626;         /* Red */
--token-result-absent: #7c3aed;     /* Purple */
--token-result-excused: #dc2626;    /* Red */
```

### Semantic Colors

```css
--token-success: #34C759;        /* Green */
--token-warning: #FF9500;        /* Orange */
--token-error: #FF3B30;          /* Red */
```

### Text Colors

```css
--token-text-primary: #000000; (light) / #ffffff (dark)
--token-text-secondary: #374151; (light) / #e5e7eb (dark)
--token-text-tertiary: #6b7280; (light) / #9ca3af (dark)
--token-text-muted: #9ca3af; (light) / #6b7280 (dark)
--token-text-white: #ffffff; /* Always white */
```

## Typography

### Font Family

```css
--font-family: -apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", system-ui, sans-serif;
```

### Font Sizes

```css
--token-font-xs: 0.625rem;    /* 10px */
--token-font-sm: 0.75rem;     /* 12px */
--token-font-md: 0.875rem;    /* 14px */
--token-font-lg: 1rem;        /* 16px */
--token-font-xl: 1.125rem;    /* 18px */
--token-font-2xl: 1.25rem;    /* 20px */
--token-font-3xl: 1.5rem;     /* 24px */
```

### Font Weights

```css
--token-font-weight-normal: 400;
--token-font-weight-medium: 500;
--token-font-weight-semibold: 590; /* Apple-style */
--token-font-weight-bold: 600;
--token-font-weight-extrabold: 700;
```

## Border Radius

```css
--token-radius-sm: 0.375rem;  /* 6px */
--token-radius-md: 0.5rem;    /* 8px */
--token-radius-lg: 0.75rem;   /* 12px */
--token-radius-xl: 1rem;      /* 16px */
--token-radius-full: 50%;     /* Circular */
```

## Shadows

Auto-adjust for light/dark mode:

```css
/* Light Mode */
--token-shadow-sm: 0 1px 3px rgba(0, 0, 0, 0.1);
--token-shadow-md: 0 2px 8px rgba(0, 0, 0, 0.1);
--token-shadow-lg: 0 8px 24px rgba(0, 0, 0, 0.12);
--token-shadow-xl: 0 12px 32px rgba(0, 0, 0, 0.15);

/* Dark Mode - Stronger shadows */
--token-shadow-sm: 0 1px 3px rgba(0, 0, 0, 0.3);
--token-shadow-md: 0 2px 8px rgba(0, 0, 0, 0.3);
--token-shadow-lg: 0 8px 24px rgba(0, 0, 0, 0.4);
--token-shadow-xl: 0 12px 32px rgba(0, 0, 0, 0.4);
```

## Transitions & Animations

```css
--token-transition-fast: 0.15s ease;
--token-transition-normal: 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94);
--token-transition-slow: 0.5s cubic-bezier(0.25, 0.46, 0.45, 0.94);
--apple-ease: cubic-bezier(0.25, 0.46, 0.45, 0.94);
--apple-spring: cubic-bezier(0.175, 0.885, 0.32, 1.275);
```

## Z-Index Scale

**ALWAYS use these** - never hardcode z-index values:

```css
--token-z-base: 0;
--token-z-raised: 10;
--token-z-overlay: 100;
--token-z-modal: 1000;
--token-z-toast: 2000;
--z-menu-overlay: 9999;
--z-menu: 10000;
```

## Touch Targets

Minimum sizes for interactive elements:

```css
--min-touch-target: 44px;          /* Apple minimum */
--comfortable-touch-target: 36px;   /* Comfortable */
--stress-touch-target: 52px;        /* High-stress scenarios */
```

## Hover Effects

```css
--token-hover-lift: translateY(-2px);
--token-hover-scale: scale(1.05);
--token-hover-scale-sm: scale(1.02);
--token-hover-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
```

## Usage Guidelines

### DO ✅

```css
/* GOOD: Using design tokens */
.my-component {
  padding: var(--token-space-lg);
  color: var(--token-text-secondary);
  background: var(--card);
  border-radius: var(--token-radius-md);
  box-shadow: var(--token-shadow-sm);
  transition: var(--token-transition-normal);
}

.status-badge {
  background: var(--status-in-progress);
  color: var(--status-in-progress-text);
}
```

### DON'T ❌

```css
/* BAD: Hardcoded values */
.my-component {
  padding: 12px;               /* ❌ Use var(--token-space-lg) */
  color: #374151;              /* ❌ Use var(--token-text-secondary) */
  background: white;           /* ❌ Use var(--card) */
  border-radius: 8px;          /* ❌ Use var(--token-radius-md) */
  box-shadow: 0 1px 3px #ccc;  /* ❌ Use var(--token-shadow-sm) */
  transition: all 0.3s;        /* ❌ Use var(--token-transition-normal) */
}

.status-badge {
  background: #0066ff;         /* ❌ Use var(--status-in-progress) */
  color: white;                /* ❌ Use var(--status-in-progress-text) */
}
```

## Special Cases

### Glass Morphism

```css
--glass-bg: rgba(255, 255, 255, 0.1); (light) / rgba(26, 29, 35, 0.9) (dark)
--glass-border: rgba(255, 255, 255, 0.2); (light) / rgba(74, 85, 104, 0.3) (dark)
--glass-blur: blur(20px);
```

### Skeleton Loaders

```css
--skeleton-gradient: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%); (light)
--skeleton-gradient-dark: linear-gradient(90deg, #2a2a2a 25%, #1a1a1a 50%, #2a2a2a 75%); (dark)
```

## Placement Colors (Rankings)

```css
--token-placement-1: #3b82f6;  /* 1st place - Blue */
--token-placement-2: #dc2626;  /* 2nd place - Red */
--token-placement-3: #f59e0b;  /* 3rd place - Gold */
--token-placement-4: #6b7280;  /* 4th place - Gray */
```

## Quick Reference: Common Patterns

### Card Component

```css
.card {
  background: var(--card);
  border: 1px solid var(--border);
  border-radius: var(--token-radius-xl);
  padding: var(--token-space-lg);
  box-shadow: var(--token-shadow-sm);
  transition: var(--token-transition-normal);
}

.card:hover {
  box-shadow: var(--token-shadow-md);
  transform: var(--token-hover-lift);
}
```

### Status Badge

```css
.status-badge {
  display: inline-flex;
  align-items: center;
  gap: var(--token-space-xs);
  padding: var(--token-space-sm) var(--token-space-lg);
  border-radius: var(--token-radius-lg);
  font-size: var(--token-font-sm);
  font-weight: var(--token-font-weight-semibold);
}

.status-badge--in-progress {
  background: var(--status-in-progress);
  color: var(--status-in-progress-text);
}
```

### Button

```css
.button {
  padding: var(--token-space-md) var(--token-space-xl);
  background: var(--primary);
  color: var(--primary-foreground);
  border: none;
  border-radius: var(--token-radius-md);
  font-weight: var(--token-font-weight-semibold);
  transition: var(--token-transition-normal);
  min-height: var(--min-touch-target);
}

.button:hover {
  transform: var(--token-hover-scale-sm);
  box-shadow: var(--token-hover-shadow);
}
```

## Token Naming Convention

Format: `--{category}-{property}-{variant}`

Examples:
- `--token-space-lg` (category: token, property: space, variant: lg)
- `--status-in-progress` (category: status, property: in-progress)
- `--token-text-secondary` (category: token, property: text, variant: secondary)

## Legacy Compatibility

Some legacy token names exist for backwards compatibility. Prefer the current naming:

```css
/* Legacy (still works but avoid in new code) */
--token-status-checked-in-bg

/* Current (prefer this) */
--status-checked-in
```

## Testing Dark Mode

Always test components in both themes:

```html
<!-- Light theme (default) -->
<div class="my-component">...</div>

<!-- Dark theme -->
<div class="theme-dark">
  <div class="my-component">...</div>
</div>
```

---

**Remember**: Using design tokens ensures:
1. **Consistency** across the entire app
2. **Easy theming** (light/dark mode just works)
3. **Maintainability** (change once, update everywhere)
4. **Accessibility** (proper contrast ratios)
5. **Faster development** (no color/spacing decisions needed)
