# CSS Pre-Commit Checklist

Run this checklist **before committing any CSS changes** to ensure design system compliance.

## Design Token Usage

- [ ] **All spacing uses design tokens** (no hardcoded px/rem values)
  - ✅ `padding: var(--token-space-lg);`
  - ❌ `padding: 12px;`

- [ ] **All colors use design tokens** (no hardcoded hex/rgb values)
  - ✅ `color: var(--token-text-secondary);`
  - ❌ `color: #374151;`

- [ ] **All font sizes use tokens** (no hardcoded values)
  - ✅ `font-size: var(--token-font-md);`
  - ❌ `font-size: 14px;`

- [ ] **All border-radius uses tokens**
  - ✅ `border-radius: var(--token-radius-md);`
  - ❌ `border-radius: 8px;`

- [ ] **All shadows use tokens**
  - ✅ `box-shadow: var(--token-shadow-sm);`
  - ❌ `box-shadow: 0 1px 3px rgba(0,0,0,0.1);`

## Mobile-First Responsive Design

- [ ] **Base styles target mobile** (NO media query wrapper)
  ```css
  /* ✅ Correct */
  .component {
    padding: var(--token-space-lg); /* Mobile base */
  }

  /* ❌ Wrong */
  @media (max-width: 640px) {
    .component { padding: 12px; }
  }
  ```

- [ ] **Media queries use min-width** (not max-width)
  - ✅ `@media (min-width: 640px)`
  - ❌ `@media (max-width: 640px)`

- [ ] **Media queries are consolidated** (ONE block per breakpoint per file)
  ```css
  /* ✅ Correct */
  @media (min-width: 640px) {
    .component-a { }
    .component-b { }
    .component-c { }
  }

  /* ❌ Wrong - scattered */
  @media (min-width: 640px) { .component-a { } }
  ... 50 lines later ...
  @media (min-width: 640px) { .component-b { } }
  ```

- [ ] **Breakpoints use standard values**
  - Tablet: `640px`
  - Desktop: `1024px`
  - Large: `1440px`

## Horizontal Alignment

- [ ] **Container padding matches standard**
  - Mobile: `var(--token-space-lg)` (12px)
  - Desktop: `var(--token-space-3xl)` (24px)

- [ ] **All sections use same horizontal padding**
  ```css
  .header { padding: 0 var(--token-space-lg); }
  .content { padding: 0 var(--token-space-lg); }
  .footer { padding: 0 var(--token-space-lg); }
  ```

- [ ] **Nested sections don't add extra padding**
  - Padding should be on container, not every section

## Semantic Class Naming

- [ ] **Class names are semantic** (not utility-first)
  - ✅ `.class-card`, `.status-badge`, `.entry-list-item`
  - ❌ `.flex-col`, `.gap-4`, `.text-sm`, `.bg-blue-500`

- [ ] **BEM-style modifiers use double-dash**
  - ✅ `.button--primary`, `.status-badge--in-progress`
  - ❌ `.button-primary`, `.status_badge_in_progress`

- [ ] **Names describe purpose, not appearance**
  - ✅ `.status-badge` (purpose: show status)
  - ❌ `.green-pill` (appearance)

## Specificity & !important

- [ ] **Zero !important declarations** (except in utilities.css)
  - ❌ `.component { color: red !important; }`
  - ✅ Utility classes only: `.sr-only { position: absolute !important; }`

- [ ] **Selectors have low specificity**
  - ✅ `.button`, `.card-header`
  - ❌ `div.container .card .button.primary`

- [ ] **No ID selectors**
  - ❌ `#header { }`
  - ✅ `.page-header { }`

## File Organization

- [ ] **CSS is in correct file**
  - Page-specific → page CSS file
  - Reusable pattern → shared-components.css
  - Simple component → shared-ui.css
  - Complex component → own CSS file (if 100+ lines)

- [ ] **File follows standard structure**
  1. CSS variables (if needed)
  2. Base/mobile styles
  3. Tablet media query (ONE block)
  4. Desktop media query (ONE block)
  5. Accessibility
  6. Dark theme (if needed)

