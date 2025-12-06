import ws from 'k6/ws';
import { check, sleep } from 'k6';
import { Rate, Counter, Trend } from 'k6/metrics';
import { CONFIG, SCENARIOS } from './config.js';

// Custom metrics
const connectionErrors = new Rate('connection_errors');
const messagesReceived = new Counter('messages_received');
const connectionTime = new Trend('connection_time');

// Test configuration - simulating many clients subscribed to live results
export const options = {
  vus: 100,        // 100 clients watching (kiosks, phones, laptops)
  duration: '5m',  // Watch for 5 minutes
  thresholds: {
    connection_errors: ['rate<0.1'],  // Less than 10% connection failures
  },
};

// Supabase Realtime WebSocket URL
const wsUrl = CONFIG.SUPABASE_URL.replace('https://', 'wss://') + '/realtime/v1/websocket';

export default function () {
  const url = `${wsUrl}?apikey=${CONFIG.SUPABASE_ANON_KEY}&vsn=1.0.0`;

  const startTime = Date.now();

  const response = ws.connect(url, {}, function (socket) {
    const connectDuration = Date.now() - startTime;
    connectionTime.add(connectDuration);

    socket.on('open', function () {
      // Join the realtime channel for entries (which contains scoring data in myK9Qv3)
      // Filter by license_key to simulate a show's live updates
      const joinPayload = JSON.stringify({
        topic: `realtime:public:${CONFIG.TABLES.entries}`,
        event: 'phx_join',
        payload: {
          config: {
            broadcast: { self: false },
            presence: { key: '' },
            postgres_changes: [
              {
                event: '*',
                schema: 'public',
                table: CONFIG.TABLES.entries,
                filter: `license_key=eq.${CONFIG.TEST_LICENSE_KEY}`,
              },
            ],
          },
        },
        ref: '1',
      });

      socket.send(joinPayload);

      // Send heartbeat every 30 seconds (Supabase requires this)
      socket.setInterval(function () {
        socket.send(JSON.stringify({
          topic: 'phoenix',
          event: 'heartbeat',
          payload: {},
          ref: Date.now().toString(),
        }));
      }, 30000);
    });

    socket.on('message', function (message) {
      messagesReceived.add(1);

      try {
        const data = JSON.parse(message);

        // Log actual data changes (not just heartbeats)
        if (data.event === 'postgres_changes') {
          console.log(`Received update: ${JSON.stringify(data.payload)}`);
        }
      } catch (e) {
        // Ignore parse errors for binary frames
      }
    });

    socket.on('error', function (e) {
      console.log(`WebSocket error: ${e.error()}`);
      connectionErrors.add(true);
    });

    socket.on('close', function () {
      // Connection closed
    });

    // Keep connection open for the test duration
    // The socket will be closed when the VU iteration ends
    sleep(60);  // Each VU stays connected for 60 seconds per iteration
  });

  const connected = check(response, {
    'WebSocket connected': (r) => r && r.status === 101,
  });

  if (!connected) {
    connectionErrors.add(true);
  }
}

export function handleSummary(data) {
  return {
    'realtime-test-summary.json': JSON.stringify(data, null, 2),
    stdout: generateReport(data),
  };
}

function generateReport(data) {
  return `
================================================================================
REALTIME SUBSCRIPTION STRESS TEST SUMMARY
================================================================================

Duration: ${data.state.testRunDurationMs / 1000}s
Concurrent Subscribers: ${options.vus}

Connections:
  Avg Connect Time: ${data.metrics.connection_time?.values?.avg?.toFixed(2) || 'N/A'}ms
  Connection Errors: ${((data.metrics.connection_errors?.values?.rate || 0) * 100).toFixed(2)}%

Messages:
  Total Received: ${data.metrics.messages_received?.values?.count || 0}

WebSocket Stats:
  Sessions: ${data.metrics.ws_sessions?.values?.count || 'N/A'}
  
${(data.metrics.connection_errors?.values?.rate || 0) > 0.1 ? '⚠️  WARNING: High connection failure rate - check Supabase connection limits!' : '✅ Realtime connections stable'}
================================================================================

NOTE: If you see connection errors, check your Supabase plan's realtime limits.
Free tier: 200 concurrent connections
Pro tier: 500 concurrent connections
`;
}
