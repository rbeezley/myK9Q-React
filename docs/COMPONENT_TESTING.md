# Component Testing Guide

## Visual Testing Checklist

### Before Making Layout/Style Changes

1. **Document Current State**
   - Take screenshots of the component in all states
   - Note down the current behavior
   - Identify what needs to change and why

2. **Create Test Plan**
   - List all status states to test
   - List all viewport sizes to test
   - List all user interactions to test

### DogDetails Page Testing Matrix

| Test Case | Status | Viewport | Expected Behavior | ✓ |
|-----------|--------|----------|-------------------|---|
| Not Checked In | `none` | Mobile (375px) | Gray left border, gray status button | |
| Not Checked In | `none` | Desktop (1920px) | Gray left border, gray status button | |
| Checked In | `checked-in` | Mobile | Green left border, green button | |
| Checked In | `checked-in` | Desktop | Green left border, green button | |
| At Gate | `at-gate` | Mobile | Purple left border, purple button | |
| At Gate | `at-gate` | Desktop | Purple left border, purple button | |
| In Ring | `in-ring` | Mobile | Blue left border, blue button | |
| In Ring | `in-ring` | Desktop | Blue left border, blue button | |
| Pulled | `pulled` | Mobile | Red left border, red button | |
| Pulled | `pulled` | Desktop | Red left border, red button | |
| Qualified | `qualified` | Mobile | Gold border, gold gradient button | |
| Qualified | `qualified` | Desktop | Gold border, gold gradient button | |
| Not Qualified | `not-qualified` | Mobile | Red border, red button | |
| Not Qualified | `not-qualified` | Desktop | Red border, red button | |

### Manual Testing Steps

1. **Status Display Tests**
   ```bash
   # Navigate to dog details page
   http://localhost:5175/dog/{armband}

   # Check each status state:
   # - Not Checked In (gray)
   # - Checked-in (green)
   # - At Gate (purple)
   # - In Ring (blue)
   # - Conflict (amber)
   # - Pulled (red)
   # - Completed (green)
   # - Qualified (gold)
   # - Not Qualified (red)
   ```

2. **Layout Tests**
   - Position badge and class name are on same horizontal line
   - Status button is in top-right corner, aligned with position badge
   - Metadata (date, trial, judge) is on single line below class name
   - Stats (time, faults) appear on third line for scored entries
   - Left accent border matches status button color
   - Left accent border follows rounded corners (no straight edges)

3. **Responsive Tests**
   ```javascript
   // Chrome DevTools → Toggle Device Toolbar
   // Test these viewports:
   - iPhone SE (375x667)
   - iPhone 12 Pro (390x844)
   - iPad (768x1024)
   - Desktop (1920x1080)
   ```

4. **Interaction Tests**
   - Click status button → dialog opens
   - Change status → card updates immediately
   - Hover over card → shadow appears, slight lift
   - Long text → truncates properly (no overflow)

5. **Dark Mode Tests**
   - Toggle theme button
   - Verify colors have sufficient contrast
   - Verify accent borders are visible
   - Verify text is readable

### Automated Testing (Future)

```typescript
// Example Playwright test
import { test, expect } from '@playwright/test';

test.describe('DogDetails Page', () => {
  test('displays correct status colors', async ({ page }) => {
    await page.goto('/dog/100');

    // Check left accent border color
    const card = page.locator('.class-card.at-gate').first();
    const borderColor = await card.evaluate((el) =>
      getComputedStyle(el).borderLeftColor
    );
    expect(borderColor).toBe('rgb(139, 92, 246)'); // Purple

    // Check status button color
    const button = card.locator('.status-button.at-gate');
    const bgColor = await button.evaluate((el) =>
      getComputedStyle(el).backgroundColor
    );
    expect(bgColor).toBe('rgb(139, 92, 246)'); // Purple
  });

  test('layout is compact and aligned', async ({ page }) => {
    await page.goto('/dog/100');

    const card = page.locator('.class-card').first();

    // Check position badge and class name are aligned
    const badge = card.locator('.class-position');
    const className = card.locator('.class-name');

    const badgeBox = await badge.boundingBox();
    const nameBox = await className.boundingBox();

    // Should be on same horizontal line (within 10px tolerance)
    expect(Math.abs(badgeBox!.y - nameBox!.y)).toBeLessThan(10);
  });
});
```

## Component Snapshot Testing

### Taking Visual Snapshots

```bash
# 1. Navigate to the component in browser
# 2. Open DevTools (F12)
# 3. Take full-page screenshot
#    - Chrome: Cmd/Ctrl + Shift + P → "Capture full size screenshot"
#    - Firefox: Right-click → "Take a Screenshot" → "Save full page"

# Save to: docs/screenshots/[component-name]-[date].png
```

### Comparing Snapshots

