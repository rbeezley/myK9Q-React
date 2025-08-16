# Two-Phase Migration Strategy
## Flutter → React → myK9Show Integration

### Overview
This document outlines a two-phase approach to migrate from Flutter myK9Q to React, then integrate with myK9Show. This strategy minimizes risk and ensures continuous operation of the scoring system.

---

## Phase 1: React myK9Q with Existing Database
**Goal**: Replace Flutter app with React web app using current myK9Q Supabase database

### Timeline: 4-6 weeks

#### Week 1-2: Foundation
- [ ] **Create React project** in myK9Q-React folder
- [ ] **Set up Supabase integration** with existing myK9Q database
- [ ] **Replicate data models** from Flutter analysis
- [ ] **Build authentication** (same as Flutter login)
- [ ] **Create basic navigation** (Home, Class List, Entry List)

#### Week 3-4: Core Scoring
- [ ] **Implement 1-2 scoresheets** (start with UKC Obedience + AKC Scent Work)
- [ ] **Build timer component** with millisecond precision
- [ ] **Add real-time subscriptions** (same as Flutter)
- [ ] **Implement score submission** with confirmation dialogs
- [ ] **Test with real judges** using existing database

#### Week 5-6: Feature Parity
- [ ] **Complete all 7 competition types**
- [ ] **Add offline mode** with local queue
- [ ] **Implement audio alerts** and feedback
- [ ] **Build judge dashboard** and class management
- [ ] **Performance optimization** for tablet use
- [ ] **User acceptance testing** with existing data

### Database Connection (Phase 1)
```typescript
// Use existing myK9Q Supabase project
const supabase = createClient(
  'https://your-myk9q-project.supabase.co',
  'your-myk9q-anon-key'
);

// Same table structure as Flutter
const entries = await supabase
  .from('view_entry_class_join_distinct')
  .select('*')
  .eq('classid_fk', classId);
```

### Benefits of Phase 1
- ✅ **Immediate Flutter retirement** once React is stable
- ✅ **No data migration** required
- ✅ **Zero downtime** - run in parallel during testing
- ✅ **Familiar workflows** maintained for judges
- ✅ **Existing Supabase features** (real-time, auth) work immediately

---

## Phase 2: Integration with myK9Show Database
**Goal**: Migrate React myK9Q to use myK9Show Supabase database for unified system

### Timeline: 2-3 weeks (after myK9Show is ready)

#### Database Schema Mapping
```sql
-- Phase 1 (myK9Q database)
tbl_entry_queue → view_entry_class_join_distinct

-- Phase 2 (myK9Show database) 
dogs → entries → classes → shows
people → registrations
scoring_sessions → competitor_scores
```

#### Migration Tasks
- [ ] **Update Supabase connection** to myK9Show project
- [ ] **Map data models** to new schema
- [ ] **Update API calls** for new table structure
- [ ] **Migrate user data** (one-time export/import)
- [ ] **Test integration** with myK9Show web app
- [ ] **Deploy unified system**

### Database Connection (Phase 2)
```typescript
// Switch to myK9Show Supabase project
const supabase = createClient(
  'https://your-myk9show-project.supabase.co', 
  'your-myk9show-anon-key'
);

// New unified schema
const entries = await supabase
  .from('entries')
  .select(`
    *,
    dog:dogs(*),
    owner:people(*),
    class:classes(*),
    show:shows(*)
  `)
  .eq('class_id', classId);
```

---

## Technical Implementation

### Phase 1: React Project Setup

#### Package.json
```json
{
  "name": "myk9q-react",
  "version": "1.0.0",
  "dependencies": {
    "react": "^18.3.1",
    "react-dom": "^18.3.1", 
    "typescript": "^5.5.3",
    "@supabase/supabase-js": "^2.39.7",
    "zustand": "^5.0.4",
    "@tanstack/react-query": "^5.75.5",
    "react-router-dom": "^6.22.3",
    "tailwindcss": "^3.4.1"
  }
}
```

#### Directory Structure
```
myK9Q-React/
├── docs/ (existing documentation)
├── src/
│   ├── components/
│   │   ├── scoresheets/
│   │   │   ├── ScoresheetAKCScentWork.tsx
│   │   │   ├── ScoresheetUKCObedience.tsx
│   │   │   └── [5 more competition types]
│   │   ├── shared/
│   │   │   ├── Timer.tsx
│   │   │   ├── CompetitorCard.tsx
│   │   │   └── AudioManager.tsx
│   │   └── navigation/
│   │       ├── EntryList.tsx
│   │       └── ClassList.tsx
│   ├── services/
│   │   ├── supabase-myk9q.ts (Phase 1)
│   │   └── supabase-myk9show.ts (Phase 2)
│   ├── types/
│   │   ├── flutter-types.ts (Phase 1)
│   │   └── myk9show-types.ts (Phase 2)
│   └── stores/
│       ├── scoringStore.ts
│       └── appStore.ts
```

