# Offline Testing Guide - Windows 11

This guide provides step-by-step instructions for testing the auto-download on login and offline functionality on Windows 11 with a local development server.

## Prerequisites

- Windows 11 PC
- Chrome or Edge browser (required for DevTools network throttling)
- Local dev server running (`npm run dev`)
- Test license key: `myK9Q1-a260f472-e0d76a33-4b6c264c`
- Test passcodes:
  - Admin: `aa260` (should auto-download)
  - Judge: `jf472` (should auto-download)
  - Steward: `se0d7` (should auto-download)
  - Exhibitor: `e4b6c` (should NOT auto-download)

## Setup: Start Dev Server

1. Open PowerShell or Command Prompt
2. Navigate to project directory:
   ```powershell
   cd d:\AI-Projects\myK9Q-React-new
   ```
3. Start dev server:
   ```powershell
   npm run dev
   ```
4. Note the local URL (typically `http://localhost:5173`)

## Test 1: Auto-Download on Login (Admin/Judge/Steward)

### Objective
Verify that logging in with admin/judge/steward roles triggers automatic background download of show data.

### Steps

1. **Open Browser DevTools**
   - Open Chrome/Edge
   - Navigate to `http://localhost:5173`
   - Press `F12` to open DevTools
   - Go to **Console** tab
   - Clear console (`Ctrl + L`)

2. **Login with Admin Passcode**
   - Enter license key: `myK9Q1-a260f472-e0d76a33-4b6c264c`
   - Enter passcode: `aa260`
   - Click "Login"

3. **Verify Auto-Download in Console**
   - Look for console logs:
     ```
     📥 [AUTO-DOWNLOAD] Starting background download...
     🚀 [AUTO-DOWNLOAD] Starting for license: myK9Q1-a260f472-e0d76a33-4b6c264c
     📥 [AUTO-DOWNLOAD] Progress: 1/50 classes
     📥 [AUTO-DOWNLOAD] Progress: 2/50 classes
     ...
     ✅ [AUTO-DOWNLOAD] Complete: 50 classes cached
     ```
   - Download should complete within 2-5 seconds
   - App should navigate to Home page immediately (non-blocking)

4. **Verify IndexedDB Cache**
   - In DevTools, go to **Application** tab
   - Expand **IndexedDB** → **myK9Q-cache**
   - Look for:
     - `auto-download-myK9Q1-a260f472-e0d76a33-4b6c264c` entry
     - Multiple `class-entries-[classId]` entries (one per class)
   - Check timestamps are recent

5. **Test Cache Freshness (30-min window)**
   - Log out
   - Log in again with `aa260`
   - Console should show:
     ```
     ✅ [AUTO-DOWNLOAD] Show already cached and fresh (X min old)
     ```
   - No new download should occur

### Expected Results
- ✅ Auto-download starts immediately after login
- ✅ Console logs show progress (1/50, 2/50, etc.)
- ✅ Download completes successfully
- ✅ User navigates to Home page immediately (non-blocking)
- ✅ Second login within 30 min skips download

---

## Test 2: Exhibitor Role (No Auto-Download)

### Objective
Verify that exhibitors do NOT trigger auto-download (they need real-time data).

### Steps

1. **Clear Console**
   - Press `Ctrl + L` in Console tab

2. **Login with Exhibitor Passcode**
   - Log out if currently logged in
   - Enter license key: `myK9Q1-a260f472-e0d76a33-4b6c264c`
   - Enter passcode: `e4b6c`
   - Click "Login"

3. **Verify No Auto-Download**
   - Console should NOT show any `[AUTO-DOWNLOAD]` logs
   - User navigates to Home page immediately
   - No background download occurs

### Expected Results
- ✅ No auto-download triggered
- ✅ No console logs with `[AUTO-DOWNLOAD]` prefix
- ✅ User can still use app normally (with network)

---

## Test 3: Offline Functionality (After Auto-Download)

### Objective
Verify that after auto-download, the app works offline for scoring functionality.

### Steps

1. **Login and Wait for Auto-Download**
   - Login with `aa260` (admin)
   - Wait for console to show: `✅ [AUTO-DOWNLOAD] Complete: 50 classes cached`

