# myK9Q Shared Components Library
## Reusable Components for Unified Scoring Interface

### Overview
This document defines the shared component library that will be used by both myK9Q (React Native) and myK9Show (React) to ensure consistent scoring interfaces across platforms.

---

## Core Components

### 1. ScoringGrid
**Purpose**: Flexible grid for entering scores across different competition types

```typescript
interface ScoringGridProps {
  exercises: Exercise[];
  scores: Score[];
  onScoreChange: (exerciseId: string, score: number) => void;
  readonly?: boolean;
  variant?: 'points' | 'time' | 'faults' | 'qualifying';
}

interface Exercise {
  id: string;
  name: string;
  maxPoints?: number;
  minPoints?: number;
  step?: number; // Increment (e.g., 0.5 for half points)
  required?: boolean;
}
```

**Usage Example**:
```tsx
// Web (React)
import { ScoringGrid } from '@/components/scoring/ScoringGrid';

<ScoringGrid
  exercises={obedienceExercises}
  scores={currentScores}
  onScoreChange={handleScoreUpdate}
/>

// Mobile (React Native)
import { ScoringGrid } from '@myK9Q/components/ScoringGrid';

<ScoringGrid
  exercises={obedienceExercises}
  scores={currentScores}
  onScoreChange={handleScoreUpdate}
/>
```

### 2. CompetitorCard
**Purpose**: Display competitor information consistently

```typescript
interface CompetitorCardProps {
  entry: {
    id: string;
    armband: string;
    dog: {
      name: string;
      breed: string;
      sex: 'male' | 'female';
      age?: number;
      photo?: string;
    };
    owner: {
      name: string;
      id: string;
    };
    handler?: {
      name: string;
      id: string;
    };
  };
  variant?: 'compact' | 'detailed' | 'minimal';
  showPhoto?: boolean;
  onPress?: () => void;
}
```

**Platform Adaptations**:
```tsx
// Shared logic
const formatCompetitorInfo = (entry: Entry) => ({
  title: `#${entry.armband} · ${entry.dog.name}`,
  subtitle: `${entry.dog.breed} · ${entry.dog.sex} · ${entry.dog.age}y`,
  owner: entry.owner.name,
  handler: entry.handler?.name || entry.owner.name
});

// Web implementation
export const CompetitorCard: React.FC<CompetitorCardProps> = (props) => {
  return (
    <div className="competitor-card" onClick={props.onPress}>
      {/* Web-specific rendering */}
    </div>
  );
};

// Mobile implementation
export const CompetitorCard: React.FC<CompetitorCardProps> = (props) => {
  return (
    <TouchableOpacity onPress={props.onPress}>
      <View style={styles.card}>
        {/* React Native rendering */}
      </View>
    </TouchableOpacity>
  );
};
```

### 3. Timer
**Purpose**: Consistent timer for timed events

```typescript
interface TimerProps {
  startTime?: number;
  running?: boolean;
  onStart?: () => void;
  onStop?: (time: number) => void;
  onReset?: () => void;
  showControls?: boolean;
  format?: 'mm:ss' | 'mm:ss.ms' | 'seconds';
}

interface TimerState {
  elapsed: number;
  running: boolean;
  startedAt?: Date;
}
```

**Shared Timer Logic**:
```typescript
// Shared hook for both platforms
export function useTimer(initialTime = 0) {
  const [elapsed, setElapsed] = useState(initialTime);
  const [running, setRunning] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout>();
  
  const start = useCallback(() => {
    setRunning(true);
    const startTime = Date.now() - elapsed;
    
    intervalRef.current = setInterval(() => {
      setElapsed(Date.now() - startTime);
    }, 10);
  }, [elapsed]);
  
  const stop = useCallback(() => {
    setRunning(false);
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
    return elapsed;
  }, [elapsed]);
  
  const reset = useCallback(() => {
    stop();
    setElapsed(0);
  }, [stop]);
  
  return { elapsed, running, start, stop, reset };
}
```

### 4. PlacementSelector
**Purpose**: Quick placement assignment interface

```typescript
interface PlacementSelectorProps {
  entries: Entry[];
  placements: Record<string, number>;
  onPlacementChange: (entryId: string, placement: number) => void;
  maxPlacements?: number;
  allowTies?: boolean;
}
```

### 5. SyncIndicator
**Purpose**: Show connection and sync status

```typescript
interface SyncIndicatorProps {
  status: 'online' | 'offline' | 'syncing' | 'error';
  pendingCount?: number;
  lastSyncTime?: Date;
  onRetry?: () => void;
}