Use tools like:
- [Pixelmatch](https://github.com/mapbox/pixelmatch) for pixel-by-pixel comparison
- [Percy](https://percy.io/) for automated visual testing
- [Chromatic](https://www.chromatic.com/) for Storybook visual regression

## CSS Testing Checklist

### Before Committing CSS Changes

- [ ] All inline styles extracted to CSS classes (or documented why they're inline)
- [ ] No `!important` except for utility classes
- [ ] All colors use CSS variables
- [ ] Tested in light and dark mode
- [ ] Tested on mobile, tablet, desktop
- [ ] No horizontal scroll
- [ ] Text doesn't overflow containers
- [ ] Touch targets are 44px+ on mobile
- [ ] HMR working (changes hot-reload in browser)
- [ ] TypeScript compiles without errors: `npm run typecheck`
- [ ] No console errors or warnings
- [ ] Accent borders/decorations respect rounded corners

### Common CSS Bugs to Watch For

1. **Overflow Issues**
   ```css
   /* ❌ BAD - Clips accent borders */
   .card {
     overflow: hidden;
   }
   .card::before {
     position: absolute;
     left: -4px; /* Gets clipped! */
   }

   /* ✅ GOOD - Uses native border */
   .card {
     overflow: hidden;
     border-left: 4px solid var(--accent);
   }
   ```

2. **Flexbox Text Truncation**
   ```css
   /* ❌ BAD - Text doesn't truncate */
   .flex-item {
     flex: 1;
   }

   /* ✅ GOOD - Text truncates properly */
   .flex-item {
     flex: 1;
     min-width: 0; /* Critical! */
   }
   ```

3. **Z-Index Stacking**
   ```css
   /* ❌ BAD - Z-index war */
   .element1 { z-index: 999; }
   .element2 { z-index: 9999; }
   .element3 { z-index: 99999; }

   /* ✅ GOOD - Organized scale */
   .element1 { z-index: 10; }
   .element2 { z-index: 20; }
   .element3 { z-index: 30; }
   ```

4. **Specificity Issues**
   ```css
   /* ❌ BAD - Too specific */
   .page .container .card .button.primary {
     background: blue;
   }

   /* ✅ GOOD - Minimal specificity */
   .button.primary {
     background: blue;
   }
   ```

## Debugging CSS Issues

### Issue: Styles not applying

1. **Check specificity**
   ```javascript
   // In browser DevTools console:
   const el = document.querySelector('.my-element');
   const styles = getComputedStyle(el);
   console.log(styles.backgroundColor); // See what's actually applied
   ```

2. **Check if class is applied**
   ```javascript
   // In React DevTools:
   // Select element → Check props → className
   ```

3. **Check CSS file is imported**
   ```typescript
   // Component file should have:
   import './MyComponent.css';
   ```

### Issue: HMR not working

1. **Hard refresh**: Ctrl+Shift+R
2. **Restart dev server**
3. **Check Vite output** for HMR messages
4. **Clear browser cache**

### Issue: Layout shifting/jumping

1. **Add explicit dimensions**
   ```css
   .card-position {
     width: 48px;
     height: 48px;
   }
   ```

2. **Use `min-height` for dynamic content**
   ```css
   .card-content {
     min-height: 48px;
   }
   ```

3. **Prevent FOUC** (Flash of Unstyled Content)
   ```css
   /* Hide until loaded */
   .component:not(.loaded) {
     opacity: 0;
   }

   .component.loaded {
     opacity: 1;
     transition: opacity 0.3s;
   }
   ```

## Git Workflow for CSS Changes

### Branch Naming
```bash
git checkout -b fix/dog-details-layout
git checkout -b feat/status-accent-borders
git checkout -b refactor/extract-inline-styles
```

### Commit Messages
```bash
# Good commit messages:
git commit -m "Fix: DogDetails status button alignment"
git commit -m "Style: Add colored left accent borders to class cards"
git commit -m "Refactor: Extract inline styles to CSS classes"

# Include before/after screenshots in PR description
```

### Code Review Checklist

When reviewing CSS changes:
- [ ] Screenshots provided showing before/after
- [ ] All status states tested
- [ ] Mobile responsive tested
- [ ] Dark mode tested
- [ ] No inline styles (or justified)
- [ ] CSS variables used for colors
- [ ] No `!important` (or justified)
- [ ] TypeScript compiles
- [ ] No console errors

## Resources

- [CLAUDE.md](../CLAUDE.md) - Project tech stack and commands
- [CSS_ARCHITECTURE.md](./CSS_ARCHITECTURE.md) - CSS patterns and standards
- [Chrome DevTools CSS Debugging](https://developer.chrome.com/docs/devtools/css/)
- [Firefox DevTools CSS](https://firefox-source-docs.mozilla.org/devtools-user/page_inspector/how_to/examine_and_edit_css/)
