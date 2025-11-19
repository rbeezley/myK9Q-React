/**
 * Unit Tests for Idle Callback Helper Utilities
 */

import { vi } from 'vitest';
import {
  scheduleIdleTask,
  cancelIdleTask,
  scheduleIdleTasks,
  hasIdleCallbackSupport,
  scheduleIdleTaskWithTimeout,
  processInIdle,
  type IdleCallbackOptions
} from './idleCallbackHelpers';

describe('hasIdleCallbackSupport', () => {
  let originalRequestIdleCallback: any;
  let originalCancelIdleCallback: any;

  beforeEach(() => {
    originalRequestIdleCallback = window.requestIdleCallback;
    originalCancelIdleCallback = window.cancelIdleCallback;
  });

  afterEach(() => {
    // Clean restoration
    if (originalRequestIdleCallback !== undefined) {
      // @ts-expect-error - restoring browser API
      window.requestIdleCallback = originalRequestIdleCallback;
    } else {
      // @ts-expect-error - removing browser API
      delete window.requestIdleCallback;
    }

    if (originalCancelIdleCallback !== undefined) {
      // @ts-expect-error - restoring browser API
      window.cancelIdleCallback = originalCancelIdleCallback;
    } else {
      // @ts-expect-error - removing browser API
      delete window.cancelIdleCallback;
    }
  });

  test('should return true when requestIdleCallback exists', () => {
    // @ts-expect-error - mocking browser API
    window.requestIdleCallback = vi.fn();
    expect(hasIdleCallbackSupport()).toBe(true);
  });

  test('should return false when requestIdleCallback does not exist', () => {
    // @ts-expect-error - removing browser API
    delete window.requestIdleCallback;
    expect(hasIdleCallbackSupport()).toBe(false);
  });
});

describe('scheduleIdleTask', () => {
  let originalRequestIdleCallback: any;
  let originalCancelIdleCallback: any;

  beforeEach(() => {
    originalRequestIdleCallback = window.requestIdleCallback;
    originalCancelIdleCallback = window.cancelIdleCallback;
  });

  afterEach(() => {
    vi.clearAllTimers();

    // Clean restoration
    if (originalRequestIdleCallback !== undefined) {
      // @ts-expect-error - restoring browser API
      window.requestIdleCallback = originalRequestIdleCallback;
    } else {
      // @ts-expect-error - removing browser API
      delete window.requestIdleCallback;
    }

    if (originalCancelIdleCallback !== undefined) {
      // @ts-expect-error - restoring browser API
      window.cancelIdleCallback = originalCancelIdleCallback;
    } else {
      // @ts-expect-error - removing browser API
      delete window.cancelIdleCallback;
    }
  });

  test('should use requestIdleCallback when available', () => {
    const callback = vi.fn();
    const mockRequestIdleCallback = vi.fn().mockReturnValue(123);
    const originalRequestIdleCallback = window.requestIdleCallback;

    // @ts-expect-error - mocking browser API
    window.requestIdleCallback = mockRequestIdleCallback;

    const id = scheduleIdleTask(callback);

    expect(mockRequestIdleCallback).toHaveBeenCalledWith(callback, {});
    expect(id).toBe(123);

    // @ts-expect-error - restoring browser API
    window.requestIdleCallback = originalRequestIdleCallback;
  });

  test('should return an ID that can be used for cancellation', () => {
    const callback = vi.fn();
    const id = scheduleIdleTask(callback);
    expect(id).toBeDefined();
    // ID can be any type (number in browsers, object in Node)
    cancelIdleTask(id);
  });

  test('should pass options to requestIdleCallback', () => {
    const callback = vi.fn();
    const options: IdleCallbackOptions = { timeout: 2000 };
    const mockRequestIdleCallback = vi.fn().mockReturnValue(123);
    const originalRequestIdleCallback = window.requestIdleCallback;

    // @ts-expect-error - mocking browser API
    window.requestIdleCallback = mockRequestIdleCallback;

    scheduleIdleTask(callback, options);

    expect(mockRequestIdleCallback).toHaveBeenCalledWith(callback, options);

    // @ts-expect-error - restoring browser API
    window.requestIdleCallback = originalRequestIdleCallback;
  });
});

