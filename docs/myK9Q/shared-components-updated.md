# myK9Q Shared Components Library (Updated)
## Based on Flutter App Analysis

### Overview
This document defines the shared component library based on analysis of the existing Flutter myK9Q app. Components are designed to support 7 competition types with proven UX patterns for ringside judging.

---

## Competition-Specific Scoresheets

### 1. AKC Scent Work Scoresheet
**Purpose**: Multi-area timing with millisecond precision

```typescript
interface ScoresheetAKCScentWorkProps {
  entry: ScoringEntry;
  areas: 1 | 2 | 3; // From database areas field
  timeLimits: {
    area1: string; // From timeLimit field (MM:SS format)
    area2?: string; // From timeLimit2 field  
    area3?: string; // From timeLimit3 field
  };
  onScoreSubmit: (score: ScentWorkScore) => void;
  readonly?: boolean;
}

interface ScentWorkScore {
  areaTimes: {
    area1?: string; // MM:SS.ms format
    area2?: string;
    area3?: string;
  };
  correctCount: number; // Hides found
  incorrectCount: number; // No finds
  result: 'Q' | 'NQ' | 'EX' | 'DQ';
  totalTime: string; // Combined time
  notes?: string;
}
```

**Key Features** (from Flutter):
- **Multi-timer support**: Up to 3 simultaneous precision timers
- **Audio alerts**: Sound when area time limit exceeded
- **Progress indicators**: Visual countdown for each area
- **Auto-calculation**: Total time computed automatically
- **Qualifying logic**: Based on correct/incorrect counts

### 2. UKC Obedience Scoresheet
**Purpose**: Decimal point scoring with validation

```typescript
interface ScoresheetUKCObedienceProps {
  entry: ScoringEntry;
  maxScore: number; // Typically 200.0
  onScoreSubmit: (score: ObedienceScore) => void;
  readonly?: boolean;
}

interface ObedienceScore {
  finalScore: number; // Decimal (e.g., 185.5)
  result: 'Q' | 'NQ' | 'EX' | 'DQ';
  reason?: string; // For NQ/EX/DQ
  notes?: string;
}
```

**Key Features** (from Flutter):
- **Input masking**: ###.# format (MaskTextInputFormatter)
- **Large numeric display**: 48pt monospace font
- **Validation**: Maximum 200.0 points
- **Auto-formatting**: Decimal places handled automatically

### 3. Fast CAT Scoresheet
**Purpose**: Speed scoring with mandatory health checks

```typescript
interface ScoresheetFastCATProps {
  entry: ScoringEntry;
  requireHealthCheck: boolean;
  handicapInfo?: {
    block: string; // Size category
    handicap: string; // Age/veteran status
  };
  onScoreSubmit: (score: FastCATScore) => void;
}

interface FastCATScore {
  healthCheck: {
    status: boolean;
    timestamp: Date;
    comment?: string;
  };
  runTime?: string; // MM:SS.mmm format
  speed?: number; // MPH calculated
  result: 'Complete' | 'No Finish' | 'DQ';
  notes?: string;
}
```

**Key Features** (from Flutter):
- **Health validation**: Must check health status before run
- **Speed calculation**: Auto-compute MPH from time
- **Handicap tracking**: Senior/veteran classifications
- **Database fields**: Maps to `fastcat_health_*` columns

---

## Shared Timer Component

### Timer (High-Precision)
**Purpose**: Millisecond-accurate timing for all timed events

```typescript
interface TimerProps {
  maxTime: number; // Milliseconds
  precision: 'seconds' | 'milliseconds';
  onTimeExpired: () => void; // Audio alert callback
  onTimeUpdate?: (elapsed: number) => void;
  autoStart?: boolean;
  showControls?: boolean;
  areas?: number; // 1-3 for multi-area events
}

interface TimerState {
  elapsed: number; // Milliseconds
  remaining: number; // Milliseconds  
  running: boolean;
  expired: boolean;
  percentage: number; // For progress indicator
}
```

**Implementation** (from Flutter `stop_watch_timer`):
```typescript
export function useTimer(maxTime: number) {
  const [state, setState] = useState<TimerState>({
    elapsed: 0,
    remaining: maxTime,
    running: false,
    expired: false,
    percentage: 0
  });
  
  const intervalRef = useRef<NodeJS.Timeout>();
  const audioRef = useRef<Audio>();
  
  const start = useCallback(() => {
    setState(prev => ({ ...prev, running: true }));
    const startTime = Date.now() - state.elapsed;
    
    intervalRef.current = setInterval(() => {
      const now = Date.now();
      const elapsed = now - startTime;
      const remaining = Math.max(0, maxTime - elapsed);
      const expired = remaining === 0;
      const percentage = (elapsed / maxTime) * 100;
      
      setState({
        elapsed,
        remaining,
        running: !expired,
        expired,
        percentage: Math.min(percentage, 100)
      });
      
      // Audio alert when time expires
      if (expired && audioRef.current) {
        audioRef.current.play();
      }
    }, 10); // 10ms precision
  }, [maxTime, state.elapsed]);
  
  return { state, start, stop, reset, pause };
}
```

