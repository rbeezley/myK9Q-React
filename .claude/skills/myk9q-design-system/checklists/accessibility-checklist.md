# Accessibility (A11y) Checklist

Ensure WCAG AA compliance before committing components.

## Semantic HTML

- [ ] Use semantic elements (`<nav>`, `<main>`, `<article>`, `<section>`, `<aside>`)
- [ ] Use `<button>` for actions (not `<div onClick>`)
- [ ] Use `<a>` for navigation (not `<div onClick>`)
- [ ] Use `<h1>` - `<h6>` for headings (maintain hierarchy)
- [ ] Use `<ul>`/`<ol>` for lists
- [ ] Use `<table>` for tabular data (not for layout)

**Bad**:
```tsx
<div onClick={handleClick}>Click me</div>
<div className="heading">Title</div>
```

**Good**:
```tsx
<button onClick={handleClick}>Click me</button>
<h2>Title</h2>
```

## Keyboard Navigation

### Focus Management
- [ ] All interactive elements are keyboard accessible
- [ ] Tab order is logical (follows visual order)
- [ ] Focus indicators are visible (not `outline: none` without replacement)
- [ ] Skip to main content link present (optional but recommended)
- [ ] Focus is managed in dialogs/modals
- [ ] Focus is restored after dialog close

**Test**: Navigate page using only keyboard (Tab, Shift+Tab, Enter, Space)

### Keyboard Shortcuts
- [ ] Enter/Space activate buttons
- [ ] Escape closes dialogs/modals
- [ ] Arrow keys navigate lists/menus (if applicable)
- [ ] No keyboard traps (focus can always move)

**Good focus styles**:
```css
.button:focus {
  outline: 2px solid var(--primary);
  outline-offset: 2px;
}

.button:focus:not(:focus-visible) {
  outline: none;  /* Hide for mouse users */
}

.button:focus-visible {
  outline: 2px solid var(--primary);  /* Show for keyboard users */
}
```

## ARIA Attributes

### Labels and Descriptions
- [ ] `aria-label` for icon-only buttons
- [ ] `aria-labelledby` for elements described by another element
- [ ] `aria-describedby` for additional descriptions
- [ ] No redundant ARIA (if semantic HTML suffices)

**Examples**:
```tsx
{/* Icon-only button needs aria-label */}
<button aria-label="Close dialog" onClick={onClose}>
  <X size={20} />
</button>

{/* Element described by another element */}
<div id="dialog-title">Confirm Delete</div>
<div aria-labelledby="dialog-title">
  Are you sure you want to delete this entry?
</div>

{/* Additional description */}
<input
  id="password"
  aria-describedby="password-requirements"
/>
<div id="password-requirements">
  Must be at least 8 characters
</div>
```

### Roles
- [ ] Use semantic HTML instead of `role` when possible
- [ ] `role="button"` for non-button clickable elements (avoid if possible)
- [ ] `role="dialog"` for dialogs
- [ ] `role="alert"` for important messages
- [ ] `role="status"` for status updates

**Examples**:
```tsx
{/* Dialog */}
<div role="dialog" aria-labelledby="dialog-title">
  <h2 id="dialog-title">Settings</h2>
  {/* ... */}
</div>

{/* Alert */}
<div role="alert" aria-live="assertive">
  Error: Failed to save changes
</div>

{/* Status update */}
<div role="status" aria-live="polite">
  Saving...
</div>
```

### States
- [ ] `aria-expanded` for expandable elements
- [ ] `aria-selected` for selectable items
- [ ] `aria-checked` for checkboxes/toggles
- [ ] `aria-disabled` for disabled elements
- [ ] `aria-hidden="true"` for decorative elements only

**Examples**:
```tsx
{/* Expandable section */}
<button
  aria-expanded={isOpen}
  aria-controls="content-id"
  onClick={toggle}
>
  {title}
</button>
<div id="content-id" hidden={!isOpen}>
  {content}
</div>

{/* Checkbox */}
<div
  role="checkbox"
  aria-checked={isChecked}
  onClick={toggle}
>
  {/* ... */}
</div>

{/* Decorative icon */}
<ChevronRight aria-hidden="true" />
```

