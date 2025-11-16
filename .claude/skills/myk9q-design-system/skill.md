# myK9Q Design System

## Overview

The myK9Q Design System skill provides comprehensive guidelines, patterns, and components for building consistent, accessible, and high-quality UI in the myK9Q React application. This skill enforces the established design patterns, semantic CSS architecture, and mobile-first responsive design principles.

## When to Use This Skill

Invoke this skill when:
- Creating new UI components or pages
- Modifying existing component styles
- Adding new features that require UI work
- Ensuring design system compliance during code reviews
- Onboarding to the myK9Q codebase
- Debugging layout or styling issues
- Planning CSS refactoring or improvements

## Core Design Principles

### 1. **Semantic CSS Architecture**
- **NO utility-first CSS** (not Tailwind-style)
- Semantic class names that describe purpose (`.class-card`, `.status-badge`)
- Design tokens via CSS variables for ALL spacing, colors, typography
- Consolidated CSS files (30 total, not 100+)
- ONE media query block per breakpoint per file

### 2. **Mobile-First Responsive Design**
- Base styles target mobile (375px+)
- Progressive enhancement for larger screens
- Breakpoints: 640px (tablet), 1024px (desktop), 1440px (large)
- Horizontal alignment: 12px mobile (`--token-space-lg`), 24px desktop (`--token-space-3xl`)

### 3. **Design Token System**
- **NEVER hardcode** values (colors, spacing, fonts)
- Always use CSS variables from `design-tokens.css`
- Zero `!important` declarations (except utility classes)
- Consistent spacing scale (2px, 4px, 8px, 12px, 16px, 20px, 24px, 32px)

### 4. **Accessibility First**
- WCAG AA compliance minimum
- Semantic HTML elements (`<nav>`, `<main>`, `<article>`)
- Proper ARIA labels and roles
- Touch targets minimum 44x44px
- `prefers-reduced-motion` support for all animations

## Core Capabilities

### 1. Design Token Reference (`references/design-tokens.md`)

Complete reference of all CSS variables used throughout the application:
- **Spacing tokens** (--token-space-xs through --token-space-4xl)
- **Color system** (theme colors, status colors, semantic colors)
- **Typography** (font sizes, weights, line heights)
- **Shadows, borders, radii**
- **Z-index scale**

**When to reference**: Before writing any CSS, when choosing spacing/colors, when creating new components.

### 2. CSS Architecture Guidelines (`references/css-architecture.md`)

Comprehensive rules for writing CSS in myK9Q:
- File organization patterns (page CSS, component CSS, shared CSS)
- Mobile-first media query structure
- When to create new CSS files vs. using shared styles
- Media query consolidation rules
- CSS specificity best practices
- Common pitfalls and how to avoid them

**When to reference**: When creating new CSS files, refactoring styles, resolving specificity issues.

### 3. Component Patterns (`references/component-patterns.md`)

Library of established UI patterns with examples:
- **Card patterns** (class cards, dog cards, info cards)
- **Badge patterns** (status badges, count badges, corner badges)
- **Button patterns** (primary, secondary, icon buttons)
- **Dialog patterns** (settings dialogs, confirmation dialogs)
- **Form patterns** (inputs, toggles, datetime pickers)
- **Layout patterns** (page containers, sections, grids)

**When to reference**: When building new components, ensuring consistency across similar UI elements.

### 4. Status & Color System (`references/status-colors.md`)

Complete status color system used throughout the app:
- Entry status colors (not-checked-in, checked-in, at-gate, in-ring, done, pulled)
- Class status colors (no-status, setup, briefing, break, start-time, in-progress, completed)
- Result status colors (qualified, nq, absent)
- Semantic colors (success, warning, error, info)
- Usage guidelines and accessibility notes

**When to reference**: When displaying status information, adding new status types, ensuring color contrast.

### 5. Responsive Guidelines (`references/responsive-guidelines.md`)

Responsive design rules and breakpoint behavior:
- Container padding at each breakpoint
- Grid column configurations
- Typography scaling
- Touch target sizing
- Testing matrix (which devices/sizes to test)

**When to reference**: When building responsive layouts, debugging mobile issues, planning new pages.

### 6. Component Templates (`assets/`)

