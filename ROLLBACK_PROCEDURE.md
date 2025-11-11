# Emergency Rollback Procedure

**Date Created**: 2025-11-10 (Day 27)
**Purpose**: Emergency rollback plan for full table replication system
**Time to Execute**: < 5 minutes

---

## When to Rollback

Execute emergency rollback if ANY of the following conditions occur:

### Critical Triggers (Immediate Rollback Required)

1. **Data Loss Detected**
   - Users report lost scores or entries
   - Missing data after sync
   - Inconsistent data across devices

2. **System Crashes**
   - App crashes on startup
   - Browser tab crashes during sync
   - QuotaExceededError preventing app usage

3. **Sync Failure Rate > 10%**
   - More than 10% of sync operations failing
   - Check: ReplicationMonitor health metrics
   - Verify: Console errors or Supabase logs

4. **Performance Degradation > 50%**
   - Sync taking > 60 seconds (normal: 5-30s)
   - UI freezing during sync operations
   - Memory usage > 200 MB (normal: < 100 MB)

### Warning Triggers (Monitor Closely, Rollback if Worsens)

5. **User Complaints > 3 per day**
   - GitHub issues mentioning sync problems
   - Support tickets about offline mode
   - Social media complaints

6. **Success Rate 90-95%**
   - Monitor for 1 hour before deciding
   - Check if specific to one table
   - May be temporary network issues

---

## Rollback Methods

### Method 1: Emergency Kill Switch (FASTEST - 30 seconds)

**Use When**: Critical production issue, need instant rollback

**Steps**:

1. **Open kill switch file**:
   ```bash
   # Edit: src/config/emergencyKillSwitch.ts
   ```

2. **Disable replication**:
   ```typescript
   // Line 26: Change to false
   export const REPLICATION_ENABLED = false;
   ```

3. **Commit and deploy**:
   ```bash
   git add src/config/emergencyKillSwitch.ts
   git commit -m "EMERGENCY: Disable replication system"
   git push
   ```

4. **Verify rollback**:
   - Check Vercel deployment logs
   - Open app in incognito window
   - Verify direct Supabase queries are working
   - Check console: should NOT see "[ReplicationManager]" logs

**Result**: App falls back to direct Supabase queries immediately. No data loss.

---

### Method 2: Table-Specific Disable (5 minutes)

**Use When**: Specific table causing issues, others working fine

**Steps**:

1. **Identify problematic table**:
   ```bash
   # Check ReplicationMonitor metrics
   # Look for table with high failure rate
   ```

2. **Disable specific table**:
   ```typescript
   // src/config/emergencyKillSwitch.ts
   export const TABLE_ENABLED = {
     entries: true,
     classes: false,  // <-- Disable problematic table
     trials: true,
     // ... rest ...
   };
   ```

3. **Deploy and verify**:
   ```bash
   git add src/config/emergencyKillSwitch.ts
   git commit -m "ROLLBACK: Disable classes table replication"
   git push
   ```

**Result**: Only specific table uses direct queries, others still replicated.

---

### Method 3: Feature-Specific Disable (5 minutes)

**Use When**: Specific feature causing issues (e.g., real-time sync, prefetch)

**Steps**:

1. **Disable problematic feature**:
   ```typescript
   // src/config/emergencyKillSwitch.ts
   export const FEATURE_ENABLED = {
     offlineMutations: true,
     realtimeSync: false,  // <-- Disable real-time if causing issues
     crossTabSync: true,
     prefetch: true,
     autoSyncOnStartup: true,
     autoSyncInterval: true,
     cacheEviction: true,
     monitoring: true,
   };
   ```

2. **Deploy and verify**:
   ```bash
   git add src/config/emergencyKillSwitch.ts
   git commit -m "ROLLBACK: Disable real-time sync feature"
   git push
   ```

**Result**: Core replication still works, specific feature disabled.

---

## Post-Rollback Steps

### Immediate (Within 1 hour)

1. **Verify rollback successful**:
   ```bash
   # Check production logs
   # No replication errors
   # Users can access app normally
   ```

2. **Notify stakeholders**:
   - Post GitHub issue: "Temporary replication system rollback"
   - Update status page (if applicable)
   - Notify active users (if applicable)

3. **Collect diagnostics**:
   ```bash
   # Export ReplicationMonitor health report
   # Check browser console errors
   # Check Supabase error logs
   # Check IndexedDB state in DevTools
   ```

