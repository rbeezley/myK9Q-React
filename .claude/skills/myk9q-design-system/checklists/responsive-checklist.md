# Responsive Design Checklist

Use this checklist to verify responsive behavior before committing.

## Mobile Testing (375px - 639px)

### Layout
- [ ] Container padding is 12px (`--token-space-lg`)
- [ ] All sections align at left edge (12px from left)
- [ ] No horizontal scrolling
- [ ] Content fits within viewport width
- [ ] Grid is single column (unless designed otherwise)
- [ ] Card stacking is vertical

### Typography
- [ ] All text is readable (not too small)
- [ ] Line height provides enough spacing
- [ ] Headings are appropriate size (not overwhelming)
- [ ] No text truncation (unless intentional)
- [ ] Font sizes use mobile tokens

### Touch Targets
- [ ] All buttons are minimum 44x44px
- [ ] Icon buttons have proper tap area
- [ ] Links have enough spacing (not too close)
- [ ] Form inputs are large enough to tap
- [ ] Toggle switches are easy to tap

### Navigation
- [ ] Mobile menu is accessible
- [ ] Menu toggle button works
- [ ] Navigation doesn't overflow
- [ ] Back button is visible
- [ ] Bottom nav (if present) is accessible

### Images & Media
- [ ] Images scale to fit container
- [ ] No image overflow
- [ ] Aspect ratios maintained
- [ ] Loading states work correctly
- [ ] Videos are responsive

### Forms
- [ ] Inputs span full width (or appropriate width)
- [ ] Labels are visible and aligned
- [ ] Error messages fit on screen
- [ ] Submit buttons are large enough
- [ ] Keyboard shows correct type (number, email, etc.)

### Dialogs/Modals
- [ ] Dialog is full screen or near full screen
- [ ] Close button is easily tappable
- [ ] Content scrolls if needed
- [ ] Footer buttons are visible
- [ ] Backdrop doesn't cause content shift

## Tablet Testing (640px - 1023px)

### Layout
- [ ] Container padding transitions appropriately
- [ ] Grid uses 2 columns (or as designed)
- [ ] Horizontal layout starts to appear
- [ ] Sidebar appears (if designed for tablet+)
- [ ] Content doesn't stretch too wide

### Typography
- [ ] Font sizes increase from mobile
- [ ] Line height adjusts for better readability
- [ ] Headings have appropriate prominence

### Navigation
- [ ] Navigation transitions to horizontal (if designed)
- [ ] Menu toggle hides (if using horizontal nav)
- [ ] Breadcrumbs appear (if designed)

### Cards
- [ ] Cards display in 2-column grid
- [ ] Card content adjusts to horizontal layout
- [ ] Hover states work (if touch+mouse device)

### Dialogs/Modals
- [ ] Dialogs become centered with border radius
- [ ] Max-width constraint applies
- [ ] Not full screen anymore

## Desktop Testing (1024px - 1439px)

### Layout
- [ ] Container padding is 24px (`--token-space-3xl`)
- [ ] All sections align at left edge (24px from left)
- [ ] Grid uses 3 columns (or as designed)
- [ ] Sidebar is visible (if designed)
- [ ] Max-width constraint applies (if designed)

### Typography
- [ ] Font sizes use desktop tokens
- [ ] Line height provides comfortable reading
- [ ] Headings are prominent but not overwhelming
- [ ] Text doesn't stretch too wide (60-80 characters)

### Hover States
- [ ] Hover effects work on cards
- [ ] Hover effects work on buttons
- [ ] Hover effects work on links
- [ ] Cursor changes to pointer for clickable elements
- [ ] Tooltips appear on hover (if present)

### Navigation
- [ ] Full horizontal navigation visible
- [ ] Dropdowns work correctly
- [ ] Active state is clear

### Cards
- [ ] Cards display in 3-column grid
- [ ] Content layout is horizontal (if designed)
- [ ] Action buttons are properly positioned