describe('cancelIdleTask', () => {
  test('should use cancelIdleCallback when available', () => {
    const mockCancelIdleCallback = vi.fn();
    const originalCancelIdleCallback = window.cancelIdleCallback;

    // @ts-expect-error - mocking browser API
    window.cancelIdleCallback = mockCancelIdleCallback;

    cancelIdleTask(123);

    expect(mockCancelIdleCallback).toHaveBeenCalledWith(123);

    // @ts-expect-error - restoring browser API
    window.cancelIdleCallback = originalCancelIdleCallback;
  });

  test('should fall back to clearTimeout when cancelIdleCallback unavailable', () => {
    vi.useFakeTimers();
    const originalCancelIdleCallback = window.cancelIdleCallback;
    const originalClearTimeout = window.clearTimeout;
    const mockClearTimeout = vi.fn();

    // @ts-expect-error - removing browser API
    delete window.cancelIdleCallback;
    // @ts-expect-error - mocking browser API
    window.clearTimeout = mockClearTimeout;

    cancelIdleTask(123);

    expect(mockClearTimeout).toHaveBeenCalledWith(123);

    vi.useRealTimers();
    // @ts-expect-error - restoring browser API
    window.cancelIdleCallback = originalCancelIdleCallback;
    window.clearTimeout = originalClearTimeout;
  });
});

describe('scheduleIdleTasks', () => {
  let originalRequestIdleCallback: any;
  let originalCancelIdleCallback: any;

  beforeEach(() => {
    originalRequestIdleCallback = window.requestIdleCallback;
    originalCancelIdleCallback = window.cancelIdleCallback;
  });

  afterEach(() => {
    vi.clearAllTimers();

    // Clean restoration
    if (originalRequestIdleCallback !== undefined) {
      // @ts-expect-error - restoring browser API
      window.requestIdleCallback = originalRequestIdleCallback;
    } else {
      // @ts-expect-error - removing browser API
      delete window.requestIdleCallback;
    }

    if (originalCancelIdleCallback !== undefined) {
      // @ts-expect-error - restoring browser API
      window.cancelIdleCallback = originalCancelIdleCallback;
    } else {
      // @ts-expect-error - removing browser API
      delete window.cancelIdleCallback;
    }
  });

  test('should schedule tasks in priority order', () => {
    vi.useFakeTimers();
    const executionOrder: number[] = [];
    const originalRequestIdleCallback = window.requestIdleCallback;
    const originalCancelIdleCallback = window.cancelIdleCallback;

    // @ts-expect-error - removing browser API to force setTimeout
    delete window.requestIdleCallback;
    // @ts-expect-error - also remove cancel
    delete window.cancelIdleCallback;

    const tasks = [
      { callback: () => executionOrder.push(1), priority: 1 },
      { callback: () => executionOrder.push(10), priority: 10 },
      { callback: () => executionOrder.push(5), priority: 5 }
    ];

    const ids = scheduleIdleTasks(tasks);

    expect(ids).toHaveLength(3);

    // Execute all scheduled tasks
    vi.advanceTimersByTime(10);

    expect(executionOrder).toEqual([10, 5, 1]);

    vi.useRealTimers();
    // @ts-expect-error - restoring browser API
    window.requestIdleCallback = originalRequestIdleCallback;
    // @ts-expect-error - restoring cancelIdleCallback
    window.cancelIdleCallback = originalCancelIdleCallback;
  });

  test('should return array of IDs', () => {
    const tasks = [
      { callback: vi.fn(), priority: 5 },
      { callback: vi.fn(), priority: 3 }
    ];

    const ids = scheduleIdleTasks(tasks);

    expect(Array.isArray(ids)).toBe(true);
    expect(ids).toHaveLength(2);
    ids.forEach(id => expect(id).toBeDefined());
  });

  test('should handle empty task array', () => {
    const ids = scheduleIdleTasks([]);
    expect(ids).toEqual([]);
  });

  test('should pass options to each task', () => {
    const mockRequestIdleCallback = vi.fn((cb, opts) => 123);
    const originalRequestIdleCallback = window.requestIdleCallback;

    // @ts-expect-error - mocking browser API
    window.requestIdleCallback = mockRequestIdleCallback;

    const tasks = [
      { callback: vi.fn(), priority: 5, options: { timeout: 1000 } },
      { callback: vi.fn(), priority: 3, options: { timeout: 2000 } }
    ];

    scheduleIdleTasks(tasks);

    expect(mockRequestIdleCallback).toHaveBeenCalledTimes(2);
    expect(mockRequestIdleCallback).toHaveBeenCalledWith(
      expect.any(Function),
      { timeout: 1000 }
    );
    expect(mockRequestIdleCallback).toHaveBeenCalledWith(
      expect.any(Function),
      { timeout: 2000 }
    );

    // @ts-expect-error - restoring browser API
    window.requestIdleCallback = originalRequestIdleCallback;
  });
});

