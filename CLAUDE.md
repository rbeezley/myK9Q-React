# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

# myK9Q - Professional Dog Show Scoring Application

A production-ready Progressive Web App for professional dog show ring scoring and management with real-time collaboration across judges, stewards, and exhibitors.

## Essential Commands

### Development
```bash
# Start development server
npm run dev

# Type checking (ALWAYS run before committing)
npm run typecheck

# Linting
npm run lint

# Production build
npm run build

# Environment setup (for new developers)
npm run setup

# Testing
npm test
npm run test:coverage
```

### Testing Specific Commands
```bash
# Run all tests
npm test

# Run tests with coverage
npm run test:coverage

# Run single test file
npm test -- entry.test.ts

# Run tests in watch mode
npm test -- --watch
```

## Critical Architecture Concepts

### Authentication & Passcode System
**CORE CONCEPT**: Passcodes are generated from license keys, not stored in database.

- License key format: `myK9Q1-d8609f3b-d3fd43aa-6323a604`
- Passcode generation: Role prefix + 4 digits from license key segments
- Roles: `admin` (a), `judge` (j), `steward` (s), `exhibitor` (e)
- Example: License key above generates `ad860`, `j9f3b`, `sd3fd`, `e6323`

**Key Files:**
- `src/utils/auth.ts`: Passcode parsing and generation logic
- `src/contexts/AuthContext.tsx`: Authentication state management
- `src/hooks/usePermission.ts`: Permission checking utilities

### Database Architecture (Supabase)
**CRITICAL**: Legacy table structure with specific naming conventions.

**Primary Tables:**
- `tbl_show_queue`: Show/trial information (license key = tenant isolation)
- `tbl_class_queue`: Class definitions with timing and configuration
- `tbl_entry_queue`: Dog entries, scores, and check-in status
- `view_entry_class_join_distinct`: Optimized read view for entry lists

**Key Database Concepts:**
- `mobile_app_lic_key`: Multi-tenant data isolation field
- `classid` vs `id`: Real-time subscriptions use `classid` field, not primary key `id`
- Check-in status: Integer codes (0=none, 1=checked-in, 2=conflict, 3=pulled, 4=at-gate)
- Self check-in control: `self_checkin` boolean field in `tbl_class_queue`

### Real-Time Data Flow
**PATTERN**: Zustand stores + Supabase real-time subscriptions + Service layer

```typescript
// Service layer handles all database operations
entryService.ts -> Supabase queries/mutations
                -> Real-time subscriptions
                -> Optimistic updates

// Stores manage client state
entryStore.ts    -> Entry data and filters
scoringStore.ts  -> Active scoring sessions
timerStore.ts    -> Multi-timer management
offlineQueueStore.ts -> Offline sync queue
```

### Organization-Specific Scoresheets
**DYNAMIC ROUTING**: Scoresheets selected by organization + element + level

**Path Logic:**
1. Parse URL for `orgType/element/level` (e.g., `akc/scent-work/excellent`)
2. Map to specific scoresheet component
3. Load organization-specific scoring rules and validation

**Scoresheet Hierarchy:**
```
src/pages/scoresheets/
├── AKC/
│   ├── AKCScentWorkScoresheet.tsx    # Multi-area timing
│   ├── AKCScentWorkScoresheet-Enhanced.tsx # Nationals version
│   └── AKCFastCatScoresheet.tsx      # Speed-based scoring
├── UKC/
│   ├── UKCObedienceScoresheet.tsx    # Traditional scoring
│   └── UKCRallyScoresheet.tsx        # Point deduction system
└── ASCA/
    └── ASCAScentDetectionScoresheet.tsx
```

### Permission System
**ROLE-BASED ACCESS**: Granular permissions per user role

```typescript
interface UserPermissions {
  canViewPasscodes: boolean;      // Admin only
  canAccessScoresheet: boolean;   // Admin, Judge
  canChangeRunOrder: boolean;     // Admin, Judge, Steward
  canCheckInDogs: boolean;        // All roles (with self check-in logic)
  canScore: boolean;              // Admin, Judge
  canManageClasses: boolean;      // Admin, Judge
}
```

**Self Check-in Logic:**
- Controlled by `self_checkin` field in `tbl_class_queue`
- When disabled, exhibitors cannot change check-in status
- Admins/judges/stewards retain full control
- Custom modal alerts replace browser alerts

### PWA & Offline Architecture
**OFFLINE-FIRST**: Critical for remote competition venues

**Strategy:**
1. Service worker caches essential assets
2. Supabase data cached with NetworkFirst strategy
3. Failed mutations queued in `offlineQueueStore`
4. Real-time sync when connectivity returns
5. Optimistic UI updates for immediate feedback

## Environment Configuration

**REQUIRED**: Supabase credentials in `.env.local`
```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

**Setup Methods:**
1. Automated: `npm run setup` (recommended)
2. Manual: Copy `.env.local.example` and edit

## Testing Architecture

**Current Test Coverage:**
- `src/utils/auth.test.ts`: Authentication utilities
- `src/services/entryService.test.ts`: Entry service functions
- `src/stores/entryStore.test.ts`: Store state management

**Testing Patterns:**
- Vitest for unit tests
- React Testing Library for component tests
- Mock Supabase client for service tests

## Development Guidelines

### File Organization Rules
- Use appropriate subdirectories: `/src`, `/tests`, `/docs`, `/config`
- Modular design: Keep files under 500 lines
- Follow existing naming conventions

### Database Changes
- Test with real data: Use license key `myK9Q1-a260f472-e0d76a33-4b6c264c`
- Always verify `self_checkin` field behavior
- Use actual `classid` values for real-time subscriptions
- Check permission logic with different user roles

### Performance Considerations
- Memoize expensive calculations in scoresheets
- Use optimistic updates for immediate UI feedback
- Implement proper cleanup for real-time subscriptions
- Monitor bundle size (current: 431.21 kB, 121.61 kB gzipped)

### Scoring System Patterns
- Multi-timer support for complex scenarios (AKC Scent Work)
- Qualification logic per organization rules
- Haptic feedback for mobile judging experience
- Real-time score updates across all connected devices

## Key Integration Points

### Supabase Real-time
```typescript
// Subscribe to entry updates for a specific class
supabase
  .channel('entry_updates')
  .on('postgres_changes',
    { event: '*', schema: 'public', table: 'tbl_entry_queue', filter: `classid_fk=eq.${classId}` },
    handleEntryUpdate
  )
  .subscribe()
```

### Authentication Flow
```typescript
// Login with passcode and show context
const { role, showContext, permissions } = useAuth();
const { hasPermission } = usePermission();

// Check permissions before actions
if (hasPermission('canAccessScoresheet')) {
  // Show scoresheet access
}
```

### Nationals vs Regular Show Detection
```typescript
// Show type detection for enhanced features
const isNationals = showContext?.showType?.toLowerCase().includes('national') ||
                   showContext?.competition_type?.toLowerCase().includes('national');
```

## Common Debugging

### Authentication Issues
- Verify license key format and database presence
- Check passcode generation logic in browser console
- Confirm RLS policies in Supabase

### Real-time Issues
- Verify subscription uses `classid_fk` not `class_id`
- Check network connectivity and Supabase status
- Monitor subscription status in browser console

### Permission Issues
- Test with different user roles (exhibitor vs admin)
- Verify `self_checkin` field values in database
- Check role assignment from passcode parsing

## Development Notes

- Follow existing code patterns and architectural decisions
- Test thoroughly with different user roles before deploying changes
- Always verify real-time subscriptions work correctly after database changes