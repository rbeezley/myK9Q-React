# User Feedback Review Plan

Tester: Samsung Z-Fold 6 (Android)

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

### 2. Settings Not Persisting
**Symptom:** Dark/light mode and other settings reset each time user enters the app.

**Investigation:**
- Settings use Zustand persist middleware → `src/stores/settingsStore.ts`
- Theme blocking script: `public/theme-init.js`
- Possible timing issue with hydration

**Files to Check:**
- `src/stores/settingsStore.ts:277-286` (initializeSettings)
- `src/hooks/useAppInitialization.ts`

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

**Fix Applied:** Added `btn-destructive` to Stop/Reset buttons and `btn-primary` to Start/Resume/Save/Submit/Confirm buttons across all scoresheets.

**Commit:** `06bd3c7` - fix(haptic): Add CSS classes for global haptic feedback on scoresheet buttons

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

### 8. Trial Box Text Too Dim
**Symptom:** Trial details under trial name are hard to read in both light and dark mode.

**Fix:** Increase contrast of subtitle text in trial selector boxes.

**Files:** CSS in trial selector component

### 9. Timer Visual Circle Missing - FIXED
**Symptom:** Judge misses the continuous visual countdown circle that turned red at 30 seconds.

**Context:** Previous version had visual countdown, new version apparently doesn't.

**Decision:** User confirmed this should be added back - important for judges.

**Fix Applied:** Added progress ring to all scoresheets:
- NationalsTimerSection (AKC Nationals)
- ASCAScentDetectionScoresheet (ASCA)
- UKCNoseworkScoresheet (UKC - both single and dual timer modes)
- AKCScentWorkScoresheet already had it

**Commit:** `83c556f` - feat(timer): Add visual countdown progress ring to all scoresheets

### 10. Return to Favorites After Check-In
**Symptom:** After "Check In All" from Favorites, returns to All Dogs instead of staying in Favorites.

**Fix:** Navigate back to Favorites tab after check-in operation.

**Files:** Check-in handler in Home screen

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

### 15. Results Visibility - Improve Discoverability
**Issue:** Feature already exists at Show level with inheritance to Trial and Class levels, but tester didn't find it.

**Current:** Show → Trial → Class inheritance with override capability.

**Fix:** Improve UI/UX to make this setting more discoverable:
- Add tooltip or info icon explaining inheritance
- Consider inline help text in Admin settings
- Possibly mention in AskQ content

**Complexity:** Low - UX improvement only, no backend changes

### 16. Show Passcode on Home Screen
**Request:** Display user's passcode to help memorization.

**Consideration:** Security vs. convenience tradeoff. Could be optional in settings.

### 17. Check-In Sheet Shows Checked Status
**Request:** Check-in report should show which dogs are already checked in.

**Implementation:** Add checked-in indicator to print report.

### 18. "My Dogs" → "My Favorite Dogs"
**Request:** Rename Inbox section header for clarity.

**Files:** `src/components/notifications/NotificationCenter.tsx`

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

**Phase 1 - User Priority:**
1. ~~Push notifications investigation (user selected this as priority)~~ - RESOLVED (user education)

**Phase 2 - Judge Experience:**
2. ~~Timer visual circle (user confirmed: add back)~~ - FIXED

**Phase 3 - Quick Wins:**
3. Trial box text contrast
4. "My Favorite Dogs" rename
5. Return to Favorites after check-in
6. Results visibility - improve discoverability (already exists, needs better UX)
7. Multi-area scoring - add visual confirmation (optional UX improvement)

**Phase 4 - Investigate if Time Permits:**
8. Settings persistence
9. ~~Haptic feedback~~ - FIXED
10. Font size/spacing application
11. Exhibitor reset verification

**Phase 5 - UX Improvements:**
12. Class Options navigation
13. Drag-and-drop improvements

**Phase 6 - Feature Requests:**
14. Show passcode option
15. Check-in sheet improvements

**Phase 7 - Content:**
16. AskQ content updates