Ready-to-use templates for common component types:
- `card-template.tsx` - Standard card component structure
- `status-badge-template.tsx` - Status badge with icon and text
- `dialog-template.tsx` - Dialog/modal following shared-dialog.css patterns
- `page-template.tsx` - Page layout with proper header/content structure
- `form-section-template.tsx` - Form section with proper labels and validation

**When to use**: When creating new components, to ensure they follow established patterns.

### 7. Pre-Commit Checklists (`checklists/`)

Verification checklists before committing changes:
- `css-checklist.md` - CSS pre-commit verification
- `component-checklist.md` - Component quality checklist
- `responsive-checklist.md` - Responsive design verification
- `accessibility-checklist.md` - A11y compliance verification

**When to use**: Before committing CSS changes, after creating new components, during code reviews.

## Workflow for Common Tasks

### Creating a New Component

1. **Choose the right template** from `assets/` (card, dialog, form, etc.)
2. **Reference design tokens** from `references/design-tokens.md`
3. **Follow component patterns** from `references/component-patterns.md`
4. **Apply CSS architecture** rules from `references/css-architecture.md`
5. **Test responsiveness** using `references/responsive-guidelines.md`
6. **Verify with checklist** using `checklists/component-checklist.md`

### Adding New Styles

1. **Check if pattern exists** in `references/component-patterns.md`
2. **Use design tokens** - NEVER hardcode values
3. **Follow mobile-first** - base styles for mobile, enhance for desktop
4. **Consolidate media queries** - one block per breakpoint
5. **Test accessibility** - contrast, focus states, reduced motion
6. **Run CSS checklist** before committing

### Modifying Existing Components

1. **Read the existing code** to understand current patterns
2. **Check component patterns** to ensure consistency
3. **Maintain design token usage** - don't introduce hardcoded values
4. **Test at all breakpoints** (375px, 768px, 1024px, 1440px)
5. **Verify accessibility** hasn't regressed
6. **Run responsive checklist** before committing

### Debugging Layout Issues

1. **Check container padding** alignment (12px mobile, 24px desktop)
2. **Verify media queries** are consolidated (not scattered)
3. **Confirm design tokens** are used correctly
4. **Test at exact breakpoints** (640px, 1024px, 1440px)
5. **Check z-index layering** using established z-index scale
6. **Validate responsive behavior** using testing matrix

## File Organization

### Global Styles (`src/styles/`)
- `design-tokens.css` - All CSS variables
- `shared-components.css` - Reusable component patterns
- `page-container.css` - Page layout system
- `utilities.css` - Utility classes (.sr-only, .truncate)

### Page Styles (`src/pages/*/`)
- **ONE CSS file per page route**
- Contains ONLY page-specific styles
- Common patterns reference shared-components.css

### Component Styles
- **Simple components** (<100 lines): Use `src/components/ui/shared-ui.css`
- **Complex components** (100+ lines): Own CSS file
- **Dialogs**: Use `src/components/dialogs/shared-dialog.css`

## Design Token Quick Reference

### Spacing (Mobile → Desktop)
```css
--token-space-xs: 0.125rem;   /* 2px */
--token-space-sm: 0.25rem;    /* 4px */
--token-space-md: 0.5rem;     /* 8px */
--token-space-lg: 0.75rem;    /* 12px - mobile container padding */
--token-space-xl: 1rem;       /* 16px */
--token-space-2xl: 1.25rem;   /* 20px */
--token-space-3xl: 1.5rem;    /* 24px - desktop container padding */
--token-space-4xl: 2rem;      /* 32px */
```

### Common Status Colors
```css
--status-checked-in: #10b981;
--status-at-gate: #8b5cf6;
--status-in-ring: #3b82f6;
--status-in-progress: #3b82f6;
--status-completed: #10b981;
```

### Breakpoints
```css
/* Mobile: < 640px (base styles, NO media query) */
/* Tablet: @media (min-width: 640px) */
/* Desktop: @media (min-width: 1024px) */
/* Large: @media (min-width: 1440px) */
```

## Common Mistakes to Avoid