2. **Enable Offline Mode**
   - In DevTools, go to **Network** tab
   - Check **"Offline"** checkbox at top of Network tab
   - OR use throttling dropdown → select **"Offline"**

3. **Navigate to Class List**
   - Click on any trial from Home page
   - Should see full class list load from cache
   - No network errors in Console

4. **Open Class Entry List**
   - Click on any class
   - Should see all entries load from cache
   - Run order should display correctly

5. **Open Scoresheet**
   - Click on any entry to open scoresheet
   - Scoresheet should load with entry details
   - Entry info (dog name, armband, handler) should display

6. **Score an Entry (Offline)**
   - Fill out scoresheet fields (time, faults, etc.)
   - Click "Save"
   - Should see success message
   - Score queued in offline queue (check `offlineQueueStore`)

7. **Verify Offline Queue**
   - In DevTools Console, run:
     ```javascript
     window.__STORES__.offlineQueueStore.getState().queue
     ```
   - Should see queued action for the score you just saved

8. **Re-Enable Network and Sync**
   - Uncheck **"Offline"** in Network tab
   - Offline queue should auto-sync
   - Check Console for sync logs
   - Verify score appears in database (check Supabase dashboard or refresh page)

### Expected Results
- ✅ Class list loads offline
- ✅ Entry list loads offline
- ✅ Scoresheet opens offline
- ✅ Scoring works offline (queued)
- ✅ Scores sync when back online
- ✅ No data loss during offline period

---

## Test 4: Settings Toggle

### Objective
Verify that users can disable auto-download via Settings.

### Steps

1. **Login with Admin**
   - Login with `aa260`
   - Wait for auto-download to complete

2. **Navigate to Settings**
   - Click profile icon → Settings
   - Scroll to **"Offline Mode"** section

3. **Disable Auto-Download**
   - Toggle **"Auto-Download on Login"** to OFF
   - Setting should save automatically

4. **Test Disabled State**
   - Log out
   - Log in again with `aa260`
   - Console should NOT show `[AUTO-DOWNLOAD]` logs
   - No background download occurs

5. **Re-Enable Auto-Download**
   - Go to Settings → Offline Mode
   - Toggle **"Auto-Download on Login"** to ON
   - Log out and log in again
   - Auto-download should trigger

### Expected Results
- ✅ Settings toggle works
- ✅ Disabled = no auto-download on login
- ✅ Enabled = auto-download on login
- ✅ Setting persists across sessions

---

## Test 5: Cache Expiration (30-min freshness)

### Objective
Verify that cache is considered stale after 30 minutes and triggers re-download.

### Steps (Manual Time Manipulation)

1. **Login and Auto-Download**
   - Login with `aa260`
   - Wait for download to complete

2. **Manually Age the Cache**
   - Open DevTools → Console
   - Run this code to age the cache by 31 minutes:
     ```javascript
     (async () => {
       const { idbCache } = await import('./src/utils/idbCache.ts');
       const cacheKey = 'auto-download-myK9Q1-a260f472-e0d76a33-4b6c264c';
       const cached = await idbCache.get(cacheKey);
       if (cached) {
         // Age by 31 minutes (31 * 60 * 1000 ms)
         const oldTimestamp = Date.now() - (31 * 60 * 1000);
         await idbCache.set(cacheKey, {
           ...cached.data,
           timestamp: oldTimestamp
         });
         console.log('✅ Cache aged by 31 minutes');
       }
     })();
     ```

3. **Login Again**
   - Log out
   - Log in with `aa260`
   - Should see fresh download start (cache is stale)

### Expected Results
- ✅ Stale cache triggers new download
- ✅ Console shows download progress again
- ✅ Cache timestamp updated to current time

---

## Test 6: Network Error Handling

### Objective
Verify graceful handling of network errors during auto-download.

### Steps

1. **Simulate Network Failure Mid-Download**
   - Clear IndexedDB cache (DevTools → Application → IndexedDB → right-click → Delete)
   - In Network tab, set throttling to **"Slow 3G"**
   - Login with `aa260`
   - Watch download start in Console
   - After 2-3 classes, switch Network to **"Offline"**

2. **Verify Graceful Failure**
   - Console should show errors for failed classes
   - Download result should show partial success
   - App should remain functional (not crash)
   - User should be on Home page

3. **Retry After Network Restored**
   - Set Network back to **"Online"**
   - Log out and log in again
   - Download should complete successfully