### Forms
- [ ] Multi-column layout (if designed)
- [ ] Inputs have appropriate width (not too wide)
- [ ] Labels align properly
- [ ] Inline validation works

## Large Desktop Testing (1440px+)

### Layout
- [ ] Grid uses 4 columns (if designed)
- [ ] Content is centered with max-width
- [ ] Doesn't look sparse or stretched
- [ ] Padding increases if designed

### Typography
- [ ] Text is comfortable to read (not too wide)
- [ ] Font sizes don't increase unnecessarily

## Cross-Breakpoint Testing

### Breakpoint Transitions
- [ ] Smooth transition at 640px
- [ ] Smooth transition at 1024px
- [ ] Smooth transition at 1440px
- [ ] No jarring layout shifts
- [ ] No content jumping

### Container Padding
- [ ] 12px on mobile (375px - 1023px)
- [ ] 24px on desktop (1024px+)
- [ ] All sections align consistently
- [ ] No sections breaking alignment

### Grid Behavior
- [ ] 1 column on mobile (< 640px)
- [ ] 2 columns on tablet (640px - 1023px)
- [ ] 3 columns on desktop (1024px - 1439px)
- [ ] 4 columns on large desktop (1440px+)
- [ ] Gap spacing is consistent

### Media Queries
- [ ] Mobile styles have NO media query wrapper
- [ ] Tablet styles use `@media (min-width: 640px)`
- [ ] Desktop styles use `@media (min-width: 1024px)`
- [ ] Large desktop styles use `@media (min-width: 1440px)`
- [ ] ONE media query block per breakpoint per file

## Device-Specific Testing

### iPhone SE (375px × 667px)
- [ ] Minimum width is supported
- [ ] All content fits
- [ ] Touch targets are large enough

### iPhone 14 Pro (393px × 852px)
- [ ] Standard mobile experience works
- [ ] Bottom nav doesn't overlap safe area

### iPad Mini (768px × 1024px)
- [ ] Portrait mode uses tablet styles
- [ ] Landscape mode uses desktop styles
- [ ] Doesn't look stretched

### iPad Pro (1024px × 1366px)
- [ ] Desktop layout appears
- [ ] Content is well-proportioned
- [ ] Not too much empty space

### Desktop (1920px × 1080px)
- [ ] Content is centered (if max-width used)
- [ ] Doesn't look sparse
- [ ] Images maintain quality

## Orientation Testing

### Portrait
- [ ] Vertical scrolling works
- [ ] Content fits width
- [ ] Navigation is accessible

### Landscape (Phone)
- [ ] Header height reduces (if designed)
- [ ] Content doesn't overflow vertically
- [ ] Navigation is still accessible

## Content Testing

### Text Content
- [ ] Short text displays correctly
- [ ] Long text doesn't break layout
- [ ] Text truncation works (if designed)
- [ ] Line breaks are natural

### Images
- [ ] Small images don't stretch
- [ ] Large images scale down
- [ ] Aspect ratios are maintained
- [ ] Srcset provides correct density

### Lists
- [ ] Empty lists show empty state
- [ ] Short lists display correctly
- [ ] Long lists scroll correctly
- [ ] Loading states work

### Data Tables
- [ ] Tables scroll horizontally on mobile
- [ ] Important columns are visible on mobile
- [ ] Tables adapt to desktop

## Accessibility Testing

### Reduced Motion
- [ ] `@media (prefers-reduced-motion: reduce)` styles present
- [ ] Animations are disabled or reduced
- [ ] Transitions are simplified
- [ ] Page is still functional without animations

### High Contrast Mode
- [ ] `@media (prefers-contrast: high)` styles present (if needed)
- [ ] Borders are visible
- [ ] Text is readable

### Zoom
- [ ] Page works at 200% zoom (WCAG requirement)
- [ ] Text doesn't overflow
- [ ] Layouts don't break
- [ ] Touch targets remain accessible

