# Rules Assistant - Multi-Sport Implementation Plan

**Status:** Planning
**Estimated Timeline:** 4 weeks (Phase 1: AKC Scent Work)
**Estimated Cost:** ~$2/year per sport operating cost
**Priority:** Future Enhancement
**Scalability:** Designed for multi-organization, multi-sport expansion

---

## Executive Summary

This document provides a complete implementation plan for adding an AI-powered Rules Assistant to the myK9Q React PWA application. The feature enables judges and exhibitors to quickly look up rules using natural language queries (e.g., "what is the area size for exterior advanced?"), with AI-powered search when online and keyword fallback when offline.

**Phase 1** launches with AKC Scent Work, but the architecture is designed for expansion to multiple organizations (UKC, NACSW, CKC) and sports (Nosework, Obedience, Rally, Conformation).

### Key Deliverables

- Natural language rule lookup accessible from hamburger menu
- Slide-out panel UI matching existing Inbox pattern
- AI-powered search via Claude Haiku (Supabase Edge Function)
- Offline-first keyword search using IndexedDB
- Sub-second response times
- Cost-effective operation (~$0.00014 per query)

### Technology Stack

- **Frontend**: React + TypeScript PWA
- **State Management**: Zustand (matching existing patterns)
- **Backend**: Supabase (PostgreSQL + Edge Functions)
- **AI**: Claude Haiku 3.5 API via Supabase Edge Function
- **Offline Storage**: IndexedDB (using idb library)
- **Search**: PostgreSQL full-text search (tsvector) + hybrid offline search

---

## System Architecture

### High-Level Flow

```
User → Hamburger Menu → Rules Assistant Panel → Search Query
                                                        ↓
                                                  Is Online?
                                                   ↙        ↘
                                            YES (Online)   NO (Offline)
                                                   ↓             ↓
                                        Supabase Edge Fn    IndexedDB
                                        (PostgreSQL FTS)    (Keyword Search)
                                        + Claude Haiku
                                                   ↓             ↓
                                             Formatted Results ←┘
                                                        ↓
                                                Display in Panel
                                                (with citations)
```

### Component Architecture

```
RulesAssistant Component (Slide-out Panel)
    ↓
useRulesAssistant Hook
    ↓
rulesService (Service Layer)
    ├─→ Online: Supabase Edge Function → PostgreSQL + Claude API
    └─→ Offline: IndexedDB → Keyword Matching
```

---

## Database Design

### Multi-Sport Schema (Scalable Architecture)

The database is designed to support multiple organizations and sports from day one, even though Phase 1 launches with AKC Scent Work only.