### Expected Results
- ✅ App doesn't crash on network errors
- ✅ Partial downloads are logged
- ✅ User can retry by logging out/in
- ✅ Completed downloads are persisted

---

## Test 7: Large Show Performance

### Objective
Verify performance with large show data (50+ classes, 600+ entries).

### Steps

1. **Monitor Download Performance**
   - Open DevTools → Network tab
   - Clear cache and login with `aa260`
   - Watch Network activity during download

2. **Measure Metrics**
   - Download time (should be 2-5 seconds)
   - Network requests (1 per class + 1 for class list)
   - Total data transferred (should be ~0.5 MB)

3. **Verify UI Responsiveness**
   - App should navigate to Home immediately
   - No UI blocking during download
   - Background download shouldn't freeze browser

### Expected Results
- ✅ Download completes in 2-5 seconds
- ✅ ~0.5 MB total data
- ✅ UI remains responsive
- ✅ No browser freezing

---

## Troubleshooting

### Issue: No console logs appear
**Solution:** Check that Settings → Offline Mode → Auto-Download is enabled

### Issue: "Show already cached" message appears immediately
**Solution:** Cache is fresh (< 30 min old). Wait or manually clear IndexedDB cache

### Issue: Download fails with network errors
**Solution:** Check that Supabase is running and `VITE_SUPABASE_URL` is correct in `.env.local`

### Issue: Offline mode doesn't work
**Solution:**
1. Verify auto-download completed successfully
2. Check IndexedDB has cached entries
3. Clear browser cache and try again

### Issue: Exhibitor role triggers download
**Solution:** Bug - check Login.tsx line ~205 for role filter: `role !== 'e'`

---

## Clean Up After Testing

1. **Clear IndexedDB Cache**
   - DevTools → Application → IndexedDB
   - Right-click `myK9Q-cache` → Delete database

2. **Clear localStorage**
   - DevTools → Application → Local Storage
   - Right-click `http://localhost:5173` → Clear

3. **Reset Settings**
   - Login → Settings
   - Reset to defaults if needed

4. **Stop Dev Server**
   - Return to PowerShell/Command Prompt
   - Press `Ctrl + C` to stop server

---

## Test Coverage Checklist

Use this checklist to track completed tests:

- [ ] Test 1: Auto-Download on Login (Admin)
- [ ] Test 1: Auto-Download on Login (Judge)
- [ ] Test 1: Auto-Download on Login (Steward)
- [ ] Test 2: Exhibitor Role (No Auto-Download)
- [ ] Test 3: Offline Functionality (Class List)
- [ ] Test 3: Offline Functionality (Entry List)
- [ ] Test 3: Offline Functionality (Scoresheet)
- [ ] Test 3: Offline Queue and Sync
- [ ] Test 4: Settings Toggle (Disable)
- [ ] Test 4: Settings Toggle (Enable)
- [ ] Test 5: Cache Expiration (30-min)
- [ ] Test 6: Network Error Handling
- [ ] Test 7: Large Show Performance

---

## Expected Data Sizes

For reference, here are typical data sizes for the test show (`aa260`):

- **Class List Query**: ~5 KB
- **Single Class Entries**: ~10-15 KB (average)
- **Total Download (50 classes)**: ~0.5 MB (500 KB)
- **IndexedDB Storage**: ~1-2 MB (with metadata)

---

## Success Criteria

All tests pass if:

1. ✅ Auto-download triggers for admin/judge/steward roles
2. ✅ Auto-download does NOT trigger for exhibitor role
3. ✅ Download completes in < 5 seconds for typical show
4. ✅ Cache freshness works (30-min window)
5. ✅ Offline scoring works after download
6. ✅ Settings toggle controls auto-download behavior
7. ✅ Network errors handled gracefully
8. ✅ UI remains responsive during download

---

## Notes

- **Service Worker**: Local dev server may not have service worker. Test PWA features with production build (`npm run build && npm run preview`)
- **Supabase Local**: If using local Supabase, ensure `npx supabase start` is running
- **Browser Support**: Chrome/Edge recommended for DevTools offline mode. Firefox has different offline testing tools.
- **Real Mobile Testing**: For real offline testing on mobile, use Chrome Remote Debugging or deploy to test server
