import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate, Trend, Counter } from 'k6/metrics';
import { CONFIG, SCENARIOS } from './config.js';

// Custom metrics
const errorRate = new Rate('errors');
const scoreSubmitDuration = new Trend('score_submit_duration');
const successfulSubmissions = new Counter('successful_submissions');
const uniqueEntriesScored = new Counter('unique_entries_scored');

// Test configuration - simulating judges entering scores
// Typically fewer concurrent users than results viewing, but more critical
export const options = {
  vus: 16,  // Match the number of entries in class 254 for realistic simulation
  duration: '2m',
  thresholds: {
    http_req_duration: ['p(95)<1000'],  // Score submissions can be slower
    errors: ['rate<0.05'],               // But must be reliable - under 5% errors
  },
};

const headers = {
  'apikey': CONFIG.SUPABASE_ANON_KEY,
  'Authorization': `Bearer ${CONFIG.SUPABASE_ANON_KEY}`,
  'Content-Type': 'application/json',
  'Prefer': 'return=representation',
};

// Generate realistic score update payload for myK9Qv3 entries table
// NOTE: In myK9Qv3, scores are UPDATED on existing entries, not created as new rows
function generateScorePayload(vuId) {
  const isQualified = Math.random() > 0.2;  // 80% qualify
  return JSON.stringify({
    // Scent Work scoring fields - matches myK9Qv3 entries table schema
    search_time_seconds: Math.floor(Math.random() * 180) + 30,  // 30-210 seconds
    total_faults: Math.floor(Math.random() * 3),                 // 0-2 faults
    total_correct_finds: Math.floor(Math.random() * 3) + 1,      // 1-3 finds
    total_incorrect_finds: Math.floor(Math.random() * 2),        // 0-1 incorrect
    result_status: isQualified ? 'qualified' : 'nq',
    is_scored: true,
    final_placement: 0,  // Calculated later
    judge_notes: `Stress test VU${vuId} @ ${Date.now()}`,
    scoring_completed_at: new Date().toISOString(),
  });
}

export default function () {
  // Each VU (virtual user) gets assigned a different entry to score
  // This simulates multiple judges scoring different dogs concurrently
  const entryIndex = (__VU - 1) % CONFIG.TEST_ENTRY_IDS.length;
  const entryId = CONFIG.TEST_ENTRY_IDS[entryIndex];

  const url = `${CONFIG.SUPABASE_URL}/rest/v1/${CONFIG.TABLES.entries}?id=eq.${entryId}`;
  const payload = generateScorePayload(__VU);

  const startTime = Date.now();
  const response = http.patch(url, payload, { headers });
  const duration = Date.now() - startTime;

  scoreSubmitDuration.add(duration);

  const success = check(response, {
    'status is 200 or 204': (r) => r.status === 200 || r.status === 204,
    'response time OK': (r) => r.timings.duration < 1000,
  });

  if (success) {
    successfulSubmissions.add(1);
    if (__ITER === 0) {
      uniqueEntriesScored.add(1);  // Count unique entries on first iteration
    }
  }

  errorRate.add(!success);

  if (!success) {
    console.log(`Failed submission for entry ${entryId}: ${response.status} - ${response.body}`);
  }

  // Judge takes time between score entries (reviewing next dog, etc.)
  sleep(Math.random() * 5 + 2);
}

export function handleSummary(data) {
  return {
    'score-submit-summary.json': JSON.stringify(data, null, 2),
    stdout: generateReport(data),
  };
}

function generateReport(data) {
  const submissions = data.metrics.successful_submissions?.values?.count || 0;
  const uniqueEntries = data.metrics.unique_entries_scored?.values?.count || 0;

  return `
================================================================================
SCORE SUBMISSION STRESS TEST SUMMARY
================================================================================

Duration: ${data.state.testRunDurationMs / 1000}s
Concurrent Judges (VUs): ${options.vus}
Unique Entries Scored: ${uniqueEntries} / ${options.vus}

Submissions:
  Successful: ${submissions}
  Rate:       ${data.metrics.http_reqs.values.rate.toFixed(2)}/s

Response Times:
  Average:  ${data.metrics.http_req_duration.values.avg.toFixed(2)}ms
  Median:   ${data.metrics.http_req_duration.values.med.toFixed(2)}ms
  p(95):    ${data.metrics.http_req_duration.values['p(95)'].toFixed(2)}ms
  Max:      ${data.metrics.http_req_duration.values.max.toFixed(2)}ms

Errors:     ${(data.metrics.errors.values.rate * 100).toFixed(2)}%

${data.metrics.errors.values.rate > 0.05 ? '🚨 CRITICAL: Score submissions failing! This would lose judge data!' : '✅ Score submission reliability OK'}
================================================================================
`;
}