## Performance Testing

### Load Time
- [ ] Page loads quickly on mobile
- [ ] Images are lazy loaded
- [ ] No layout shift during load (CLS)
- [ ] Fonts load without FOIT/FOUT

### Scroll Performance
- [ ] Smooth scrolling on mobile
- [ ] No janky animations
- [ ] Images load as you scroll
- [ ] Virtual scrolling for long lists (if needed)

## Visual Testing

### Light Theme
- [ ] All breakpoints work in light theme
- [ ] Colors are consistent
- [ ] Contrast is sufficient
- [ ] Shadows are visible

### Dark Theme
- [ ] All breakpoints work in dark theme
- [ ] Colors adjust correctly
- [ ] Contrast is sufficient
- [ ] Shadows are stronger

## Browser Testing

### Mobile Browsers
- [ ] Safari iOS (latest)
- [ ] Chrome Android (latest)
- [ ] Firefox Android (latest)

### Desktop Browsers
- [ ] Chrome (latest)
- [ ] Safari (latest)
- [ ] Firefox (latest)
- [ ] Edge (latest)

## Common Issues to Check

### Mobile Issues
- [ ] No accidental horizontal scroll
- [ ] Touch targets not too small
- [ ] Text not too small to read
- [ ] Modals/dialogs fit on screen
- [ ] Fixed elements don't overlap content

### Tablet Issues
- [ ] Not just "blown up mobile"
- [ ] Grid transitions correctly
- [ ] Navigation is appropriate
- [ ] Content uses available space

### Desktop Issues
- [ ] Content not too wide
- [ ] Not too much empty space
- [ ] Hover states work
- [ ] Text line length comfortable (60-80 chars)

### Cross-Device Issues
- [ ] Breakpoint transitions smooth
- [ ] Container padding consistent
- [ ] No layout jumps
- [ ] Grid columns adjust correctly

## Testing Tools

### Browser DevTools
```
Chrome DevTools:
1. F12 to open DevTools
2. Ctrl+Shift+M for device toolbar
3. Select "Responsive"
4. Test at 375px, 768px, 1024px, 1440px
```

### Device Emulation
- [ ] Test in Chrome Device Mode
- [ ] Test in Firefox Responsive Design Mode
- [ ] Test on real devices (if available)

### Accessibility Tools
- [ ] Chrome DevTools Lighthouse
- [ ] axe DevTools extension
- [ ] WAVE browser extension

## Pre-Commit Commands

Run these before committing responsive changes:

```bash
# Type check
npm run typecheck

# Lint
npm run lint

# Build (ensures no build errors)
npm run build
```

## Documentation

Before committing:

- [ ] Responsive behavior documented (if non-standard)
- [ ] Breakpoint choices justified (if custom)
- [ ] Edge cases noted
- [ ] Known issues documented

## Final Checklist

- [ ] Tested at ALL required breakpoints (375px, 768px, 1024px, 1440px)
- [ ] Mobile-first approach used
- [ ] Design tokens used (no hardcoded spacing)
- [ ] Media queries consolidated (one block per breakpoint)
- [ ] Container padding follows 12px/24px system
- [ ] Touch targets are minimum 44x44px
- [ ] No horizontal scrolling at any breakpoint
- [ ] Grid columns adjust correctly
- [ ] Typography scales appropriately
- [ ] Reduced motion support present
- [ ] Light and dark themes work at all sizes
- [ ] All browsers tested
- [ ] Type check passes
- [ ] Lint passes
- [ ] Build succeeds

## Responsive Quality Score

Rate your component's responsive design:

- **90-100**: Excellent - Works perfectly at all breakpoints
- **70-89**: Good - Minor issues at some breakpoints
- **50-69**: Acceptable - Noticeable issues, but functional
- **Below 50**: Poor - Significant problems, needs work

Aim for 90+ on all components!

---

**Remember**: Test early, test often, test at ALL breakpoints!
