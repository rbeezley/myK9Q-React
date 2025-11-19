/**
 * Unit Tests for Area Initialization Utilities
 */

import {
  initializeAreas,
  getExpectedAreaCount,
  hasMultipleAreas,
  getAreaNames,
  validateAreas,
  type AreaScore
} from './areaInitialization';

describe('initializeAreas', () => {
  test('should initialize single area for most elements', () => {
    const areas = initializeAreas('Container', 'Novice', false);
    expect(areas).toHaveLength(1);
    expect(areas[0].areaName).toBe('Container');
    expect(areas[0].time).toBe('');
    expect(areas[0].found).toBe(false);
  });

  test('should initialize 2 areas for Master Handler Discrimination', () => {
    const areas = initializeAreas('Handler Discrimination', 'Master', false);
    expect(areas).toHaveLength(2);
    expect(areas[0].areaName).toContain('Area 1');
    expect(areas[1].areaName).toContain('Area 2');
  });

  test('should handle nationals mode', () => {
    const areas = initializeAreas('Container', 'Novice', true);
    expect(areas).toHaveLength(1);
  });
});

describe('getExpectedAreaCount', () => {
  test('should return correct count for regular shows', () => {
    expect(getExpectedAreaCount('Container', 'Novice', false)).toBe(1);
    expect(getExpectedAreaCount('Handler Discrimination', 'Master', false)).toBe(2);
  });

  test('should return 1 for nationals mode', () => {
    expect(getExpectedAreaCount('Container', 'Master', true)).toBe(1);
  });
});

describe('hasMultipleAreas', () => {
  test('should return false for single area elements', () => {
    expect(hasMultipleAreas('Container', 'Novice', false)).toBe(false);
  });

  test('should return true for Master Handler Discrimination', () => {
    expect(hasMultipleAreas('Handler Discrimination', 'Master', false)).toBe(true);
  });
});

describe('getAreaNames', () => {
  test('should return area names', () => {
    const names = getAreaNames('Container', 'Novice', false);
    expect(names).toHaveLength(1);
    expect(names[0]).toBe('Container');
  });
});

describe('validateAreas', () => {
  test('should validate correct area structure', () => {
    const areas = initializeAreas('Container', 'Novice', false);
    expect(validateAreas(areas, 'Container', 'Novice', false)).toBe(true);
  });

  test('should reject invalid area count', () => {
    const areas: AreaScore[] = [];
    expect(validateAreas(areas, 'Container', 'Novice', false)).toBe(false);
  });
});