### Short-term (Within 24 hours)

4. **Root cause analysis**:
   - Review error logs
   - Identify specific failure pattern
   - Check if edge case from Day 25-26 analysis
   - Verify fix in development environment

5. **Test fix thoroughly**:
   - Manual testing with test license key
   - Run edge case test scripts
   - Check all 17 edge cases still handled
   - Performance benchmarks

6. **Document incident**:
   - What triggered rollback
   - Root cause identified
   - Fix implemented
   - Prevention measures added

### Long-term (Within 1 week)

7. **Re-enable with monitoring**:
   - Set `REPLICATION_ENABLED = true`
   - Deploy to production
   - Monitor for 48 hours before declaring stable
   - Check ReplicationMonitor metrics hourly

8. **Post-mortem**:
   - What went wrong
   - What went right
   - What to improve
   - Update edge case analysis if needed

---

## Rollback Impact

### What Happens During Rollback

**Data Safety**:
- ✅ **NO DATA LOSS**: Pending mutations preserved in IndexedDB
- ✅ **NO CORRUPTION**: Replication disabled cleanly
- ✅ **AUTO-RECOVERY**: When re-enabled, mutations upload automatically

**User Experience**:
- ⚠️ **Offline mode disabled**: App requires network connection
- ⚠️ **Slower page loads**: No cache, direct Supabase queries
- ⚠️ **No auto-sync**: Manual refresh required
- ✅ **All features still work**: Just slower, not broken

**Technical Impact**:
- Increased Supabase API usage (more direct queries)
- Increased network usage (no cache)
- Increased page load times (50-200ms → 200-500ms)
- IndexedDB data preserved but not accessed

---

## Testing Rollback

### Pre-Production Test

**Run this test BEFORE actual rollback needed**:

1. **Set kill switch to false locally**:
   ```typescript
   // src/config/emergencyKillSwitch.ts
   export const REPLICATION_ENABLED = false;
   ```

2. **Start dev server**:
   ```bash
   npm run dev
   ```

3. **Verify fallback behavior**:
   - Login works
   - Class list loads (direct query)
   - Entry list loads (direct query)
   - Scoresheet submission works (direct insert)
   - Console shows NO replication logs

4. **Re-enable**:
   ```typescript
   export const REPLICATION_ENABLED = true;
   ```

5. **Verify replication resumes**:
   - Pending mutations upload
   - Cache rebuilds
   - Auto-sync works

**Expected Result**: Seamless fallback and recovery, no errors.

---

## Emergency Contacts

**Technical Lead**: (Add contact info)
**Deployment Access**: Vercel dashboard
**Monitoring**: Browser DevTools → Application → IndexedDB
**Logs**: Browser Console + Supabase Dashboard

---

## Quick Reference Commands

```bash
# Emergency kill switch (fastest)
# Edit: src/config/emergencyKillSwitch.ts
# Set: REPLICATION_ENABLED = false
git add src/config/emergencyKillSwitch.ts
git commit -m "EMERGENCY: Disable replication"
git push

# Check health metrics (browser console)
const monitor = getReplicationMonitor();
const metrics = await monitor.getHealthMetrics();
console.log(metrics);

# View health report (browser console)
const monitor = getReplicationMonitor();
await monitor.logHealthReport();

# Check pending mutations (browser DevTools)
# Application → IndexedDB → myK9Q_replication → pending_mutations

# Force full sync (if recovering)
const manager = getReplicationManager();
await manager.syncAll({ forceFullSync: true });
```

---

## Success Criteria for Re-Enabling

Only re-enable replication after ALL criteria met:

- [ ] Root cause identified and fixed
- [ ] Fix tested locally with all edge cases
- [ ] Health monitor shows 100% success rate for 1 hour
- [ ] Performance benchmarks pass (sync < 30s, memory < 100 MB)
- [ ] No errors in browser console
- [ ] Staging environment stable for 24 hours
- [ ] Rollback plan tested and documented

---

## Version History

- **2025-11-10**: Initial rollback procedure (Day 27)
- **Last Updated**: 2025-11-10

---

## Notes

- This procedure assumes development-only deployment (no existing users)
- For production with real users, add user notification steps
- Keep this document updated with each replication system change
- Test rollback procedure quarterly to ensure it works