```sql
-- =====================================================
-- Organizations Table
-- =====================================================
CREATE TABLE rule_organizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code VARCHAR(20) UNIQUE NOT NULL,      -- 'AKC', 'UKC', 'NACSW', 'CKC'
  name TEXT NOT NULL,                     -- 'American Kennel Club'
  website TEXT,
  logo_url TEXT,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Seed organizations
INSERT INTO rule_organizations (code, name, website, active) VALUES
  ('AKC', 'American Kennel Club', 'https://www.akc.org', true),
  ('UKC', 'United Kennel Club', 'https://www.ukcdogs.com', false),  -- Future
  ('NACSW', 'National Association of Canine Scent Work', 'https://www.nacsw.net', false),  -- Future
  ('CKC', 'Canadian Kennel Club', 'https://www.ckc.ca', false);  -- Future

-- =====================================================
-- Sports/Disciplines Table
-- =====================================================
CREATE TABLE rule_sports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code VARCHAR(50) UNIQUE NOT NULL,      -- 'scent-work', 'nosework', 'obedience'
  name TEXT NOT NULL,                     -- 'Scent Work', 'Nosework'
  description TEXT,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Seed sports
INSERT INTO rule_sports (code, name, description, active) VALUES
  ('scent-work', 'Scent Work', 'AKC Scent Work detection sport', true),
  ('nosework', 'Nosework', 'UKC Nosework detection sport', false),  -- Future
  ('obedience', 'Obedience', 'Obedience trials and competitions', false),  -- Future
  ('rally', 'Rally', 'Rally obedience sport', false),  -- Future
  ('conformation', 'Conformation', 'Breed conformation shows', false);  -- Future

-- =====================================================
-- Rulebooks Table (Version Management)
-- =====================================================
CREATE TABLE rulebooks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES rule_organizations(id) ON DELETE CASCADE,
  sport_id UUID REFERENCES rule_sports(id) ON DELETE CASCADE,
  version VARCHAR(50) NOT NULL,          -- '2024', 'January 2025'
  effective_date DATE,
  pdf_url TEXT,                          -- Original PDF in Supabase Storage
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(organization_id, sport_id, version)
);

-- Seed AKC Scent Work rulebook
INSERT INTO rulebooks (organization_id, sport_id, version, effective_date, active)
SELECT
  (SELECT id FROM rule_organizations WHERE code = 'AKC'),
  (SELECT id FROM rule_sports WHERE code = 'scent-work'),
  '2024',
  '2024-01-01',
  true;

-- =====================================================
-- Rules Table (Flexible Multi-Sport Design)
-- =====================================================
CREATE TABLE rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  rulebook_id UUID REFERENCES rulebooks(id) ON DELETE CASCADE,

  -- Rule identification
  section VARCHAR(50) NOT NULL,
  title TEXT NOT NULL,
  content TEXT NOT NULL,

  -- Sport-specific categorization (JSONB for flexibility)
  -- Different sports have different category structures:
  -- AKC Scent Work: {"level": "Advanced", "element": "Exterior"}
  -- UKC Nosework:   {"level": "Level 2", "element": "Vehicle"}
  -- Obedience:      {"level": "Novice", "exercise": "Heel on Leash"}
  -- Conformation:   {"breed_group": "Sporting", "section": "General Appearance"}
  categories JSONB,

  -- Search optimization
  keywords TEXT[],             -- Pre-defined keywords for better matching
  measurements JSONB,          -- Structured data (e.g., {"min_area_sq_ft": 800})

  -- Full-text search vector (auto-generated)
  search_vector tsvector GENERATED ALWAYS AS (
    setweight(to_tsvector('english', coalesce(title, '')), 'A') ||
    setweight(to_tsvector('english', coalesce(content, '')), 'B') ||
    setweight(to_tsvector('english', coalesce(array_to_string(keywords, ' '), '')), 'C')
  ) STORED,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- Indexes for Performance
-- =====================================================
CREATE INDEX idx_rules_rulebook ON rules(rulebook_id);
CREATE INDEX idx_rules_search_vector ON rules USING GIN(search_vector);
CREATE INDEX idx_rules_categories ON rules USING GIN(categories);
CREATE INDEX idx_rulebooks_org_sport ON rulebooks(organization_id, sport_id);
CREATE INDEX idx_rulebooks_active ON rulebooks(active) WHERE active = true;

-- =====================================================
-- Row Level Security
-- =====================================================
ALTER TABLE rule_organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE rule_sports ENABLE ROW LEVEL SECURITY;
ALTER TABLE rulebooks ENABLE ROW LEVEL SECURITY;
ALTER TABLE rules ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Organizations are public" ON rule_organizations FOR SELECT USING (true);
CREATE POLICY "Sports are public" ON rule_sports FOR SELECT USING (true);
CREATE POLICY "Rulebooks are public" ON rulebooks FOR SELECT USING (true);
CREATE POLICY "Rules are public" ON rules FOR SELECT USING (true);

-- =====================================================
-- Helper Function: Update Timestamp
-- =====================================================
CREATE OR REPLACE FUNCTION update_rules_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_rules_timestamp
  BEFORE UPDATE ON rules
  FOR EACH ROW
  EXECUTE FUNCTION update_rules_updated_at();

CREATE TRIGGER trigger_update_rulebooks_timestamp
  BEFORE UPDATE ON rulebooks
  FOR EACH ROW
  EXECUTE FUNCTION update_rules_updated_at();
```