---

## Competitor Information Components

### CompetitorCard
**Purpose**: Display current competitor being scored

```typescript
interface CompetitorCardProps {
  entry: {
    armband: number; // From database armband field
    callName: string; // From database call_name field
    breed: string; // From database breed field
    handler: string; // From database handler field
    photo?: string; // Optional photo URL
  };
  progress?: {
    current: number;
    total: number;
  };
  onPress?: () => void;
}
```

**Visual Layout** (from Flutter):
```
┌──────────────────────────────────────────┐
│  Armband #42           Progress: 3/15    │
│  ┌──────┐                               │
│  │Photo │  Champion Max                  │
│  │ 100x │  Golden Retriever • Male      │
│  │ 100px│  Handler: Jane Smith           │
│  └──────┘                               │
└──────────────────────────────────────────┘
```

### HealthCheckComponent (Fast CAT Specific)
**Purpose**: Mandatory pre-run health verification

```typescript
interface HealthCheckProps {
  onHealthCheck: (status: HealthCheckStatus) => void;
  required: boolean;
  previousCheck?: HealthCheckStatus;
}

interface HealthCheckStatus {
  approved: boolean;
  timestamp: Date;
  comment?: string;
  judgeId: string;
}
```

**Implementation** (from Flutter health check logic):
```typescript
const HealthCheckComponent: React.FC<HealthCheckProps> = ({
  onHealthCheck,
  required,
  previousCheck
}) => {
  const [approved, setApproved] = useState(previousCheck?.approved ?? false);
  const [comment, setComment] = useState(previousCheck?.comment ?? '');
  
  const handleSubmit = () => {
    if (required && !approved) {
      // Show validation error
      return;
    }
    
    onHealthCheck({
      approved,
      timestamp: new Date(),
      comment: comment.trim(),
      judgeId: currentJudge.id
    });
  };
  
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Pre-Run Health Check</Text>
      <CheckBox
        checked={approved}
        onChange={setApproved}
        label="Dog appears healthy and ready to run"
        required={required}
      />
      <TextInput
        value={comment}
        onChange={setComment}
        placeholder="Optional health comments"
        multiline
      />
      <Button onPress={handleSubmit}>
        {approved ? '✅ Approved' : '⚠️ Approve Health Check'}
      </Button>
    </View>
  );
};
```

---

## Scoring Input Components

### PointScoreInput (UKC Obedience)
**Purpose**: Decimal point entry with validation

```typescript
interface PointScoreInputProps {
  maxPoints: number; // Usually 200.0
  value: number | null;
  onChange: (score: number) => void;
  formatMask: string; // "###.#"
  placeholder?: string;
}
```

**Implementation** (from Flutter MaskTextInputFormatter):
```typescript
const PointScoreInput: React.FC<PointScoreInputProps> = ({
  maxPoints,
  value,
  onChange,
  formatMask
}) => {
  const [displayValue, setDisplayValue] = useState('');
  
  const handleChange = (text: string) => {
    // Apply mask formatting (###.#)
    const masked = applyMask(text, formatMask);
    setDisplayValue(masked);
    
    const numericValue = parseFloat(masked);
    if (!isNaN(numericValue) && numericValue <= maxPoints) {
      onChange(numericValue);
    }
  };
  
  return (
    <TextInput
      style={styles.scoreInput} // Large 48pt font
      value={displayValue}
      onChangeText={handleChange}
      keyboardType="numeric"
      placeholder={`Max: ${maxPoints}`}
      maxLength={5} // ###.#
    />
  );
};
```

### FaultCounter (Rally)
**Purpose**: Increment/decrement fault counting

```typescript
interface FaultCounterProps {
  value: number;
  onChange: (count: number) => void;
  maxFaults?: number;
  faultTypes?: string[]; // Different fault categories
}
```

