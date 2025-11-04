# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Essential Commands
```bash
npm run dev          # Development server (Vite)
npm run typecheck    # Type checking - ALWAYS run before committing
npm run lint         # ESLint validation
npm run build        # Production build (runs typecheck + vite build)
npm run preview      # Preview production build
npm test             # Run tests with Vitest
npm run test:coverage # Run tests with coverage report
npm run setup        # Interactive Supabase environment setup
```

## Tech Stack
- **Frontend**: React 18.3 + TypeScript 5.2 (strict mode)
- **Build**: Vite 5.3 with PWA plugin
- **State**: Zustand 5.0 with devtools middleware
- **Database**: Supabase (PostgreSQL + real-time subscriptions)
  - **Project**: myK9Q-React-Dev (ID: yyzgjyiqgmjzyhzkqdfx)
  - **Region**: us-east-2
  - **Use this project ID for all Supabase MCP operations**
- **Routing**: React Router DOM 6.22
- **Styling**: Semantic CSS with design tokens (CSS variables for theming)
- **UI**: Lucide React icons, @dnd-kit for drag-and-drop
- **Testing**: Vitest + React Testing Library + Playwright

## Application Architecture

### Three-Tier Pattern
1. **Stores** (Zustand): Client-side state management
   - `entryStore`: Entry data, filters, pagination
   - `scoringStore`: Active scoring sessions and timer state
   - `offlineQueueStore`: Offline sync queue management
   - `nationalsStore`: Nationals-specific scoring state
   - `timerStore`: Multi-timer management
   - `announcementStore`: Push notification state

2. **Services**: Business logic and API communication
   - `entryService`: Entry CRUD + real-time sync
   - `authService`: Authentication flow
   - `placementService`: Placement calculation
   - `nationalsScoring`: Nationals scoring logic
   - `announcementService`: Push notification service

3. **Components/Pages**: React UI layer
   - Uses `@/` path alias for imports (resolved via Vite)
   - Lazy loading for routes (see [App.tsx](src/App.tsx))
   - Error boundaries for scoresheet isolation

### Authentication System
- **Passcode-based**: No passwords, uses license key derivation
- **Format**: `[role][4 digits]` (e.g., `aa260`, `j9f3b`)
- **Roles**: admin (a), judge (j), steward (s), exhibitor (e)
- **Generation**: Extracts 4-char segments from license key parts
  - Example: `myK9Q1-a260f472-e0d76a33-4b6c264c` → admin: `aa260`, judge: `jf472`, steward: `se0d7`, exhibitor: `e4b6c`
- **Permissions**: Role-based via [usePermission](src/hooks/usePermission.ts) hook
- **Storage**: localStorage with `myK9Q_auth` key
- **Files**: [src/utils/auth.ts](src/utils/auth.ts), [src/contexts/AuthContext.tsx](src/contexts/AuthContext.tsx)

### Database Schema (Supabase)
**Core Tables** (normalized, no `tbl_*` prefix):
- `shows`: Show/trial containers (license_key = multi-tenant isolation)
- `trials`: Trial instances linked to shows
- `classes`: Class definitions with `self_checkin_enabled` flag
- `entries`: Dog entries (armband_number, call_name, handler)
- `results`: Scoring results (time, faults, placement)
- `class_requirements`: Organization-specific class requirements with configurable rules
  - `has_30_second_warning` (boolean, default: true): Whether 30-second warning is given
  - `time_type` ('fixed'|'range'|'dictated', default: 'range'): Type of max time allowed
  - `warning_notes` (text): Custom warning message for display
  - `updated_at` (timestamp): Auto-updated via trigger when rules change

**Key Views**:
- `view_entry_class_join_normalized`: Pre-joined data for queries (entries + classes + trials + shows)
- `view_trial_summary_normalized`: Trial summary with show context (trial info + show info)
- `view_class_summary`: **Performance view** - Pre-aggregated entry counts and scoring statistics per class
  - Eliminates: 3-4 separate queries per class list
  - Returns: Class info + trial info + show info + 7 aggregated counts (total_entries, scored_entries, checked_in_count, at_gate_count, in_ring_count, qualified_count, nq_count)
  - Use in: ClassList, Home dashboard, CompetitionAdmin pages
- `view_entry_with_results`: **Performance view** - Entries pre-joined with results table
  - Eliminates: Separate entries + results queries + JavaScript map/join logic
  - Returns: All entry fields + all result fields + computed convenience fields
  - Use in: entryService, entry lists, scoresheet data loading, dog details

**Real-time Subscriptions**:
- Use standard `id` field for all tables
- Subscribe to specific license_key for multi-tenant filtering
- Handle inserts/updates/deletes in stores

### Scoresheet System
**Dynamic Routing**: `/scoresheet/:orgType/:element/:level/:entryId`
- `orgType`: AKC, UKC, ASCA
- `element`: Scent Work, Rally, Obedience, etc.
- `level`: Novice, Advanced, Excellent, Masters