❌ **DON'T:**
- Use hardcoded colors or spacing (use design tokens)
- Create multiple media query blocks per breakpoint
- Use `!important` (except in utility classes)
- Use utility-first/Tailwind-style classes
- Create CSS files for simple components (<100 lines)
- Ignore mobile-first approach (desktop-first breaks responsive)

✅ **DO:**
- Always use design tokens (CSS variables)
- Consolidate media queries (one block per breakpoint)
- Use semantic class names (`.class-card`, not `.flex-col-gap-4`)
- Follow established component patterns
- Test at all breakpoints (375px, 768px, 1024px, 1440px)
- Verify accessibility (contrast, focus states, reduced motion)

## Resources Summary

This skill includes:

### references/
- `design-tokens.md` - Complete CSS variable reference
- `css-architecture.md` - CSS writing guidelines and rules
- `component-patterns.md` - Library of established UI patterns
- `status-colors.md` - Status color system and usage
- `responsive-guidelines.md` - Responsive design rules and testing
- `escape-hatches.md` - When and how to deviate from design system

### assets/
- `card-template.tsx` - Card component template
- `status-badge-template.tsx` - Status badge template
- `dialog-template.tsx` - Dialog/modal template
- `page-template.tsx` - Page layout template
- `form-section-template.tsx` - Form section template

### checklists/
- `css-checklist.md` - CSS pre-commit verification
- `component-checklist.md` - Component quality checklist
- `responsive-checklist.md` - Responsive design verification
- `accessibility-checklist.md` - A11y compliance verification

## Integration with Development Workflow

1. **Before starting work**: Reference relevant guides and patterns
2. **During development**: Use templates and follow architecture rules
3. **Before committing**: Run applicable checklists + `npm run audit:design`
4. **During code review**: Verify compliance with design system

## Automated Auditing

The skill includes an automated audit tool to find design system violations:

```bash
# Run design system audit
npm run audit:design
```

**What it checks:**
- ❌ Hardcoded colors (use CSS variables instead)
- ❌ Hardcoded spacing (use design tokens instead)
- ❌ !important usage (except in utilities.css)
- ❌ Hardcoded z-index values (use z-index tokens)
- ❌ Non-standard breakpoints (use 640px, 1024px, 1440px)
- ❌ Desktop-first approach (use mobile-first min-width)
- ❌ Duplicate media query blocks (consolidate per breakpoint)

**Example output:**
```
🎨 myK9Q Design System Audit Report
================================================================================
📁 /src/pages/ClassList/ClassList.css
  Line 45: Use CSS variable (e.g., var(--foreground)) instead of hardcoded color
  background: #ffffff

📊 Summary:
  🟢 hardcoded-color: 1
  🟡 hardcoded-spacing: 8
  Total violations: 9
```

See `tools/README.md` for more details.

## Tips for Success

1. **Start with existing patterns** - Don't reinvent the wheel
2. **Use design tokens religiously** - Never hardcode values
3. **Mobile-first always** - Base styles for mobile, enhance for desktop
4. **Test at real breakpoints** - Use exact px values (640px, 1024px)
5. **Consolidate media queries** - One block per breakpoint per file
6. **Think accessibility first** - Semantic HTML, proper labels, focus states
7. **Reference the checklists** - They catch common mistakes
8. **When in doubt, ask** - Better to clarify than guess wrong

## Example: Adding a New Feature with Planned Start Time

This is a real example from recent work:

**Task**: Add `planned_start_time` field to class cards

**Process**:
1. ✅ Added field to TypeScript interface
2. ✅ Imported Calendar icon from lucide-react
3. ✅ Created formatting helper function
4. ✅ Added UI element conditionally (only if time exists)
5. ✅ Used design tokens for all spacing and colors
6. ✅ Matched existing "Max Time" pattern for consistency
7. ✅ Added CSS following architecture rules:
   - Used semantic class names (`.class-planned-time`)
   - Applied design tokens (no hardcoded values)
   - No media queries needed (inherits responsive behavior)
8. ✅ Ran typecheck before committing
9. ✅ Visual hierarchy: Primary color for emphasis

**Result**: Clean, consistent implementation that follows all design system rules.

---

**Remember**: This skill is your single source of truth for UI development in myK9Q. When in doubt, reference the guides, use the templates, and run the checklists!
