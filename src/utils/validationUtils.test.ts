/**
 * Unit Tests for Validation Utilities
 */

import { shouldCheckCompletion } from './validationUtils';

describe('shouldCheckCompletion', () => {
  // Suppress console.log during tests
  let consoleLogSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
  });

  afterEach(() => {
    consoleLogSpy.mockRestore();
  });

  describe('First dog scored', () => {
    test('should return true when first dog is scored (1 of any total)', () => {
      expect(shouldCheckCompletion(1, 10)).toBe(true);
      expect(shouldCheckCompletion(1, 1)).toBe(true); // Edge case: only 1 dog total
      expect(shouldCheckCompletion(1, 100)).toBe(true);
    });

    test('should log "First dog scored" message when logging enabled', () => {
      shouldCheckCompletion(1, 15, true);
      expect(consoleLogSpy).toHaveBeenCalledWith(
        '✅ First dog scored - checking to mark class as in_progress'
      );
    });

    test('should not log when logging is disabled', () => {
      shouldCheckCompletion(1, 15, false);
      expect(consoleLogSpy).not.toHaveBeenCalled();
    });
  });

  describe('Last dog scored', () => {
    test('should return true when all dogs are scored', () => {
      expect(shouldCheckCompletion(10, 10)).toBe(true);
      expect(shouldCheckCompletion(1, 1)).toBe(true); // Edge case: only 1 dog
      expect(shouldCheckCompletion(50, 50)).toBe(true);
    });

    test('should log "All dogs scored" message when logging enabled', () => {
      shouldCheckCompletion(15, 15, true);
      expect(consoleLogSpy).toHaveBeenCalledWith(
        '✅ All dogs scored - checking to mark class as completed'
      );
    });

    test('should not log when logging is disabled', () => {
      shouldCheckCompletion(10, 10, false);
      expect(consoleLogSpy).not.toHaveBeenCalled();
    });
  });

  describe('Middle dogs scored (optimization skip)', () => {
    test('should return false for any middle dog', () => {
      expect(shouldCheckCompletion(2, 10)).toBe(false);
      expect(shouldCheckCompletion(5, 10)).toBe(false);
      expect(shouldCheckCompletion(9, 10)).toBe(false);
    });

    test('should return false even if close to completion', () => {
      expect(shouldCheckCompletion(9, 10)).toBe(false); // One away from done
      expect(shouldCheckCompletion(14, 15)).toBe(false); // One away from done
      expect(shouldCheckCompletion(99, 100)).toBe(false); // One away from done
    });

    test('should log "Skipping completion check" message when logging enabled', () => {
      shouldCheckCompletion(5, 10, true);
      expect(consoleLogSpy).toHaveBeenCalledWith(
        '⏭️ Skipping completion check (5/10 - not first or last)'
      );
    });

    test('should not log when logging is disabled', () => {
      shouldCheckCompletion(5, 10, false);
      expect(consoleLogSpy).not.toHaveBeenCalled();
    });
  });

  describe('Edge cases', () => {
    test('should handle zero scored (should skip)', () => {
      expect(shouldCheckCompletion(0, 10)).toBe(false);
    });

    test('should handle class with only 1 dog total', () => {
      // When 1 dog total, first and last are the same
      expect(shouldCheckCompletion(1, 1)).toBe(true);
    });

    test('should handle class with 2 dogs', () => {
      expect(shouldCheckCompletion(1, 2)).toBe(true); // First
      expect(shouldCheckCompletion(2, 2)).toBe(true); // Last
    });

    test('should handle large classes', () => {
      expect(shouldCheckCompletion(1, 200)).toBe(true); // First
      expect(shouldCheckCompletion(100, 200)).toBe(false); // Middle
      expect(shouldCheckCompletion(200, 200)).toBe(true); // Last
    });
  });

  describe('Logging parameter', () => {
    test('should default to logging enabled', () => {
      shouldCheckCompletion(1, 10);
      expect(consoleLogSpy).toHaveBeenCalled();
    });

    test('should support explicit true for logging', () => {
      shouldCheckCompletion(1, 10, true);
      expect(consoleLogSpy).toHaveBeenCalled();
    });

    test('should support explicit false for logging', () => {
      shouldCheckCompletion(1, 10, false);
      expect(consoleLogSpy).not.toHaveBeenCalled();
    });
  });

  describe('Real-world scenarios', () => {
    test('typical class flow: 10 dogs', () => {
      // First dog
      expect(shouldCheckCompletion(1, 10)).toBe(true);

      // Middle dogs (optimization - skip these)
      for (let i = 2; i < 10; i++) {
        expect(shouldCheckCompletion(i, 10)).toBe(false);
      }

      // Last dog
      expect(shouldCheckCompletion(10, 10)).toBe(true);
    });

    test('small class: 3 dogs', () => {
      expect(shouldCheckCompletion(1, 3)).toBe(true); // First
      expect(shouldCheckCompletion(2, 3)).toBe(false); // Middle (skip)
      expect(shouldCheckCompletion(3, 3)).toBe(true); // Last
    });
  });
});