## Form Accessibility

### Labels
- [ ] All inputs have associated `<label>` elements
- [ ] Labels use `htmlFor` attribute (matches input `id`)
- [ ] Placeholder text is NOT the only label
- [ ] Required fields are marked (visually and programmatically)

**Examples**:
```tsx
{/* Explicit label */}
<label htmlFor="dog-name">Dog Name</label>
<input id="dog-name" type="text" required />

{/* Required field */}
<label htmlFor="handler">
  Handler Name <span aria-label="required">*</span>
</label>
<input id="handler" type="text" required aria-required="true" />
```

### Validation
- [ ] Error messages are programmatically associated with inputs
- [ ] Errors are announced to screen readers
- [ ] Success messages are announced
- [ ] Loading states are announced

**Examples**:
```tsx
{/* Error message */}
<label htmlFor="email">Email</label>
<input
  id="email"
  type="email"
  aria-invalid={hasError}
  aria-describedby={hasError ? "email-error" : undefined}
/>
{hasError && (
  <div id="email-error" role="alert">
    Please enter a valid email address
  </div>
)}

{/* Success message */}
<div role="status" aria-live="polite">
  Saved successfully
</div>
```

### Fieldsets
- [ ] Related inputs grouped with `<fieldset>`
- [ ] Fieldsets have `<legend>` for group label
- [ ] Radio buttons grouped in fieldset

**Example**:
```tsx
<fieldset>
  <legend>Contact Preference</legend>
  <label>
    <input type="radio" name="contact" value="email" />
    Email
  </label>
  <label>
    <input type="radio" name="contact" value="phone" />
    Phone
  </label>
</fieldset>
```

## Color Contrast

### Text Contrast (WCAG AA)
- [ ] Normal text (< 18px): 4.5:1 contrast ratio
- [ ] Large text (≥ 18px or ≥ 14px bold): 3:1 contrast ratio
- [ ] UI components: 3:1 contrast ratio
- [ ] Contrast works in light theme
- [ ] Contrast works in dark theme

**Tools**: Chrome DevTools (Inspect > Accessibility > Contrast)

### Color Alone
- [ ] Information not conveyed by color alone
- [ ] Status indicators have text/icon in addition to color
- [ ] Links distinguishable from text (underline or bold)
- [ ] Charts/graphs have labels and patterns

**Bad**:
```tsx
<div style={{ background: 'green' }} /> {/* Color only */}
```

**Good**:
```tsx
<div className="status-badge status-badge--checked-in">
  <CheckCircle size={14} /> {/* Icon */}
  <span>Checked In</span> {/* Text */}
</div>
```

## Images and Media

### Alternative Text
- [ ] All `<img>` have `alt` attribute
- [ ] Decorative images have `alt=""`
- [ ] Informative images have descriptive alt text
- [ ] Complex images have longer description

**Examples**:
```tsx
{/* Informative image */}
<img src="dog.jpg" alt="Golden Retriever jumping over agility hurdle" />

{/* Decorative image */}
<img src="divider.svg" alt="" />

{/* Complex image with description */}
<img
  src="chart.png"
  alt="Bar chart showing entry counts by class"
  aria-describedby="chart-description"
/>
<div id="chart-description">
  The chart shows Novice A has 12 entries, Open B has 8 entries, and Excellent C has 15 entries.
</div>
```

### Video/Audio
- [ ] Videos have captions (if audio present)
- [ ] Audio-only content has transcript
- [ ] Controls are keyboard accessible
- [ ] Autoplay is disabled or muted

## Interactive Components

### Buttons
- [ ] Use `<button>` element
- [ ] Button text is descriptive (not just "Click here")
- [ ] Icon-only buttons have `aria-label`
- [ ] Disabled state is announced (`aria-disabled` or `disabled`)

### Links
- [ ] Link text is descriptive (not just "Click here")
- [ ] External links indicate they open in new tab
- [ ] Links have focus state
- [ ] Links have sufficient contrast

