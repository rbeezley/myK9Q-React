# Component Quality Checklist

Use this checklist before committing new or modified components.

## TypeScript & Props

- [ ] Component has proper TypeScript interface
- [ ] All props are typed (no `any` types)
- [ ] Optional props have `?` marker
- [ ] Default values are set for optional props
- [ ] Props are documented with JSDoc comments (if complex)
- [ ] No unused props in interface
- [ ] Callback props follow `onAction` naming pattern

**Example**:
```typescript
interface MyComponentProps {
  /** The unique identifier for the component */
  id: number;
  /** The title to display */
  title: string;
  /** Optional subtitle */
  subtitle?: string;
  /** Called when the component is clicked */
  onClick?: () => void;
}

export const MyComponent: React.FC<MyComponentProps> = ({
  id,
  title,
  subtitle = '',  // Default value
  onClick,
}) => {
  // ...
};
```

## Component Structure

- [ ] Component uses functional component pattern (`React.FC`)
- [ ] Hooks are at the top of the component
- [ ] Event handlers are defined before JSX
- [ ] Complex logic is extracted to helper functions
- [ ] No nested component definitions
- [ ] Early returns for loading/error states
- [ ] No more than 200 lines (split if larger)

**Example structure**:
```typescript
export const MyComponent: React.FC<Props> = (props) => {
  // 1. Hooks
  const [state, setState] = useState(initial);
  const { data, loading } = useData();

  // 2. Early returns
  if (loading) return <Loader />;
  if (!data) return <EmptyState />;

  // 3. Event handlers
  const handleClick = () => {
    // ...
  };

  // 4. Render helpers
  const renderItem = (item) => {
    // ...
  };

  // 5. JSX
  return (
    <div>
      {/* ... */}
    </div>
  );
};
```

## CSS & Styling

- [ ] Component has dedicated CSS file OR uses shared-ui.css
- [ ] All styles use design tokens (no hardcoded values)
- [ ] Mobile-first approach (base styles for mobile)
- [ ] Media queries consolidated (one block per breakpoint)
- [ ] No `!important` declarations (except utilities)
- [ ] Semantic class names (`.class-card`, not `.flex-col`)
- [ ] BEM naming for variants (`.card--status`, `.card__header`)
- [ ] Follows horizontal alignment rules (12px/24px padding)
- [ ] Dark theme works correctly
- [ ] Reduced motion support for animations

**CSS file requirements**:
```css
/* Component.css */

/* 1. CSS Variables (if needed) */
:root { }

/* 2. Base/Mobile Styles (no media query) */
.component { }

/* 3. Tablet (ONE block) */
@media (min-width: 640px) { }

/* 4. Desktop (ONE block) */
@media (min-width: 1024px) { }

/* 5. Accessibility */
@media (prefers-reduced-motion: reduce) { }
```

## Responsiveness

- [ ] Tested at 375px (mobile)
- [ ] Tested at 768px (tablet)
- [ ] Tested at 1024px (desktop)
- [ ] Tested at 1440px (large desktop)
- [ ] No horizontal scrolling at any breakpoint
- [ ] Touch targets are minimum 44x44px
- [ ] Text is readable at all sizes
- [ ] Images/media scale appropriately
- [ ] Grid/flex layouts adjust correctly

## Accessibility

- [ ] Semantic HTML elements used (`<button>`, `<nav>`, etc.)
- [ ] All interactive elements are keyboard accessible
- [ ] Proper `aria-label` for icon-only buttons
- [ ] `aria-labelledby` / `aria-describedby` where needed
- [ ] Focus states are visible
- [ ] Color contrast meets WCAG AA (4.5:1 for text)
- [ ] Error messages are announced to screen readers
- [ ] Form inputs have associated labels
- [ ] Links have descriptive text (not "click here")
- [ ] Images have alt text

**Example**:
```tsx
<button
  aria-label="Close dialog"
  onClick={handleClose}
>
  <X size={20} />
</button>

<label htmlFor="dog-name">Dog Name</label>
<input id="dog-name" type="text" />
```

## Performance

- [ ] No unnecessary re-renders (use React DevTools Profiler)
- [ ] Expensive calculations use `useMemo`
- [ ] Callbacks use `useCallback` (if passed to children)
- [ ] Lists use proper `key` prop (unique, stable ID)
- [ ] Images use `loading="lazy"` when appropriate
- [ ] No console.log statements (use logger or remove)
- [ ] Large lists use virtualization (if 100+ items)

**Example**:
```typescript
const expensiveValue = useMemo(() => {
  return calculateComplexValue(data);
}, [data]);

const handleClick = useCallback(() => {
  // ...
}, [dependency]);

{items.map(item => (
  <Card key={item.id} {...item} />  // Use stable ID
))}
```

## State Management

- [ ] Local state uses `useState` or `useReducer`
- [ ] Global state uses Zustand store
- [ ] No prop drilling (use context or store)
- [ ] State updates are batched when possible
- [ ] Async state has loading/error states
- [ ] Form state is controlled or uses form library

**Example**:
```typescript
// Local state
const [count, setCount] = useState(0);

// Global state (Zustand)
const entries = useEntryStore((state) => state.entries);
const addEntry = useEntryStore((state) => state.addEntry);

// Async state
const [loading, setLoading] = useState(false);
const [error, setError] = useState<Error | null>(null);
```

