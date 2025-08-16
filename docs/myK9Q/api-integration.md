# myK9Q API Integration Guide
## Connecting Mobile Scoring to myK9Show Backend

### Overview
This document defines the API endpoints, data flow, and synchronization strategies for integrating myK9Q mobile app with the myK9Show Supabase backend.

---

## Authentication

### Judge Login
```typescript
// Endpoint: Supabase Auth
POST /auth/v1/token?grant_type=password
{
  "email": "judge@example.com",
  "password": "secure_password"
}

// Response
{
  "access_token": "eyJhbGciOiJS...",
  "refresh_token": "v1.MYu5z...",
  "user": {
    "id": "uuid",
    "email": "judge@example.com",
    "user_metadata": {
      "judgeNumber": "12345",
      "roles": ["judge"]
    }
  }
}
```

### Biometric Authentication (Mobile)
```typescript
// Store tokens securely after first login
import * as Keychain from 'react-native-keychain';

await Keychain.setInternetCredentials(
  'myK9Q',
  user.email,
  tokens.refresh_token
);

// Retrieve with biometric check
const credentials = await Keychain.getInternetCredentials('myK9Q');
```

---

## Core API Endpoints

### 1. Get Judge Assignments
```typescript
// Get today's assignments for logged-in judge
GET /rest/v1/rpc/get_judge_assignments
Headers: {
  Authorization: "Bearer {access_token}"
}
Query: {
  judge_id: "uuid",
  show_date: "2024-01-15"
}

// Response
{
  "assignments": [
    {
      "id": "uuid",
      "show_id": "uuid",
      "show_name": "Winter Classic",
      "class_id": "uuid",
      "class_name": "Open B",
      "ring_number": 2,
      "scheduled_time": "09:00",
      "entry_count": 15,
      "status": "pending"
    }
  ]
}
```

### 2. Get Class Entries
```typescript
// Get all entries for a specific class
GET /rest/v1/rpc/get_class_entries
Query: {
  class_id: "uuid",
  include_photos: true
}

// Response
{
  "entries": [
    {
      "id": "uuid",
      "armband": "42",
      "dog": {
        "id": "uuid",
        "name": "Champion Max",
        "breed": "Golden Retriever",
        "sex": "male",
        "age": 3,
        "photo_url": "https://..."
      },
      "owner": {
        "id": "uuid",
        "name": "John Smith"
      },
      "handler": {
        "id": "uuid",
        "name": "Jane Doe"
      },
      "status": "checked_in"
    }
  ]
}
```

### 3. Submit Score
```typescript
// Submit individual competitor score
POST /rest/v1/scoring_sessions
{
  "judge_id": "uuid",
  "class_id": "uuid",
  "entry_id": "uuid",
  "scores": {
    "heeling": 35,
    "recall": 28,
    "stay": 30,
    "total": 93
  },
  "placement": null, // Calculated server-side
  "notes": "Good heeling, slight lag on recall",
  "status": "completed",
  "scored_at": "2024-01-15T10:30:00Z"
}

// Response
{
  "id": "uuid",
  "placement": 2, // Auto-calculated
  "success": true
}
```

### 4. Batch Score Submission
```typescript
// Submit multiple scores at once (offline sync)
POST /rest/v1/rpc/submit_batch_scores
{
  "scores": [
    {
      "entry_id": "uuid1",
      "scores": {...},
      "scored_at": "2024-01-15T10:30:00Z"
    },
    {
      "entry_id": "uuid2",
      "scores": {...},
      "scored_at": "2024-01-15T10:35:00Z"
    }
  ],
  "class_id": "uuid",
  "judge_id": "uuid"
}

// Response
{
  "processed": 2,
  "failed": 0,
  "placements": {
    "uuid1": 1,
    "uuid2": 2
  }
}
```

### 5. Update Entry Status
```typescript
// Mark entry as absent, excused, or disqualified
PATCH /rest/v1/entries/{entry_id}
{
  "status": "absent" | "excused" | "disqualified",
  "reason": "Dog aggressive",
  "updated_by": "judge_id"
}
```

