# User Feedback Review Plan

Tester: Samsung Z-Fold 6 (Android)

## Progress Summary

| Phase | Status | Items |
|-------|--------|-------|
| Phase 1 - User Priority | ✅ Complete | Push notifications (user education) |
| Phase 2 - Judge Experience | ✅ Complete | Timer visual circle, 30-second chime |
| Phase 3 - Quick Wins | ✅ Complete | 5/5 complete |
| Phase 4 - Investigate | 🔄 Partial | Settings ✅, Haptic ✅, 2 remaining |
| Phase 5 - UX Improvements | ⏳ Pending | 0/2 complete |
| Phase 6 - Feature Requests | ⏳ Pending | 0/2 complete |
| Phase 7 - Content | ⏳ Pending | 0/1 complete |

**Next Step:** Phase 4 - Font size/spacing investigation (#7)

---

## Feedback Categories

I've categorized the 30+ pieces of feedback into: **Critical Bugs**, **Bugs to Investigate**, **UX Improvements**, **Feature Requests**, and **Positive Feedback / No Action Needed**.

---

## ~~CRITICAL BUGS~~ → Likely User Education Issue

### 1. Multi-Area Scoring - Code Verified OK
**Symptom Reported:** Recording Area 2 resets Area 1 to 00:00:00.

**Code Review Result:** Implementation is correct.
- `handleAreaUpdate()` uses immutable state updates (`prev.map()`) - only updates the specified index
- Each area's input displays `area.time` from state (not stopwatch.time)
- The stopwatch reset after recording doesn't affect the areas state

**Likely User Confusion:**
1. **Timer display resets** - Big timer at top shows stopwatch time, which resets to "0:00.00" after recording. User may have looked at this instead of the area input fields.
2. **Area input is the saved value** - After recording, the "Record Area X" button changes to "Area X" badge and the time appears in the input field below.

**Recommendation:** No code fix needed. Consider UX improvements:
- Add visual confirmation when time is recorded ("✓ Recorded!")
- Make the recorded area times more prominent
- Add help text explaining the workflow

---

## BUGS TO INVESTIGATE

### 2. Settings Not Persisting - ✅ RESOLVED (User Education + UX Improvement)
**Symptom:** Dark/light mode and other settings reset each time user enters the app.

**Root Cause:** Default theme is `'auto'` which follows device system preference.

When set to 'auto', the app uses `window.matchMedia('(prefers-color-scheme: dark)')` to detect the device's current preference. If the device switches between light/dark based on time of day or user toggle, the app follows.

**Resolution:**
1. User education - explicitly set theme to "Light" or "Dark" if a fixed theme is desired
2. **UX Improvement:** Added 3-way theme toggle to hamburger menu (Light → Dark → Auto) with clear labels:
   - ☀️ "Light Mode"
   - 🌙 "Dark Mode"
   - 📱 "Auto (System)"

   This makes "Auto" discoverable and syncs with Settings page.

### 3. Exhibitor Can Reset Scores?
**Symptom:** User claims they could reset Daisy's score as exhibitor from Completed tab.

**Investigation:**
- Code shows `hasPermission('canScore')` guards the reset menu
- Exhibitors have `canScore: false` in permission matrix
- Need to verify if there's a bug or user misremembered their role

**Files to Check:**
- `src/pages/EntryList/EntryList.tsx:178`
- `src/pages/EntryList/components/ResetMenuPopup.tsx`

### 4. Push Notifications - RESOLVED (User Education)
**Symptom:** User enabled notifications but never received any alerts.

**Root Cause:** Tester's subscription has `favorite_armbands: []` (empty).

**How it works:**
- "Announcement" notifications → work for everyone with notifications enabled
- "Up Soon" notifications → ONLY fire for dogs in `favorite_armbands` array

**The tester didn't favorite any dogs**, so they won't receive "your dog is up soon" notifications. No announcements were created during testing either.

**Resolution:** User education. Consider adding inline help text explaining that favoriting dogs is required for "up soon" notifications.

### 5. Haptic Feedback Not Working - FIXED
**Symptom:** Setting enabled but no vibration felt.

**Root Cause:** The `useGlobalHaptic` hook only triggers vibration for buttons with specific CSS classes (`btn-primary`, `btn-destructive`). Timer and Save buttons were missing these classes.

**Fix Applied (Phase 1):** Added `btn-destructive` to Stop/Reset buttons and `btn-primary` to Start/Resume/Save/Submit/Confirm buttons across all scoresheets.

**Fix Applied (Phase 2):** Added direct haptic feedback to ResultChoiceChips component:
- Qualified, NQ, Absent, Excused buttons: `haptic.medium()`
- Fault counter +/- buttons: `haptic.light()`
- NQ reason buttons: `haptic.light()`
- Excused reason buttons: `haptic.light()`

**Commits:**
- `06bd3c7` - fix(haptic): Add CSS classes for global haptic feedback on scoresheet buttons
- (pending) - feat(haptic): Add haptic feedback to result choice chips and reason buttons

### 6. "Clear All" Does Nothing
**Symptom:** Clicking "Clear All" in Inbox did nothing visible.

**Code Location:** `src/components/notifications/NotificationCenter.tsx:183`

**Investigation:**
- Function calls `announcementStore.markAllAsRead()` and clears push notifications
- If no announcements/push notifications, nothing visual changes
- May need better feedback to user

### 7. Font Size / Spacing Not Applying
**Symptom:** Font size changes had no visible effect. Spacing only worked on Settings screen.

**Investigation:**
- Check CSS variable application in `settingsStore.ts`
- Verify `--font-size-*` variables are used across components

---

## UX IMPROVEMENTS (Priority Order)

### 8. Trial Box Text Too Dim - ✅ FIXED
**Symptom:** Trial details under trial name are hard to read in both light and dark mode.

**Fix Applied:** Increased contrast of subtitle text in trial selector boxes.

### 9. Timer Visual Circle Missing - ✅ FIXED
**Symptom:** Judge misses the continuous visual countdown circle that turned red at 30 seconds.

**Context:** Previous version had visual countdown, new version apparently doesn't.

**Decision:** User confirmed this should be added back - important for judges.

**Fix Applied:** Added progress ring to all scoresheets:
- NationalsTimerSection (AKC Nationals)
- ASCAScentDetectionScoresheet (ASCA)
- UKCNoseworkScoresheet (UKC - both single and dual timer modes)
- AKCScentWorkScoresheet already had it

**Additional Enhancement:** Added audible 30-second warning chime that plays regardless of voice announcement settings (respects notification sound setting). This provides an audible alert at the 30-second mark for judges who may not have voice announcements enabled.

**Commits:**
- `83c556f` - feat(timer): Add visual countdown progress ring to all scoresheets
- (pending) - feat(timer): Add 30-second warning chime independent of voice announcements

### 10. Return to Favorites After Check-In - ✅ FIXED
**Symptom:** After "Check In All" from Favorites, returns to All Dogs instead of staying in Favorites.

**Fix Applied:** Persist Favorites tab selection across navigation. Returns to Favorites after check-in operations.

**Commit:** `cbd5b5e` - feat(feedback): Implement user feedback improvements

### 11. Class Options Navigation
**Symptom:** After viewing Max Time dialog from Class Options, pressing X returns to class list instead of Class Options.

**Fix:** Dialog close should return to parent dialog, not skip levels.

**Files:** `src/components/dialogs/ClassOptionsDialog.tsx`

### 12. Drag-and-Drop Run Order
**Symptoms:**
- Can't drag to end of list in one motion (must scroll incrementally)
- After dragging, doesn't return to top of list

**Potential Fixes:**
- Auto-scroll when dragging near edge
- Scroll to top after drag operation completes

**Files:** `src/pages/EntryList/` drag-and-drop handlers

### 13. Tapping Class Title Shows Partial Screen
**Symptom:** Tapping "Container Advanced" title shows popup with blank lines and time, then can swipe down.

**Investigation:** This seems like incomplete feature or bug. Need to identify what this popup is supposed to show.

---

## FEATURE REQUESTS (Discuss with User)

### 14. "Skip" as Default for Onboarding
**Request:** Remember "Skip" preference so onboarding doesn't show again.

**Current Behavior:** Already sets `localStorage.setItem('onboarding_completed', 'true')` when skipping.

**Investigation:** If user is seeing it again, localStorage may be clearing. Check if this is related to #2 (settings not persisting).

### 15. Results Visibility - Improve Discoverability - ✅ FIXED
**Issue:** Feature already exists at Show level with inheritance to Trial and Class levels, but tester didn't find it.

**Fix Applied:** Added help tip explaining where to find results visibility settings.

**Commits:**
- `307cc91` - feat(ux): Add help tip for results visibility discoverability
- `7406cc2` - fix(ux): Correct help tip to match actual tab name

### 16. Show Passcode on Home Screen
**Request:** Display user's passcode to help memorization.

**Consideration:** Security vs. convenience tradeoff. Could be optional in settings.

### 17. Check-In Sheet Shows Checked Status
**Request:** Check-in report should show which dogs are already checked in.

**Implementation:** Add checked-in indicator to print report.

### 18. "My Dogs" → "My Favorites" - ✅ FIXED
**Request:** Rename Inbox section header for clarity.

**Fix Applied:** Renamed to "My Favorites" in NotificationCenter.

**Commit:** `cbd5b5e` - feat(feedback): Implement user feedback improvements

---

## CONTENT UPDATES (Low Priority)

### 19. AskQ Content Updates
- Add note about adding Classes as Favorites
- Add "Class Status" section explaining color meanings and clickable statuses
- Clarify "How do I read the class status"

**Files:** Edge function `ask-myk9q` knowledge base

---

## POSITIVE FEEDBACK / NO ACTION NEEDED

- Dark mode easier to read
- The Podium is a nice feature
- Completed entries feature is nice
- Hamburger menu on top left appreciated
- Class Options dialog much easier to read
- NQ choices match score sheet nicely
- Secretary Tools correctly read-only for exhibitors

---

## QUESTIONS FOR TESTER (Follow-up)

1. **Settings persistence (#2):** Does this happen in all browsers or specific to Samsung Internet/Chrome? Are you using incognito/private mode?

2. **Exhibitor reset (#3):** Can you confirm you were logged in as exhibitor (passcode starting with 'e')? The reset menu should only appear for judges/admins.

3. **Push notifications (#4):** Did the browser prompt you to allow notifications? Did you see "Notifications Enabled!" confirmation?

~~4. Timer circle - ANSWERED: User confirmed add it back~~
~~5. Results visibility - ANSWERED: Already exists, needs better discoverability~~

---

## RECOMMENDED IMPLEMENTATION ORDER

**Phase 1 - User Priority:** ✅ COMPLETE
1. ~~Push notifications investigation~~ - RESOLVED (user education)

**Phase 2 - Judge Experience:** ✅ COMPLETE
2. ~~Timer visual circle~~ - FIXED (`83c556f`)
3. ~~30-second warning chime~~ - FIXED (`73046be`)

**Phase 3 - Quick Wins:** ✅ COMPLETE
4. ~~Trial box text contrast~~ - FIXED
5. ~~"My Favorites" rename~~ - FIXED (`cbd5b5e`)
6. ~~Return to Favorites after check-in~~ - FIXED (`cbd5b5e`)
7. ~~Results visibility discoverability~~ - FIXED (`307cc91`)
8. ~~Multi-area visual confirmation~~ - Already has `.area-badge.recorded` styling

**Phase 4 - Investigate:** 🔄 IN PROGRESS
9. ~~Settings persistence~~ - RESOLVED (user education - 'auto' follows device)
10. ~~Haptic feedback~~ - FIXED (`06bd3c7`, `73046be`)
11. **Font size/spacing application** ← NEXT
12. Exhibitor reset verification

**Phase 5 - UX Improvements:**
13. Class Options navigation
14. Drag-and-drop improvements

**Phase 6 - Feature Requests:**
15. Show passcode option
16. Check-in sheet improvements

**Phase 7 - Content:**
17. AskQ content updates
