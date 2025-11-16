# Responsive Design Guidelines

Comprehensive guide to building responsive layouts in myK9Q.

## Philosophy

myK9Q follows a **mobile-first** responsive design approach:
1. **Base styles target mobile** (375px minimum width)
2. **Progressive enhancement** for larger screens
3. **Container-based scaling** (not viewport-based)
4. **Touch-optimized** for mobile, refined for desktop

## Breakpoints

### Standard Breakpoints

**ALWAYS use these exact breakpoints** - never create custom ones:

```css
/* Mobile (default) - NO media query needed */
/* Targets: 375px - 639px */
.component {
  /* Mobile styles here */
}

/* Tablet - 640px and up */
@media (min-width: 640px) {
  .component {
    /* Tablet enhancements */
  }
}

/* Desktop - 1024px and up */
@media (min-width: 1024px) {
  .component {
    /* Desktop enhancements */
  }
}

/* Large Desktop - 1440px and up (rarely needed) */
@media (min-width: 1440px) {
  .component {
    /* Large screen optimizations */
  }
}
```

### Why These Breakpoints?

- **375px (mobile base)**: iPhone SE minimum
- **640px (tablet)**: iPad mini portrait, most tablets
- **1024px (desktop)**: iPad landscape, laptop screens
- **1440px (large)**: Desktop monitors, large displays

### Mobile-First vs Desktop-First

❌ **WRONG (desktop-first)**:
```css
/* Desktop styles as base */
.component {
  padding: 24px;
  font-size: 18px;
}

/* Override for mobile */
@media (max-width: 640px) {
  .component {
    padding: 12px;
    font-size: 14px;
  }
}
```

✅ **CORRECT (mobile-first)**:
```css
/* Mobile styles as base */
.component {
  padding: var(--token-space-lg);    /* 12px */
  font-size: var(--token-font-md);   /* 14px */
}

/* Enhance for desktop */
@media (min-width: 1024px) {
  .component {
    padding: var(--token-space-3xl);  /* 24px */
    font-size: var(--token-font-xl);  /* 18px */
  }
}
```

## Container Padding System

### Horizontal Alignment Rule

**CRITICAL**: All sections must align their left edges at 12px (mobile) and 24px (desktop).

```css
/* Page container */
.page-section {
  padding: 0 var(--token-space-lg);  /* 12px mobile */
}

@media (min-width: 1024px) {
  .page-section {
    padding: 0 var(--token-space-3xl);  /* 24px desktop */
  }
}
```

### Common Container Patterns

**Full-width section**:
```css
.section {
  width: 100%;
  padding: var(--token-space-lg);  /* 12px all sides mobile */
}

@media (min-width: 1024px) {
  .section {
    padding: var(--token-space-3xl);  /* 24px desktop */
  }
}
```

**Centered content with max-width**:
```css
.container {
  width: 100%;
  max-width: 1440px;
  margin: 0 auto;
  padding: 0 var(--token-space-lg);
}

@media (min-width: 1024px) {
  .container {
    padding: 0 var(--token-space-3xl);
  }
}
```

**No horizontal padding (for full-bleed content)**:
```css
.full-bleed {
  width: 100%;
  /* No horizontal padding */
  /* Child elements handle their own padding */
}
```

## Grid Systems

### Auto-Responsive Grid

Use CSS Grid with `auto-fit` for automatic column adjustment:

```css
.grid-container {
  display: grid;
  grid-template-columns: 1fr;  /* 1 column mobile */
  gap: var(--token-space-lg);
}

@media (min-width: 640px) {
  .grid-container {
    grid-template-columns: repeat(2, 1fr);  /* 2 columns tablet */
  }
}

@media (min-width: 1024px) {
  .grid-container {
    grid-template-columns: repeat(3, 1fr);  /* 3 columns desktop */
  }
}
```

### Flexible Grid (Auto-fit)

For truly responsive grids that adjust based on content:

```css
.flexible-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: var(--token-space-lg);
}
```

- **280px**: Minimum card width
- **auto-fit**: Creates as many columns as fit
- **1fr**: Equal width columns

### Common Grid Patterns

**Class cards grid**:
```css
.class-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: var(--token-space-lg);
}

@media (min-width: 640px) {
  .class-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (min-width: 1024px) {
  .class-grid {
    grid-template-columns: repeat(3, 1fr);
  }
}

@media (min-width: 1440px) {
  .class-grid {
    grid-template-columns: repeat(4, 1fr);
  }
}
```

**Dashboard layout** (sidebar + content):
```css
.dashboard {
  display: grid;
  grid-template-columns: 1fr;
  gap: var(--token-space-lg);
}

@media (min-width: 1024px) {
  .dashboard {
    grid-template-columns: 280px 1fr;  /* Fixed sidebar, flexible content */
  }
}
```

## Typography Scaling

### Font Size Progression

