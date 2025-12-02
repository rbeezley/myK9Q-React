# Fix CSS Rehydration Issues

**Created:** 2025-12-02  
**Status:** Planning Phase  
**Priority:** High - Affects user experience on initial page load

## Problem Analysis

Three main issues identified:

1. **CSS Loading Race Condition**: `index.css` (which imports all component CSS) is loaded asynchronously via ES module import in `main.tsx`, while React can start rendering before CSS is fully loaded.

2. **Missing CSS Variable Fallbacks**: 
   - Armband numbers use `var(--accent-color, var(--primary))` but `--accent-color` is only defined in accent color classes, not as a root variable
   - Status badge text colors depend on CSS variables that may not be available during initial render

3. **Service Worker Caching**: CSS files cached with CacheFirst strategy may serve stale CSS that conflicts with new builds.

## Root Causes

### Issue 1: Async CSS Loading
- `index.html` loads `critical.css` synchronously (good)
- `theme-init.js` runs synchronously (good)
- But `src/index.css` is imported in `src/main.tsx` as an ES module, making it async
- React can render before component CSS (`Home.css`, `ClassList.css`, etc.) is loaded

### Issue 2: CSS Variable Dependencies
- `ClassList.css` line 827: `.armband-number { color: var(--accent-color, var(--primary)); }`
- `--accent-color` is only defined in `critical.css` accent color classes (`.accent-green`, etc.)
- If accent class isn't applied yet, fallback to `--primary` should work, but there may be timing issues

### Issue 3: Status Badge Colors
- Status badges use `var(--status-*-text)` variables from `design-tokens.css`
- These should be available, but if CSS loads out of order, defaults may show (gray text instead of white)

## Solution Plan

### Phase 1: Ensure CSS Loads Before React Renders

**File: `index.html`**
- Add a blocking `<link>` tag for `index.css` (or a preload hint)
- OR inline critical component CSS in `critical.css`

**File: `src/main.tsx`**
- Keep `import './index.css'` but ensure it's processed before React renders
- Consider using Vite's CSS preloading or adding a small delay

**File: `vite.config.ts`**
- Ensure CSS is extracted and loaded synchronously
- Check `cssCodeSplit` settings

### Phase 2: Fix CSS Variable Fallbacks

**File: `public/critical.css`**
- Add `--accent-color` as a root variable that defaults to `--primary`
- Ensure all accent color classes override it properly

**File: `src/pages/ClassList/ClassList.css`**
- Verify `.armband-number` fallback chain: `var(--accent-color, var(--primary))`
- Add explicit font-size to prevent size issues during hydration

**File: `src/styles/design-tokens.css`**
- Ensure all status badge text color variables have proper defaults
- Add `--accent-color: var(--primary);` as a root variable

### Phase 3: Fix Status Badge Text Colors

**File: `src/styles/utilities.css`**
- Verify `.class-status-badge` and `.status-badge.*` classes use correct text color variables
- Ensure `.class-status-badge { color: var(--status-none-text); }` has proper fallback

**File: `src/pages/ClassList/ClassCard.tsx`**
- Check that status color classes are applied correctly
- Verify no inline styles override CSS variables

### Phase 4: Service Worker CSS Caching

**File: `vite.config.ts`**
- Consider changing CSS cache strategy from CacheFirst to NetworkFirst with short TTL
- OR add cache busting via version query params (already done for `critical.css?v=3`)

**File: `public/sw-custom.js`** (if exists)
- Ensure CSS files are not cached aggressively
- Add version-based cache invalidation

### Phase 5: Dog Card Height Issues

**File: `src/components/DogCard.css`**
- Verify `min-height: 70px` is applied correctly
- Check for conflicting styles in `Home.css` that might override height
- Ensure flexbox/grid layouts have proper constraints

**File: `src/pages/Home/Home.css`**
- Check `.entry-card` and `.dog-card` height definitions
- Verify no CSS loading race causes missing height rules

## Implementation Steps

1. **Add CSS preload/prefetch** in `index.html` for `index.css` or ensure Vite injects it
2. **Add `--accent-color` root variable** in `critical.css` and `design-tokens.css`
3. **Fix armband number styling** with explicit font-size and color fallbacks
4. **Verify status badge text colors** use correct CSS variables
5. **Test CSS loading order** by adding temporary console logs or network tab inspection
6. **Update service worker cache strategy** for CSS files if needed
7. **Add CSS loading guard** in React to delay render until CSS is ready (if necessary)

## Testing Strategy

1. Hard refresh (Ctrl+Shift+R) on login page → check home page dog cards
2. Navigate to ClassList → check armband numbers and status badges
3. Test with slow 3G throttling to simulate CSS loading delays
4. Test with service worker disabled to rule out caching issues
5. Check browser DevTools Network tab for CSS load timing vs React render

## Files to Modify

- `index.html` - Add CSS preload or ensure proper loading order
- `public/critical.css` - Add `--accent-color` root variable
- `src/styles/design-tokens.css` - Add `--accent-color` fallback
- `src/pages/ClassList/ClassList.css` - Fix armband number styling
- `src/styles/utilities.css` - Verify status badge text colors
- `vite.config.ts` - Review CSS code splitting and caching
- `src/components/DogCard.css` - Verify height constraints
- `src/pages/Home/Home.css` - Check for height conflicts

## Notes

- The issue is intermittent because it depends on network timing and cache state
- Service worker caching may be serving stale CSS that conflicts with new builds
- CSS variables may not be available during the brief window between React render and CSS load
- Consider adding a "CSS loaded" check before React renders if other solutions don't work

## Implementation Todos

- [ ] Add CSS preload/prefetch in index.html or ensure Vite injects CSS synchronously
- [ ] Add --accent-color root variable in critical.css and design-tokens.css with proper fallback
- [ ] Fix armband number styling in ClassList.css with explicit font-size and color fallbacks
- [ ] Verify status badge text colors use correct CSS variables in utilities.css
- [ ] Fix dog card height issues in DogCard.css and Home.css
- [ ] Review and update service worker CSS caching strategy in vite.config.ts
- [ ] Test CSS loading order and timing with network throttling