type SyncStatus = {
  isOnline: boolean;
  pendingScores: number;
  lastSync: Date | null;
  syncErrors: Error[];
};
```

**Implementation**:
```tsx
export const SyncIndicator: React.FC<SyncIndicatorProps> = ({
  status,
  pendingCount = 0,
  lastSyncTime,
  onRetry
}) => {
  const statusConfig = {
    online: { icon: '🟢', text: 'Connected', color: 'green' },
    offline: { icon: '🟡', text: `Offline (${pendingCount} pending)`, color: 'yellow' },
    syncing: { icon: '🔄', text: 'Syncing...', color: 'blue' },
    error: { icon: '🔴', text: 'Sync Error', color: 'red' }
  };
  
  const config = statusConfig[status];
  
  // Platform-specific rendering handled by wrapper
  return (
    <SyncIndicatorView
      icon={config.icon}
      text={config.text}
      color={config.color}
      onPress={status === 'error' ? onRetry : undefined}
    />
  );
};
```

### 6. ScoreInput
**Purpose**: Optimized input for entering scores

```typescript
interface ScoreInputProps {
  value: number | null;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  step?: number;
  label?: string;
  variant?: 'buttons' | 'slider' | 'numeric' | 'grid';
}
```

**Button Grid Variant**:
```tsx
const ScoreButtonGrid: React.FC<ScoreInputProps> = ({
  value,
  onChange,
  min = 0,
  max = 10,
  step = 1
}) => {
  const buttons = [];
  for (let i = min; i <= max; i += step) {
    buttons.push(
      <ScoreButton
        key={i}
        value={i}
        selected={value === i}
        onPress={() => onChange(i)}
      />
    );
  }
  return <ButtonGrid>{buttons}</ButtonGrid>;
};
```

### 7. NavigationControls
**Purpose**: Consistent navigation between competitors

```typescript
interface NavigationControlsProps {
  currentIndex: number;
  totalCount: number;
  onPrevious: () => void;
  onNext: () => void;
  onSave: () => void;
  canSave?: boolean;
  previousLabel?: string;
  nextLabel?: string;
}
```

### 8. QuickActions
**Purpose**: Common judge actions (absent, DQ, etc.)

```typescript
interface QuickActionsProps {
  onAbsent?: () => void;
  onExcused?: () => void;
  onDisqualify?: () => void;
  onMoveUp?: () => void;
  status?: 'normal' | 'absent' | 'excused' | 'disqualified';
}
```

---

## Shared Hooks

### useScoring
```typescript
export function useScoring(classId: string) {
  const [scores, setScores] = useState<Map<string, Score>>();
  const [currentEntry, setCurrentEntry] = useState<Entry>();
  const [isDirty, setIsDirty] = useState(false);
  
  const updateScore = useCallback((exerciseId: string, points: number) => {
    setScores(prev => {
      const updated = new Map(prev);
      updated.set(exerciseId, { exerciseId, points });
      return updated;
    });
    setIsDirty(true);
  }, []);
  
  const saveScore = useCallback(async () => {
    if (!currentEntry || !isDirty) return;
    
    await api.submitScore({
      entryId: currentEntry.id,
      scores: Array.from(scores.values())
    });
    
    setIsDirty(false);
  }, [currentEntry, scores, isDirty]);
  
  return {
    scores,
    currentEntry,
    isDirty,
    updateScore,
    saveScore
  };
}
```

### useOfflineQueue
```typescript
export function useOfflineQueue() {
  const [queue, setQueue] = useState<OfflineScore[]>([]);
  const [isOnline, setIsOnline] = useState(true);
  
  useEffect(() => {
    // Platform-specific network detection
    const unsubscribe = NetInfo.addEventListener(state => {
      setIsOnline(state.isConnected);
    });
    
    return unsubscribe;
  }, []);
  
  const addToQueue = useCallback(async (score: Score) => {
    if (isOnline) {
      return api.submitScore(score);
    }
    
    const offlineScore = {
      ...score,
      id: uuid(),
      synced: false,
      createdAt: new Date()
    };
    
    await db.offlineScores.add(offlineScore);
    setQueue(prev => [...prev, offlineScore]);
  }, [isOnline]);
  
  const syncQueue = useCallback(async () => {
    if (!isOnline || queue.length === 0) return;
    
    for (const score of queue) {
      try {
        await api.submitScore(score);
        await db.offlineScores.delete(score.id);
        setQueue(prev => prev.filter(s => s.id !== score.id));
      } catch (error) {
        console.error('Sync failed for score:', score.id, error);
      }
    }
  }, [queue, isOnline]);
  
  return {
    queue,
    isOnline,
    addToQueue,
    syncQueue,
    pendingCount: queue.length
  };
}
```

### useJudgeSession
```typescript
export function useJudgeSession() {
  const [session, setSession] = useState<JudgeSession>();
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  
  const startSession = useCallback(async (classId: string) => {
    const newSession = await api.startJudgingSession(classId);
    setSession(newSession);
    
    // Track session locally
    await db.sessions.add(newSession);
  }, []);
  
  const endSession = useCallback(async () => {
    if (!session) return;
    
    await api.endJudgingSession(session.id);
    await db.sessions.update(session.id, { status: 'completed' });
    setSession(undefined);
  }, [session]);
  
  return {
    session,
    assignments,
    startSession,
    endSession,
    isActive: session?.status === 'active'
  };
}
```

---

## Style System

### Shared Design Tokens
```typescript
// tokens.ts - Shared between platforms
export const tokens = {
  colors: {
    primary: '#007AFF',
    success: '#34C759',
    warning: '#FF9500',
    danger: '#FF3B30',
    background: '#F2F2F7',
    surface: '#FFFFFF',
    text: '#000000',
    textSecondary: '#8E8E93',
    border: '#C6C6C8'
  },
  spacing: {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32
  },
  typography: {
    h1: { size: 32, weight: 'bold' },
    h2: { size: 24, weight: 'semibold' },
    h3: { size: 20, weight: 'semibold' },
    body: { size: 16, weight: 'normal' },
    caption: { size: 14, weight: 'normal' }
  },
  borderRadius: {
    sm: 4,
    md: 8,
    lg: 12,
    full: 9999
  }
};
```

### Platform-Specific Styles
```typescript
// Web styles (styles.ts)
export const createStyles = () => ({
  card: {
    backgroundColor: tokens.colors.surface,
    borderRadius: tokens.borderRadius.md,
    padding: tokens.spacing.md,
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
  }
});