```css
/* Mobile base */
.heading-1 {
  font-size: var(--token-font-2xl);  /* 20px */
}

.heading-2 {
  font-size: var(--token-font-xl);   /* 18px */
}

.body {
  font-size: var(--token-font-md);   /* 14px */
}

/* Desktop enhancement */
@media (min-width: 1024px) {
  .heading-1 {
    font-size: var(--token-font-3xl);  /* 24px */
  }

  .heading-2 {
    font-size: var(--token-font-2xl);  /* 20px */
  }

  .body {
    font-size: var(--token-font-lg);   /* 16px */
  }
}
```

### Line Height Adjustment

```css
/* Mobile - tighter line heights for smaller screens */
.text {
  line-height: 1.4;
}

/* Desktop - more breathing room */
@media (min-width: 1024px) {
  .text {
    line-height: 1.6;
  }
}
```

## Touch Targets

### Minimum Sizes

Apple Human Interface Guidelines recommend **44x44px** minimum touch targets.

```css
.button,
.icon-button,
.link {
  min-height: var(--min-touch-target);  /* 44px */
  min-width: var(--min-touch-target);   /* 44px */
}
```

### Touch Target Zones

**Small icons need larger hit areas**:

```css
.icon-button {
  /* Icon is 16px, but button is 44px */
  width: var(--min-touch-target);
  height: var(--min-touch-target);
  display: flex;
  align-items: center;
  justify-content: center;
}

.icon-button svg {
  width: var(--token-space-xl);   /* 16px icon */
  height: var(--token-space-xl);
}
```

### High-Stress Touch Targets

For actions in high-stress scenarios (scoring, timing), use **52x52px**:

```css
.scoring-button {
  min-height: var(--stress-touch-target);  /* 52px */
  min-width: var(--stress-touch-target);
}
```

## Component Adaptation Patterns

### Card Stacking

```css
.card {
  padding: var(--token-space-lg);
}

/* Stack card content vertically on mobile */
.card-content {
  display: flex;
  flex-direction: column;
  gap: var(--token-space-md);
}

/* Horizontal layout on desktop */
@media (min-width: 1024px) {
  .card {
    padding: var(--token-space-xl);
  }

  .card-content {
    flex-direction: row;
    align-items: center;
    gap: var(--token-space-lg);
  }
}
```

### Navigation Patterns

**Mobile: Hamburger menu**
**Desktop: Horizontal nav**

```css
.nav {
  display: flex;
  flex-direction: column;  /* Stack mobile */
}

.nav-toggle {
  display: block;  /* Show hamburger on mobile */
}

@media (min-width: 1024px) {
  .nav {
    flex-direction: row;  /* Horizontal desktop */
  }

  .nav-toggle {
    display: none;  /* Hide hamburger on desktop */
  }
}
```

### Dialog/Modal Sizing

```css
.dialog {
  width: 100%;
  height: 100%;  /* Full screen on mobile */
  border-radius: 0;
}

@media (min-width: 640px) {
  .dialog {
    width: 90%;
    max-width: 600px;
    height: auto;  /* Auto height on tablet/desktop */
    border-radius: var(--token-radius-xl);
  }
}
```

## Testing Matrix

### Required Test Points

Test EVERY component at these exact widths:

| Device Class | Width | What to Test |
|-------------|-------|--------------|
| **Mobile (small)** | 375px | iPhone SE, minimum supported width |
| **Mobile (large)** | 414px | iPhone Pro Max |
| **Tablet (portrait)** | 768px | iPad mini portrait |
| **Tablet (landscape)** | 1024px | iPad landscape, breakpoint transition |
| **Desktop** | 1280px | Laptop screens |
| **Large Desktop** | 1440px | Desktop monitors, breakpoint transition |

### Testing Checklist

For each test point:

- [ ] All text is readable (not too small, not truncated)
- [ ] All touch targets are minimum 44x44px
- [ ] Container padding is consistent (12px mobile, 24px desktop)
- [ ] Grid columns are appropriate (1 mobile → 2 tablet → 3+ desktop)
- [ ] No horizontal scrolling
- [ ] Images/media scale appropriately
- [ ] Navigation is accessible
- [ ] Dialogs/modals fit on screen
- [ ] Forms are usable (inputs not too small)
- [ ] Buttons are large enough to tap accurately

### Browser DevTools Testing

**Chrome DevTools**:
1. Open DevTools (F12)
2. Toggle device toolbar (Ctrl+Shift+M)
3. Select "Responsive"
4. Enter exact width (e.g., 375px)
5. Test at each breakpoint

**Responsive Design Mode shortcuts**:
- `Ctrl+Shift+M` (Windows/Linux)
- `Cmd+Opt+M` (Mac)

## Common Responsive Patterns

### Show/Hide Based on Screen Size

```css
/* Show only on mobile */
.mobile-only {
  display: block;
}

@media (min-width: 1024px) {
  .mobile-only {
    display: none;
  }
}

/* Show only on desktop */
.desktop-only {
  display: none;
}

@media (min-width: 1024px) {
  .desktop-only {
    display: block;
  }
}
```

