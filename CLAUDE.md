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
- **Routing**: React Router DOM 6.22
- **Styling**: TailwindCSS with custom components
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

**Key View**:
- `view_entry_class_join_normalized`: Pre-joined data for queries (entries + classes + trials + shows)

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

### State Management
- Zustand stores for global state
- Services for async operations
- React Query could be integrated for server state (currently using manual fetching)

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
