# Outstanding Tasks


## Setup Automated Test Execution - 2025-11-20 09:28

- **Add pre-commit hook and CI/CD pipeline for tests** - Implement automated test execution at multiple stages of development workflow. **Problem:** Currently tests only run when manually executing `npm test`, which can lead to untested code being committed or deployed. Need automated safety checks. **Files:** `package.json` (add Husky configuration), `.github/workflows/` (new CI/CD workflow file), potential `.husky/` directory for hooks. **Solution:** Three-tier approach: (1) Pre-commit hook using Husky to run tests before each commit and block if tests fail, (2) CI/CD pipeline (GitHub Actions) to run tests on every push, (3) Pre-deploy check ensuring tests pass before production deployment. Example Husky config provided in discussion.

## Test Pull-to-Refresh Mobile UX - 2025-11-20 20:02

- **Verify PTR improvements on production mobile** - Test pull-to-refresh activation threshold and scrolling behavior on app.myk9q.com after deployment. **Problem:** Pull-to-refresh was interfering with scrolling through long dog lists on mobile home page. Changes deployed (20px activation threshold, increased trigger distance) need real-world mobile testing to confirm they solve the issue. **Files:** `src/components/ui/PullToRefresh.tsx:85-101` (activation threshold logic), `src/pages/Home/Home.tsx:367-372` (PTR configuration). **Solution:** Test on actual mobile device: (1) Verify normal scrolling works smoothly without triggering PTR, (2) Verify intentional pull-down from top triggers refresh after deliberate gesture, (3) If still problematic, consider increasing activation threshold to 30-40px or adding user setting to disable PTR.

## Implement AKC Rules Assistant Feature - 2025-11-20

- **Build AI-powered natural language rule lookup for judges** - Add a slide-out Rules Assistant panel (accessible from hamburger menu) that enables judges and exhibitors to search the AKC Scent Work rulebook using natural language queries like "what is the area size for exterior advanced?". **Features:** AI-powered semantic search when online (via Claude Haiku + Supabase Edge Function), keyword search fallback when offline (IndexedDB), sub-second response times, filter by level/element, rule citations with measurements. **Implementation:** See comprehensive plan in `docs/akc-rules-assistant-implementation-plan.md` for complete architecture, database schema, Edge Function code, frontend components, 7-phase timeline (4 weeks), cost analysis (~$2/year), testing strategy, and deployment checklist. **Cost:** Extremely cost-effective at ~$0.00014 per query using Claude Haiku. **Tech Stack:** Supabase (PostgreSQL + Edge Functions), IndexedDB for offline, React slide-out panel matching Inbox UX pattern.

