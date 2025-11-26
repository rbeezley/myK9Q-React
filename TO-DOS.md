# Outstanding Tasks


## Test Pull-to-Refresh Mobile UX - 2025-11-20 20:02

- **Verify PTR improvements on production mobile** - Test pull-to-refresh activation threshold and scrolling behavior on app.myk9q.com after deployment. **Problem:** Pull-to-refresh was interfering with scrolling through long dog lists on mobile home page. Changes deployed (20px activation threshold, increased trigger distance) need real-world mobile testing to confirm they solve the issue. **Files:** `src/components/ui/PullToRefresh.tsx:85-101` (activation threshold logic), `src/pages/Home/Home.tsx:367-372` (PTR configuration). **Solution:** Test on actual mobile device: (1) Verify normal scrolling works smoothly without triggering PTR, (2) Verify intentional pull-down from top triggers refresh after deliberate gesture, (3) If still problematic, consider increasing activation threshold to 30-40px or adding user setting to disable PTR.

## Scoresheet Refactoring - 2025-11-25 ✅ COMPLETE

**Status:** All phases complete

**Summary:**
- ✅ Phase 1: Created `useScoresheetCore` and `useEntryNavigation` shared hooks
- ✅ Phase 3a: Refactored `AKCScentWorkScoresheet.tsx` (1,118 → 692 lines, **38% reduction**)
- ✅ Phase 3b: Deleted `AKCScentWorkScoresheet-Enhanced.tsx` (redundant dual-mode file)
- ✅ Phase 3c: Refactored `AKCNationalsScoresheet.tsx` (1,175 → 847 lines, **28% reduction**)

**Results:** Reduced 3 files to 2 files, **~1,550 lines deleted** (43% total reduction).

**Files:** See `docs/SCORESHEET_REFACTORING_PLAN.md` for full details. Hooks at `src/pages/scoresheets/hooks/`.

## Monetization Strategy Research - 2025-11-23 19:30

- **Research exhibitor monetization opportunities** - Brainstorm premium features and services that exhibitors would be willing to pay for to ensure app sustainability and growth. **Problem:** Need to identify viable revenue streams from the exhibitor user segment while maintaining value proposition. Current app is free but needs to explore sustainable monetization models that align with user needs and willingness to pay. **Files:** Consider researching competitive apps, analyzing user feedback in existing features (`src/pages/Home/`, `src/pages/EntryList/`, `src/pages/Settings/`), and documenting findings in new `docs/monetization-strategy.md`. **Solution:** Analyze exhibitor pain points throughout their show workflow, research competitive pricing models in dog show management space, evaluate premium feature opportunities (advanced analytics, training history, performance tracking, premium notifications, ad-free experience, priority support), and assess subscription vs one-time payment models.

