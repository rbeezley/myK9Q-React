# Add Set Run Order to Combined Entry List

## Context
The regular EntryList page (for non-novice classes) has a "Set Run Order" option in its 3-dot menu. The CombinedEntryList page (for Novice A & B classes) does **not** have this option, even though the `RunOrderDialog` component is already rendered in the page. We need to add "Set Run Order" to the combined entry list's 3-dot menu, and extend the dialog with a **scope picker** so users can set run order for All entries, Section A only, or Section B only. When a single section is selected, the user should be prompted to choose whether to preserve or renumber the other section's entries.

## Changes

### 1. Add "Set Run Order" to CombinedEntryList's actions menu
**File:** [CombinedEntryList.tsx](src/pages/EntryList/CombinedEntryList.tsx) (lines 591-599)

Add `showRunOrder`, `onRunOrderClick`, and permission check to the `actionsMenu` config, matching the pattern from `EntryList.tsx`:

```tsx
actionsMenu={{
  showRunOrder: hasPermission('canChangeRunOrder'),
  onRunOrderClick: () => setRunOrderDialogOpen(true),
  printOptions: [ ... ]
}}
```

This is the only change needed here — the `RunOrderDialog` is already rendered at line 672-678 with the correct props.

### 2. Add scope picker to RunOrderDialog
**File:** [RunOrderDialog.tsx](src/components/dialogs/RunOrderDialog.tsx)

When entries have A/B sections, add a **scope selector** at the top of the dialog before the preset options:

- **All Entries (A & B)** — default, current behavior
- **Section A Only**
- **Section B Only**

New state: `scope: 'all' | 'A' | 'B'` (default `'all'`).

When scope is `'all'`, show the existing section-aware presets (A then B, B then A, Combined, etc.).

When scope is `'A'` or `'B'`, show simplified presets (same as regular classes):
- Armband Low to High
- Armband High to Low
- Random Shuffle
- Manual Drag and Drop

New props to add:
```tsx
onApplyOrder: (preset: RunOrderPreset, scope?: 'all' | 'A' | 'B', renumberMode?: 'preserve' | 'renumber') => Promise<void>;
```

### 3. Add "Preserve vs Renumber" prompt for single-section scope
**File:** [RunOrderDialog.tsx](src/components/dialogs/RunOrderDialog.tsx)

When the user clicks "Apply" with a single-section scope (A or B), show an inline confirmation step within the dialog before applying:

- **Preserve other section** — Only renumber entries in the selected section. The other section keeps its current `exhibitor_order` values.
- **Renumber all** — After reordering the selected section, renumber all entries so the selected section comes first (1, 2, 3...) then the other section continues (4, 5, 6...).

This can be implemented as a second "step" in the dialog (the presets view transitions to a renumber-mode view on Apply click, then final Apply commits).

### 4. Update run order service to support scoped ordering
**File:** [runOrderService.ts](src/services/runOrderService.ts)

Add a new function `applyRunOrderPresetScoped` (or extend `applyRunOrderPreset`):

```tsx
export async function applyRunOrderPresetScoped(
  allEntries: Entry[],
  preset: RunOrderPreset,
  scope: 'all' | 'A' | 'B',
  renumberMode: 'preserve' | 'renumber'
): Promise<Entry[]>
```

Logic:
- **scope `'all'`**: Delegate to existing `applyRunOrderPreset` (unchanged behavior)
- **scope `'A'` or `'B'`, renumberMode `'preserve'`**:
  - Filter entries to the target section
  - Apply `calculateRunOrder` on just those entries
  - Only update `exhibitor_order` for the scoped entries (leave others untouched)
- **scope `'A'` or `'B'`, renumberMode `'renumber'`**:
  - Apply `calculateRunOrder` on the scoped section's entries
  - Place them first (1, 2, 3...)
  - Append the other section's entries in their current order, continuing the numbering
  - Update all entries in DB

### 5. Update CombinedEntryList handler to pass scope through
**File:** [CombinedEntryList.tsx](src/pages/EntryList/CombinedEntryList.tsx)

Update `handleApplyRunOrder` to accept and pass `scope` and `renumberMode`:

```tsx
const handleApplyRunOrder = useCallback(async (
  preset: RunOrderPreset,
  scope?: 'all' | 'A' | 'B',
  renumberMode?: 'preserve' | 'renumber'
) => {
  const reorderedEntries = await applyRunOrderPresetScoped(
    localEntries, preset, scope || 'all', renumberMode || 'renumber'
  );
  // ... rest unchanged
}, [localEntries, refresh]);
```

### 6. Update RunOrderDialog props type (backward compatible)
**File:** [RunOrderDialog.tsx](src/components/dialogs/RunOrderDialog.tsx)

Make the new callback params optional so the regular `EntryList` doesn't need changes:
```tsx
onApplyOrder: (preset: RunOrderPreset, scope?: 'all' | 'A' | 'B', renumberMode?: 'preserve' | 'renumber') => Promise<void>;
```

The regular EntryList passes entries without sections, so `hasSections` will be false and the scope picker won't render — no changes needed to `EntryList.tsx`.

## Files Modified
1. **[CombinedEntryList.tsx](src/pages/EntryList/CombinedEntryList.tsx)** — Add run order menu item + update handler
2. **[RunOrderDialog.tsx](src/components/dialogs/RunOrderDialog.tsx)** — Add scope picker UI + renumber mode step
3. **[runOrderService.ts](src/services/runOrderService.ts)** — Add scoped ordering logic
4. **[RunOrderDialog.css](src/components/dialogs/RunOrderDialog.css)** — Styles for scope picker + renumber step (if needed)

## Files NOT Modified
- **EntryList.tsx** — No changes needed (regular classes have no sections)
- **entryListHeaderHelpers.tsx** — Already supports `showRunOrder` / `onRunOrderClick` config
- **EntryListHeader.tsx** — Already passes through actionsMenu config

## Verification
1. Run `npm run typecheck` to verify no type errors
2. Run `npm run lint` to verify lint-clean
3. Run `npm run dev` and test:
   - Open a regular (non-novice) class → verify "Set Run Order" still works as before
   - Open a combined Novice A & B class → verify "Set Run Order" now appears in 3-dot menu
   - Click "Set Run Order" → verify scope picker shows (All, Section A, Section B)
   - Select "All" scope → verify existing section-aware presets appear
   - Select "Section A" scope → verify simplified presets appear
   - Apply a preset with Section A scope → verify renumber mode prompt appears
   - Test both "Preserve" and "Renumber" modes
   - Verify manual drag-and-drop still works in combined view