**Available Scoresheets**:
- [AKC Scent Work](src/pages/scoresheets/AKC/AKCScentWorkScoresheet-Enhanced.tsx) - Multi-area timing
- [AKC FastCat](src/pages/scoresheets/AKC/AKCFastCatScoresheet.tsx) - Speed scoring
- [UKC Obedience](src/pages/scoresheets/UKC/UKCObedienceScoresheet.tsx)
- [UKC Rally](src/pages/scoresheets/UKC/UKCRallyScoresheet.tsx)
- [ASCA Scent Detection](src/pages/scoresheets/ASCA/ASCAScentDetectionScoresheet.tsx)

**Nationals Detection**:
- Check `competition_type` field for "National"
- Use [nationalsStore](src/stores/nationalsStore.ts) and [nationalsScoring service](src/services/nationalsScoring.ts)
- Different scoring logic for nationals vs regular trials

### Offline-First Architecture
- **Queue Pattern**: [offlineQueueStore](src/stores/offlineQueueStore.ts) buffers writes when offline
- **Sync Strategy**: NetworkFirst caching via Workbox (see [vite.config.ts](vite.config.ts))
- **Real-time**: Supabase subscriptions auto-reconnect
- **Visual Feedback**: Connection status indicators

### PWA Configuration
- **Manifest**: Defined in [vite.config.ts](vite.config.ts)
- **Service Worker**: Auto-generated via vite-plugin-pwa
- **Cache Strategy**: NetworkFirst for Supabase API, assets cached
- **Icons**: 192x192 and 512x512 maskable icons required

## Development Rules

### CSS Architecture & Standards

**Philosophy: Simple, Clean, Fast**
- Semantic CSS class names (NOT utility-first like Tailwind)
- Design tokens via CSS variables for all spacing/colors
- Consolidated files (30 total, not 100+)
- One media query block per breakpoint per file

**Core Principles:**
1. **Mobile-First**: Base styles are mobile, enhance for tablet/desktop
2. **Design Tokens Only**: Never hardcode colors or spacing
3. **Zero !important**: Only allowed in utility classes
4. **Consolidated Media Queries**: One block per breakpoint per file

**File Organization:**

**Global Styles** (`src/styles/`):
- `design-tokens.css` - All CSS variables (spacing, colors, typography)
- `shared-components.css` - Reusable component patterns (cards, buttons, badges)
- `page-container.css` - Page layout system
- `utilities.css` - Utility classes (.sr-only, .truncate, etc.)

**Page Styles** (`src/pages/*/`):
- ONE CSS file per page route
- Contains ONLY page-specific styles
- Common patterns should reference shared-components.css classes

**Component Styles**:
- **Simple components** (Button, Badge, Card): Use `src/components/ui/shared-ui.css`
- **Complex components** (DogCard, MultiTimer): Own CSS file (100+ lines of unique styles)
- **Dialogs**: Use `src/components/dialogs/shared-dialog.css`

**When to Create New CSS File:**
```
✅ CREATE new file when:
   - Component has 100+ lines of unique styles
   - Component has complex state-dependent styling
   - Component is page-specific (page CSS files)

❌ USE shared CSS when:
   - Component is < 100 lines of CSS
   - Styles are mostly variations of existing patterns
   - Component uses design tokens with minimal customization
```

**Required CSS File Structure:**
```css
/* ===== COMPONENT_NAME.css ===== */

/* CSS Variables (if needed) */
:root { --component-var: value; }

/* Base/Mobile Styles (no media query - mobile first!) */
.component {
  padding: var(--token-space-lg);  /* Always use tokens */
  color: var(--foreground);         /* Never hardcode colors */
}

/* Tablet (ONE block only) */
@media (min-width: 640px) {
  .component { padding: var(--token-space-xl); }
}

/* Desktop (ONE block only) */
@media (min-width: 1024px) {
  .component { padding: var(--token-space-3xl); }
}

/* Accessibility */
@media (prefers-reduced-motion: reduce) {
  .component { animation: none; }
}

/* Theme (use CSS variables - they handle switching) */
.theme-dark .component { /* Usually not needed */ }
```

**Spacing System (Horizontal Alignment):**
```css
/* Mobile: All sections use 12px left padding */
.page-section { padding: 0 var(--token-space-lg); }

/* Desktop: All sections use 24px */
@media (min-width: 1024px) {
  .page-section { padding: 0 var(--token-space-3xl); }
}
```

**Design Token Reference:**
```css
/* Spacing */
--token-space-xs: 0.125rem;   /* 2px */
--token-space-sm: 0.25rem;    /* 4px */
--token-space-md: 0.5rem;     /* 8px */
--token-space-lg: 0.75rem;    /* 12px - mobile container padding */
--token-space-xl: 1rem;       /* 16px */
--token-space-2xl: 1.25rem;   /* 20px */
--token-space-3xl: 1.5rem;    /* 24px - desktop container padding */
--token-space-4xl: 2rem;      /* 32px */

/* Status Colors */
--status-checked-in: #10b981;
--status-at-gate: #8b5cf6;
--status-in-ring: #3b82f6;
/* See design-tokens.css for complete list */
```