**Implementation** (from Flutter increment/decrement):
```typescript
const FaultCounter: React.FC<FaultCounterProps> = ({
  value,
  onChange,
  maxFaults = 20
}) => {
  const increment = () => {
    if (value < maxFaults) {
      onChange(value + 1);
      // Haptic feedback
      Haptics.selectionAsync();
    }
  };
  
  const decrement = () => {
    if (value > 0) {
      onChange(value - 1);
      // Haptic feedback  
      Haptics.selectionAsync();
    }
  };
  
  return (
    <View style={styles.counter}>
      <TouchableOpacity 
        style={[styles.button, styles.decrementButton]}
        onPress={decrement}
        disabled={value === 0}
      >
        <Text style={styles.buttonText}>−</Text>
      </TouchableOpacity>
      
      <Text style={styles.count}>{value}</Text>
      
      <TouchableOpacity 
        style={[styles.button, styles.incrementButton]}
        onPress={increment}
        disabled={value >= maxFaults}
      >
        <Text style={styles.buttonText}>+</Text>
      </TouchableOpacity>
    </View>
  );
};
```

### QualifyingResultSelector
**Purpose**: Binary result selection (Q/NQ/EX/DQ)

```typescript
interface QualifyingResultProps {
  value: 'Q' | 'NQ' | 'EX' | 'DQ' | null;
  onChange: (result: 'Q' | 'NQ' | 'EX' | 'DQ') => void;
  options: ResultOption[];
}

interface ResultOption {
  value: 'Q' | 'NQ' | 'EX' | 'DQ';
  label: string;
  color: string;
  requiresReason?: boolean;
}
```

**Implementation** (from Flutter FlutterFlowChoiceChips):
```typescript
const QualifyingResultSelector: React.FC<QualifyingResultProps> = ({
  value,
  onChange,
  options
}) => {
  return (
    <View style={styles.resultSelector}>
      {options.map((option) => (
        <TouchableOpacity
          key={option.value}
          style={[
            styles.resultButton,
            { backgroundColor: value === option.value ? option.color : '#f0f0f0' }
          ]}
          onPress={() => onChange(option.value)}
        >
          <Text style={[
            styles.resultText,
            { color: value === option.value ? 'white' : 'black' }
          ]}>
            {option.label}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );
};

// Usage
const obedienceOptions: ResultOption[] = [
  { value: 'Q', label: 'Q', color: '#34C759' }, // Green
  { value: 'NQ', label: 'NQ', color: '#FF3B30' }, // Red
  { value: 'EX', label: 'EX', color: '#FF9500' }, // Orange  
  { value: 'DQ', label: 'DQ', color: '#FF3B30', requiresReason: true } // Red
];
```

---

## Audio and Feedback Components

### AudioManager
**Purpose**: Handle all sound effects and alerts

```typescript
interface AudioManagerProps {
  enabled: boolean;
  volume: number; // 0.0 to 1.0
}

class AudioManager {
  private sounds: Map<string, Audio> = new Map();
  
  constructor(private volume: number = 0.5) {
    // Load sounds from Flutter assets
    this.sounds.set('timer_expired', new Audio('assets/audios/MaxTimeExceeded.wav'));
    this.sounds.set('notification', new Audio('assets/audios/NewNotification.mp3'));
    this.sounds.set('warning', new Audio('assets/audios/warning.mp3'));
  }
  
  play(soundName: string) {
    const sound = this.sounds.get(soundName);
    if (sound) {
      sound.volume = this.volume;
      sound.play();
    }
  }
  
  setVolume(volume: number) {
    this.volume = Math.max(0, Math.min(1, volume));
  }
}
```

### HapticManager
**Purpose**: Provide tactile feedback

```typescript
class HapticManager {
  static light() {
    // Light tap feedback for buttons
    Haptics.selectionAsync();
  }
  
  static medium() {
    // Medium impact for important actions
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  }
  
  static heavy() {
    // Heavy impact for critical actions (DQ, submit)
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
  }
}
```

---

## Real-time Synchronization Components

### SyncIndicator  
**Purpose**: Show connection status and pending operations

```typescript
interface SyncIndicatorProps {
  isOnline: boolean;
  pendingCount: number;
  lastSyncTime?: Date;
  onRetrySync?: () => void;
}

const SyncIndicator: React.FC<SyncIndicatorProps> = ({
  isOnline,
  pendingCount,
  lastSyncTime,
  onRetrySync
}) => {
  const getStatusConfig = () => {
    if (!isOnline && pendingCount > 0) {
      return {
        icon: '🟡',
        text: `Offline • ${pendingCount} pending`,
        color: '#FF9500'
      };
    } else if (!isOnline) {
      return {
        icon: '🔴',
        text: 'Connection Error',
        color: '#FF3B30'
      };
    } else {
      const timeAgo = lastSyncTime ? formatTimeAgo(lastSyncTime) : '';
      return {
        icon: '🟢',
        text: `Connected • ${timeAgo}`,
        color: '#34C759'
      };
    }
  };
  
  const config = getStatusConfig();
  
  return (
    <TouchableOpacity 
      style={[styles.indicator, { borderColor: config.color }]}
      onPress={onRetrySync}
    >
      <Text style={styles.icon}>{config.icon}</Text>
      <Text style={styles.statusText}>{config.text}</Text>
    </TouchableOpacity>
  );
};
```