## Error Handling

- [ ] Try-catch blocks for async operations
- [ ] Error states are displayed to user
- [ ] Errors are logged (use logger)
- [ ] Fallback UI for errors (not just blank screen)
- [ ] Network errors have retry mechanism
- [ ] Form validation errors are shown inline

**Example**:
```typescript
try {
  await saveData(data);
  toast.success('Saved successfully');
} catch (error) {
  logger.error('Failed to save data', error);
  toast.error('Failed to save. Please try again.');
  setError(error);
}
```

## Data Flow

- [ ] Props flow down (parent to child)
- [ ] Events flow up (child to parent via callbacks)
- [ ] No bi-directional data binding
- [ ] Stores/services handle async operations (not components)
- [ ] API calls are in services (not components)

**Example**:
```typescript
// GOOD: Data down, events up
<ClassCard
  classData={classData}              // Data down
  onClick={() => handleClick(id)}    // Event up
/>

// BAD: Component making API calls directly
const MyComponent = () => {
  const saveData = async () => {
    await supabase.from('entries').insert(data);  // ❌ Use service
  };
};
```

## Testing

- [ ] Component can be rendered without errors
- [ ] Loading states render correctly
- [ ] Error states render correctly
- [ ] Empty states render correctly
- [ ] User interactions work (clicks, inputs)
- [ ] Keyboard navigation works
- [ ] Forms can be submitted
- [ ] API mocks return expected data

**Example test**:
```typescript
describe('ClassCard', () => {
  it('renders class title', () => {
    render(<ClassCard title="Novice A" />);
    expect(screen.getByText('Novice A')).toBeInTheDocument();
  });

  it('calls onClick when clicked', () => {
    const handleClick = vi.fn();
    render(<ClassCard onClick={handleClick} />);
    fireEvent.click(screen.getByRole('button'));
    expect(handleClick).toHaveBeenCalledOnce();
  });
});
```

## Documentation

- [ ] Component has JSDoc comment with description
- [ ] Complex props have JSDoc comments
- [ ] Example usage is provided (in comments or docs)
- [ ] Edge cases are documented
- [ ] Breaking changes are noted in commit message

**Example**:
```typescript
/**
 * ClassCard displays a summary of a class with status, time, and entry count.
 *
 * @example
 * ```tsx
 * <ClassCard
 *   id={1}
 *   title="Novice A"
 *   status="in-progress"
 *   entryCount={12}
 *   onClick={() => navigate(`/class/${id}`)}
 * />
 * ```
 */
export const ClassCard: React.FC<ClassCardProps> = (props) => {
  // ...
};
```

## Design System Compliance

- [ ] Follows established component patterns
- [ ] Uses design tokens exclusively
- [ ] Matches existing visual style
- [ ] Consistent with similar components
- [ ] No duplicate components (check if exists first)

**Check existing patterns**:
- Card components → Use `card-template.tsx`
- Status badges → Use `status-badge-template.tsx`
- Dialogs → Use `dialog-template.tsx`
- Forms → Use `form-section-template.tsx`

## Security

- [ ] User input is sanitized
- [ ] No XSS vulnerabilities (avoid `dangerouslySetInnerHTML`)
- [ ] No sensitive data in console.log
- [ ] API keys/secrets not in client code
- [ ] File uploads are validated (type, size)

## Browser Compatibility

- [ ] Works in Chrome (latest)
- [ ] Works in Safari (latest)
- [ ] Works in Firefox (latest)
- [ ] Works in Edge (latest)
- [ ] No deprecated APIs used

## Final Checks

- [ ] `npm run typecheck` passes
- [ ] `npm run lint` passes
- [ ] `npm run build` succeeds
- [ ] Component works in light theme
- [ ] Component works in dark theme
- [ ] No console errors in browser
- [ ] No console warnings in browser
- [ ] Git commit message is descriptive

## Specific Component Types

### Card Components

- [ ] Hover effect with shadow and lift
- [ ] Click handler prevents event bubbling for action buttons
- [ ] Status border (if applicable) uses correct color
- [ ] Favorite/menu buttons are 44x44px minimum
- [ ] Card content doesn't overflow

### Form Components

- [ ] All inputs have labels
- [ ] Validation errors show inline
- [ ] Submit button disabled during submission
- [ ] Form reset clears all fields
- [ ] Enter key submits form (if appropriate)

### Dialog/Modal Components

- [ ] Closes on Escape key
- [ ] Closes on backdrop click (if appropriate)
- [ ] Focus traps within dialog
- [ ] Restores focus on close
- [ ] Body scroll is locked when open
- [ ] Accessible close button

### List Components

- [ ] Empty state shows when no items
- [ ] Loading state shows during fetch
- [ ] Pagination/infinite scroll works correctly
- [ ] Sorting/filtering works correctly
- [ ] Items have stable keys

## Pre-Commit Command

Run this before committing:

```bash
npm run typecheck && npm run lint
```

If either fails, fix the issues before committing.

## Component Quality Score

Give your component a score out of 100:

- **90-100**: Production ready, excellent quality
- **70-89**: Good quality, minor improvements needed
- **50-69**: Acceptable, but needs work
- **Below 50**: Not ready for production

Aim for 90+ on all components!

---

**Remember**: Quality over speed. A well-built component saves time in the long run through fewer bugs and easier maintenance!
