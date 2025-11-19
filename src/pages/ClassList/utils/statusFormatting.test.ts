/**
 * Unit Tests for Status Formatting Utilities
 */

import {
  getContextualPreview,
  getFormattedStatus,
  getStatusColor,
  getStatusLabel
} from './statusFormatting';

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

describe('getContextualPreview', () => {
  test('should show not started status', () => {
    const classEntry = createMockClass({
      entry_count: 5,
      completed_count: 0,
      dogs: []
    });

    const preview = getContextualPreview(classEntry);
    expect(preview).toContain('5 entries');
    expect(preview).toContain('Not yet started');
  });

  test('should show completed status', () => {
    const classEntry = createMockClass({
      entry_count: 5,
      completed_count: 5,
      dogs: Array(5).fill({ is_scored: true })
    });

    const preview = getContextualPreview(classEntry);
    expect(preview).toContain('Completed');
  });

  test('should show in-progress status with in-ring dog', () => {
    const classEntry = createMockClass({
      entry_count: 5,
      completed_count: 2,
      dogs: [
        { armband: '101', call_name: 'Buddy', is_scored: true, in_ring: false },
        { armband: '102', call_name: 'Max', is_scored: true, in_ring: false },
        { armband: '103', call_name: 'Rex', is_scored: false, in_ring: true }
      ]
    });

    const preview = getContextualPreview(classEntry);
    expect(preview).toContain('In Ring: 103');
    expect(preview).toContain('Rex');
  });
});

describe('getFormattedStatus', () => {
  test('should format not-started status', () => {
    const classEntry = createMockClass({
      completed_count: 0,
      dogs: []
    });

    const status = getFormattedStatus(classEntry);
    expect(status.label).toContain('Not Started');
  });

  test('should format in-progress status', () => {
    const classEntry = createMockClass({
      entry_count: 5,
      completed_count: 2,
      dogs: [
        { is_scored: true, in_ring: false },
        { is_scored: true, in_ring: false },
        { is_scored: false, in_ring: false }
      ]
    });

    const status = getFormattedStatus(classEntry);
    expect(status.label).toContain('In Progress');
  });

  test('should format completed status', () => {
    const classEntry = createMockClass({
      entry_count: 5,
      completed_count: 5,
      dogs: Array(5).fill({ is_scored: true })
    });

    const status = getFormattedStatus(classEntry);
    expect(status.label).toContain('Completed');
  });
});

describe('getStatusColor', () => {
  test('should return correct color for not-started', () => {
    const classEntry = createMockClass({ completed_count: 0, dogs: [] });
    expect(getStatusColor(classEntry)).toBe('not-started');
  });

  test('should return correct color for in-progress', () => {
    const classEntry = createMockClass({
      entry_count: 5,
      completed_count: 2,
      dogs: [{ is_scored: true }, { is_scored: false }]
    });
    expect(getStatusColor(classEntry)).toBe('in-progress');
  });

  test('should return correct color for completed', () => {
    const classEntry = createMockClass({
      entry_count: 5,
      completed_count: 5,
      dogs: Array(5).fill({ is_scored: true })
    });
    expect(getStatusColor(classEntry)).toBe('completed');
  });
});

describe('getStatusLabel', () => {
  test('should return label for not-started', () => {
    const classEntry = createMockClass({ completed_count: 0, dogs: [] });
    const label = getStatusLabel(classEntry);
    expect(label).toContain('Not Started');
  });

  test('should return label for in-progress', () => {
    const classEntry = createMockClass({
      entry_count: 5,
      completed_count: 2,
      dogs: [{ is_scored: true }, { is_scored: false }]
    });
    const label = getStatusLabel(classEntry);
    expect(label).toContain('In Progress');
  });
});
