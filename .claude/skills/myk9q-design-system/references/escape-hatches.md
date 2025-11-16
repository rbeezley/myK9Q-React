# Design System Escape Hatches

Sometimes you need to deviate from the design system. This guide explains **when it's okay** and **how to do it properly**.

## When Deviations Are Acceptable

### 1. Third-Party Library Integration

**Valid Case**: External component library requires specific styling.

```css
/* ✅ OKAY - Document the reason */
/* Third-party calendar widget requires exact color match */
.react-calendar {
  background: #f0f0f0; /* Library default - do not change */
}
```

**How to document**:
```css
/* [DESIGN-SYSTEM-EXCEPTION: third-party]
 * Library: react-calendar v2.0
 * Reason: Component breaks with CSS variables
 * Approved: 2024-01-15
 */
```

---

### 2. Browser-Specific Workarounds

**Valid Case**: Browser bug requires precise value.

```css
/* ✅ OKAY - Document the browser bug */
/* Safari iOS bug: Requires exact 1px to prevent rendering glitch */
.ios-fix {
  border-bottom: 1px solid var(--border);
  transform: translateZ(0); /* Force GPU rendering */
}
```

**How to document**:
```css
/* [DESIGN-SYSTEM-EXCEPTION: browser-bug]
 * Browser: Safari iOS 15.x
 * Bug: https://bugs.webkit.org/show_bug.cgi?id=12345
 * Can remove after: iOS 16 adoption > 95%
 */
```

---

### 3. Animation Timing Precision

**Valid Case**: Animation requires precise timing that doesn't fit tokens.

```css
/* ✅ OKAY - Precise animation timing */
/* Staggered animation: Each item delayed by 50ms */
.animated-item:nth-child(1) { animation-delay: 0ms; }
.animated-item:nth-child(2) { animation-delay: 50ms; }
.animated-item:nth-child(3) { animation-delay: 100ms; }
```

**How to document**:
```css
/* [DESIGN-SYSTEM-EXCEPTION: animation-precision]
 * Reason: Staggered animation requires precise 50ms increments
 * Design tokens are too coarse for this effect
 */
```

---

### 4. Designer-Approved Visual Exceptions

**Valid Case**: Designer specifically requested a unique effect.

```css
/* ✅ OKAY - Designer exception */
/* [DESIGN-SYSTEM-EXCEPTION: designer-approved]
 * Designer: Jane Doe
 * Approved: 2024-11-10
 * Reason: Hero section requires unique gradient not in design system
 */
.hero-gradient {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}
```

**Documentation required**:
- Designer name and date
- Reason for exception
- Link to design file (Figma, etc.)

---

### 5. Performance Optimization

**Valid Case**: Specific value improves performance measurably.

```css
/* ✅ OKAY - Performance optimization */
/* [DESIGN-SYSTEM-EXCEPTION: performance]
 * Reason: will-change with transform performs 30% better than CSS variable
 * Benchmark: https://jsperf.com/...
 * Approved: Engineering lead, 2024-11-05
 */
.high-performance-animation {
  will-change: transform;
  transform: translateX(10px); /* Hardcoded for GPU optimization */
}
```

---

### 6. Legacy Code During Migration

**Valid Case**: Old component being incrementally refactored.

```css
/* ✅ OKAY - Migration in progress */
/* [DESIGN-SYSTEM-EXCEPTION: legacy-migration]
 * Component: LegacyDashboard.css
 * Migration ticket: TICKET-1234
 * Scheduled for: Q1 2025
 * DO NOT ADD NEW VIOLATIONS - only refactor existing code
 */
```

---

## How to Add Exceptions

### Option 1: Inline Comment (Preferred)

Add a structured comment above the violation:

```css
/* [DESIGN-SYSTEM-EXCEPTION: category]
 * Reason: Clear explanation
 * Approved: Date and approver
 * Ticket: JIRA-123 (if applicable)
 */
.component {
  /* Your exception here */
}
```