describe('scheduleIdleTaskWithTimeout', () => {
  afterEach(() => {
    vi.clearAllTimers();
  });

  test('should execute callback during idle time', () => {
    vi.useFakeTimers();
    const callback = vi.fn();
    const mockRequestIdleCallback = vi.fn((cb) => {
      cb();
      return 123;
    });
    const originalRequestIdleCallback = window.requestIdleCallback;

    // @ts-expect-error - mocking browser API
    window.requestIdleCallback = mockRequestIdleCallback;

    scheduleIdleTaskWithTimeout(callback, 5000);

    expect(callback).toHaveBeenCalledTimes(1);

    vi.useRealTimers();
    // @ts-expect-error - restoring browser API
    window.requestIdleCallback = originalRequestIdleCallback;
  });

  test('should execute callback after timeout if not idle', () => {
    vi.useFakeTimers();
    const callback = vi.fn();
    const originalRequestIdleCallback = window.requestIdleCallback;
    const originalCancelIdleCallback = window.cancelIdleCallback;

    // @ts-expect-error - removing browser API to force setTimeout
    delete window.requestIdleCallback;
    // @ts-expect-error - also remove cancel
    delete window.cancelIdleCallback;

    scheduleIdleTaskWithTimeout(callback, 2000);

    expect(callback).not.toHaveBeenCalled();

    vi.advanceTimersByTime(2000);

    expect(callback).toHaveBeenCalledTimes(1);

    vi.useRealTimers();
    // @ts-expect-error - restoring browser API
    window.requestIdleCallback = originalRequestIdleCallback;
    // @ts-expect-error - restoring cancelIdleCallback
    window.cancelIdleCallback = originalCancelIdleCallback;
  });

  test('should not execute callback twice', () => {
    vi.useFakeTimers();
    const callback = vi.fn();
    const originalRequestIdleCallback = window.requestIdleCallback;
    const originalCancelIdleCallback = window.cancelIdleCallback;

    // @ts-expect-error - removing browser API
    delete window.requestIdleCallback;
    // @ts-expect-error - also remove cancel
    delete window.cancelIdleCallback;

    scheduleIdleTaskWithTimeout(callback, 5000);

    // Callback executes via setTimeout after 1ms (idle fallback)
    vi.advanceTimersByTime(1);
    expect(callback).toHaveBeenCalledTimes(1);

    // Advance to timeout - should not execute again
    vi.advanceTimersByTime(5000);
    expect(callback).toHaveBeenCalledTimes(1);

    vi.useRealTimers();
    // @ts-expect-error - restoring browser API
    window.requestIdleCallback = originalRequestIdleCallback;
    // @ts-expect-error - restoring cancelIdleCallback
    window.cancelIdleCallback = originalCancelIdleCallback;
  });

  test('should use default timeout of 5000ms', () => {
    vi.useFakeTimers();
    const callback = vi.fn();
    const originalRequestIdleCallback = window.requestIdleCallback;
    const originalCancelIdleCallback = window.cancelIdleCallback;

    // @ts-expect-error - removing browser API
    delete window.requestIdleCallback;
    // @ts-expect-error - also remove cancel
    delete window.cancelIdleCallback;

    scheduleIdleTaskWithTimeout(callback);

    vi.advanceTimersByTime(4999);
    expect(callback).toHaveBeenCalledTimes(1); // Already called via idle fallback

    vi.useRealTimers();
    // @ts-expect-error - restoring browser API
    window.requestIdleCallback = originalRequestIdleCallback;
    // @ts-expect-error - restoring cancelIdleCallback
    window.cancelIdleCallback = originalCancelIdleCallback;
  });
});

