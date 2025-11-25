# Outstanding Tasks


## Setup Automated Test Execution - 2025-11-20 09:28

- **Add pre-commit hook and CI/CD pipeline for tests** - Implement automated test execution at multiple stages of development workflow. **Problem:** Currently tests only run when manually executing `npm test`, which can lead to untested code being committed or deployed. Need automated safety checks. **Files:** `package.json` (add Husky configuration), `.github/workflows/` (new CI/CD workflow file), potential `.husky/` directory for hooks. **Solution:** Three-tier approach: (1) Pre-commit hook using Husky to run tests before each commit and block if tests fail, (2) CI/CD pipeline (GitHub Actions) to run tests on every push, (3) Pre-deploy check ensuring tests pass before production deployment. Example Husky config provided in discussion.

## Test Pull-to-Refresh Mobile UX - 2025-11-20 20:02

- **Verify PTR improvements on production mobile** - Test pull-to-refresh activation threshold and scrolling behavior on app.myk9q.com after deployment. **Problem:** Pull-to-refresh was interfering with scrolling through long dog lists on mobile home page. Changes deployed (20px activation threshold, increased trigger distance) need real-world mobile testing to confirm they solve the issue. **Files:** `src/components/ui/PullToRefresh.tsx:85-101` (activation threshold logic), `src/pages/Home/Home.tsx:367-372` (PTR configuration). **Solution:** Test on actual mobile device: (1) Verify normal scrolling works smoothly without triggering PTR, (2) Verify intentional pull-down from top triggers refresh after deliberate gesture, (3) If still problematic, consider increasing activation threshold to 30-40px or adding user setting to disable PTR.

## Monetization Strategy Research - 2025-11-23 19:30

- **Research exhibitor monetization opportunities** - Brainstorm premium features and services that exhibitors would be willing to pay for to ensure app sustainability and growth. **Problem:** Need to identify viable revenue streams from the exhibitor user segment while maintaining value proposition. Current app is free but needs to explore sustainable monetization models that align with user needs and willingness to pay. **Files:** Consider researching competitive apps, analyzing user feedback in existing features (`src/pages/Home/`, `src/pages/EntryList/`, `src/pages/Settings/`), and documenting findings in new `docs/monetization-strategy.md`. **Solution:** Analyze exhibitor pain points throughout their show workflow, research competitive pricing models in dog show management space, evaluate premium feature opportunities (advanced analytics, training history, performance tracking, premium notifications, ad-free experience, priority support), and assess subscription vs one-time payment models.