- [ ] **No duplicate/redundant files created**
  - Did you check if pattern already exists?
  - Could you use shared CSS instead?

## Dark Theme Support

- [ ] **Design tokens handle theme switching**
  - ✅ `background: var(--card);` (auto-switches)
  - ❌ Manual theme classes unless absolutely necessary

- [ ] **Tested in both light AND dark mode**
  - Contrast is sufficient
  - Colors are readable
  - Borders are visible

## Accessibility

- [ ] **Reduced motion support added**
  ```css
  @media (prefers-reduced-motion: reduce) {
    .component {
      animation: none;
      transition: none;
    }
  }
  ```

- [ ] **Focus states are visible**
  ```css
  .button:focus-visible {
    outline: 2px solid var(--primary);
    outline-offset: 2px;
  }
  ```

- [ ] **Touch targets meet minimum size**
  - Interactive elements: min 44x44px
  - Use `--min-touch-target` token

- [ ] **Color contrast meets WCAG AA**
  - Text on background: 4.5:1 ratio minimum
  - Status colors have sufficient contrast

## Testing Matrix

- [ ] **Tested at mobile breakpoint** (375px)
  - Layout works
  - Text is readable
  - Buttons are tappable

- [ ] **Tested at tablet breakpoint** (768px)
  - Layout adapts correctly
  - No awkward gaps or overflow

- [ ] **Tested at desktop breakpoint** (1024px)
  - Container padding is correct (24px)
  - Layout uses available space well

- [ ] **Tested at large breakpoint** (1440px)
  - Content doesn't stretch too wide
  - Layout remains balanced

- [ ] **Tested with theme toggle**
  - Light mode works
  - Dark mode works
  - Transition is smooth

- [ ] **Tested with reduced motion**
  - Animations disabled
  - No jarring transitions

## Common Pitfalls Check

- [ ] **No hardcoded values**
  - Check for: `px`, `rem`, `#hexcolors`, `rgb()`
  - Replace with: design tokens

- [ ] **No scattered media queries**
  - Each breakpoint = ONE block per file

- [ ] **No max-width media queries**
  - Mobile-first = min-width only

- [ ] **No overly specific selectors**
  - Keep it simple: single class names

- [ ] **No new tiny CSS files**
  - Component < 100 lines = use shared CSS

- [ ] **No utility-first classes**
  - This is not Tailwind!

## Performance

- [ ] **Animations use transform/opacity** (GPU-accelerated)
  - ✅ `transform: translateY(-2px);`
  - ❌ `top: -2px;` (causes reflow)

- [ ] **Transitions only on specific properties**
  - ✅ `transition: transform 0.3s;`
  - ❌ `transition: all 0.3s;` (expensive)

- [ ] **No excessive nesting** (max 3 levels)
  - ✅ `.card .header .title`
  - ❌ `.page .container .card .content .header .title .text`

## Documentation

- [ ] **Complex patterns have comments**
  ```css
  /* Corner Badge - Positioned in top-right */
  .corner-badge { }
  ```

- [ ] **Section headers for organization**
  ```css
  /* ===== STATUS BADGES ===== */
  ```

- [ ] **Unusual values are explained**
  ```css
  /* Offset for header height (64px) + padding (16px) */
  margin-top: 80px;
  ```

## Final Checks

- [ ] **Run TypeScript typecheck** (`npm run typecheck`)
- [ ] **Run linter** (`npm run lint`)
- [ ] **Review git diff** for unintended changes
- [ ] **Test in actual browser** (not just dev tools)
- [ ] **Ask: "Does this follow existing patterns?"**

---

## Quick Reference: Most Common Issues

1. **Hardcoded spacing** → Use `var(--token-space-*)`
2. **Hardcoded colors** → Use `var(--token-text-*)` or `var(--status-*)`
3. **Scattered media queries** → Consolidate into ONE block per breakpoint
4. **Max-width queries** → Change to min-width (mobile-first)
5. **Creating tiny CSS files** → Use shared CSS instead

---

**If you checked all boxes** ✅ → You're ready to commit!

**If you found issues** ⚠️ → Fix them before committing

**When in doubt** 🤔 → Check existing patterns in similar components