### OfflineQueueViewer
**Purpose**: Show queued operations when offline

```typescript
interface OfflineQueueViewerProps {
  queueItems: OfflineScore[];
  onClearQueue?: () => void;
  onRetryItem?: (item: OfflineScore) => void;
}

const OfflineQueueViewer: React.FC<OfflineQueueViewerProps> = ({
  queueItems,
  onClearQueue,
  onRetryItem
}) => {
  if (queueItems.length === 0) return null;
  
  return (
    <View style={styles.queueContainer}>
      <Text style={styles.queueTitle}>
        {queueItems.length} Scores Queued for Sync
      </Text>
      {queueItems.map((item, index) => (
        <View key={item.id} style={styles.queueItem}>
          <Text>#{item.score.armband} - {item.score.dogName}</Text>
          <Text style={styles.timestamp}>
            {formatTime(item.createdAt)}
          </Text>
          {item.lastSyncError && (
            <TouchableOpacity onPress={() => onRetryItem?.(item)}>
              <Text style={styles.retryButton}>Retry</Text>
            </TouchableOpacity>
          )}
        </View>
      ))}
    </View>
  );
};
```

---

## Navigation Components

### EntryNavigator
**Purpose**: Move between competitors with context

```typescript
interface EntryNavigatorProps {
  currentIndex: number;
  totalEntries: number;
  entries: ScoringEntry[];
  onNavigate: (index: number) => void;
  onSave: () => void;
  isDirty: boolean;
}

const EntryNavigator: React.FC<EntryNavigatorProps> = ({
  currentIndex,
  totalEntries,
  entries,
  onNavigate,
  onSave,
  isDirty
}) => {
  const canGoPrevious = currentIndex > 0;
  const canGoNext = currentIndex < totalEntries - 1;
  
  const previousEntry = canGoPrevious ? entries[currentIndex - 1] : null;
  const nextEntry = canGoNext ? entries[currentIndex + 1] : null;
  
  return (
    <View style={styles.navigator}>
      <TouchableOpacity
        style={[styles.navButton, !canGoPrevious && styles.disabled]}
        onPress={() => canGoPrevious && onNavigate(currentIndex - 1)}
        disabled={!canGoPrevious}
      >
        <Text style={styles.navText}>
          Previous
          {previousEntry && `\n#${previousEntry.armband}`}
        </Text>
      </TouchableOpacity>
      
      <TouchableOpacity
        style={[styles.saveButton, isDirty && styles.saveButtonDirty]}
        onPress={onSave}
      >
        <Text style={styles.saveText}>
          {isDirty ? 'Save*' : 'Saved'}
        </Text>
      </TouchableOpacity>
      
      <TouchableOpacity
        style={[styles.navButton, !canGoNext && styles.disabled]}
        onPress={() => canGoNext && onNavigate(currentIndex + 1)}
        disabled={!canGoNext}
      >
        <Text style={styles.navText}>
          Next
          {nextEntry && `\n#${nextEntry.armband}`}
        </Text>
      </TouchableOpacity>
    </View>
  );
};
```

---

## Testing Strategy for Components

### Component Testing Requirements
Each component must have:
- [ ] **Unit tests**: Input validation, state changes
- [ ] **Integration tests**: Supabase data flow
- [ ] **Accessibility tests**: Screen reader, large text support
- [ ] **Performance tests**: Memory usage, render speed
- [ ] **Device tests**: Tablet/phone layouts, different screen sizes

### Scoresheet Testing Matrix
For each of the 7 competition types:
- [ ] Valid score submission
- [ ] Invalid input handling
- [ ] Timer accuracy (where applicable)
- [ ] Audio alert functionality
- [ ] Offline queue operation
- [ ] Real-time sync verification

### Migration Testing
- [ ] Data compatibility with Flutter app
- [ ] Supabase schema compatibility
- [ ] Judge workflow consistency
- [ ] Performance parity or improvement

---

Last Updated: 2025-08-12 (Based on Flutter Analysis)
Version: 2.0.0