### Sample Data (Phase 1: AKC Scent Work)

```sql
-- Get the AKC Scent Work 2024 rulebook ID
DO $$
DECLARE
  rulebook_uuid UUID;
BEGIN
  SELECT rb.id INTO rulebook_uuid
  FROM rulebooks rb
  JOIN rule_organizations org ON rb.organization_id = org.id
  JOIN rule_sports sport ON rb.sport_id = sport.id
  WHERE org.code = 'AKC' AND sport.code = 'scent-work' AND rb.version = '2024';

  -- Example: Novice Interior Area Size
  INSERT INTO rules (rulebook_id, section, title, content, categories, keywords, measurements) VALUES (
    rulebook_uuid,
    '2.3.1',
    'Novice Interior Search Area Size',
    'The search area for Novice Interior shall be a minimum of 120 square feet and a maximum of 600 square feet. The area may be divided into multiple rooms or spaces.',
    '{"level": "Novice", "element": "Interior", "category": "Search Area"}'::JSONB,
    ARRAY['area size', 'dimensions', 'square feet', 'novice', 'interior', 'search area'],
    '{"min_area_sq_ft": 120, "max_area_sq_ft": 600, "can_divide_rooms": true}'::JSONB
  );

  -- Example: Advanced Exterior Area Size
  INSERT INTO rules (rulebook_id, section, title, content, categories, keywords, measurements) VALUES (
    rulebook_uuid,
    '3.4.2',
    'Advanced Exterior Search Area Size',
    'The search area for Advanced Exterior shall be a minimum of 800 square feet and a maximum of 2000 square feet. The area must include natural terrain and may include up to 3 inaccessible hides.',
    '{"level": "Advanced", "element": "Exterior", "category": "Search Area"}'::JSONB,
    ARRAY['area size', 'exterior', 'advanced', 'terrain', 'inaccessible hides', 'square feet'],
    '{"min_area_sq_ft": 800, "max_area_sq_ft": 2000, "terrain": "natural", "max_inaccessible_hides": 3}'::JSONB
  );
END$$;
```

---

## Multi-Sport Expansion Strategy

### Phase 1: AKC Scent Work (Weeks 1-4)

Launch with single organization, single sport to validate the concept and gather user feedback.

**Database:**
- Organizations table has AKC active, others inactive
- Sports table has Scent Work active, others inactive
- Single rulebook: AKC Scent Work 2024
- Categories use: `{"level": "...", "element": "..."}`

**UI:**
- No organization/sport selector (hardcoded to AKC Scent Work)
- Filters: Level (Novice/Advanced/Excellent/Master), Element (Interior/Exterior/Container/Buried)

### Phase 2: Add UKC Nosework (Estimated: 1 week)

Easiest expansion - very similar to Scent Work.

**Database Changes:**
```sql
-- Activate UKC and Nosework
UPDATE rule_organizations SET active = true WHERE code = 'UKC';
UPDATE rule_sports SET active = true WHERE code = 'nosework';

-- Add UKC Nosework rulebook
INSERT INTO rulebooks (organization_id, sport_id, version, effective_date, active)
SELECT
  (SELECT id FROM rule_organizations WHERE code = 'UKC'),
  (SELECT id FROM rule_sports WHERE code = 'nosework'),
  '2024',
  '2024-01-01',
  true;

-- Populate rules with categories like:
-- {"level": "Level 2", "element": "Vehicle"}
```

**UI Changes:**
- Add organization/sport selector dropdowns
- Add Level (Level 1/2/3/Elite) and Element (Interior/Exterior/Vehicle/Container) filters
- Sport-specific filter logic based on selected sport

### Phase 3: Add Obedience (Estimated: 1-2 weeks)