### Phase 1: Database Service Layer
```typescript
// services/supabase-myk9q.ts - Phase 1
export class MyK9QDatabase {
  constructor(private supabase: SupabaseClient) {}
  
  // Exact same queries as Flutter
  async getClassEntries(classId: number) {
    return await this.supabase
      .from('view_entry_class_join_distinct')
      .select('*')
      .eq('classid_fk', classId)
      .order('exhibitor_order');
  }
  
  async submitScore(score: FlutterScore) {
    return await this.supabase
      .from('tbl_entry_queue')
      .update({
        result_text: score.result,
        search_time: score.time,
        fault_count: score.faults,
        is_scored: true
      })
      .eq('id', score.entryId);
  }
  
  // Real-time subscriptions (same as Flutter)
  subscribeToEntries(classId: number, callback: (entries: any[]) => void) {
    return this.supabase
      .channel('entry_updates')
      .on('postgres_changes', 
        { 
          event: '*', 
          schema: 'public', 
          table: 'tbl_entry_queue',
          filter: `classid_fk=eq.${classId}`
        }, 
        callback
      )
      .subscribe();
  }
}
```

### Phase 2: Migration Service
```typescript
// services/migration.ts - Phase 2
export class DatabaseMigration {
  constructor(
    private oldDB: MyK9QDatabase,
    private newDB: MyK9ShowDatabase
  ) {}
  
  async migrateData() {
    // Export all judge data from myK9Q
    const judges = await this.oldDB.getAllJudges();
    const scores = await this.oldDB.getAllScores();
    
    // Transform and import to myK9Show schema
    for (const judge of judges) {
      await this.newDB.createJudge(this.transformJudge(judge));
    }
    
    for (const score of scores) {
      await this.newDB.createScore(this.transformScore(score));
    }
  }
  
  private transformJudge(flutterJudge: any): MyK9ShowJudge {
    return {
      id: flutterJudge.id,
      firstName: flutterJudge.first_name,
      lastName: flutterJudge.last_name,
      // Map other fields...
    };
  }
}
```

---

## Risk Mitigation

### Phase 1 Risks & Solutions
| Risk | Solution |
|------|----------|
| **React performance vs Flutter** | Use React Query, optimize renders, test on tablets |
| **Browser compatibility** | Target modern browsers, fallbacks for older ones |
| **Timer precision** | Use high-resolution performance.now(), test accuracy |
| **Offline sync complexity** | Start simple, iterate based on Flutter patterns |

### Phase 2 Risks & Solutions  
| Risk | Solution |
|------|----------|
| **Data migration errors** | Extensive testing, rollback plan, staged migration |
| **Schema incompatibilities** | Map fields carefully, validate with sample data |
| **Performance with unified DB** | Index optimization, query tuning |
| **Judge retraining** | Maintain identical UX, provide side-by-side testing |

---

## Success Metrics

### Phase 1 Success Criteria
- [ ] **Functional parity**: All 7 competition types work identically
- [ ] **Performance parity**: Score submission <1 second, timer precision maintained
- [ ] **Judge acceptance**: 90%+ prefer React over Flutter (or neutral)
- [ ] **Stability**: Zero data loss, 99.9% uptime during shows
- [ ] **Flutter retirement**: Complete replacement with confidence

### Phase 2 Success Criteria
- [ ] **Seamless integration**: myK9Q + myK9Show share all data
- [ ] **Unified experience**: Judge can switch between apps fluidly
- [ ] **Data integrity**: 100% accuracy during migration
- [ ] **Performance improvement**: Faster due to unified database
- [ ] **Feature enhancement**: New capabilities from integration

---

## Deployment Strategy

### Phase 1 Deployment
```bash
# Deploy React app alongside Flutter
# Judges can choose which to use during transition

Production:
├── Flutter myK9Q (existing)
├── React myK9Q (new) 
└── myK9Q Supabase DB (shared)
```

### Phase 2 Deployment
```bash
# Single unified system

Production:
├── React myK9Q (scoring)
├── myK9Show React (management)
└── myK9Show Supabase DB (unified)
```

---

## Timeline Summary

**Total Timeline: 6-9 weeks**
- **Phase 1**: 4-6 weeks (React app with existing DB)
- **Transition**: 1-2 weeks (parallel operation, user acceptance)  
- **Phase 2**: 2-3 weeks (integration with myK9Show DB)

This approach provides:
✅ **Immediate Flutter replacement** (Phase 1)
✅ **Risk mitigation** through staged approach
✅ **Continuous operation** throughout migration
✅ **Future-proof architecture** (Phase 2)

---

Last Updated: 2025-08-12
Version: 1.0.0