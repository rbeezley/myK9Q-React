# myK9Q Production Deployment Plan

**Goal:** Deploy myK9Q to production at `myK9Q.com` while keeping `app.myK9Q.com` as staging
**Target Date:** Before next weekend's club trial
**Estimated Time:** 2-4 hours (excluding DNS propagation)

---

## Overview

| Environment | Domain | Branch | Purpose |
|-------------|--------|--------|---------|
| **Production** | myK9Q.com | `main` | Live site for clubs |
| **Staging** | app.myK9Q.com | `main` | Testing/development |

---

## Phase 1: Code Updates (Priority - Do First)

### 1.1 Edge Functions - CORS Updates
These functions have hardcoded `app.myk9q.com` that will block production requests.

- [ ] **send-push-notification/index.ts** (line 27)
  - Current: `'Access-Control-Allow-Origin': 'https://app.myk9q.com'`
  - Update to include both domains or use wildcard for *.myk9q.com

- [ ] **search-rules-v2/index.ts** (lines 6-7)
  - Current: `ALLOWED_ORIGINS = ["https://app.myk9q.com", ...]`
  - Add: `"https://myk9q.com"`, `"https://www.myk9q.com"`

- [ ] **ask-myk9q/index.ts** (lines 9-10)
  - Current: `ALLOWED_ORIGINS = ["https://app.myk9q.com", ...]`
  - Add: `"https://myk9q.com"`, `"https://www.myk9q.com"`

- [ ] **validate-passcode/index.ts** (line 19)
  - Current: `'Access-Control-Allow-Origin': '*'`
  - Consider restricting to production domains for security

### 1.2 Deploy Updated Edge Functions
- [ ] Deploy `send-push-notification` to Supabase
- [ ] Deploy `search-rules-v2` to Supabase
- [ ] Deploy `ask-myk9q` to Supabase
- [ ] Deploy `validate-passcode` to Supabase (if updated)

### 1.3 Test Configuration Updates (Optional - for future E2E testing)
- [ ] Update `playwright.prod.config.ts` line 26 to use environment variable
- [ ] Update `stress_tests/playwright.config.js` (lines 67, 75, 84)

---

## Phase 2: Vercel Configuration