Tests flexibility - different categorization structure.

**Categories:**
```json
{
  "level": "Novice",
  "exercise": "Heel on Leash",
  "category": "Performance Standards"
}
```

**Filters:**
- Level: Novice, Open, Utility
- Exercise: Heel, Recall, Stay, Retrieve, Jump

### Phase 4: Add Conformation (Estimated: 1-2 weeks)

Most different - breed-specific rules, hierarchical categories.

**Categories:**
```json
{
  "breed_group": "Sporting",
  "breed": "Labrador Retriever",
  "section": "General Appearance",
  "category": "Breed Standards"
}
```

**Filters:**
- Breed Group: Sporting, Hound, Working, Terrier, Toy, Non-Sporting, Herding
- Breed: (Dropdown filtered by group)

### Sport-Specific Filter Configuration

```typescript
// src/config/sportFilters.ts

export interface SportFilterDefinition {
  sport: string;
  filters: {
    name: string;
    field: string;  // JSONB path: "categories.level"
    options: string[];
  }[];
}

export const SPORT_FILTERS: Record<string, SportFilterDefinition> = {
  'scent-work': {
    sport: 'AKC Scent Work',
    filters: [
      {
        name: 'Level',
        field: 'categories.level',
        options: ['Novice', 'Advanced', 'Excellent', 'Master']
      },
      {
        name: 'Element',
        field: 'categories.element',
        options: ['Interior', 'Exterior', 'Container', 'Buried']
      }
    ]
  },
  'nosework': {
    sport: 'UKC Nosework',
    filters: [
      {
        name: 'Level',
        field: 'categories.level',
        options: ['Level 1', 'Level 2', 'Level 3', 'Elite']
      },
      {
        name: 'Element',
        field: 'categories.element',
        options: ['Interior', 'Exterior', 'Vehicle', 'Container']
      }
    ]
  },
  'obedience': {
    sport: 'AKC Obedience',
    filters: [
      {
        name: 'Level',
        field: 'categories.level',
        options: ['Novice', 'Open', 'Utility']
      },
      {
        name: 'Exercise',
        field: 'categories.exercise',
        options: ['Heel', 'Recall', 'Stay', 'Retrieve', 'Jump', 'Scent Discrimination']
      }
    ]
  },
  'conformation': {
    sport: 'AKC Conformation',
    filters: [
      {
        name: 'Breed Group',
        field: 'categories.breed_group',
        options: ['Sporting', 'Hound', 'Working', 'Terrier', 'Toy', 'Non-Sporting', 'Herding']
      }
    ]
  }
};
```

### Cost Projections (Multi-Sport)

**Per Sport Operating Cost:** ~$2/year (assuming 1000 queries/month)

**Projected Costs:**
- Phase 1 (AKC Scent Work only): $2/year
- Phase 2 (+UKC Nosework): $4/year
- Phase 3 (+Obedience): $6/year
- Phase 4 (+Conformation): $8/year

**At 10,000 queries/month across all sports:** ~$17/year

**Storage Costs:**
- ~1MB per rulebook (300 rules × 2KB + indexes)
- 10 rulebooks = 10MB (negligible in Supabase free tier)

**Conclusion:** Multi-sport expansion remains extremely cost-effective.

---

## IndexedDB Schema

### Database Structure

```typescript
// Database: myK9Q-Rules (version 1)

// Store 1: rules
interface RuleEntry {
  id: string;
  section: string;
  title: string;
  content: string;
  level: string | null;
  category: string | null;
  element: string | null;
  keywords: string[];
  measurements: Record<string, any> | null;
  search_tokens: string[];  // Pre-tokenized for offline search
}

// Store 2: query_cache
interface QueryCacheEntry {
  query: string;              // Primary key
  results: RuleEntry[];
  source: 'online' | 'offline';
  timestamp: number;
  ttl: number;                // 1 hour cache
}

// Store 3: metadata
interface RulesMetadata {
  key: string;                // e.g., "last_sync_at"
  value: any;
  timestamp: number;
}
```