---

## Real-Time Subscriptions

### Subscribe to Class Updates
```typescript
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(url, key);

// Subscribe to scoring updates for a class
const subscription = supabase
  .channel('class_scores')
  .on(
    'postgres_changes',
    {
      event: '*',
      schema: 'public',
      table: 'scoring_sessions',
      filter: `class_id=eq.${classId}`
    },
    (payload) => {
      console.log('Score update:', payload);
      // Update local state
    }
  )
  .subscribe();
```

### Subscribe to Entry Changes
```typescript
// Listen for check-ins, move-ups, scratches
const entrySubscription = supabase
  .channel('class_entries')
  .on(
    'postgres_changes',
    {
      event: '*',
      schema: 'public',
      table: 'entries',
      filter: `class_id=eq.${classId}`
    },
    (payload) => {
      // Handle entry updates
    }
  )
  .subscribe();
```

---

## Offline Synchronization

### Local Storage Schema
```typescript
// SQLite/Realm schema for offline storage
interface OfflineScore {
  id: string; // Local UUID
  entry_id: string;
  class_id: string;
  scores: Record<string, number>;
  notes?: string;
  created_at: Date;
  synced: boolean;
  sync_attempts: number;
  last_sync_error?: string;
}
```

### Sync Strategy
```typescript
class OfflineSyncManager {
  async syncPendingScores() {
    const pending = await db.offlineScores
      .where('synced')
      .equals(false)
      .toArray();
    
    for (const score of pending) {
      try {
        await this.submitScore(score);
        await db.offlineScores.update(score.id, { synced: true });
      } catch (error) {
        await this.handleSyncError(score, error);
      }
    }
  }
  
  private async handleSyncError(score: OfflineScore, error: Error) {
    const attempts = score.sync_attempts + 1;
    
    if (attempts >= 3) {
      // Mark for manual review
      await db.offlineScores.update(score.id, {
        sync_attempts: attempts,
        last_sync_error: error.message,
        requires_review: true
      });
    } else {
      // Retry with exponential backoff
      const delay = Math.pow(2, attempts) * 1000;
      setTimeout(() => this.syncScore(score), delay);
    }
  }
}
```

### Conflict Resolution
```typescript
interface ConflictResolution {
  strategy: 'timestamp' | 'judge_override' | 'manual';
  
  async resolve(local: Score, remote: Score): Promise<Score> {
    switch (this.strategy) {
      case 'timestamp':
        return local.scored_at > remote.scored_at ? local : remote;
      
      case 'judge_override':
        return local; // Judge's score takes precedence
      
      case 'manual':
        return await this.promptUserResolution(local, remote);
    }
  }
}
```

---

## Error Handling

### API Error Codes
```typescript
enum ApiErrorCode {
  NETWORK_ERROR = 'NETWORK_ERROR',
  AUTH_EXPIRED = 'AUTH_EXPIRED',
  INVALID_SCORE = 'INVALID_SCORE',
  CLASS_LOCKED = 'CLASS_LOCKED',
  DUPLICATE_SCORE = 'DUPLICATE_SCORE',
  SERVER_ERROR = 'SERVER_ERROR'
}

class ApiError extends Error {
  constructor(
    public code: ApiErrorCode,
    public message: string,
    public retryable: boolean = false
  ) {
    super(message);
  }
}
```

### Error Recovery
```typescript
async function withRetry<T>(
  fn: () => Promise<T>,
  maxRetries: number = 3
): Promise<T> {
  let lastError: Error;
  
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      
      if (!isRetryable(error)) {
        throw error;
      }
      
      await delay(Math.pow(2, i) * 1000);
    }
  }
  
  throw lastError;
}
```

---

## Performance Optimization