**Examples**:
```tsx
{/* Descriptive link */}
<a href="/class/1">View Novice A details</a>

{/* External link */}
<a href="https://example.com" target="_blank" rel="noopener noreferrer">
  AKC Website <ExternalLink aria-hidden="true" size={14} />
  <span className="sr-only">(opens in new tab)</span>
</a>
```

### Dialogs/Modals
- [ ] `role="dialog"` and `aria-modal="true"`
- [ ] Focus is moved to dialog when opened
- [ ] Focus is trapped within dialog
- [ ] Focus is restored when dialog closes
- [ ] Escape key closes dialog
- [ ] Dialog has accessible name (`aria-labelledby` or `aria-label`)

**Example**:
```tsx
<div
  role="dialog"
  aria-modal="true"
  aria-labelledby="dialog-title"
>
  <h2 id="dialog-title">Confirm Delete</h2>
  {/* ... */}
  <button onClick={onClose}>Cancel</button>
  <button onClick={onConfirm}>Delete</button>
</div>
```

### Tooltips
- [ ] Triggered by hover AND focus
- [ ] Dismissible (Escape key)
- [ ] Don't hide on hover (allow mouse to move to tooltip)
- [ ] Associated with trigger element (`aria-describedby`)

## Responsive and Zoom

### Zoom
- [ ] Page works at 200% zoom (WCAG requirement)
- [ ] No horizontal scrolling at 200% zoom
- [ ] Text doesn't overflow containers
- [ ] Touch targets remain accessible

**Test**: Set browser zoom to 200% and verify all functionality

### Text Resize
- [ ] Page works when text size increased (browser setting)
- [ ] Use relative units (`rem`, `em`) for font sizes
- [ ] Containers expand to fit text
- [ ] No text truncation

### Orientation
- [ ] Page works in portrait orientation
- [ ] Page works in landscape orientation
- [ ] Content reflows appropriately

## Motion and Animation

### Reduced Motion
- [ ] `@media (prefers-reduced-motion: reduce)` styles present
- [ ] Animations are disabled or reduced
- [ ] Page remains functional without animations

**Example**:
```css
.animated-element {
  animation: slide-in 0.3s ease;
}

@media (prefers-reduced-motion: reduce) {
  .animated-element {
    animation: none;  /* Disable animation */
  }
}
```

### Flashing Content
- [ ] No flashing more than 3 times per second
- [ ] No red flashing
- [ ] Autoplay videos are muted

## Screen Reader Testing

### Screen Reader Compatibility
- [ ] Tested with NVDA (Windows)
- [ ] Tested with JAWS (Windows) - optional
- [ ] Tested with VoiceOver (Mac/iOS) - optional
- [ ] All content is announced correctly
- [ ] Interactive elements are announced correctly
- [ ] Status updates are announced

### Landmarks
- [ ] `<header>` or `role="banner"` for site header
- [ ] `<nav>` or `role="navigation"` for navigation
- [ ] `<main>` or `role="main"` for main content
- [ ] `<aside>` or `role="complementary"` for sidebars
- [ ] `<footer>` or `role="contentinfo"` for site footer

**Example**:
```tsx
<div className="page">
  <header>
    <nav aria-label="Main navigation">
      {/* ... */}
    </nav>
  </header>

  <main>
    {/* Main content */}
  </main>

  <aside aria-label="Filters">
    {/* Sidebar content */}
  </aside>

  <footer>
    {/* Footer content */}
  </footer>
</div>
```

### Live Regions
- [ ] Status updates use `aria-live="polite"`
- [ ] Urgent alerts use `aria-live="assertive"`
- [ ] Loading states are announced
- [ ] Error messages are announced

**Examples**:
```tsx
{/* Polite announcement (doesn't interrupt) */}
<div role="status" aria-live="polite">
  {loading ? 'Loading...' : 'Loaded successfully'}
</div>

{/* Assertive announcement (interrupts) */}
<div role="alert" aria-live="assertive">
  Error: Failed to save changes
</div>
```