// Mobile styles (styles.native.ts)
import { StyleSheet } from 'react-native';

export const createStyles = () => StyleSheet.create({
  card: {
    backgroundColor: tokens.colors.surface,
    borderRadius: tokens.borderRadius.md,
    padding: tokens.spacing.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3
  }
});
```

---

## Component Wrapper Pattern

### Cross-Platform Component Structure
```typescript
// ComponentName/index.tsx - Shared logic
export { useComponentLogic } from './useComponentLogic';
export { ComponentProps } from './types';

// ComponentName/Component.web.tsx - Web implementation
import { useComponentLogic } from './useComponentLogic';
export const Component: React.FC<ComponentProps> = (props) => {
  const logic = useComponentLogic(props);
  return <div>{/* Web rendering */}</div>;
};

// ComponentName/Component.native.tsx - Mobile implementation
import { useComponentLogic } from './useComponentLogic';
import { View } from 'react-native';
export const Component: React.FC<ComponentProps> = (props) => {
  const logic = useComponentLogic(props);
  return <View>{/* Mobile rendering */}</View>;
};

// ComponentName/index.ts - Platform detection
import { Platform } from 'react-native';
export const Component = Platform.OS === 'web' 
  ? require('./Component.web').Component
  : require('./Component.native').Component;
```

---

## Testing Strategy

### Shared Component Tests
```typescript
// __tests__/ScoringGrid.test.tsx
describe('ScoringGrid', () => {
  const mockExercises = [
    { id: '1', name: 'Heeling', maxPoints: 40 },
    { id: '2', name: 'Recall', maxPoints: 30 }
  ];
  
  it('should render all exercises', () => {
    const { getByText } = render(
      <ScoringGrid exercises={mockExercises} />
    );
    
    expect(getByText('Heeling')).toBeTruthy();
    expect(getByText('Recall')).toBeTruthy();
  });
  
  it('should call onScoreChange when score selected', () => {
    const onChange = jest.fn();
    const { getByTestId } = render(
      <ScoringGrid 
        exercises={mockExercises}
        onScoreChange={onChange}
      />
    );
    
    fireEvent.press(getByTestId('score-button-35'));
    expect(onChange).toHaveBeenCalledWith('1', 35);
  });
});
```

---

## Documentation Pattern

Each shared component should have:
1. **TypeScript interface** defining props
2. **Usage examples** for both platforms
3. **Visual mockup** or screenshot
4. **Test coverage** requirements
5. **Accessibility** considerations

---

Last Updated: 2025-08-12
Version: 1.0.0