### Data Caching
```typescript
class DataCache {
  private cache = new Map<string, CacheEntry>();
  
  async getClassEntries(classId: string): Promise<Entry[]> {
    const key = `entries_${classId}`;
    const cached = this.cache.get(key);
    
    if (cached && !this.isExpired(cached)) {
      return cached.data;
    }
    
    const fresh = await api.getClassEntries(classId);
    this.cache.set(key, {
      data: fresh,
      timestamp: Date.now(),
      ttl: 5 * 60 * 1000 // 5 minutes
    });
    
    return fresh;
  }
}
```

### Request Batching
```typescript
class RequestBatcher {
  private queue: PendingRequest[] = [];
  private timer: NodeJS.Timeout;
  
  add(request: PendingRequest) {
    this.queue.push(request);
    
    if (!this.timer) {
      this.timer = setTimeout(() => this.flush(), 100);
    }
  }
  
  private async flush() {
    const batch = this.queue.splice(0);
    
    if (batch.length === 0) return;
    
    const response = await api.batchRequest(batch);
    batch.forEach((req, i) => {
      req.resolve(response[i]);
    });
  }
}
```

---

## Security Considerations

### Token Management
```typescript
class TokenManager {
  private accessToken: string;
  private refreshToken: string;
  private expiresAt: Date;
  
  async getValidToken(): Promise<string> {
    if (this.isExpired()) {
      await this.refresh();
    }
    return this.accessToken;
  }
  
  private async refresh() {
    const response = await supabase.auth.refreshSession({
      refresh_token: this.refreshToken
    });
    
    this.accessToken = response.data.session.access_token;
    this.expiresAt = new Date(response.data.session.expires_at);
  }
}
```

### Data Encryption
```typescript
// Encrypt sensitive data in local storage
import CryptoJS from 'crypto-js';

class SecureStorage {
  private key: string;
  
  async store(key: string, data: any) {
    const encrypted = CryptoJS.AES.encrypt(
      JSON.stringify(data),
      this.key
    ).toString();
    
    await AsyncStorage.setItem(key, encrypted);
  }
  
  async retrieve(key: string): Promise<any> {
    const encrypted = await AsyncStorage.getItem(key);
    if (!encrypted) return null;
    
    const decrypted = CryptoJS.AES.decrypt(encrypted, this.key);
    return JSON.parse(decrypted.toString(CryptoJS.enc.Utf8));
  }
}
```

---

## Testing

### API Mocking
```typescript
// Mock API for development and testing
class MockApi {
  async getClassEntries(classId: string) {
    return Promise.resolve([
      {
        id: 'mock-1',
        armband: '42',
        dog: { name: 'Test Dog 1' },
        // ... mock data
      }
    ]);
  }
}

// Use in development
const api = __DEV__ ? new MockApi() : new ProductionApi();
```

### Integration Tests
```typescript
describe('Scoring API Integration', () => {
  it('should submit score successfully', async () => {
    const score = {
      entry_id: 'test-entry',
      scores: { heeling: 35, recall: 28 }
    };
    
    const result = await api.submitScore(score);
    
    expect(result.success).toBe(true);
    expect(result.placement).toBeDefined();
  });
  
  it('should handle offline mode', async () => {
    // Simulate offline
    await NetInfo.setReachability(false);
    
    const score = { /* ... */ };
    await scoringService.submitScore(score);
    
    // Check queued locally
    const pending = await db.offlineScores.toArray();
    expect(pending).toHaveLength(1);
    
    // Simulate online
    await NetInfo.setReachability(true);
    await syncManager.sync();
    
    // Check synced
    const remaining = await db.offlineScores.toArray();
    expect(remaining).toHaveLength(0);
  });
});
```

---

## Monitoring & Analytics

### Performance Tracking
```typescript
class PerformanceMonitor {
  trackApiCall(endpoint: string, duration: number) {
    analytics.track('api_call', {
      endpoint,
      duration,
      timestamp: Date.now()
    });
    
    if (duration > 2000) {
      this.reportSlowApi(endpoint, duration);
    }
  }
  
  trackSyncSuccess(count: number, duration: number) {
    analytics.track('sync_completed', {
      score_count: count,
      duration,
      success: true
    });
  }
}
```

---

Last Updated: 2025-08-12
Version: 1.0.0