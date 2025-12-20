# Technology Stack - myK9Q

## 1.0 Core Technologies
- **Language:** TypeScript 5.9+ (Strict Mode)
- **Frontend Framework:** React 19.2+ (Functional Components, Hooks)
- **Build Tool:** Vite 7.2+ with PWA Plugin
- **State Management:** Zustand 5.0+ (with DevTools & Middleware)
- **Routing:** React Router 7.9+ (Data APIs)

## 2.0 Backend & Data
- **Platform:** Supabase (PostgreSQL 15+)
- **Real-time:** Supabase Realtime (WebSockets)
- **Local Storage:** IndexedDB (via `idb` library) for offline-first capabilities
- **Data Fetching:** TanStack Query v5+ (for caching and synchronization)

## 3.0 UI & Styling
- **Styling Strategy:** Semantic CSS using design tokens for theme consistency.
- **Icons:** Lucide React
- **Complex UI:** `@dnd-kit` for drag-and-drop interactions, `Recharts` for data visualization.

## 4.0 Infrastructure & PWA
- **PWA Engine:** Workbox (custom service worker integration)
- **Offline Strategy:** Network-first with background synchronization queue.
- **Deployment:** Vercel/Render (as per project configuration files)

## 5.0 Quality Assurance
- **Unit/Integration Testing:** Vitest 4.0+
- **E2E Testing:** Playwright 1.57+
- **Code Quality:** ESLint 9.39+ (TypeScript rules), Prettier
- **Static Analysis:** TypeScript `--noEmit`
