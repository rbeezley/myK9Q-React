# Phase 5: Duplicate Media Query Consolidation Priority List

**Generated**: November 17, 2025
**Last Updated**: November 17, 2025
**Total Files**: 15
**Total Duplicate Blocks**: 80
**Completed**: 0 files
**Remaining**: 15 files

---

## 🎯 Strategy

Consolidate duplicate media query blocks into single blocks per breakpoint per file. This improves:
- **Maintainability**: All responsive styles for a breakpoint in one place
- **Performance**: Reduces CSS file size and parsing time
- **Developer Experience**: Easier to find and modify responsive styles

**Approach**:
1. **Start with EASY files** (1-2 duplicate blocks) - 5 files
2. **Progress to MEDIUM files** (3-6 duplicate blocks) - 6 files
3. **Tackle HARD files last** (9-26 duplicate blocks) - 4 files

Each EASY file takes ~10-15 minutes. Each MEDIUM file takes ~20-30 minutes. HARD files may take 1-3 hours each.

---

## 🟢 EASY FILES (1-2 duplicate blocks) - 5 files

### Batch 1: Components & Pages (5 files)

1. [ ] `/src/components/dialogs/MaxTimeDialog.css`
   - 1 duplicate (2 blocks for 640px at lines 394, 439)
   - **Strategy**: Merge both 640px blocks into one
   - **Risk**: Low - simple dialog styles

2. [ ] `/src/components/DogCard.css`
   - 1 duplicate (2 blocks for 640px at lines 396, 420)
   - **Strategy**: Merge both 640px blocks into one
   - **Risk**: Low - card component styles

3. [ ] `/src/pages/Landing/Landing.css`
   - 1 duplicate (2 blocks for 1024px at lines 108, 772)
   - **Strategy**: Merge both 1024px blocks into one
   - **Risk**: Medium - large spacing between blocks, check for cascade issues

4. [ ] `/src/pages/TVRunOrder/TVRunOrder.css`
   - 1 duplicate (2 blocks for 1024px at lines 44, 146)
   - **Strategy**: Merge both 1024px blocks into one
   - **Risk**: Low - TV display styles

5. [ ] `/src/styles/performance.css`
   - 1 duplicate (2 blocks for 640px at lines 317, 329)
   - **Strategy**: Merge both 640px blocks into one
   - **Risk**: Low - performance optimization styles

---

## 🟡 MEDIUM FILES (3-6 duplicate blocks) - 6 files

### Batch 2: Pages & Utilities (6 files)

6. [ ] `/src/styles/utilities.css`
   - 1 duplicate (2 blocks for 640px at lines 55, 468)
   - **Strategy**: Merge both 640px blocks into one
   - **Risk**: Medium - utility classes used throughout app

7. [ ] `/src/styles/page-container.css`
   - 2 duplicates (3 blocks for 1024px at lines 28, 58, 93)
   - **Strategy**: Consolidate all three 1024px blocks into one
   - **Risk**: Medium - affects all page layouts

8. [ ] `/src/pages/ClassList/ClassList.css`
   - 3 duplicates (3 blocks for 640px, 2 blocks for 1024px)
   - **Strategy**: Consolidate each breakpoint separately
   - **Risk**: Medium - complex class list table/grid styles

9. [ ] `/src/pages/Announcements/Announcements.css`
   - 3 duplicates (2 blocks for 640px, 3 blocks for 1024px)
   - **Strategy**: Consolidate each breakpoint separately
   - **Risk**: Medium - notification/announcement styles

10. [ ] `/src/pages/DogDetails/DogDetails.css`
    - 4 duplicates (5 blocks for 1024px)
    - **Strategy**: Consolidate all five 1024px blocks into one
    - **Risk**: Medium - detail page with complex layout

11. [ ] `/src/components/scoring/shared-scoring.css`
    - 5 duplicates (6 blocks for 640px)
    - **Strategy**: Consolidate all six 640px blocks into one
    - **Risk**: High - shared scoring components used across multiple scoresheets

---