---

## Supabase Edge Function

### Function: search-scent-work-rules

**Endpoint:** `POST /functions/v1/search-scent-work-rules`

**Request:**
```json
{
  "query": "what is the area size for exterior advanced?",
  "filters": {
    "level": "Advanced",
    "element": "Exterior"
  },
  "limit": 10
}
```

**Response:**
```json
{
  "success": true,
  "results": [
    {
      "id": "uuid",
      "section": "3.4.2",
      "title": "Advanced Exterior Search Area Size",
      "content": "The search area for Advanced Exterior shall be...",
      "level": "Advanced",
      "category": "Exterior",
      "element": "Exterior",
      "measurements": {"min_area_sq_ft": 800, "max_area_sq_ft": 2000},
      "relevance_score": 0.95,
      "match_type": "semantic"
    }
  ],
  "source": "ai",
  "query": "what is the area size for exterior advanced?"
}
```

**Implementation Approach:**

1. **PostgreSQL Full-Text Search** - Fast keyword matching using built-in `ts_vector`
2. **Claude Haiku Enhancement** - If fewer than 3 good results, use AI for semantic understanding
3. **Relevance Scoring** - Rank results by relevance (0.0 - 1.0)
4. **Filter Support** - Apply level/element/category filters

---

## Frontend Implementation

### File Structure

```
src/
├── components/
│   └── rules/
│       ├── RulesAssistant.tsx        # Main slide-out panel
│       └── RulesAssistant.css        # Styles (matches Inbox pattern)
├── hooks/
│   └── useRulesAssistant.ts          # Search logic hook
├── services/
│   └── rulesService.ts               # Online/offline service layer
├── stores/
│   └── rulesStore.ts                 # Zustand store (panel state)
└── utils/
    └── indexedDB-rules.ts            # IndexedDB wrapper
```

### Service Layer Architecture

```typescript
// rulesService.ts - Main service

class RulesService {
  // Main search - routes to online or offline
  async searchRules(query: string, filters?: SearchFilters): Promise<SearchResponse>

  // Online search via Edge Function
  private async searchOnline(query: string, filters?: SearchFilters): Promise<SearchResponse>

  // Offline search via IndexedDB
  private async searchOffline(query: string, filters?: SearchFilters): Promise<SearchResponse>

  // Background sync (run on app load)
  async syncRulebook(): Promise<void>

  // Check if sync needed
  async needsSync(): Promise<boolean>
}
```

### UI Component Structure

```tsx
<RulesAssistant>
  <Header>
    <Title>AKC Rules Assistant</Title>
    <OnlineIndicator />
    <CloseButton />
  </Header>

  <SearchInput>
    <input placeholder="Ask a question..." />
    <FilterToggle />
  </SearchInput>

  {showFilters && (
    <Filters>
      <LevelChips />  {/* Novice, Advanced, Excellent, Master */}
      <ElementChips /> {/* Interior, Exterior, Container, Buried */}
    </Filters>
  )}

  <ResultsList>
    {results.map(result => (
      <RuleCard
        section={result.section}
        title={result.title}
        content={result.content}
        measurements={result.measurements}
        relevanceScore={result.relevance_score}
        matchType={result.match_type}
      />
    ))}
  </ResultsList>

  <Footer>
    <OnlineStatus />
  </Footer>
</RulesAssistant>
```

---

## Implementation Phases

### Phase 1: Database Setup (Days 1-2)

**Tasks:**
- [ ] Create migration file for `akc_scent_work_rules` table
- [ ] Run migration on Supabase
- [ ] Verify indexes and RLS policies
- [ ] Insert 5-10 sample rules for testing
- [ ] Test full-text search with sample queries

**Deliverables:**
- `supabase/migrations/YYYYMMDD_create_akc_scent_work_rules.sql`
- Sample data in production database

### Phase 2: PDF Parsing & Data Population (Days 3-5)

