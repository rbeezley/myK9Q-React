# Design System Audit Tools

Tools for auditing and enforcing the myK9Q Design System.

## audit-design-system.js

Scans the codebase for design system violations.

### Usage

```bash
# Run from project root
node .claude/skills/myk9q-design-system/tools/audit-design-system.js
```

### What It Checks

1. **Hardcoded Colors** ❌
   - Detects: `#ffffff`, `rgb()`, `rgba()` values
   - Fix: Use `var(--foreground)`, `var(--primary)`, etc.

2. **Hardcoded Spacing** ❌
   - Detects: `12px`, `1rem` (not in variables)
   - Fix: Use `var(--token-space-lg)`, `var(--token-space-xl)`, etc.

3. **!important Usage** ❌
   - Detects: `!important` (except in utilities.css)
   - Fix: Use proper CSS specificity

4. **Hardcoded Z-Index** ❌
   - Detects: `z-index: 1000`
   - Fix: Use `var(--token-z-modal)`, `var(--token-z-toast)`, etc.

5. **Non-Standard Breakpoints** ❌
   - Detects: Custom breakpoints (not 640px, 1024px, 1440px)
   - Fix: Use standard breakpoints only

6. **Desktop-First Approach** ❌
   - Detects: `max-width` media queries
   - Fix: Use mobile-first `min-width` approach

7. **Duplicate Media Queries** ❌
   - Detects: Multiple blocks for same breakpoint
   - Fix: Consolidate into one block per breakpoint

### Example Output

```
🎨 myK9Q Design System Audit Report

================================================================================

📁 /src/pages/ClassList/ClassList.css
--------------------------------------------------------------------------------
  Line 45: Use CSS variable (e.g., var(--foreground)) instead of hardcoded color
  background: #ffffff

  Line 67: Use design token (e.g., var(--token-space-lg)) instead of hardcoded value
  padding: 12px

  Line 123: Multiple media query blocks for 1024px - consolidate into one block
  @media (min-width: 1024px)


================================================================================

📊 Summary:

  🟢 hardcoded-color: 1
  🟡 hardcoded-spacing: 8
  🟢 duplicate-media-query: 1

  Total violations: 10
```

### Exit Codes

- `0`: No violations found
- `1`: Violations found

### Integration with CI/CD

Add to your GitHub Actions workflow:

```yaml
- name: Audit Design System
  run: node .claude/skills/myk9q-design-system/tools/audit-design-system.js
```

### Exceptions and Escape Hatches

#### Built-in Exceptions

Some violations are automatically allowed in specific files:

- `design-tokens.css`: Can have hardcoded colors and spacing (token definitions)
- `utilities.css`: Can use `!important` (utility classes)

#### .auditignore File

For legitimate deviations from the design system, add them to `.auditignore`:

```
# Format: filename:line-number:reason
src/components/ThirdPartyWidget.css:45:Third-party library requires exact RGB value

# Ignore entire file (e.g., during migration)
src/components/LegacyDashboard.css:*:Legacy component - TICKET-1234

# Ignore all instances of violation type in a file
src/styles/animations.css:hardcoded-spacing:Precise animation timing required
```

**Valid reasons for exceptions**:
- Third-party library integration
- Browser-specific workarounds
- Animation timing precision
- Designer-approved visual exceptions
- Performance optimizations
- Legacy code during migration

**See**: `references/escape-hatches.md` for complete guide on when and how to use exceptions.

### Future Enhancements

Planned features:
- [ ] Auto-fix capability (replace hardcoded values with tokens)
- [ ] JSON output for CI integration
- [ ] Severity levels (error vs warning)
- [ ] Custom ignore patterns
- [ ] React/TypeScript component scanning
- [ ] Performance metrics