## 🔴 HARD FILES (9-26 duplicate blocks) - 4 files

**Recommendation**: Convert these LAST, after building experience with easy/medium files.

12. [ ] `/src/pages/Admin/CompetitionAdmin.css`
    - 6 duplicates (7 blocks for 640px at lines 666, 974, 1452, 1636, 1838, 2040, 2247)
    - **Strategy**: Consolidate all seven 640px blocks into one
    - **Risk**: High - admin interface with complex grid layouts and tables
    - **Testing**: Thoroughly test trial creation, class management, check-in controls

13. [ ] `/src/styles/containers.css`
    - 9 duplicates across three breakpoints:
      - 5 blocks for 640px
      - 5 blocks for 1024px
      - 2 blocks for 1440px
    - **Strategy**: Consolidate each breakpoint separately (three consolidations)
    - **Risk**: CRITICAL - core container system affects ALL pages
    - **Testing**: Test EVERY page layout at all breakpoints

14. [ ] `/src/components/monitoring/shared-monitoring.css`
    - 16 duplicates (17 blocks for 640px!)
    - **Strategy**: Consolidate all seventeen 640px blocks into one massive block
    - **Risk**: High - monitoring/debugging components with complex layouts
    - **Note**: This file was just converted to mobile-first in Phase 4 (commit fa5a760)
    - **Testing**: Test all monitoring panels (network inspector, performance monitor, state inspector)

15. [ ] `/src/components/ui/shared-ui.css` ⚠️ **LARGEST FILE!**
    - 26 duplicates (27 blocks for 640px at lines 111, 117, 156, 165, 432, 499, 699, 895, 1013, 1188, 1565, 1735, 1872, 2312, 2497, 2693, 2886, 3200, 3413, 3724, 4061, 4383, 4636, 5079, 5443, 5811, 6165)
    - **Strategy**: Consolidate all twenty-seven 640px blocks into ONE block
    - **Risk**: CRITICAL - central UI component library affects EVERY component
    - **Note**: This file was just converted to mobile-first in Phase 4 (commit 133db0e)
    - **Components affected**: armband-badge, card, empty-state, filter-tabs, sticky-header, device-tier-toast, header-ticker, status-badge, offline-indicators, FAB, search-controls, hamburger-menu, modals, debug-panels, storage-manager, performance-settings, and 11+ more
    - **Testing**: Test EVERY major component at 640px breakpoint before/after

---

## 📊 Progress Tracking

- [ ] **Batch 1: Easy Files** (5/5) - Simple consolidations
- [ ] **Batch 2: Medium Files** (6/6) - Multi-block consolidations
- [ ] **Hard Files** (4/4) - Critical system files

**Total Progress**: 0 / 15 files (0%)

---

## 🔄 Consolidation Pattern

```css
/* BEFORE - Multiple Blocks (Desktop-First Remnant Pattern) */
.element-one {
  property: mobile-value;
}

@media (min-width: 640px) {
  .element-one {
    property: desktop-value;
  }
}

/* ... 500 lines later ... */

.element-two {
  another: mobile-value;
}

@media (min-width: 640px) {  /* DUPLICATE! */
  .element-two {
    another: desktop-value;
  }
}

/* AFTER - Single Consolidated Block (Mobile-First Pattern) */
.element-one {
  property: mobile-value;
}

.element-two {
  another: mobile-value;
}

/* Desktop enhancements - ALL in one place */
@media (min-width: 640px) {
  .element-one {
    property: desktop-value;
  }

  .element-two {
    another: desktop-value;
  }
}
```

---

## ⚡ Quick Workflow

1. **Read file** - Identify all duplicate media query blocks
2. **Create new consolidated block** - At end of file or logical location
3. **Copy all rules** - From each duplicate block into new consolidated block
4. **Preserve order** - Maintain cascade/specificity (later rules override earlier)
5. **Delete old blocks** - Remove all duplicate blocks
6. **Test at breakpoints** - Test at 375px, 640px, 1024px, 1440px
7. **Commit individually** - Each file gets its own commit
8. **Move to next file**

