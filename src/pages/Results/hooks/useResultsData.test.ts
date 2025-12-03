// src/pages/Results/hooks/useResultsData.test.ts
import { renderHook, waitFor, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useResultsData } from './useResultsData';

// Mock dependencies
vi.mock('../../../lib/supabase', () => ({
  supabase: {
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          eq: vi.fn(() => ({
            order: vi.fn(() => ({
              order: vi.fn(() => Promise.resolve({ data: [], error: null })),
            })),
          })),
        })),
      })),
    })),
  },
}));

vi.mock('../../../services/resultVisibilityService', () => ({
  getVisibleResultFields: vi.fn(() => Promise.resolve({
    showPlacement: true,
    showQualification: true,
    showTime: true,
    showFaults: true,
  })),
}));

describe('useResultsData', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns loading state initially', () => {
    const { result } = renderHook(() => useResultsData({
      trialId: 1,
      licenseKey: 'test-key',
    }));

    expect(result.current.isLoading).toBe(true);
  });

  it('returns empty array when no completed classes', async () => {
    const { result } = renderHook(() => useResultsData({
      trialId: 1,
      licenseKey: 'test-key',
    }));

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.completedClasses).toEqual([]);
  });

  it('provides filter state and setters', () => {
    const { result } = renderHook(() => useResultsData({
      trialId: 1,
      licenseKey: 'test-key',
    }));

    expect(result.current.filters).toEqual({
      element: null,
      level: null,
    });
    expect(typeof result.current.setFilters).toBe('function');
  });

  it('filters results by element', async () => {
    const { result } = renderHook(() => useResultsData({
      trialId: 1,
      licenseKey: 'test-key',
    }));

    act(() => {
      result.current.setFilters({ element: 'Container', level: null });
    });

    await waitFor(() => {
      expect(result.current.filters.element).toBe('Container');
    });
  });
});
