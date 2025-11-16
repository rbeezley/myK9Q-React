# Component Patterns Library

This is your library of established UI patterns used throughout myK9Q. **Always check here first** before creating new components to ensure consistency.

## Card Patterns

### 1. Standard Card

**Used in**: ClassList, EntryList, Home dashboard

**Structure**:
```tsx
<div className="card">
  <div className="card-header">
    <h3 className="card-title">Title</h3>
    <button className="card-action-button">⋮</button>
  </div>
  <div className="card-content">
    {/* Content */}
  </div>
</div>
```

**CSS Pattern**:
```css
.card {
  background: var(--card);
  border: 1px solid var(--border);
  border-radius: var(--token-radius-xl);
  padding: var(--token-space-lg);
  box-shadow: var(--token-shadow-sm);
  transition: var(--token-transition-normal);
  cursor: pointer;
}

.card:hover {
  box-shadow: var(--token-shadow-md);
  border-color: var(--primary);
  transform: translateY(-2px);
}

@media (min-width: 1024px) {
  .card {
    padding: var(--token-space-xl);
  }
}
```

### 2. Card with Left Status Border

**Used in**: ClassCard, TrialCard

**Visual**: Colored left border indicating status

```css
.card-with-status {
  border-left: 3px solid var(--status-in-progress);
}

.card-with-status.status-completed {
  border-left-color: var(--status-completed);
}

.card-with-status.status-setup {
  border-left-color: var(--status-setup);
}
```

### 3. Info Card (Non-Interactive)

**Used in**: Trial info display, Summary sections

```css
.info-card {
  background: rgba(255, 255, 255, 0.8);
  backdrop-filter: blur(20px);
  border: 1px solid var(--border);
  border-radius: var(--token-radius-lg);
  padding: var(--token-space-lg) var(--token-space-xl);
  box-shadow: var(--token-shadow-sm);
  /* No hover effect - not clickable */
}

.theme-dark .info-card {
  background: var(--card);
  box-shadow: 0 var(--token-space-sm) var(--token-space-lg) rgba(0, 0, 0, 0.3);
}
```

## Badge Patterns

### 1. Status Badge (Inline)

**Used in**: Entry lists, Class cards

**Structure**:
```tsx
<span className="status-badge status-badge--in-progress">
  <PlayCircle className="status-icon" />
  <span>In Progress</span>
</span>
```

**CSS Pattern**:
```css
.status-badge {
  display: inline-flex;
  align-items: center;
  gap: var(--token-space-xs);
  padding: var(--token-space-sm) var(--token-space-lg);
  border-radius: var(--token-radius-lg);
  font-size: var(--token-font-sm);
  font-weight: var(--token-font-weight-semibold);
  text-transform: uppercase;
  letter-spacing: 0.05em;
  line-height: 1.1;
}

.status-badge--in-progress {
  background: var(--status-in-progress);
  color: var(--status-in-progress-text);
}

.status-icon {
  width: 18px;
  height: 18px;
  flex-shrink: 0;
}
```

### 2. Corner Badge (Absolute Positioned)

**Used in**: ClassCard status, Entry status

**Visual**: Badge positioned in top-right corner

```css
.corner-badge-container {
  position: absolute;
  top: -1px;
  right: -1px;
  z-index: 10;
}

.corner-badge {
  padding: var(--token-space-sm) var(--token-space-lg);
  border-radius: 0 var(--token-space-lg) 0 var(--token-space-lg);
  /* Square top-left and bottom-right */
  font-size: var(--token-font-sm);
  font-weight: var(--token-font-weight-semibold);
  min-height: var(--comfortable-touch-target);
}
```

### 3. Count Badge

**Used in**: Tab badges, notification counts

```css
.count-badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  background: var(--primary);
  color: var(--primary-foreground);
  border-radius: var(--token-radius-full);
  padding: 0 var(--token-space-sm);
  font-size: var(--token-font-xs);
  font-weight: var(--token-font-weight-bold);
  min-width: 18px;
  height: 18px;
  line-height: 1;
}
```

## Button Patterns

### 1. Primary Button

```css
.btn-primary {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: var(--token-space-sm);
  padding: var(--token-space-md) var(--token-space-xl);
  background: var(--primary);
  color: var(--primary-foreground);
  border: none;
  border-radius: var(--token-radius-md);
  font-weight: var(--token-font-weight-semibold);
  font-size: var(--token-font-md);
  transition: var(--token-transition-normal);
  cursor: pointer;
  min-height: var(--min-touch-target);
}

.btn-primary:hover:not(:disabled) {
  transform: scale(1.02);
  box-shadow: var(--token-hover-shadow);
}

.btn-primary:active:not(:disabled) {
  transform: scale(0.98);
}

.btn-primary:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
```

### 2. Icon Button

**Used in**: Favorite buttons, Menu buttons, Close buttons