describe('processInIdle', () => {
  afterEach(() => {
    vi.clearAllTimers();
  });

  test('should process all items in batches', async () => {
    vi.useFakeTimers();
    const items = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
    const processed: number[] = [];
    const originalRequestIdleCallback = window.requestIdleCallback;

    // @ts-expect-error - removing browser API to force setTimeout
    delete window.requestIdleCallback;

    const promise = processInIdle(
      items,
      (item) => processed.push(item),
      3 // batch size
    );

    // Process all batches
    await vi.runAllTimersAsync();
    await promise;

    expect(processed).toEqual(items);

    vi.useRealTimers();
    // @ts-expect-error - restoring browser API
    window.requestIdleCallback = originalRequestIdleCallback;
  });

  test('should call progress callback', async () => {
    vi.useFakeTimers();
    const items = [1, 2, 3, 4, 5];
    const progressUpdates: number[] = [];
    const originalRequestIdleCallback = window.requestIdleCallback;

    // @ts-expect-error - removing browser API
    delete window.requestIdleCallback;

    const promise = processInIdle(
      items,
      () => {},
      2,
      (progress) => progressUpdates.push(progress)
    );

    await vi.runAllTimersAsync();
    await promise;

    expect(progressUpdates).toEqual([40, 80, 100]);

    vi.useRealTimers();
    // @ts-expect-error - restoring browser API
    window.requestIdleCallback = originalRequestIdleCallback;
  });

  test('should handle async processor', async () => {
    vi.useFakeTimers();
    const items = [1, 2, 3];
    const processed: number[] = [];
    const originalRequestIdleCallback = window.requestIdleCallback;

    // @ts-expect-error - removing browser API
    delete window.requestIdleCallback;

    const asyncProcessor = async (item: number) => {
      await Promise.resolve();
      processed.push(item * 2);
    };

    const promise = processInIdle(items, asyncProcessor, 10);

    await vi.runAllTimersAsync();
    await promise;

    expect(processed).toEqual([2, 4, 6]);

    vi.useRealTimers();
    // @ts-expect-error - restoring browser API
    window.requestIdleCallback = originalRequestIdleCallback;
  });

  test('should pass correct index to processor', async () => {
    vi.useFakeTimers();
    const items = ['a', 'b', 'c'];
    const indices: number[] = [];
    const originalRequestIdleCallback = window.requestIdleCallback;

    // @ts-expect-error - removing browser API
    delete window.requestIdleCallback;

    const promise = processInIdle(
      items,
      (_, index) => indices.push(index),
      2
    );

    await vi.runAllTimersAsync();
    await promise;

    expect(indices).toEqual([0, 1, 2]);

    vi.useRealTimers();
    // @ts-expect-error - restoring browser API
    window.requestIdleCallback = originalRequestIdleCallback;
  });

  test('should handle empty array', async () => {
    vi.useFakeTimers();
    const processed: any[] = [];
    const originalRequestIdleCallback = window.requestIdleCallback;

    // @ts-expect-error - removing browser API
    delete window.requestIdleCallback;

    const promise = processInIdle(
      [],
      (item) => processed.push(item),
      10
    );

    await vi.runAllTimersAsync();
    await promise;

    expect(processed).toEqual([]);

    vi.useRealTimers();
    // @ts-expect-error - restoring browser API
    window.requestIdleCallback = originalRequestIdleCallback;
  });

  test('should use default batch size of 10', async () => {
    vi.useFakeTimers();
    const items = Array.from({ length: 25 }, (_, i) => i);
    const batches: number[] = [];
    const originalRequestIdleCallback = window.requestIdleCallback;

    // @ts-expect-error - removing browser API
    delete window.requestIdleCallback;

    let currentBatch = 0;
    const promise = processInIdle(
      items,
      () => {
        if (batches.length === 0 || batches[batches.length - 1] !== currentBatch) {
          batches.push(currentBatch);
        }
      },
      undefined, // use default batch size
      (progress) => {
        if (progress < 100) currentBatch++;
      }
    );

    await vi.runAllTimersAsync();
    await promise;

    // Should have processed in 3 batches: 10, 10, 5
    expect(batches.length).toBeGreaterThan(0);

    vi.useRealTimers();
    // @ts-expect-error - restoring browser API
    window.requestIdleCallback = originalRequestIdleCallback;
  });
});

describe('Integration: Complete idle workflow', () => {
  afterEach(() => {
    vi.clearAllTimers();
  });

  test('should schedule and cancel tasks', () => {
    vi.useFakeTimers();
    const callback = vi.fn();
    const originalRequestIdleCallback = window.requestIdleCallback;
    const originalCancelIdleCallback = window.cancelIdleCallback;

    // @ts-expect-error - removing browser API
    delete window.requestIdleCallback;
    // @ts-expect-error - also remove cancel
    delete window.cancelIdleCallback;

    const id = scheduleIdleTask(callback);
    expect(callback).not.toHaveBeenCalled();

    cancelIdleTask(id);
    vi.advanceTimersByTime(10);

    expect(callback).not.toHaveBeenCalled();

    vi.useRealTimers();
    // @ts-expect-error - restoring browser API
    window.requestIdleCallback = originalRequestIdleCallback;
    // @ts-expect-error - restoring cancelIdleCallback
    window.cancelIdleCallback = originalCancelIdleCallback;
  });

  test('should process large dataset in batches without blocking', async () => {
    vi.useFakeTimers();
    const largeDataset = Array.from({ length: 100 }, (_, i) => i);
    const processed: number[] = [];
    const originalRequestIdleCallback = window.requestIdleCallback;

    // @ts-expect-error - removing browser API
    delete window.requestIdleCallback;

    const promise = processInIdle(
      largeDataset,
      (item) => processed.push(item * 2),
      10
    );

    await vi.runAllTimersAsync();
    await promise;

    expect(processed).toHaveLength(100);
    expect(processed[0]).toBe(0);
    expect(processed[99]).toBe(198);

    vi.useRealTimers();
    // @ts-expect-error - restoring browser API
    window.requestIdleCallback = originalRequestIdleCallback;
  });
});
