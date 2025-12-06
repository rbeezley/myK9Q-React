# Stress Testing Suite for myK9Qv3

This folder contains stress tests for your dog show management application. These tests are **different from unit tests** - they test system behavior under load rather than code correctness.

## Quick Start

```bash
# 1. Navigate to stress_tests folder
cd stress_tests

# 2. Install dependencies
npm install

# 3. Install k6 (Windows - requires Chocolatey)
choco install k6

# 4. Run tests
npm run test:api          # API load tests (requires k6)
npm run test:frontend     # Frontend tests (requires Playwright)
```

---

## Setup Instructions

### Prerequisites

```bash
# Install k6 (load testing tool - NOT an npm package)
# Windows (chocolatey)
choco install k6

# macOS
brew install k6

# Linux (Debian/Ubuntu)
sudo gpg -k
sudo gpg --no-default-keyring --keyring /usr/share/keyrings/k6-archive-keyring.gpg --keyserver hkp://keyserver.ubuntu.com:80 --recv-keys C5AD17C747E3415A3642D57D77C6C491D6AC1D69
echo "deb [signed-by=/usr/share/keyrings/k6-archive-keyring.gpg] https://dl.k6.io/deb stable main" | sudo tee /etc/apt/sources.list.d/k6.list
sudo apt-get update
sudo apt-get install k6
```

```bash
# Install Node dependencies (for Playwright)
npm install
npx playwright install chromium
```

### Configuration

The tests are **pre-configured** for myK9Qv3's production Supabase instance.

**To use different test data, update `config.js`:**

```javascript
export const CONFIG = {
  // Already configured for myK9Qv3
  SUPABASE_URL: 'https://yyzgjyiqgmjzyhzkqdfx.supabase.co',
  SUPABASE_ANON_KEY: '...',  // Already set

  // Change these to test different shows/classes
  TEST_LICENSE_KEY: 'myK9Q1-xxxxx-xxxxx-xxxxx',  // Your test show
  TEST_CLASS_ID: 254,                              // A class to load test
  TEST_ENTRY_ID: 743,                              // An entry to update
};
```

---

## Running Tests

### API/Backend Tests (k6)

```bash
# Test results fetching (simulates users checking results)
k6 run test-results-fetch.js

# Test score submissions (simulates judges entering scores)
k6 run test-score-submit.js

# Test real-time subscriptions (simulates kiosks/phones watching updates)
k6 run test-realtime.js
```

**Adjust load levels:**

```bash
# Light load (10 users for 1 minute)
k6 run --vus 10 --duration 1m test-results-fetch.js

# Heavy load (200 users for 5 minutes)
k6 run --vus 200 --duration 5m test-results-fetch.js

# Or use npm scripts:
npm run test:api:light    # 10 VUs, 1 minute
npm run test:api:heavy    # 200 VUs, 5 minutes
```

### Frontend Tests (Playwright)

**Important:** Start your dev server first!

```bash
# In another terminal (from project root)
npm run dev

# Then run Playwright tests (from stress_tests folder)
cd stress_tests
npx playwright test
```

```bash
# Run all frontend tests
npm run test:frontend

# Kiosk/TV endurance test (30 minutes)
npm run test:kiosk

# Short kiosk test (5 minutes)
npm run test:kiosk:short

# Concurrent users (10 parallel browsers)
npm run test:concurrent

# Mobile simulation
npm run test:mobile

# With visible browser (for debugging)
npx playwright test --headed
```

---

## Test Descriptions

| Test | Purpose | When to Run |
|------|---------|-------------|
| `test-results-fetch.js` | Simulates many users loading class results simultaneously | Before big trials |
| `test-score-submit.js` | Simulates judges updating scores concurrently | Before trials with many judges |
| `test-realtime.js` | Tests WebSocket connections for live updates | If using TV/kiosk displays |
| `kiosk-endurance.spec.js` | Monitors TV display for memory leaks over time | Before all-day events |
| `concurrent-users.spec.js` | Full browser rendering under load | Pre-release testing |

---

## myK9Qv3 Schema Notes

The tests are configured for myK9Qv3's merged schema:

- **`entries` table**: Contains both entry data AND scoring data (merged in migration 039)
- **`classes` table**: Competition classes within trials
- **`license_key`**: Used to filter by show (denormalized for realtime subscriptions)
- **Routes tested**:
  - `/tv/:licenseKey` - TV/Kiosk display
  - `/results/:licenseKey` - Public results page

---

## Interpreting Results

### k6 Output

```
✓ status is 200
✓ response time OK

http_req_duration..............: avg=45.2ms  min=12ms  med=38ms  max=892ms  p(95)=120ms
http_reqs......................: 15234   253.9/s
```

**Key metrics:**
- `p(95) < 500ms` = Good response times
- `errors < 10%` = Acceptable reliability
- Watch for increasing response times over duration (indicates saturation)

### Playwright Output

```
Memory:
  Start:  45.2MB
  End:    52.1MB
  Growth: 6.9MB (15.3%)
✅ Memory growth acceptable
```

**Warning signs:**
- Memory growth > 100MB = Likely memory leak
- Console errors during rotation = Event listener issues
- Page crashes = Critical bug

---

## Recommended Testing Schedule

| Event | Tests to Run |
|-------|--------------|
| Before any trial | `test-results-fetch.js` (light) |
| Before National Championship | All tests at heavy load |
| After major code changes | Full test suite |
| Before deploying TV/kiosk updates | `kiosk-endurance.spec.js` (30+ min) |

---

## Troubleshooting

### "Connection refused" errors
- Make sure your Supabase URL is correct
- Check if you're using the right API key
- Verify your IP isn't rate-limited

### Playwright tests timeout
- Start your dev server first (`npm run dev` from project root)
- Check CSS selectors match your components
- Try running with `--headed` to see what's happening

### k6 "too many open files"
```bash
# Increase file descriptor limit (macOS/Linux)
ulimit -n 10000
```

### Real-time test shows all failures
- Check Supabase plan limits (free tier = 200 connections)
- Verify realtime is enabled for the `entries` table
- Check RLS policies allow read access

---

## Questions?

These tests complement your unit tests. Unit tests verify logic correctness; stress tests verify the system works under real-world load.

For dog show specific scenarios (like the "results posted" moment at a National), the `test-results-fetch.js` with 200 VUs is your best simulation.