```css
.icon-button {
  display: flex;
  align-items: center;
  justify-content: center;
  width: var(--token-space-4xl);
  height: var(--token-space-4xl);
  background: var(--muted);
  border: 1px solid var(--border);
  border-radius: var(--token-radius-md);
  cursor: pointer;
  transition: var(--token-transition-normal);
  color: var(--foreground);
}

.icon-button:hover {
  background: var(--primary);
  color: white;
  border-color: var(--primary);
  transform: scale(1.05);
}

.icon-button:active {
  transform: scale(0.95);
}

.icon-button svg {
  width: 20px;
  height: 20px;
}
```

### 3. Toggle Button

**Used in**: Status tabs, Filter buttons

```css
.toggle-button {
  padding: var(--token-space-md) var(--token-space-lg);
  background: transparent;
  border: none;
  border-radius: var(--token-radius-md);
  color: var(--muted-foreground);
  font-weight: var(--token-font-weight-medium);
  cursor: pointer;
  transition: var(--token-transition-normal);
}

.toggle-button.active {
  background: var(--card);
  color: var(--primary);
  box-shadow: var(--token-shadow-sm);
}

.toggle-button:hover:not(.active) {
  background: rgba(0, 0, 0, 0.05);
}

.theme-dark .toggle-button:hover:not(.active) {
  background: rgba(255, 255, 255, 0.05);
}
```

## Dialog Patterns

### Standard Dialog Structure

**File**: Use `src/components/dialogs/shared-dialog.css`

**Structure**:
```tsx
<div className="dialog-overlay" onClick={onClose}>
  <div className="dialog-container" onClick={(e) => e.stopPropagation()}>
    <div className="dialog-header">
      <h2 className="dialog-title">
        <Icon />
        Title
      </h2>
      <button className="close-button" onClick={onClose}>
        <X />
      </button>
    </div>
    <div className="dialog-content">
      {/* Content */}
    </div>
    <div className="dialog-footer">
      <button className="btn-secondary" onClick={onClose}>Cancel</button>
      <button className="btn-primary" onClick={handleSave}>Save</button>
    </div>
  </div>
</div>
```

**CSS** (from shared-dialog.css):
```css
.dialog-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  backdrop-filter: blur(4px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: var(--token-z-modal);
  padding: 1rem;
}

.dialog-container {
  background: var(--card);
  border-radius: 1rem;
  box-shadow: var(--token-shadow-xl);
  max-width: 500px;
  width: 100%;
  max-height: calc(100vh - 2rem);
  overflow: visible;
  display: flex;
  flex-direction: column;
}

.dialog-header {
  padding: 0.875rem 1rem;
  border-bottom: 1px solid var(--border);
  background: var(--muted);
  border-radius: 1rem 1rem 0 0;
}

.dialog-content {
  padding: 1rem;
  overflow-y: auto;
  flex: 1;
}

.dialog-footer {
  padding: 0.875rem 1rem;
  border-top: 1px solid var(--border);
  display: flex;
  gap: var(--token-space-md);
  justify-content: flex-end;
  flex-shrink: 0;
}
```

## Form Patterns

### 1. Form Section

```css
.form-section {
  display: flex;
  flex-direction: column;
  gap: var(--token-space-md);
}

.form-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--token-space-2xl);
  padding: var(--token-space-lg);
  background: var(--muted);
  border-radius: var(--token-radius-md);
  border: 1px solid var(--border);
}

.form-item-header {
  flex: 1;
}

.form-label {
  display: block;
  font-weight: var(--token-font-weight-semibold);
  color: var(--foreground);
  margin-bottom: var(--token-space-sm);
  font-size: var(--token-font-md);
}

.form-description {
  font-size: var(--token-font-sm);
  color: var(--muted-foreground);
  line-height: 1.4;
}
```

### 2. Text Input

```css
.input {
  width: 100%;
  padding: var(--token-space-md) var(--token-space-lg);
  border: 1px solid var(--border);
  border-radius: var(--token-radius-md);
  background: var(--background);
  color: var(--foreground);
  font-size: var(--token-font-md);
  font-family: inherit;
  transition: border-color 0.2s ease;
}

.input:focus {
  outline: none;
  border-color: var(--primary);
  box-shadow: 0 0 0 3px rgba(var(--primary-rgb, 59, 130, 246), 0.1);
}

.input:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.input--error {
  border-color: var(--token-error);
}
```

### 3. Toggle Switch

**Used in**: Settings, Feature flags

```css
.toggle-switch {
  position: relative;
  width: 40px;
  height: 16px;
  background: #cbd5e1;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  transition: background 0.25s ease;
  padding: 1px;
  display: inline-flex;
  align-items: center;
  justify-content: flex-start;
}

.toggle-switch--on {
  background: var(--primary);
  justify-content: flex-end;
}

.toggle-thumb {
  width: 16px;
  height: 16px;
  background: white;
  border-radius: 50%;
  transition: all 0.25s ease;
}
```

## Layout Patterns

### 1. Page Container

**Used in**: All pages

