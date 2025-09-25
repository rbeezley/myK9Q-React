# CLAUDE.md

# myK9Q - Dog Show Scoring PWA

## Essential Commands
```bash
npm run dev          # Development server
npm run typecheck    # ALWAYS run before committing
npm run lint         # Linting
npm run build        # Production build
npm test             # Run tests
```

## Authentication
- Passcodes generated from license keys (not stored in DB)
- Format: Role prefix + 4 digits from license segments
- Roles: admin(a), judge(j), steward(s), exhibitor(e)
- Files: `src/utils/auth.ts`, `src/contexts/AuthContext.tsx`

## Database (Supabase)
- `shows`: Shows (license key = tenant isolation)
- `trials`: Trials linked to shows
- `classes`: Classes (`self_checkin_enabled` controls exhibitor access)
- `entries`: Entries (check_in_status: 0-3)
- `results`: Scoring results linked to entries
- `view_entry_class_join_normalized`: Normalized view joining all entry/class data
- Real-time: Use standard `id` field for all tables

## Architecture Patterns
- Zustand stores + Supabase real-time + Service layer
- Scoresheet routing: `orgType/element/level`
- Permission system via `usePermission` hook
- Offline-first with queue sync

## Environment Setup
Run `npm run setup` or copy `.env.local.example`

## Key Development Rules
- Test license key: `myK9Q1-a260f472-e0d76a33-4b6c264c`
- Always verify `self_checkin_enabled` field behavior
- Use standard `id` fields for all database operations
- Test with different user roles (admin: aa260, judge: ja260, etc.)
- Run `npm run typecheck` before commits
- **IMPORTANT**: Only use normalized tables (shows, trials, classes, entries, results)
- **NEVER** use legacy `tbl_*` tables - they have been removed