**Categories**:
- `third-party` - External library integration
- `browser-bug` - Browser-specific workaround
- `animation-precision` - Precise timing requirements
- `designer-approved` - Design exception
- `performance` - Performance optimization
- `legacy-migration` - Code being refactored

---

### Option 2: .auditignore File

Add to `.claude/skills/myk9q-design-system/tools/.auditignore`:

```
# Format: filename:line-number:reason
src/components/ThirdPartyWidget.css:45:Third-party library requires exact RGB value

# Or ignore entire file during migration
src/components/LegacyDashboard.css:*:Legacy component - TICKET-1234 - Q1 2025 refactor
```

---

## When Deviations Are NOT Acceptable

### ❌ "I didn't know about the design token"

**Wrong**:
```css
.my-component {
  padding: 12px; /* I didn't know about tokens */
}
```

**Right**:
```css
.my-component {
  padding: var(--token-space-lg); /* 12px */
}
```

**Fix**: Learn the design system, use the reference docs.

---

### ❌ "It was easier this way"

**Wrong**:
```css
.my-component {
  background: #007AFF; /* Easier than looking up the token */
}
```

**Right**:
```css
.my-component {
  background: var(--primary);
}
```

**Fix**: Use design tokens - it's actually easier in the long run.

---

### ❌ "I wanted a slightly different shade"

**Wrong**:
```css
.my-component {
  color: #0066CC; /* Slightly darker than --primary */
}
```

**Right**:
1. Use existing token that's closest
2. If truly needed, propose new token to design system
3. Add to `design-tokens.css` with proper naming

**Fix**: Don't create one-off colors. Maintain consistency.

---

### ❌ "The design system is wrong"

If you genuinely believe the design system has a problem:

1. **Don't just work around it** - that creates inconsistency
2. **Document the issue** - Open a discussion with the team
3. **Propose a fix** - Suggest improvement to design system
4. **Get approval** - Team agrees to change design system
5. **Update design-tokens.css** - Make it official

**Process**:
```markdown
1. Create GitHub issue: "Design System Issue: [description]"
2. Explain the problem and proposed solution
3. Get team/designer approval
4. Update design-tokens.css
5. Update all instances across codebase
6. Update documentation
```

---

## Rollback Strategy: If Design System Fix Breaks Something

### Scenario: You fixed violations but now something looks wrong

**Step 1: Identify the Issue**
```bash
# Find what changed
git diff HEAD~1

# Check specific file
git diff HEAD~1 src/components/MyComponent.css
```

**Step 2: Determine Root Cause**

**Possible causes**:
1. **Design token was incorrect** - The token doesn't match what was hardcoded
2. **Context-specific styling** - Component needs different value than token provides
3. **Browser rendering difference** - CSS variable renders differently
4. **Cascade/specificity issue** - Token has lower specificity

**Step 3: Choose Fix Strategy**

#### Fix 1: Design Token is Wrong

```css
/* Before (hardcoded) */
.component { padding: 14px; }

/* After (using token) */
.component { padding: var(--token-space-lg); } /* 12px - looks too tight! */

/* Problem: Token value is incorrect for this use case */
```

**Solution**: Add a new token

```css
/* design-tokens.css */
--token-space-lg: 0.75rem;     /* 12px - general use */
--token-space-lg-plus: 0.875rem; /* 14px - specific use case */
```

```css
/* Component */
.component { padding: var(--token-space-lg-plus); }
```

---

#### Fix 2: Component Needs Exception

```css
/* Component genuinely needs a value not in design system */

/* Add documented exception */
/* [DESIGN-SYSTEM-EXCEPTION: designer-approved]
 * Designer: John Doe, 2024-11-16
 * Reason: This specific button needs 14px padding for optical alignment
 * with adjacent 48px icon
 */
.special-button {
  padding: 0.875rem; /* 14px - not available in design system */
}
```

---