```css
.page-container {
  height: 100vh;
  overflow: hidden;
  background: var(--background);
  color: var(--foreground);
  display: flex;
  flex-direction: column;
  padding: 0 var(--token-space-lg); /* 12px mobile */
}

@media (min-width: 1024px) {
  .page-container {
    padding: 0 var(--token-space-3xl); /* 24px desktop */
  }
}
```

### 2. Page Header

```css
.page-header {
  position: relative;
  display: flex;
  align-items: center;
  padding: var(--token-space-lg) 0;
  border-bottom: 1px solid var(--border);
  backdrop-filter: blur(20px);
  background: rgba(255, 255, 255, 0.8);
  z-index: var(--token-z-raised);
}

.theme-dark .page-header {
  background: rgba(26, 29, 35, 0.9);
}
```

### 3. Scrollable Content

```css
.scrollable-content {
  flex: 1;
  overflow-y: auto;
  overflow-x: hidden;
  padding-bottom: var(--token-space-4xl);
  -webkit-overflow-scrolling: touch;
  scroll-behavior: smooth;
}
```

### 4. Responsive Grid

```css
.grid-responsive {
  display: grid;
  gap: var(--token-space-lg);
  grid-template-columns: 1fr; /* Mobile: 1 column */
}

@media (min-width: 640px) {
  .grid-responsive {
    grid-template-columns: repeat(2, 1fr); /* Tablet: 2 columns */
  }
}

@media (min-width: 1024px) {
  .grid-responsive {
    grid-template-columns: repeat(3, 1fr); /* Desktop: 3 columns */
    gap: var(--token-space-xl);
  }
}

@media (min-width: 1440px) {
  .grid-responsive {
    grid-template-columns: repeat(4, 1fr); /* Large: 4 columns */
  }
}
```

## Loading States

### 1. Skeleton Loader

```css
.skeleton {
  background: var(--skeleton-gradient);
  background-size: 200% 100%;
  animation: shimmer 1.5s infinite;
  border-radius: var(--token-radius-md);
}

@keyframes shimmer {
  0% { background-position: -200% 0; }
  100% { background-position: 200% 0; }
}

.skeleton-text {
  height: 1rem;
  width: 100%;
  margin-bottom: var(--token-space-sm);
}

.skeleton-card {
  height: 200px;
  width: 100%;
}
```

### 2. Spinner

```css
.spinner {
  width: var(--token-space-4xl);
  height: var(--token-space-4xl);
  border: 3px solid var(--muted);
  border-top-color: var(--primary);
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}
```

## Empty States

```css
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: var(--token-space-4xl);
  text-align: center;
  color: var(--token-text-secondary);
}

.empty-state-icon {
  width: 64px;
  height: 64px;
  margin-bottom: var(--token-space-xl);
  opacity: 0.5;
}

.empty-state-title {
  font-size: var(--token-font-xl);
  font-weight: var(--token-font-weight-semibold);
  color: var(--foreground);
  margin-bottom: var(--token-space-md);
}

.empty-state-message {
  font-size: var(--token-font-md);
  color: var(--token-text-secondary);
}
```

## Animation Patterns

### 1. Fade In

```css
@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(-8px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.fade-in {
  animation: fadeIn 0.3s ease;
}
```

### 2. Slide Up

```css
@keyframes slideUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.slide-up {
  animation: slideUp 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94);
}
```

### 3. Pulse (for In Progress indicators)

```css
@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}

.pulse {
  animation: pulse 2s ease-in-out infinite;
}
```

## Usage Guidelines

### When to Use Each Pattern

**Cards**:
- List items (ClassList, EntryList)
- Summary information (Trial info, Dashboard stats)
- Interactive containers (clickable to navigate)

**Badges**:
- Status indicators (in-progress, completed)
- Counts (entry counts, notification counts)
- Labels (tags, categories)

**Buttons**:
- Primary actions (Save, Submit, Create)
- Secondary actions (Cancel, Close)
- Icon-only actions (Favorite, Menu, Delete)

**Dialogs**:
- Settings/configuration
- Confirmations (delete, cancel)
- Forms (create/edit entries)

**Forms**:
- User input (text, datetime, toggles)
- Settings pages
- Filters and search

### Customization Guidelines

1. **Start with base pattern** - Copy exact CSS
2. **Add component-specific classes** - Don't modify base
3. **Override with specific selectors** - Use semantic class names
4. **Test responsiveness** - Verify at all breakpoints
5. **Verify accessibility** - Check focus states, contrast

### Example: Customizing a Card

```css
/* ✅ GOOD: Extending base pattern */
.class-card {
  /* Inherits all .card styles */
}

.class-card-specific-feature {
  /* Component-specific addition */
  border-left: 3px solid var(--status-in-progress);
}
```

```css
/* ❌ BAD: Recreating from scratch */
.class-card {
  background: white;
  padding: 12px;
  /* Don't reinvent the wheel! */
}
```

---

**Remember**: These patterns exist to maintain consistency. Always check this library before creating new components!
