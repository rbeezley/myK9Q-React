/**
 * Unit Tests for Novice Class Grouping Utilities
 */

import {
  findPairedNoviceClass,
  groupNoviceClasses,
  isCombinedNoviceEntry,
  getClassIds
} from './noviceClassGrouping';

const createMockClass = (overrides: any = {}) => ({
  id: 1,
  class_name: 'Container Novice A',
  element: 'Container',
  level: 'Novice',
  section: 'A',
  entry_count: 5,
  completed_count: 0,
  dogs: [],
  is_favorite: false,
  ...overrides
});

describe('findPairedNoviceClass', () => {
  test('should find matching Novice B for Novice A', () => {
    const classA = createMockClass({ id: 1, section: 'A' });
    const classB = createMockClass({ id: 2, section: 'B' });
    const classes = [classA, classB];

    const result = findPairedNoviceClass(classA, classes);
    expect(result).toEqual(classB);
  });

  test('should return null if no pair exists', () => {
    const classA = createMockClass({ id: 1, section: 'A' });
    const classes = [classA];

    const result = findPairedNoviceClass(classA, classes);
    expect(result).toBeNull();
  });

  test('should not pair different elements', () => {
    const classA = createMockClass({ id: 1, element: 'Container', section: 'A' });
    const classB = createMockClass({ id: 2, element: 'Exterior', section: 'B' });
    const classes = [classA, classB];

    const result = findPairedNoviceClass(classA, classes);
    expect(result).toBeNull();
  });
});

describe('groupNoviceClasses', () => {
  test('should combine Novice A and B classes', () => {
    const classA = createMockClass({ id: 1, section: 'A', entry_count: 5 });
    const classB = createMockClass({ id: 2, section: 'B', entry_count: 3 });
    const classes = [classA, classB];

    const result = groupNoviceClasses(classes);

    expect(result).toHaveLength(1);
    expect(result[0].section).toBe('A & B');
    expect(result[0].entry_count).toBe(8); // 5 + 3
  });

  test('should keep unpaired classes as-is', () => {
    const classA = createMockClass({ id: 1, section: 'A' });
    const classes = [classA];

    const result = groupNoviceClasses(classes);

    expect(result).toHaveLength(1);
    expect(result[0].section).toBe('A');
  });

  test('should not group non-Novice classes', () => {
    const classAdvanced = createMockClass({
      id: 1,
      level: 'Advanced',
      section: 'A'
    });
    const classes = [classAdvanced];

    const result = groupNoviceClasses(classes);
    expect(result).toHaveLength(1);
    expect(result[0]).toEqual(classAdvanced);
  });
});

describe('isCombinedNoviceEntry', () => {
  test('should identify combined entries', () => {
    const combined = createMockClass({ section: 'A & B', pairedClassId: 2 });
    expect(isCombinedNoviceEntry(combined)).toBe(true);
  });

  test('should return false for single sections', () => {
    const single = createMockClass({ section: 'A' });
    expect(isCombinedNoviceEntry(single)).toBe(false);
  });

  test('should return false if section is A & B but no pairedClassId', () => {
    const incompleteCombined = createMockClass({ section: 'A & B' });
    expect(isCombinedNoviceEntry(incompleteCombined)).toBe(false);
  });
});

describe('getClassIds', () => {
  test('should return single ID for regular class', () => {
    const regularClass = createMockClass({ id: 1, section: 'A' });
    const ids = getClassIds(regularClass);

    expect(ids).toEqual([1]);
  });

  test('should return both IDs for combined class', () => {
    const combined = createMockClass({
      id: 1,
      section: 'A & B',
      pairedClassId: 2
    });
    const ids = getClassIds(combined);

    expect(ids).toEqual([1, 2]);
  });
});
