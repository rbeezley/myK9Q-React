# myK9Q - Product Requirements Document

**Version:** 3.0
**Last Updated:** January 2026
**Status:** Production

---

## Executive Summary

**myK9Q** is a professional dog show scoring and management Progressive Web Application (PWA) designed for real-time collaboration across judges, stewards, exhibitors, and administrators at competition venues. It replaces paper-based systems with a mobile-first, offline-capable solution that handles multi-organization scoring rules (AKC, UKC, ASCA) with enterprise-grade reliability.

### Core Value Proposition

- **Offline-First**: Works reliably in rural venues with intermittent connectivity
- **Real-Time Sync**: Multi-device collaboration with instant score/status updates
- **Organization-Specific**: Handles complex scoring rules for AKC, UKC, and ASCA events
- **Mobile-Optimized**: Designed for one-handed operation in the field

---

## Table of Contents

1. [Problem Statement](#1-problem-statement)
2. [Target Users](#2-target-users)
3. [User Roles & Permissions](#3-user-roles--permissions)
4. [Core Features](#4-core-features)
5. [Workflows](#5-workflows)
6. [Data Architecture](#6-data-architecture)
7. [Technical Requirements](#7-technical-requirements)
8. [Security & Compliance](#8-security--compliance)
9. [Performance Requirements](#9-performance-requirements)
10. [Future Roadmap](#10-future-roadmap)

---

## 1. Problem Statement

### Current Challenges in Dog Show Management

1. **Paper-Based Scoring**: Traditional shows use paper scoresheets, leading to transcription errors, delays, and lost records
2. **No Real-Time Visibility**: Exhibitors wait hours to learn results; judges can't see class progress
3. **Connectivity Issues**: Rural show venues often lack reliable internet, making cloud-only solutions unusable
4. **Complex Rules**: Each organization (AKC, UKC, ASCA) has different scoring rules, qualification criteria, and tiebreaker logic
5. **Coordination Overhead**: Stewards, judges, and exhibitors struggle to coordinate check-ins, run order, and gate calls
6. **Audit Requirements**: Show results may be contested; paper trails are unreliable for dispute resolution

### Solution

myK9Q provides a unified platform that:
- Digitizes scoring with organization-specific scoresheets
- Works offline with automatic sync when connectivity returns
- Broadcasts real-time updates to all connected devices
- Maintains complete audit trails for every score change
- Supports granular result visibility controls for procedural compliance

---

## 2. Target Users

### Primary User Segments

| Segment | Description | Key Needs |
|---------|-------------|-----------|
| **Judges** | Licensed officials who evaluate dogs and assign scores | Fast score entry, timer integration, rule references, offline capability |
| **Stewards** | Volunteers managing ring operations | Check-in management, gate calling, run order control, status visibility |
| **Exhibitors** | Dog handlers/owners competing | Entry status, schedule visibility, result notifications, check-in self-service |
| **Administrators** | Trial secretaries and show organizers | Configuration, result visibility control, volunteer scheduling, reporting |

### Usage Context

- **Environment**: Indoor/outdoor show venues, often rural with poor connectivity
- **Devices**: Tablets (judges), smartphones (stewards/exhibitors), laptops (admins)
- **Duration**: Multi-day events with continuous usage (6-10 hours/day)
- **Scale**: 50-500 entries per show, 10-50 classes per trial

---

## 3. User Roles & Permissions

### Authentication Model

myK9Q uses a **passcode-based authentication** system designed for shared-device scenarios common at dog shows:

```
Passcode Format: [role][4 digits]
Examples: aa260 (admin), jf472 (judge), se0d7 (steward), e4b6c (exhibitor)
```

Passcodes are derived from a **license key** that provides multi-tenant isolation. All data is filtered by license key, ensuring complete separation between different show organizations.

### Permission Matrix

| Feature | Admin | Judge | Steward | Exhibitor |
|---------|:-----:|:-----:|:-------:|:---------:|
| View classes/entries | ✓ | ✓ | ✓ | ✓ |
| Check in entries | ✓ | ✓ | ✓ | ✓ (own only) |
| Modify entry status | ✓ | ✓ | ✓ | - |
| Access scoresheets | ✓ | ✓ | - | - |
| Submit/edit scores | ✓ | ✓ | - | - |
| Change class status | ✓ | ✓ | ✓ | - |
| Configure result visibility | ✓ | - | - | - |
| Manage volunteers | ✓ | - | - | - |
| View audit logs | ✓ | - | - | - |
| Send announcements | ✓ | ✓ | - | - |
| Favorite entries/classes | ✓ | ✓ | ✓ | ✓ |

---

## 4. Core Features

### 4.1 Show Hierarchy Management

myK9Q organizes competition data in a four-level hierarchy:

```
Show (e.g., "Spring Regional 2026")
  └── Trial (e.g., "Trial 1 - Saturday", "Trial 2 - Sunday")
      └── Class (e.g., "Interior Novice A", "Exterior Advanced B")
          └── Entry (Individual dog + handler + scoring data)
```

**Show Features:**
- Multi-trial support (typical: 2-4 trials per show)
- License key assignment for multi-tenant isolation
- Global settings inheritance

**Trial Features:**
- Independent class configurations
- Trial-specific volunteer assignments
- Separate result visibility controls

**Class Features:**
- Organization-specific requirements (time limits, fault limits)
- Status progression (Setup → Briefing → In Progress → Completed)
- Entry count summaries (total, checked-in, scored, qualified)

### 4.2 Entry Management

**Entry Statuses** (8-state workflow):

| Status | Color | Description |
|--------|-------|-------------|
| No Status | Gray | Initial state, not yet checked in |
| Checked In | Blue | Handler confirmed present at show |
| At Gate | Yellow | Dog staged at ring entrance |
| Come to Gate | Orange | Called to gate, should proceed now |
| In Ring | Purple | Currently being judged |
| Completed | Green | Finished, score recorded |
| Conflict | Red | Overlapping class time detected |
| Pulled | Gray (strikethrough) | Withdrawn from competition |

**Entry Features:**
- Real-time status updates broadcast to all devices
- Favorites system for quick access (heart icon toggle)
- Search by dog name, armband number, handler name, or breed
- Filter by status, class, or trial
- Sort by run order, armband, alphabetical, or status

### 4.3 Scoring System

#### Organization-Specific Scoresheets

myK9Q dynamically routes to the correct scoresheet based on organization, competition element, and class level:

| Organization | Element | Supported Levels |
|--------------|---------|------------------|
| **AKC** | Scent Work | Novice, Advanced, Excellent, Master, Detective |
| **AKC** | FastCAT | All (speed-based) |
| **AKC** | Nationals | Multi-tier placement with points |
| **UKC** | Nosework | All levels |
| **UKC** | Obedience | Novice through Utility |
| **UKC** | Rally | All levels |
| **ASCA** | Scent Detection | All levels |

#### Scoring Features

- **Time Entry**: MM:SS format with automatic conversion to seconds
- **Fault Counting**: Increment/decrement with visual feedback
- **Multi-Area Timing**: For scent work with multiple search areas
- **Qualification Logic**: Automatic Q/NQ determination based on org rules
- **Tiebreaker Calculation**: Fewer faults → faster time → earlier run order
- **Auto-Placement**: Placements recalculate immediately when scores submit

#### Result Statuses

| Status | Code | Description |
|--------|------|-------------|
| Qualified | Q | Met all requirements |
| Not Qualified | NQ | Failed to meet requirements |
| Absent | ABS | Did not appear for run |
| Excused | EXC | Removed by judge (behavioral) |
| Withdrawn | WD | Handler withdrew before run |

### 4.4 Result Visibility Control

Granular authorization system for procedural compliance with kennel club rules:

**Visibility Presets:**

| Preset | Behavior |
|--------|----------|
| **Open** | All results visible immediately as dogs run |
| **Standard** | Q/NQ immediate; time/faults/placement when class completes |
| **Review** | All results hidden until judge clicks "Release Results" |

**Field-Level Control:**
- Placement visibility
- Qualification status visibility
- Time visibility
- Fault count visibility

**Scope Levels:**
- Show-wide defaults
- Trial-level overrides
- Class-level overrides

### 4.5 Real-Time Collaboration

**Supabase Real-Time Subscriptions:**
- Entry status changes
- Score submissions
- Class status updates
- Announcements

**Use Cases:**
- Judge scores on tablet → Steward sees update on ring display
- Exhibitor checks in on phone → Gate steward sees "Checked In" badge
- Admin posts announcement → All devices receive push notification

### 4.6 Offline-First Architecture

**Offline Capabilities:**
- All critical tables replicated to IndexedDB
- Scores queue locally when offline
- Background sync when connectivity returns
- Visual indicators showing sync status

**Conflict Resolution:**
- Last-write-wins with timestamp comparison
- Audit log preserves all versions for dispute resolution

**Replication System Components:**
- `ReplicationManager`: Coordinates all replicated tables
- `ReplicatedTable`: Base class for offline-capable entities
- `SyncEngine`: Handles background synchronization
- `MutationManager`: Queues mutations when offline
- `ConflictResolver`: Handles sync conflicts

### 4.7 AI Chatbot (Ask Q)

Natural language interface for rules questions and show data queries:

**Capabilities:**
- Rules questions: "What faults apply to interior courses?"
- Show data: "How many dogs in the Advanced level?"
- Entry lookup: "What's the time limit for this class?"

**Implementation:**
- Claude AI backend via Edge Function
- Full-text search on organization rules database
- Context-aware responses filtered to current show/trial

### 4.8 Notifications System

**Push Notification Types:**
- Class status changes (briefing starting, scoring complete)
- Entry status changes (called to gate, up next)
- Custom announcements from admins
- "Up soon" reminders for next runs

**Notification Preferences:**
- Sound on/off
- Badge on/off
- Notification type filtering
- Browser compatibility detection

### 4.9 PWA Capabilities

- **Installable**: Add to Home Screen on iOS/Android/Desktop
- **Service Worker**: Offline asset caching
- **Theme Support**: Light/dark mode with CSS custom properties
- **One-Handed Mode**: UI optimizations for mobile field use
- **Haptic Feedback**: Vibration on key interactions
- **Voice Announcements**: Text-to-speech for gate calling

### 4.10 Administration Features

**Trial Secretary Dashboard:**
- Kanban board for task management (drag-and-drop)
- Volunteer scheduling by class
- Result visibility controls
- Check-in status reports

**Reporting:**
- Entry count summaries
- Qualification rates by class
- Judge statistics
- Breed statistics
- Export capabilities

---

## 5. Workflows

### 5.1 Judge Scoring Workflow

```
1. Navigate: Trial → Class List → Select Class
2. View entries sorted by run order
3. Tap scoresheet icon on current entry
4. System loads organization-appropriate scoresheet
5. Enter time (start timer or manual entry)
6. Record faults (tap increment/decrement)
7. Set qualification status
8. Submit score → Confirmation dialog
9. Score syncs to database
10. Placements auto-recalculate
11. Real-time update broadcasts to all devices
```

### 5.2 Steward Check-In Workflow

```
1. Navigate to Home dashboard
2. Search for dog (name/armband/handler)
3. Tap dog card → View entries
4. Tap entry → Status dialog
5. Select "Checked In"
6. Status syncs immediately
7. All devices see updated status
```

### 5.3 Offline Scoring Workflow

```
1. Device loses connectivity
2. Judge continues scoring normally
3. Scores queue in local IndexedDB
4. Visual indicator: "Pending Sync" badge
5. Connectivity restored
6. Background sync processes queue
7. Conflicts resolved (timestamp-based)
8. UI updates: "Synced" confirmation
```

### 5.4 Result Release Workflow (Review Mode)

```
1. Judge completes all scoring for class
2. Class status → "Completed"
3. Results remain hidden from non-judges
4. Judge reviews all scores for accuracy
5. Judge clicks "Release Results"
6. Results become visible per visibility settings
7. Exhibitors receive push notification
```

---

## 6. Data Architecture

### 6.1 Core Entities

| Entity | Description | Key Fields |
|--------|-------------|------------|
| `shows` | Top-level container | license_key, name, dates, location |
| `trials` | Competition instances | show_id, name, date, trial_number |
| `classes` | Competition divisions | trial_id, element, level, status, times |
| `entries` | Dog/handler combinations | class_id, dog_name, armband, handler, status, scores |
| `class_requirements` | Org-specific rules | class_id, max_time, fault_limit, areas |

### 6.2 Supporting Entities

| Entity | Purpose |
|--------|---------|
| `entry_audit` | Immutable log of all score changes |
| `announcements` | Admin/judge broadcasts |
| `volunteers` | Volunteer assignments |
| `notification_subscriptions` | Push notification endpoints |
| `chatbot_query_log` | AI chatbot usage analytics |

### 6.3 Key Views

| View | Purpose |
|------|---------|
| `view_class_summary` | Pre-aggregated class statistics |
| `view_entry_with_results` | Entries with scoring data joined |
| `view_entry_audit_summary` | Human-readable audit log |

### 6.4 Multi-Tenant Isolation

All queries filter by `license_key`:
- Shows belong to a single license key
- Passcode validation returns associated license key
- Row-Level Security (RLS) enforces isolation at database level

---

## 7. Technical Requirements

### 7.1 Technology Stack

| Layer | Technology |
|-------|------------|
| Frontend | React 19 + TypeScript (strict mode) |
| State Management | Zustand 5 |
| Routing | React Router 7 |
| Data Fetching | React Query 5 |
| Database | Supabase (PostgreSQL + Real-time) |
| Build | Vite 7 + PWA Plugin |
| Styling | Semantic CSS with design tokens |
| Icons | Lucide React |
| Drag-and-Drop | @dnd-kit |
| Testing | Vitest + Playwright |
| Offline Storage | IndexedDB via `idb` library |

### 7.2 Browser Support

| Browser | Minimum Version |
|---------|-----------------|
| Chrome | 90+ |
| Safari | 14+ |
| Firefox | 90+ |
| Edge | 90+ |
| iOS Safari | 14+ |
| Chrome Android | 90+ |

### 7.3 Device Requirements

- **Minimum Screen**: 320px width (mobile portrait)
- **Recommended**: 768px+ for judge scoresheets
- **Touch Support**: Required for mobile workflows
- **Storage**: 50MB+ available for offline cache

---

## 8. Security & Compliance

### 8.1 Authentication

- Server-side passcode validation via Edge Function
- Rate limiting: 5 attempts per IP per minute
- Session persistence with secure token storage
- No passwords stored (passcode derived from license key)

### 8.2 Data Protection

- All API calls over HTTPS
- Row-Level Security (RLS) at database level
- Multi-tenant isolation via license_key filtering
- No PII beyond handler names (no addresses, SSNs, etc.)

### 8.3 Audit Trail

- Immutable `entry_audit` table
- Records: timestamp, user, old value, new value, source
- Cannot be deleted or modified
- Available for dispute resolution

### 8.4 Compliance Considerations

- **AKC/UKC/ASCA Rules**: Result visibility controls ensure procedural compliance
- **Data Retention**: Configurable per organization requirements
- **Export**: Full data export available for backup/migration

---

## 9. Performance Requirements

### 9.1 Response Time Targets

| Operation | Target | Maximum |
|-----------|--------|---------|
| Page load (cached) | < 500ms | 1s |
| Page load (uncached) | < 2s | 3s |
| Score submission | < 200ms | 500ms |
| Real-time update | < 100ms | 300ms |
| Search results | < 300ms | 500ms |

### 9.2 Offline Performance

| Metric | Requirement |
|--------|-------------|
| Offline queue capacity | Unlimited |
| Sync retry interval | 30 seconds |
| Maximum offline duration | Unlimited (persisted to IndexedDB) |
| Conflict resolution | < 1s per record |

### 9.3 Bundle Size

| Asset | Target | Current |
|-------|--------|---------|
| Main bundle (gzipped) | < 150KB | ~121KB |
| Total initial load | < 500KB | ~431KB |
| Service worker | < 50KB | ~30KB |

---

## 10. Future Roadmap

### Phase 1: Enhanced Reporting (Q1 2026)
- Advanced analytics dashboard
- Custom report builder
- Export to PDF/Excel
- Historical trend analysis

### Phase 2: Multi-Organization Expansion (Q2 2026)
- CPE (Canine Performance Events) support
- NADAC agility scoring
- Additional scent work organizations

### Phase 3: Exhibitor Experience (Q3 2026)
- Exhibitor mobile app (standalone)
- Entry pre-registration
- Payment integration
- Digital premium lists

### Phase 4: Enterprise Features (Q4 2026)
- Multi-show organization management
- Advanced role customization
- API access for third-party integrations
- White-label options

---

## Appendix A: Glossary

| Term | Definition |
|------|------------|
| **Armband** | Unique identifier number worn by handler during competition |
| **Element** | Type of competition (e.g., Interior, Exterior, Containers) |
| **Fault** | Deduction for errors during run |
| **Level** | Difficulty tier (Novice, Advanced, Excellent, Master) |
| **Q/NQ** | Qualified / Not Qualified result |
| **Run Order** | Sequence in which dogs compete within a class |
| **Trial** | Single competition event, usually one day |
| **Show** | Multi-day event containing multiple trials |

---

## Appendix B: Environment Configuration

| Environment | Branch | Domain | Purpose |
|-------------|--------|--------|---------|
| Staging | `develop` | app.myk9q.com | Testing and validation |
| Production | `main` | myk9q.com | Live user traffic |

**Supabase Project:** `yyzgjyiqgmjzyhzkqdfx` (us-east-2)

---

*Document maintained by the myK9Q development team.*
