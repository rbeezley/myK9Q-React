import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  subscribeToEntryUpdates,
  createSubscriptionKey,
  createClassFilter,
  RealtimePayload,
} from './entrySubscriptions';
import { syncManager } from '../syncManager';

// Mock syncManager
vi.mock('../syncManager', () => ({
  syncManager: {
    subscribeToUpdates: vi.fn(),
    unsubscribe: vi.fn(),
  },
}));

describe('entrySubscriptions', () => {
  const mockClassId = 123;
  const mockLicenseKey = 'test-license-key';

  beforeEach(() => {
    vi.clearAllMocks();
    // Silence console logs in tests
    vi.spyOn(console, 'log').mockImplementation(() => {});
  });

  describe('subscribeToEntryUpdates', () => {
    it('should create subscription with correct parameters', () => {
      // Arrange
      const onUpdate = vi.fn();

      // Act
      subscribeToEntryUpdates(mockClassId, mockLicenseKey, onUpdate);

      // Assert
      expect(syncManager.subscribeToUpdates).toHaveBeenCalledWith(
        'entries:123',
        'entries',
        'class_id=eq.123',
        expect.any(Function)
      );
    });

    it('should invoke callback when payload is received', () => {
      // Arrange
      const onUpdate = vi.fn();
      let payloadHandler: ((payload: RealtimePayload) => void) | undefined;

      vi.mocked(syncManager.subscribeToUpdates).mockImplementation(
        (_key, _table, _filter, handler) => {
          payloadHandler = handler;
        }
      );

      const mockPayload: RealtimePayload = {
        eventType: 'UPDATE',
        table: 'entries',
        schema: 'public',
        new: { id: 1, armband: 5, in_ring: true },
        old: { id: 1, armband: 5, in_ring: false },
      };

      // Act
      subscribeToEntryUpdates(mockClassId, mockLicenseKey, onUpdate);
      payloadHandler?.(mockPayload);

      // Assert
      expect(onUpdate).toHaveBeenCalledWith(mockPayload);
    });

    it('should return unsubscribe function', () => {
      // Arrange
      const onUpdate = vi.fn();

      // Act
      const unsubscribe = subscribeToEntryUpdates(mockClassId, mockLicenseKey, onUpdate);

      // Assert
      expect(unsubscribe).toBeInstanceOf(Function);
    });

    it('should unsubscribe when unsubscribe function is called', () => {
      // Arrange
      const onUpdate = vi.fn();

      // Act
      const unsubscribe = subscribeToEntryUpdates(mockClassId, mockLicenseKey, onUpdate);
      unsubscribe();

      // Assert
      expect(syncManager.unsubscribe).toHaveBeenCalledWith('entries:123');
    });

    it('should log subscription setup information', () => {
      // Arrange
      const consoleSpy = vi.spyOn(console, 'log');
      const onUpdate = vi.fn();

      // Act
      subscribeToEntryUpdates(mockClassId, mockLicenseKey, onUpdate);

      // Assert
      expect(consoleSpy).toHaveBeenCalledWith(
        '🔌 Setting up subscription via syncManager for class_id:',
        mockClassId
      );
      expect(consoleSpy).toHaveBeenCalledWith(
        '🔍 Using correct column name: class_id (matching the main query)'
      );
    });

    it('should log unsubscribe information', () => {
      // Arrange
      const consoleSpy = vi.spyOn(console, 'log');
      const onUpdate = vi.fn();

      // Act
      const unsubscribe = subscribeToEntryUpdates(mockClassId, mockLicenseKey, onUpdate);
      unsubscribe();

      // Assert
      expect(consoleSpy).toHaveBeenCalledWith(
        '🔌 Unsubscribing from real-time updates for class_id',
        mockClassId
      );
    });
  });

  describe('payload processing', () => {
    it('should log detailed payload information on UPDATE events', () => {
      // Arrange
      const consoleSpy = vi.spyOn(console, 'log');
      const onUpdate = vi.fn();
      let payloadHandler: ((payload: RealtimePayload) => void) | undefined;

      vi.mocked(syncManager.subscribeToUpdates).mockImplementation(
        (_key, _table, _filter, handler) => {
          payloadHandler = handler;
        }
      );

      const mockPayload: RealtimePayload = {
        eventType: 'UPDATE',
        table: 'entries',
        schema: 'public',
        new: { id: 1, armband: 5, in_ring: true, class_id: mockClassId },
        old: { id: 1, armband: 5, in_ring: false, class_id: mockClassId },
      };

      // Act
      subscribeToEntryUpdates(mockClassId, mockLicenseKey, onUpdate);
      payloadHandler?.(mockPayload);

      // Assert
      expect(consoleSpy).toHaveBeenCalledWith('🚨🚨🚨 REAL-TIME PAYLOAD RECEIVED 🚨🚨🚨');
      expect(consoleSpy).toHaveBeenCalledWith('🔄 Event type:', 'UPDATE');
      expect(consoleSpy).toHaveBeenCalledWith('🔄 Table:', 'entries');
      expect(consoleSpy).toHaveBeenCalledWith('🔄 Schema:', 'public');
    });

    it('should detect and log in_ring status changes', () => {
      // Arrange
      const consoleSpy = vi.spyOn(console, 'log');
      const onUpdate = vi.fn();
      let payloadHandler: ((payload: RealtimePayload) => void) | undefined;

      vi.mocked(syncManager.subscribeToUpdates).mockImplementation(
        (_key, _table, _filter, handler) => {
          payloadHandler = handler;
        }
      );

      const mockPayload: RealtimePayload = {
        eventType: 'UPDATE',
        table: 'entries',
        schema: 'public',
        new: { id: 1, armband: 5, in_ring: true, class_id: mockClassId },
        old: { id: 1, armband: 5, in_ring: false, class_id: mockClassId },
      };

      // Act
      subscribeToEntryUpdates(mockClassId, mockLicenseKey, onUpdate);
      payloadHandler?.(mockPayload);

      // Assert
      expect(consoleSpy).toHaveBeenCalledWith('🎯 THIS IS AN IN_RING STATUS CHANGE!');
      expect(consoleSpy).toHaveBeenCalledWith('  Dog #5 (ID: 1) is now IN RING');
    });

    it('should handle in_ring status change from true to false', () => {
      // Arrange
      const consoleSpy = vi.spyOn(console, 'log');
      const onUpdate = vi.fn();
      let payloadHandler: ((payload: RealtimePayload) => void) | undefined;

      vi.mocked(syncManager.subscribeToUpdates).mockImplementation(
        (_key, _table, _filter, handler) => {
          payloadHandler = handler;
        }
      );

      const mockPayload: RealtimePayload = {
        eventType: 'UPDATE',
        table: 'entries',
        schema: 'public',
        new: { id: 1, armband: 5, in_ring: false, class_id: mockClassId },
        old: { id: 1, armband: 5, in_ring: true, class_id: mockClassId },
      };

      // Act
      subscribeToEntryUpdates(mockClassId, mockLicenseKey, onUpdate);
      payloadHandler?.(mockPayload);

      // Assert
      expect(consoleSpy).toHaveBeenCalledWith('🎯 THIS IS AN IN_RING STATUS CHANGE!');
      expect(consoleSpy).toHaveBeenCalledWith('  Dog #5 (ID: 1) is now NOT IN RING');
    });

    it('should log NEW record data for INSERT events', () => {
      // Arrange
      const consoleSpy = vi.spyOn(console, 'log');
      const onUpdate = vi.fn();
      let payloadHandler: ((payload: RealtimePayload) => void) | undefined;

      vi.mocked(syncManager.subscribeToUpdates).mockImplementation(
        (_key, _table, _filter, handler) => {
          payloadHandler = handler;
        }
      );

      const mockPayload: RealtimePayload = {
        eventType: 'INSERT',
        table: 'entries',
        schema: 'public',
        new: { id: 1, armband: 5, class_id: mockClassId },
      };

      // Act
      subscribeToEntryUpdates(mockClassId, mockLicenseKey, onUpdate);
      payloadHandler?.(mockPayload);

      // Assert
      expect(consoleSpy).toHaveBeenCalledWith(
        '📈 NEW record data:',
        expect.stringContaining('"id": 1')
      );
    });

    it('should log OLD record data for DELETE events', () => {
      // Arrange
      const consoleSpy = vi.spyOn(console, 'log');
      const onUpdate = vi.fn();
      let payloadHandler: ((payload: RealtimePayload) => void) | undefined;

      vi.mocked(syncManager.subscribeToUpdates).mockImplementation(
        (_key, _table, _filter, handler) => {
          payloadHandler = handler;
        }
      );

      const mockPayload: RealtimePayload = {
        eventType: 'DELETE',
        table: 'entries',
        schema: 'public',
        old: { id: 1, armband: 5, class_id: mockClassId },
      };

      // Act
      subscribeToEntryUpdates(mockClassId, mockLicenseKey, onUpdate);
      payloadHandler?.(mockPayload);

      // Assert
      expect(consoleSpy).toHaveBeenCalledWith(
        '📉 OLD record data:',
        expect.stringContaining('"id": 1')
      );
    });

    it('should log completion of callback invocation', () => {
      // Arrange
      const consoleSpy = vi.spyOn(console, 'log');
      const onUpdate = vi.fn();
      let payloadHandler: ((payload: RealtimePayload) => void) | undefined;

      vi.mocked(syncManager.subscribeToUpdates).mockImplementation(
        (_key, _table, _filter, handler) => {
          payloadHandler = handler;
        }
      );

      const mockPayload: RealtimePayload = {
        eventType: 'UPDATE',
        table: 'entries',
        schema: 'public',
        new: { id: 1 },
        old: { id: 1 },
      };

      // Act
      subscribeToEntryUpdates(mockClassId, mockLicenseKey, onUpdate);
      payloadHandler?.(mockPayload);

      // Assert
      expect(consoleSpy).toHaveBeenCalledWith('✅ About to call onUpdate callback...');
      expect(consoleSpy).toHaveBeenCalledWith('✅ onUpdate callback completed');
      expect(consoleSpy).toHaveBeenCalledWith('🚨🚨🚨 END REAL-TIME PAYLOAD PROCESSING 🚨🚨🚨');
    });

    it('should not log in_ring change when value is the same', () => {
      // Arrange
      const consoleSpy = vi.spyOn(console, 'log');
      const onUpdate = vi.fn();
      let payloadHandler: ((payload: RealtimePayload) => void) | undefined;

      vi.mocked(syncManager.subscribeToUpdates).mockImplementation(
        (_key, _table, _filter, handler) => {
          payloadHandler = handler;
        }
      );

      const mockPayload: RealtimePayload = {
        eventType: 'UPDATE',
        table: 'entries',
        schema: 'public',
        new: { id: 1, armband: 5, in_ring: true, class_id: mockClassId },
        old: { id: 1, armband: 5, in_ring: true, class_id: mockClassId },
      };

      // Act
      subscribeToEntryUpdates(mockClassId, mockLicenseKey, onUpdate);
      payloadHandler?.(mockPayload);

      // Assert
      expect(consoleSpy).not.toHaveBeenCalledWith('🎯 THIS IS AN IN_RING STATUS CHANGE!');
    });
  });

  describe('helper functions', () => {
    describe('createSubscriptionKey', () => {
      it('should create correct subscription key format', () => {
        // Act
        const key = createSubscriptionKey(123);

        // Assert
        expect(key).toBe('entries:123');
      });

      it('should handle different class IDs', () => {
        // Act & Assert
        expect(createSubscriptionKey(1)).toBe('entries:1');
        expect(createSubscriptionKey(999)).toBe('entries:999');
        expect(createSubscriptionKey(42)).toBe('entries:42');
      });
    });

    describe('createClassFilter', () => {
      it('should create correct PostgREST filter format', () => {
        // Act
        const filter = createClassFilter(123);

        // Assert
        expect(filter).toBe('class_id=eq.123');
      });

      it('should handle different class IDs', () => {
        // Act & Assert
        expect(createClassFilter(1)).toBe('class_id=eq.1');
        expect(createClassFilter(999)).toBe('class_id=eq.999');
        expect(createClassFilter(42)).toBe('class_id=eq.42');
      });
    });
  });

  describe('integration scenarios', () => {
    it('should handle full subscription lifecycle', () => {
      // Arrange
      const onUpdate = vi.fn();
      let payloadHandler: ((payload: RealtimePayload) => void) | undefined;

      vi.mocked(syncManager.subscribeToUpdates).mockImplementation(
        (_key, _table, _filter, handler) => {
          payloadHandler = handler;
        }
      );

      const mockPayload: RealtimePayload = {
        eventType: 'UPDATE',
        table: 'entries',
        schema: 'public',
        new: { id: 1, armband: 5, in_ring: true },
        old: { id: 1, armband: 5, in_ring: false },
      };

      // Act - Subscribe
      const unsubscribe = subscribeToEntryUpdates(mockClassId, mockLicenseKey, onUpdate);

      // Act - Receive payload
      payloadHandler?.(mockPayload);

      // Act - Unsubscribe
      unsubscribe();

      // Assert
      expect(syncManager.subscribeToUpdates).toHaveBeenCalledTimes(1);
      expect(onUpdate).toHaveBeenCalledWith(mockPayload);
      expect(syncManager.unsubscribe).toHaveBeenCalledWith('entries:123');
    });

    it('should handle multiple payloads to same subscription', () => {
      // Arrange
      const onUpdate = vi.fn();
      let payloadHandler: ((payload: RealtimePayload) => void) | undefined;

      vi.mocked(syncManager.subscribeToUpdates).mockImplementation(
        (_key, _table, _filter, handler) => {
          payloadHandler = handler;
        }
      );

      const payload1: RealtimePayload = {
        eventType: 'UPDATE',
        table: 'entries',
        schema: 'public',
        new: { id: 1, armband: 5, in_ring: true },
        old: { id: 1, armband: 5, in_ring: false },
      };

      const payload2: RealtimePayload = {
        eventType: 'UPDATE',
        table: 'entries',
        schema: 'public',
        new: { id: 2, armband: 6, in_ring: true },
        old: { id: 2, armband: 6, in_ring: false },
      };

      // Act
      subscribeToEntryUpdates(mockClassId, mockLicenseKey, onUpdate);
      payloadHandler?.(payload1);
      payloadHandler?.(payload2);

      // Assert
      expect(onUpdate).toHaveBeenCalledTimes(2);
      expect(onUpdate).toHaveBeenNthCalledWith(1, payload1);
      expect(onUpdate).toHaveBeenNthCalledWith(2, payload2);
    });

    it('should handle subscription for different class IDs', () => {
      // Arrange
      const onUpdate1 = vi.fn();
      const onUpdate2 = vi.fn();

      // Act
      subscribeToEntryUpdates(123, mockLicenseKey, onUpdate1);
      subscribeToEntryUpdates(456, mockLicenseKey, onUpdate2);

      // Assert
      expect(syncManager.subscribeToUpdates).toHaveBeenCalledTimes(2);
      expect(syncManager.subscribeToUpdates).toHaveBeenNthCalledWith(
        1,
        'entries:123',
        'entries',
        'class_id=eq.123',
        expect.any(Function)
      );
      expect(syncManager.subscribeToUpdates).toHaveBeenNthCalledWith(
        2,
        'entries:456',
        'entries',
        'class_id=eq.456',
        expect.any(Function)
      );
    });
  });

  describe('RealtimePayload type', () => {
    it('should accept valid INSERT payload', () => {
      // Arrange
      const payload: RealtimePayload = {
        eventType: 'INSERT',
        table: 'entries',
        schema: 'public',
        new: { id: 1, armband: 5 },
      };

      // Assert - TypeScript compilation is the test
      expect(payload.eventType).toBe('INSERT');
    });

    it('should accept valid UPDATE payload', () => {
      // Arrange
      const payload: RealtimePayload = {
        eventType: 'UPDATE',
        table: 'entries',
        schema: 'public',
        new: { id: 1, armband: 5 },
        old: { id: 1, armband: 4 },
      };

      // Assert - TypeScript compilation is the test
      expect(payload.eventType).toBe('UPDATE');
    });

    it('should accept valid DELETE payload', () => {
      // Arrange
      const payload: RealtimePayload = {
        eventType: 'DELETE',
        table: 'entries',
        schema: 'public',
        old: { id: 1, armband: 5 },
      };

      // Assert - TypeScript compilation is the test
      expect(payload.eventType).toBe('DELETE');
    });
  });
});
