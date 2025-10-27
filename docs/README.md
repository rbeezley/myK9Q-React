# myK9Q Documentation Index

**Last Updated:** 2025-10-25

This directory contains comprehensive technical documentation for the myK9Q React application.

---

## 📊 Data Model Documentation

> **💡 New!** Interactive Mermaid diagrams available! See [ARCHITECTURE_DIAGRAM_MERMAID.md](./ARCHITECTURE_DIAGRAM_MERMAID.md)

### [DATABASE_ERD.md](./DATABASE_ERD.md)
**Entity Relationship Diagram & Schema Reference**

Complete visual and textual representation of the PostgreSQL database schema hosted on Supabase.

**Now includes:** Interactive Mermaid ERD (renders automatically on GitHub!)

**Contents:**
- Visual ERD showing all tables and relationships
- Multi-tenant architecture (license_key isolation)
- Foreign key constraints and indexes
- Real-time subscription setup
- Migration history
- RLS policies

**Use this for:**
- Understanding table relationships
- Planning new features that require schema changes
- Debugging data integrity issues
- Onboarding new developers

**Key Sections:**
- Core schema (shows → trials → classes → entries → results)
- Supporting tables (nationals, announcements, class requirements)
- Relationship diagrams (1:N, 1:1 mappings)
- Constraint reference (CHECK, UNIQUE, FK)

---

### [TYPE_MAPPING.md](./TYPE_MAPPING.md)
**TypeScript Interface ↔ PostgreSQL Schema Mapping**

Detailed mapping between TypeScript interfaces in the codebase and database tables.

**Contents:**
- Entry interface breakdown (54 fields mapped)
- Service layer interfaces (ResultData, ClassData)
- Data transformation functions
- Type validation rules
- Common pitfalls and solutions

**Use this for:**
- Writing new service functions
- Understanding data transformations
- Debugging type mismatches
- Validating data before DB writes

**Key Transformations:**
- `snake_case` (DB) ↔ `camelCase` (TS)
- Time format: `numeric seconds` ↔ `MM:SS string`
- Status enums: DB constraints ↔ TS union types
- Multi-area spreading: Object ↔ Multiple columns

---

### [ARCHITECTURE_DIAGRAM.md](./ARCHITECTURE_DIAGRAM.md) ⭐
**Three-Tier Architecture Flow Documentation**

Visual documentation of the data flow through Stores → Services → Database.

**⚡ Interactive Mermaid Version:** [ARCHITECTURE_DIAGRAM_MERMAID.md](./ARCHITECTURE_DIAGRAM_MERMAID.md) - Recommended for viewing on GitHub!

**Contents:**
- Architectural overview
- Detailed flow diagrams (entry fetch, score submission, real-time updates)
- Store inventory (6 Zustand stores)
- Service inventory (6 core services)
- Transformation pipeline
- Architectural rules (DOs and DON'Ts)

**Use this for:**
- Understanding request/response flow
- Implementing new features correctly
- Debugging state management issues
- Code review reference

**Key Flows:**
1. **Entry Management:** Component → Service → DB → Store → Re-render
2. **Score Submission:** Scoresheet → Service → DB → Placement calc → Real-time broadcast
3. **Real-time Updates:** Device A → DB → Broadcast → Devices B & C

---

## 🎯 Quick Reference Guide

### When to use each document:

| Scenario | Document |
|----------|----------|
| "What columns exist in the `entries` table?" | [DATABASE_ERD.md](./DATABASE_ERD.md#database-tables) |
| "How do I map `armband_number` to TypeScript?" | [TYPE_MAPPING.md](./TYPE_MAPPING.md#1-entries-table) |
| "Should I call Supabase from my component?" | [ARCHITECTURE_DIAGRAM.md](./ARCHITECTURE_DIAGRAM.md#-dont) |
| "How are placements calculated after scoring?" | [ARCHITECTURE_DIAGRAM.md](./ARCHITECTURE_DIAGRAM.md#2-score-submission-flow) |
| "What's the relationship between entries and results?" | [DATABASE_ERD.md](./DATABASE_ERD.md#key-relationships) |
| "How do I convert MM:SS to seconds?" | [TYPE_MAPPING.md](./TYPE_MAPPING.md#1-time-conversion-seconds--mmss) |
| "Which store manages entry data?" | [ARCHITECTURE_DIAGRAM.md](./ARCHITECTURE_DIAGRAM.md#-store-inventory) |
| "How does real-time sync work?" | [ARCHITECTURE_DIAGRAM.md](./ARCHITECTURE_DIAGRAM.md#3-real-time-subscription-flow) |

---

## 🏗️ Architecture Summary

```
┌─────────────────────────────────────────────────────────────────┐
│                     myK9Q Architecture                          │
└─────────────────────────────────────────────────────────────────┘

📱 UI Layer (React Components)
    ↕ hooks (useEntryStore, useScoringStore)
🗂️ State Layer (Zustand Stores)
    ↕ service calls
🛠️ Service Layer (Business Logic)
    ↕ Supabase client (REST + Realtime)
🗄️ Database Layer (PostgreSQL)
    ↕ RLS + Real-time triggers
📡 Real-time Broadcast (All clients)
```

**Design Principles:**
1. **Three-tier separation** - UI never talks directly to DB
2. **Multi-tenant isolation** - Every query filters by `license_key`
3. **Real-time first** - All state changes broadcast instantly
4. **Type safety** - TypeScript strict mode, validated transforms
5. **Offline-ready** - Queue mechanism for network failures

---

## 📋 Other Documentation

### Documentation Guides
- [MERMAID_GUIDE.md](./MERMAID_GUIDE.md) - **NEW!** How to view and edit Mermaid diagrams

### Development Guides
- [../CLAUDE.md](../CLAUDE.md) - Main development guide, tech stack, rules
- [CSS_ARCHITECTURE.md](./CSS_ARCHITECTURE.md) - CSS design system and patterns
- [COMPONENT_TESTING.md](./COMPONENT_TESTING.md) - Testing strategies

### Style Guides
- [style-guides/design-system.md](./style-guides/design-system.md) - Design tokens, colors, spacing

### Migration Guides
- [../supabase/migrations/](../supabase/migrations/) - Database schema evolution

---

## 🤝 Contributing

When adding new features:

1. **Check the ERD** - Understand existing relationships
2. **Review type mappings** - Follow established transformation patterns
3. **Follow architecture** - Always use services, never bypass stores
4. **Update documentation** - Keep these docs in sync with code changes

---

## 📞 Getting Help

**For Questions About:**
- **Database schema** → See [DATABASE_ERD.md](./DATABASE_ERD.md)
- **TypeScript types** → See [TYPE_MAPPING.md](./TYPE_MAPPING.md)
- **Data flow** → See [ARCHITECTURE_DIAGRAM.md](./ARCHITECTURE_DIAGRAM.md)
- **Development rules** → See [../CLAUDE.md](../CLAUDE.md)

**Common Tasks:**
```bash
# View schema in browser
npm run supabase:studio

# Check types
npm run typecheck

# Test local changes
npm run dev

# Run tests
npm test
```

---

**Generated:** 2025-10-25 by Claude Code
**Maintained by:** Project contributors
**Status:** ✅ Complete & current