#### Fix 3: Specificity Issue

```css
/* Before */
.component { padding: 12px !important; }

/* After (using token) - doesn't work! */
.component { padding: var(--token-space-lg); } /* Gets overridden */

/* Problem: Removing !important exposed specificity issue */
```

**Solution**: Fix specificity properly

```css
/* Option A: Increase specificity naturally */
.parent .component {
  padding: var(--token-space-lg);
}

/* Option B: Restructure CSS to avoid override */
/* Remove the conflicting rule */
```

---

#### Fix 4: CSS Variable Rendering Bug

```css
/* Very rare: Browser renders var() differently than static value */

/* If this happens, document thoroughly */
/* [DESIGN-SYSTEM-EXCEPTION: browser-bug]
 * Browser: Safari 15.x
 * Bug: CSS variable in transform renders 1px off
 * Ticket: BUG-5678
 * Remove after: Safari 16 adoption > 95%
 */
.component {
  transform: translateX(10px); /* Cannot use var(--token-space-md) due to bug */
}
```

---

### Step 4: Temporary Rollback if Needed

If the fix breaks critical functionality:

```bash
# Revert specific file
git checkout HEAD~1 src/components/MyComponent.css

# Or revert entire commit
git revert HEAD
```

Then:
1. Document the issue
2. Investigate root cause
3. Apply proper fix (one of the strategies above)
4. Re-commit with documentation

---

## Best Practices for Exceptions

### 1. Always Document

```css
/* ❌ BAD - No explanation */
.component {
  padding: 14px;
}

/* ✅ GOOD - Clear reasoning */
/* [DESIGN-SYSTEM-EXCEPTION: designer-approved]
 * Designer: Jane Smith, 2024-11-16
 * Reason: Optical alignment with 48px icon requires 14px padding
 * Design file: https://figma.com/file/abc123
 */
.component {
  padding: 0.875rem; /* 14px */
}
```

---

### 2. Add to .auditignore

```
# .auditignore
src/components/SpecialButton.css:45:Designer-approved optical alignment (Jane Smith, 2024-11-16)
```

This prevents future audits from flagging it as a violation.

---

### 3. Set Expiration Dates

```css
/* [DESIGN-SYSTEM-EXCEPTION: browser-bug]
 * Remove after: Safari 16 adoption > 95% (check Q2 2025)
 * Ticket: TECH-DEBT-456
 */
```

Create a tech debt ticket to revisit the exception later.

---

### 4. Limit Scope

```css
/* ❌ BAD - Exception affects entire file */
/* Just use hardcoded values throughout this file */

/* ✅ GOOD - Exception is scoped to specific rule */
.specific-component-that-needs-exception {
  /* [DESIGN-SYSTEM-EXCEPTION: reason] */
  padding: 14px;
}

/* Rest of file uses design tokens */
.other-component {
  padding: var(--token-space-lg);
}
```

---

## Review Process for Exceptions

Before approving an exception:

1. **Is there an existing token?** - Check design-tokens.css thoroughly
2. **Can we add a new token?** - Would this value be useful elsewhere?
3. **Is this temporary?** - Set expiration date and tech debt ticket
4. **Is it documented?** - Clear reason and approval
5. **Is scope limited?** - Only affects what's necessary

---

## Quick Decision Tree

```
Do I need to deviate from design system?
│
├─ NO → Use design tokens ✅
│
└─ YES → Why?
    │
    ├─ Third-party library → Document + .auditignore ✅
    ├─ Browser bug → Document + ticket + expiration ✅
    ├─ Performance → Benchmark + document ✅
    ├─ Designer approved → Get approval + document ✅
    ├─ Legacy migration → Ticket + deadline ✅
    │
    └─ Just easier/faster → ❌ NOT ACCEPTABLE - use design tokens
```

---

**Remember**: Exceptions should be **rare** and **well-documented**. The design system exists to maintain consistency and reduce decisions. When in doubt, follow the system!