**Tasks:**
- [ ] Extract text from AKC Scent Work PDF
- [ ] Parse rules into structured format
- [ ] Identify level, category, element for each rule
- [ ] Extract measurements into JSONB
- [ ] Generate keywords arrays
- [ ] Create seed script
- [ ] Populate database with full rulebook (~200-300 rules)

**Deliverables:**
- `scripts/parse-akc-rulebook.ts`
- `scripts/seed-akc-rules.ts`
- Full rulebook in database

### Phase 3: Supabase Edge Function (Days 6-8)

**Tasks:**
- [ ] Create Edge Function directory structure
- [ ] Implement PostgreSQL full-text search
- [ ] Integrate Claude Haiku API
- [ ] Add error handling and logging
- [ ] Test locally with Supabase CLI
- [ ] Deploy to Supabase
- [ ] Test deployed function

**Deliverables:**
- `supabase/functions/search-scent-work-rules/index.ts`
- Deployed and tested Edge Function

### Phase 4: Frontend Service Layer (Days 9-10)

**Tasks:**
- [ ] Create IndexedDB wrapper (`indexedDB-rules.ts`)
- [ ] Create rules service (`rulesService.ts`)
- [ ] Implement keyword search for offline mode
- [ ] Add query caching
- [ ] Implement background sync
- [ ] Write unit tests

**Deliverables:**
- `src/utils/indexedDB-rules.ts`
- `src/services/rulesService.ts`
- Unit tests

### Phase 5: UI Components (Days 11-14)

**Tasks:**
- [ ] Create RulesAssistant component
- [ ] Create useRulesAssistant hook
- [ ] Create rulesStore
- [ ] Style to match Inbox pattern
- [ ] Implement search with debouncing
- [ ] Add filter UI
- [ ] Implement results display
- [ ] Add online/offline indicator
- [ ] Test responsive design

**Deliverables:**
- `src/components/rules/RulesAssistant.tsx`
- `src/components/rules/RulesAssistant.css`
- `src/hooks/useRulesAssistant.ts`
- `src/stores/rulesStore.ts`

### Phase 6: Integration & Testing (Days 15-17)

**Tasks:**
- [ ] Integrate into App.tsx
- [ ] Add to hamburger menu
- [ ] Test end-to-end flow
- [ ] Test offline functionality
- [ ] Test sync behavior
- [ ] Performance optimization
- [ ] Bug fixes

**Deliverables:**
- Fully integrated feature
- E2E tests
- Performance report

### Phase 7: Documentation & Deployment (Days 18-20)

**Tasks:**
- [ ] Write user documentation
- [ ] Write developer documentation
- [ ] Create demo video
- [ ] Deploy to production
- [ ] Monitor analytics
- [ ] Gather user feedback

**Deliverables:**
- User guide
- Developer guide
- Production deployment

---

## Cost Analysis

### Supabase Costs

**Database Storage:**
- ~300 rules × 2KB = 600KB
- Indexes: ~200KB
- **Total: ~1MB** (free tier: 500MB)

**Edge Function:**
- ~1000 invocations/month
- ~2 seconds per invocation
- **Cost: Free** (free tier: 500K invocations/month)

### Claude API Costs

**Claude 3.5 Haiku Pricing:**
- Input: $0.25 per million tokens
- Output: $1.25 per million tokens

**Per Query:**
- Input tokens: ~500 (context)
- Output tokens: ~100 (response)
- **Cost: ~$0.00014 per query**

**Monthly (1000 queries):** $0.14
**Yearly:** $1.68

**Conclusion:** Extremely cost-effective. Even at 10,000 queries/month = $1.40/month.

---

## Testing Strategy

### Unit Tests

- Service layer search logic
- Keyword scoring algorithm
- Tokenization function
- Hook state management
- Store actions

### Integration Tests

- Edge Function with PostgreSQL
- Claude API integration
- IndexedDB operations
- Query caching