## Touch Targets

### Size
- [ ] Minimum 44x44px (Apple HIG)
- [ ] 48x48px for high-stress scenarios (Android)
- [ ] Spacing between targets (minimum 8px)

**Example**:
```css
.button,
.icon-button {
  min-width: var(--min-touch-target);   /* 44px */
  min-height: var(--min-touch-target);  /* 44px */
}

.scoring-button {
  min-width: var(--stress-touch-target);   /* 52px */
  min-height: var(--stress-touch-target);  /* 52px */
}
```

## Testing Tools

### Browser Extensions
- [ ] axe DevTools (Chrome/Firefox)
- [ ] WAVE (Chrome/Firefox)
- [ ] Lighthouse (Chrome DevTools)

### Manual Testing
- [ ] Keyboard navigation (Tab, Shift+Tab, Enter, Space, Escape)
- [ ] Screen reader (NVDA, VoiceOver)
- [ ] Zoom to 200%
- [ ] High contrast mode
- [ ] Reduced motion preference

### Automated Testing
- [ ] `npm run test` includes accessibility tests
- [ ] axe-core integrated (via @axe-core/react)
- [ ] Violations fail tests

## Common Mistakes to Avoid

❌ **DON'T:**
```tsx
{/* div as button */}
<div onClick={handleClick}>Click me</div>

{/* No alt text */}
<img src="dog.jpg" />

{/* Placeholder as label */}
<input placeholder="Dog name" />

{/* Icon-only button without label */}
<button><X /></button>

{/* Color-only status */}
<div style={{ background: 'green' }} />

{/* Remove focus outline without replacement */}
button:focus { outline: none; }

{/* Keyboard trap */}
{/* User can tab in but not out */}
```

✅ **DO:**
```tsx
{/* Semantic button */}
<button onClick={handleClick}>Click me</button>

{/* Descriptive alt text */}
<img src="dog.jpg" alt="Golden Retriever jumping over hurdle" />

{/* Proper label */}
<label htmlFor="dog-name">Dog Name</label>
<input id="dog-name" placeholder="e.g., Max" />

{/* Icon button with aria-label */}
<button aria-label="Close dialog"><X /></button>

{/* Color + icon + text */}
<div className="status-badge">
  <CheckCircle /> Checked In
</div>

{/* Custom focus style */}
button:focus-visible {
  outline: 2px solid var(--primary);
  outline-offset: 2px;
}

{/* Manage focus properly */}
{/* Focus can always move */}
```

## Pre-Commit Commands

Run these before committing:

```bash
# Type check
npm run typecheck

# Lint (includes a11y rules)
npm run lint

# Run accessibility tests
npm test -- --grep "accessibility"
```

## Documentation

Before committing:

- [ ] Accessibility features documented
- [ ] Keyboard shortcuts documented
- [ ] ARIA usage justified (if complex)
- [ ] Known issues documented
- [ ] Testing notes included

## Final Checklist

- [ ] Semantic HTML used throughout
- [ ] All interactive elements keyboard accessible
- [ ] Focus indicators visible
- [ ] ARIA attributes used correctly
- [ ] All images have alt text
- [ ] All forms have labels
- [ ] Color contrast meets WCAG AA
- [ ] Information not conveyed by color alone
- [ ] Reduced motion support present
- [ ] Touch targets minimum 44x44px
- [ ] Tested with keyboard only
- [ ] Tested with screen reader
- [ ] Tested at 200% zoom
- [ ] Lint passes (includes a11y rules)
- [ ] No console accessibility warnings

## Accessibility Quality Score

Rate your component's accessibility:

- **90-100**: Excellent - WCAG AA+ compliant
- **70-89**: Good - Minor issues, mostly accessible
- **50-69**: Acceptable - Notable issues, needs improvement
- **Below 50**: Poor - Major issues, not accessible

Aim for 90+ on all components!

---

**Remember**: Accessibility is not optional. Build it in from the start, not as an afterthought!