**Forbidden Practices:**
```css
/* ❌ NEVER do this */
@media (max-width: 640px) { .foo { } }
/* ... 500 lines later ... */
@media (max-width: 640px) { .bar { } }  /* Duplicate breakpoint! */

.component { padding: 12px; }            /* Hardcoded spacing! */
.component { color: red !important; }    /* Specificity war! */
.status { background: #10b981; }         /* Hardcoded color! */

/* ✅ ALWAYS do this */
@media (max-width: 640px) {
  .foo { }
  .bar { }  /* Consolidated in ONE block */
}

.component { padding: var(--token-space-lg); }
.component { color: red; }  /* No !important needed */
.status { background: var(--status-checked-in); }
```

**Media Query Breakpoints (Use These Only):**
- Mobile: `< 640px` (base styles, NO media query wrapper)
- Tablet: `@media (min-width: 640px)`
- Desktop: `@media (min-width: 1024px)`
- Large: `@media (min-width: 1440px)` (rarely needed)

**Pre-Commit CSS Checklist:**
- [ ] All spacing uses design tokens (no hardcoded px/rem)
- [ ] All colors use design tokens (no hardcoded hex)
- [ ] Zero `!important` declarations (except utility classes)
- [ ] Media queries consolidated (one block per breakpoint)
- [ ] Tested at 375px, 768px, 1024px, 1440px
- [ ] Light and dark theme both work
- [ ] Left-edge alignment verified across all sections

**Reference Documents:**
- [CSS-IMPROVEMENT-ROADMAP.md](CSS-IMPROVEMENT-ROADMAP.md) - Consolidation plan and metrics
- [docs/CSS_ARCHITECTURE.md](docs/CSS_ARCHITECTURE.md) - Detailed patterns and pitfalls
- [docs/COMPONENT_TESTING.md](docs/COMPONENT_TESTING.md) - Testing matrix
- [docs/style-guides/design-system.md](docs/style-guides/design-system.md) - Design tokens and colors

### Type Safety
- TypeScript strict mode enabled
- Run `npm run typecheck` before commits
- No `any` types without explicit justification
- Use proper interfaces for Entry, Class, Result types

### Database Operations
- **NEVER** use legacy `tbl_*` table names - they have been removed
- Always use normalized tables: `shows`, `trials`, `classes`, `entries`, `results`
- Always filter by `license_key` for multi-tenant isolation
- Use `self_checkin_enabled` field for exhibitor access control
- Check-in status uses integer codes (0-3)
- **Configurable Class Rules**: Components check database fields first (e.g., `has_30_second_warning`, `time_type`), then fall back to hardcoded logic for backward compatibility
- Migration 013 must be run to enable configurable class rules (see [supabase/migrations/013_add_class_rule_configuration.sql](supabase/migrations/013_add_class_rule_configuration.sql))

### State Management
- Zustand stores for global state
- Services for async operations
- React Query could be integrated for server state (currently using manual fetching)

### Settings & User Preferences
- **Auto-Cleanup**: Data older than 30 days is automatically cleaned up daily (no user setting required)
- **WiFi Detection**: Use `useConnectionWarning` hook to detect cellular vs WiFi and show appropriate warnings
- **Auto-Save**: Always enabled with 3 drafts per entry (no user setting needed)
- **Auto-Logout**: Simplified to "Keep me logged in" toggle (24h vs 8h timeout)
- **Removed Settings**: Storage limit, sync frequency, pull sensitivity, max drafts, image quality - these are now automatic/hardcoded for simplicity

### Testing Strategy
- Unit tests: auth utilities ([src/utils/auth.test.ts](src/utils/auth.test.ts))
- Store tests: [src/stores/entryStore.test.ts](src/stores/entryStore.test.ts)
- Service tests: [src/services/entryService.test.ts](src/services/entryService.test.ts)
- E2E: Playwright tests (configured but minimal coverage)

### Test License Key
For development/testing: `myK9Q1-a260f472-e0d76a33-4b6c264c`
- Admin: `aa260`
- Judge: `jf472`
- Steward: `se0d7`
- Exhibitor: `e4b6c`

## Component Patterns

### Path Alias
Use `@/` for src imports:
```typescript
import { useAuth } from '@/contexts/AuthContext';
import { Entry } from '@/stores/entryStore';
```

### Protected Routes
Wrap routes with `<ProtectedRoute>` component for auth checks

### Error Boundaries
- General: `<ErrorBoundary>` for app-level errors
- Scoresheets: `<ScoresheetErrorBoundary>` for scoresheet isolation

### Loading States
- Page-level: `<PageLoader>`
- Scoresheet-level: `<ScoresheetLoader>`
- Suspense boundaries for lazy-loaded routes

## Environment Setup
Required `.env.local` variables:
```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

Run `npm run setup` for interactive configuration.

## Build Output
- Main bundle: ~431 kB (121 kB gzipped)
- Service worker: Auto-generated
- Code splitting: Route-based via React.lazy()

## Multi-Organization Support
- **AKC**: Scent Work, FastCat
- **UKC**: Obedience, Rally, Agility
- **ASCA**: Scent Detection

Each organization has dedicated scoresheet components under `src/pages/scoresheets/[ORG]/`
