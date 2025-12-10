# Supabase CLI Operations

This skill should be used when the user asks about Supabase operations: database migrations, Edge Functions, logs, SQL queries, schema changes, or type generation.

## Project Context

- **Project ID**: `yyzgjyiqgmjzyhzkqdfx`
- **Region**: us-east-2
- **Dashboard**: https://supabase.com/dashboard/project/yyzgjyiqgmjzyhzkqdfx

## Trigger Phrases

- "deploy edge function"
- "create migration"
- "check supabase logs"
- "run SQL"
- "generate types"
- "push schema changes"
- "supabase status"
- "database diff"

---

## Common Operations

### Check Project Status
```bash
npx supabase projects list
```

### Database Migrations

**Create a new migration:**
```bash
npx supabase migration new <migration_name>
```
Creates file in `supabase/migrations/` with timestamp prefix.

**Apply migrations to remote:**
```bash
npx supabase db push
```

**Check for schema drift:**
```bash
npx supabase db diff
```

**Pull remote schema locally:**
```bash
npx supabase db pull
```

### Edge Functions

**List deployed functions:**
```bash
npx supabase functions list
```

**Deploy a single function:**
```bash
npx supabase functions deploy <function_name>
```

**Deploy all functions:**
```bash
npx supabase functions deploy
```

**View function logs:**
```bash
npx supabase functions logs <function_name> --project-ref yyzgjyiqgmjzyhzkqdfx
```

**Current Edge Functions in this project:**
- `ask-myk9q` - AI chatbot for rules and show data queries
- `search-rules-v2` - Full-text search on competition rules
- `send-push-notification` - PWA push notifications
- `validate-passcode` - Authentication passcode validation

### Logs & Debugging

**View API logs:**
```bash
npx supabase logs api --project-ref yyzgjyiqgmjzyhzkqdfx
```

**View database logs:**
```bash
npx supabase logs postgres --project-ref yyzgjyiqgmjzyhzkqdfx
```

**View Edge Function logs:**
```bash
npx supabase functions logs <function_name> --project-ref yyzgjyiqgmjzyhzkqdfx
```

### Run SQL Queries

**Execute SQL directly:**
```bash
npx supabase db execute --project-ref yyzgjyiqgmjzyhzkqdfx -f <file.sql>
```

**Or use the dashboard SQL editor:**
https://supabase.com/dashboard/project/yyzgjyiqgmjzyhzkqdfx/sql

### Type Generation

**Generate TypeScript types from schema:**
```bash
npx supabase gen types typescript --project-id yyzgjyiqgmjzyhzkqdfx > src/types/supabase.ts
```

### Secrets Management

**List secrets:**
```bash
npx supabase secrets list --project-ref yyzgjyiqgmjzyhzkqdfx
```

**Set a secret:**
```bash
npx supabase secrets set SECRET_NAME=value --project-ref yyzgjyiqgmjzyhzkqdfx
```

---

## Project-Specific Info

### Key Tables
- `shows` - Multi-tenant root (filtered by `license_key`)
- `trials` - Trial dates and info
- `classes` - Competition classes
- `entries` - Dog entries
- `results` - Scoring results
- `rules` - Competition rulebook

### Key Views
- `view_class_summary` - Class entry counts and status
- `view_entry_with_results` - Entries joined with results
- `view_trial_summary_normalized` - Trial overview

### RLS Policy Pattern
All tables use Row Level Security filtered by `license_key` for multi-tenant isolation.

---

## Troubleshooting

**Authentication issues:**
```bash
npx supabase login
```

**Link local project:**
```bash
npx supabase link --project-ref yyzgjyiqgmjzyhzkqdfx
```

**Check CLI version:**
```bash
npx supabase --version
```
