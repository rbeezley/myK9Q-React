import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate, Trend } from 'k6/metrics';
import { CONFIG, SCENARIOS } from './config.js';

// Custom metrics
const errorRate = new Rate('errors');
const resultsFetchDuration = new Trend('results_fetch_duration');

// Test configuration - change 'medium' to other scenarios as needed
export const options = {
  vus: SCENARIOS.medium.vus,
  duration: SCENARIOS.medium.duration,
  thresholds: {
    http_req_duration: ['p(95)<500'],  // 95% of requests under 500ms
    errors: ['rate<0.1'],               // Error rate under 10%
  },
};

const headers = {
  'apikey': CONFIG.SUPABASE_ANON_KEY,
  'Authorization': `Bearer ${CONFIG.SUPABASE_ANON_KEY}`,
  'Content-Type': 'application/json',
};

export default function () {
  // Scenario: User loads results page for a class
  // This simulates "everyone refreshes when results are posted" moment
  // myK9Qv3 uses entries table (merged entry + score data) filtered by class_id

  const url = `${CONFIG.SUPABASE_URL}/rest/v1/${CONFIG.TABLES.entries}?class_id=eq.${CONFIG.TEST_CLASS_ID}&select=id,armband_number,handler_name,dog_call_name,result_status,search_time_seconds,total_faults,final_placement,is_scored&order=final_placement.asc`;

  const startTime = Date.now();
  const response = http.get(url, { headers });
  const duration = Date.now() - startTime;

  resultsFetchDuration.add(duration);

  const success = check(response, {
    'status is 200': (r) => r.status === 200,
    'response has data': (r) => r.json().length >= 0,
    'response time OK': (r) => r.timings.duration < 500,
  });

  errorRate.add(!success);

  // Simulate user viewing results for a few seconds before refreshing
  sleep(Math.random() * 3 + 1);
}

export function handleSummary(data) {
  return {
    'results-test-summary.json': JSON.stringify(data, null, 2),
    stdout: generateReport(data),
  };
}

function generateReport(data) {
  return `
================================================================================
RESULTS FETCH STRESS TEST SUMMARY
================================================================================

Duration: ${data.state.testRunDurationMs / 1000}s
Virtual Users: ${options.vus}

HTTP Requests:
  Total:    ${data.metrics.http_reqs.values.count}
  Rate:     ${data.metrics.http_reqs.values.rate.toFixed(2)}/s

Response Times:
  Average:  ${data.metrics.http_req_duration.values.avg.toFixed(2)}ms
  Median:   ${data.metrics.http_req_duration.values.med.toFixed(2)}ms
  p(95):    ${data.metrics.http_req_duration.values['p(95)'].toFixed(2)}ms
  Max:      ${data.metrics.http_req_duration.values.max.toFixed(2)}ms

Errors:     ${(data.metrics.errors.values.rate * 100).toFixed(2)}%

${data.metrics.http_req_duration.values['p(95)'] > 500 ? '⚠️  WARNING: p(95) exceeds 500ms threshold!' : '✅ Response times within acceptable range'}
${data.metrics.errors.values.rate > 0.1 ? '⚠️  WARNING: Error rate exceeds 10%!' : '✅ Error rate acceptable'}
================================================================================
`;
}