### 2.1 Add Production Domain
- [ ] Log into Vercel Dashboard (vercel.com)
- [ ] Navigate to your myK9Q project
- [ ] Go to **Settings** → **Domains**
- [ ] Click **"Add Domain"**
- [ ] Enter: `myk9q.com`
- [ ] Note the DNS records Vercel provides (you'll need these for Hostinger)
- [ ] Add `www.myk9q.com` as well (redirects to apex)

### 2.2 Configure Domain Assignments
- [ ] Set `myk9q.com` → Production (main branch)
- [ ] Set `www.myk9q.com` → Redirect to `myk9q.com`
- [ ] Keep `app.myk9q.com` → Preview deployments (staging)

### 2.3 Verify Environment Variables
- [ ] Go to **Settings** → **Environment Variables**
- [ ] Confirm these are set for Production:
  - `VITE_SUPABASE_URL`
  - `VITE_SUPABASE_ANON_KEY`
  - Any other required variables

---

## Phase 3: DNS Configuration (Hostinger)

### 3.1 Backup Current DNS
- [ ] Screenshot or export current DNS records for myK9Q.com
- [ ] Note any email (MX) records that must be preserved

### 3.2 Option A: Use Vercel Nameservers (Recommended)
- [ ] In Hostinger, go to DNS/Nameservers settings
- [ ] Change nameservers to Vercel's:
  - `ns1.vercel-dns.com`
  - `ns2.vercel-dns.com`
- [ ] Note: This gives Vercel full control, automatic SSL

### 3.2 Option B: Keep Hostinger DNS (Alternative)
If you need to keep other services on Hostinger:

- [ ] Add A record: `@` → `76.76.21.21`
- [ ] Add CNAME record: `www` → `cname.vercel-dns.com`
- [ ] Verify existing `app` CNAME is: `app` → `cname.vercel-dns.com`

### 3.3 Preserve Email Records (if applicable)
- [ ] Ensure MX records remain unchanged if you use email@myk9q.com
- [ ] Verify SPF/DKIM records if using email services

---

## Phase 4: Verification & Testing

### 4.1 Wait for DNS Propagation
- [ ] Check propagation status at: https://dnschecker.org
- [ ] Enter `myk9q.com` and verify A record shows Vercel IP
- [ ] Typical time: 15 minutes to 48 hours

### 4.2 Verify SSL Certificate
- [ ] Visit https://myk9q.com - should show valid SSL (padlock)
- [ ] Vercel provisions SSL automatically once DNS propagates

### 4.3 Functional Testing on Production Domain
- [ ] Landing page loads at https://myk9q.com
- [ ] Login works (passcode validation)
- [ ] AskQ chatbot works (rules search, AI responses)
- [ ] Push notifications work (if already subscribed)
- [ ] Offline mode works (toggle airplane mode, verify cached data)
- [ ] PWA install prompt appears

### 4.4 Cross-Browser Testing
- [ ] Chrome desktop
- [ ] Safari desktop
- [ ] Chrome mobile (Android)
- [ ] Safari mobile (iOS)

---

## Phase 5: PWA & Notifications

### 5.1 Service Worker Verification
- [ ] Clear browser cache and revisit https://myk9q.com
- [ ] Verify service worker registers successfully (DevTools → Application → Service Workers)
- [ ] Verify manifest loads correctly (DevTools → Application → Manifest)

### 5.2 Push Notification Testing
- [ ] Subscribe to notifications on production domain
- [ ] Send test notification to verify delivery
- [ ] Verify VAPID keys are correct for production

---

## Phase 6: Documentation Updates

- [ ] Update `docs/DISASTER_RECOVERY.md` - change domain reference
- [ ] Update any internal documentation referencing `app.myk9q.com` as production
- [ ] Create/update `README.md` with production URL

---

## Phase 7: WordPress Site Migration (Optional)

If you want to preserve WordPress content or redirect:

- [ ] **Option A:** Point WordPress to a subdomain (e.g., `blog.myk9q.com`)
- [ ] **Option B:** Export WordPress content and archive it
- [ ] **Option C:** Set up redirects from old WordPress pages to new app

---

## Rollback Plan

If something goes wrong:

### Immediate Rollback (DNS)
1. Revert nameservers to Hostinger's original nameservers
2. Or restore original A/CNAME records
3. DNS will propagate back (may take time)

### Vercel Rollback
1. In Vercel Dashboard → Deployments
2. Click "..." on previous working deployment
3. Select "Promote to Production"

---

## Post-Launch Checklist (Day of Club Trial)

### Morning of Event
- [ ] Verify https://myk9q.com loads correctly
- [ ] Test login with admin passcode
- [ ] Verify show data is accessible
- [ ] Test offline mode on a phone

### During Event
- [ ] Monitor for any error reports
- [ ] Have staging site (app.myk9q.com) ready as backup

### After Event
- [ ] Collect feedback from club users
- [ ] Review any error logs in Supabase
- [ ] Document any issues for future improvements

---

## Files to Modify

| File | Change |
|------|--------|
| `supabase/functions/send-push-notification/index.ts` | Add production domain to CORS |
| `supabase/functions/search-rules-v2/index.ts` | Add production domain to ALLOWED_ORIGINS |
| `supabase/functions/ask-myk9q/index.ts` | Add production domain to ALLOWED_ORIGINS |
| `supabase/functions/validate-passcode/index.ts` | (Optional) Restrict CORS |
| `docs/DISASTER_RECOVERY.md` | Update domain reference |

---

## Quick Reference - DNS Records

### For Vercel (if using Option B - keep Hostinger DNS)

| Type | Name | Value | TTL |
|------|------|-------|-----|
| A | @ | 76.76.21.21 | 300 |
| CNAME | www | cname.vercel-dns.com | 300 |
| CNAME | app | cname.vercel-dns.com | 300 |

---

## Support Resources

- Vercel Docs: https://vercel.com/docs/projects/domains
- DNS Propagation Check: https://dnschecker.org
- Supabase Edge Functions: https://supabase.com/docs/guides/functions

---

*Plan created: January 2, 2026*
*Last updated: January 2, 2026*