---

## ⚠️ Risk Mitigation

### CSS Cascade Awareness
When consolidating, the ORDER of rules matters:
```css
/* BEFORE */
@media (min-width: 640px) {
  .foo { color: blue; }  /* Line 100 */
}

.foo { color: red; }  /* Line 200 - overrides due to source order */

@media (min-width: 640px) {
  .foo { font-size: 1rem; }  /* Line 300 */
}

/* AFTER - Wrong! Changes cascade */
.foo { color: red; }

@media (min-width: 640px) {
  .foo {
    color: blue;  /* Now overrides red! Broken! */
    font-size: 1rem;
  }
}

/* AFTER - Correct! Preserves cascade */
.foo { color: red; }

@media (min-width: 640px) {
  .foo { font-size: 1rem; }
  /* Omit color: blue since it's overridden by base .foo above */
}
```

### Specificity Conflicts
Watch for:
- Rules that override each other
- Nested selectors with different specificity
- Rules that depend on source order for precedence

### Testing Checklist (Per File)
- [ ] Visual inspection at 375px (mobile)
- [ ] Visual inspection at 640px (tablet breakpoint)
- [ ] Visual inspection at 1024px (desktop breakpoint)
- [ ] Visual inspection at 1440px (large desktop)
- [ ] Compare before/after screenshots
- [ ] Test interactions (hover, focus, active states)
- [ ] Verify no visual regressions

---

## 📈 Expected Outcomes

**Before Consolidation**:
- 15 files with 80 duplicate media query blocks
- Scattered responsive styles throughout files
- Difficult to find all styles for a breakpoint

**After Consolidation**:
- 15 files with ZERO duplicate media query blocks
- All responsive styles consolidated per breakpoint
- ONE `@media (min-width: 640px)` block per file
- ONE `@media (min-width: 1024px)` block per file
- ONE `@media (min-width: 1440px)` block per file
- Cleaner, more maintainable CSS
- Easier to add new responsive styles

**Violation Reduction**:
- Start: 26 duplicate media query violations (audit count)
- Target: 0 duplicate media query violations (100% fixed ✅)

---

## 🎯 Success Criteria

- [ ] All 15 files consolidated
- [ ] Zero duplicate media query blocks remain
- [ ] Audit shows 0 `duplicate-media-query` violations
- [ ] All pages tested at 375px, 640px, 1024px, 1440px
- [ ] No visual regressions
- [ ] Type checks passing
- [ ] All changes committed individually

---

## 📝 Notes

- **Phase 4 Connection**: Several files (shared-ui.css, shared-monitoring.css, CompetitionAdmin.css) were just converted to mobile-first in Phase 4. The duplicate blocks were created DURING that conversion as we moved styles from max-width to min-width blocks without consolidating.
- **Not a Bug**: Duplicate media queries aren't broken - they work fine. This is purely a code quality and maintainability improvement.
- **No Rush**: This phase is lower priority than Phase 4 (mobile-first conversion). Take time to do it right and test thoroughly.

---

## 🛠️ Tools

- **Analysis**: `find-duplicate-media-queries.cjs` - Identifies files with duplicate blocks
- **Testing**: Use browser DevTools responsive mode
- **Validation**: `npm run audit:design` - Verify 0 duplicate-media-query violations

---

## 📚 References

- [DESIGN_SYSTEM_REMEDIATION.md](../../DESIGN_SYSTEM_REMEDIATION.md) - Overall project plan
- [CONVERSION_PRIORITY_LIST.md](./CONVERSION_PRIORITY_LIST.md) - Phase 4 mobile-first conversion (completed!)
- [CSS_ARCHITECTURE.md](../../../docs/CSS_ARCHITECTURE.md) - CSS patterns and best practices
- [escape-hatches.md](../references/escape-hatches.md) - When to deviate from standards

---

## 🚀 Let's Go!

Start with the EASY files to build confidence, then progress to MEDIUM, and finally tackle the HARD files. Remember: **test thoroughly** and **commit frequently**!