### Fluid Typography

```css
/* Scales between 14px and 16px based on viewport */
.fluid-text {
  font-size: clamp(0.875rem, 2vw, 1rem);
}
```

**Use sparingly** - prefer explicit breakpoints for predictable sizing.

### Aspect Ratio Containers

```css
.video-container {
  aspect-ratio: 16 / 9;
  width: 100%;
}

.square-image {
  aspect-ratio: 1 / 1;
  width: 100%;
}
```

### Flexible Images

```css
.responsive-image {
  max-width: 100%;
  height: auto;
  display: block;
}
```

## Accessibility Considerations

### Reduced Motion

```css
@media (prefers-reduced-motion: reduce) {
  .animated-component {
    animation: none;
    transition: none;
  }

  .scrolling-banner {
    animation-play-state: paused;
  }
}
```

**ALWAYS include this** for animated components.

### High Contrast Mode

```css
@media (prefers-contrast: high) {
  .component {
    border: 2px solid currentColor;  /* Ensure visible borders */
  }
}
```

### Orientation Changes

```css
/* Landscape phones - different from tablet landscape */
@media (max-height: 600px) and (orientation: landscape) {
  .header {
    height: var(--token-space-4xl);  /* Shorter header */
  }
}
```

## Performance Optimization

### Lazy Loading Images

```tsx
<img
  src={imageSrc}
  loading="lazy"
  alt="Description"
/>
```

### Conditional Loading

Load desktop-only features conditionally:

```tsx
const isDesktop = window.matchMedia('(min-width: 1024px)').matches;

{isDesktop && <DesktopFeature />}
```

### Responsive Images

Use `srcset` for different screen densities:

```html
<img
  src="image-1x.jpg"
  srcset="image-1x.jpg 1x, image-2x.jpg 2x"
  alt="Description"
/>
```

## Common Mistakes to Avoid

❌ **DON'T:**

```css
/* Desktop-first approach */
@media (max-width: 1023px) { }

/* Random breakpoints */
@media (min-width: 850px) { }

/* Hardcoded spacing */
.component { padding: 12px; }

/* Fixed widths */
.container { width: 1200px; }

/* Multiple media query blocks for same breakpoint */
@media (min-width: 1024px) { .foo { } }
/* ... 500 lines later ... */
@media (min-width: 1024px) { .bar { } }  /* ❌ Consolidate! */
```

✅ **DO:**

```css
/* Mobile-first approach */
@media (min-width: 1024px) { }

/* Standard breakpoints only */
@media (min-width: 640px) { }
@media (min-width: 1024px) { }

/* Design tokens */
.component { padding: var(--token-space-lg); }

/* Flexible widths */
.container { max-width: 1440px; width: 100%; }

/* Consolidated media queries */
@media (min-width: 1024px) {
  .foo { }
  .bar { }
  /* All 1024px+ styles in ONE block */
}
```

## Pre-Commit Checklist

Before committing responsive changes:

- [ ] Tested at 375px, 768px, 1024px, 1440px
- [ ] Mobile-first approach used (min-width media queries)
- [ ] Standard breakpoints only (640px, 1024px, 1440px)
- [ ] Container padding follows 12px/24px system
- [ ] Touch targets are minimum 44x44px
- [ ] Typography scales appropriately
- [ ] Grid columns adjust correctly
- [ ] No horizontal scrolling at any breakpoint
- [ ] Media queries consolidated (one block per breakpoint)
- [ ] Design tokens used (no hardcoded spacing)
- [ ] Reduced motion support for animations
- [ ] Light and dark themes work at all sizes
- [ ] Navigation is accessible on mobile
- [ ] Dialogs/modals fit on mobile screens

## Quick Reference

### Spacing Progression

| Element | Mobile | Desktop |
|---------|--------|---------|
| Container padding | 12px (`--token-space-lg`) | 24px (`--token-space-3xl`) |
| Card padding | 12px | 16px (`--token-space-xl`) |
| Section gap | 8px (`--token-space-md`) | 12px (`--token-space-lg`) |
| Grid gap | 12px | 16px |

### Grid Columns

| Screen | Columns | Use Case |
|--------|---------|----------|
| Mobile (< 640px) | 1 | Full width cards |
| Tablet (640px+) | 2 | Side-by-side cards |
| Desktop (1024px+) | 3 | Grid layout |
| Large (1440px+) | 4 | Wide monitors |

### Typography Scaling

| Element | Mobile | Desktop |
|---------|--------|---------|
| H1 | 20px (`--token-font-2xl`) | 24px (`--token-font-3xl`) |
| H2 | 18px (`--token-font-xl`) | 20px (`--token-font-2xl`) |
| Body | 14px (`--token-font-md`) | 16px (`--token-font-lg`) |
| Small | 12px (`--token-font-sm`) | 14px (`--token-font-md`) |

---

**Remember**: Mobile-first, design tokens, test at all breakpoints, and consolidate media queries!