### End-to-End Tests

**User Flows:**
1. Open menu → Click Rules Assistant
2. Enter query → See results
3. Apply filters → See filtered results
4. Go offline → Search still works
5. Clear cache → Re-sync

**Performance:**
- Online response < 2 seconds
- Offline response < 500ms
- Smooth animations (60 FPS)

**Accessibility:**
- Keyboard navigation
- Screen reader support
- Focus management
- ARIA labels

---

## Deployment Checklist

### Pre-Deployment

- [ ] Database migration tested
- [ ] Sample data populated
- [ ] Edge Function deployed
- [ ] Claude API key configured
- [ ] Unit tests passing
- [ ] Integration tests passing
- [ ] E2E tests passing
- [ ] Lighthouse score > 90
- [ ] Accessibility audit passing

### Deployment Steps

1. **Database:**
   - [ ] Run migration
   - [ ] Seed production data

2. **Edge Function:**
   - [ ] Deploy function
   - [ ] Configure env variables
   - [ ] Test in production

3. **Frontend:**
   - [ ] Merge to main
   - [ ] Build production bundle
   - [ ] Deploy to hosting
   - [ ] Test in production

### Post-Deployment

- [ ] Monitor error logs
- [ ] Monitor Edge Function costs
- [ ] Monitor Claude API usage
- [ ] Collect user feedback
- [ ] Document issues

---

## Future Enhancements

### Phase 2 Features

1. **Favorites/Bookmarks** - Save frequently referenced rules
2. **Recent Searches** - Show search history
3. **Rule Citations in App** - Link to rules from scoresheets
4. **Multi-Organization Support** - Add UKC, NACSW rules
5. **Voice Input** - Enable voice search
6. **Advanced Filters** - Filter by hide count, time limits
7. **Rule Change Notifications** - Track updates to bookmarked rules
8. **Export Functionality** - Export results to PDF
9. **Offline AI** - Explore WebLLM for offline AI
10. **Analytics Dashboard** - Track most searched rules

---

## Success Metrics

### Key Performance Indicators

1. **Adoption Rate**: 50% of users within 3 months
2. **Search Success Rate**: 80% of searches return relevant results
3. **Response Time**: < 2s online, < 500ms offline
4. **Cost Efficiency**: < $5/month API costs
5. **User Satisfaction**: 4.5/5 average rating
6. **Offline Usage**: 30% of searches offline

---

## Risk Mitigation

| Risk | Mitigation |
|------|------------|
| Claude API costs exceed budget | Rate limiting (10 queries/user/hour), aggressive caching, fallback to PostgreSQL-only |
| PDF parsing errors | Manual review, test suite, admin editing capability |
| Poor search relevance | Iterative tuning, user feedback, A/B testing |
| IndexedDB storage limits | Compress data, automatic cleanup, request persistent storage |
| Edge Function timeout | Optimize prompts, 5s timeout with fallback, cache common queries |

---

## Example Queries Users Can Ask

- "What is the area size for exterior advanced?"
- "How many hides in novice container?"
- "Time limit for excellent interior?"
- "Can I use a leash in buried searches?"
- "What are the requirements for master level?"
- "How many inaccessible hides in advanced exterior?"
- "What is the minimum search area for novice?"
- "Can I have multiple rooms in interior searches?"
- "What is the penalty for exceeding the time limit?"
- "How are placements determined in scent work?"

---

## References

### Documentation
- Supabase Edge Functions: https://supabase.com/docs/guides/functions
- Claude API: https://docs.anthropic.com/
- PostgreSQL Full-Text Search: https://www.postgresql.org/docs/current/textsearch.html
- IndexedDB API: https://developer.mozilla.org/en-US/docs/Web/API/IndexedDB_API

### Similar Implementations
- See `docs/akc-nationals-scoring-implementation.md` for similar feature planning pattern

---

**Last Updated:** 2025-11-20
**Document Version:** 1.0
**Status:** Ready for Implementation
