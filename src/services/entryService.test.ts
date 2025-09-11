/**
 * Tests for entry service
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { getClassEntries, submitScore, markInRing, updateEntryCheckinStatus } from './entryService';
import { supabase } from '../lib/supabase';

// Mock Supabase
vi.mock('../lib/supabase', () => ({
  supabase: {
    from: vi.fn(),
  },
}));

describe('entryService', () => {
  const mockSupabaseQuery = {
    select: vi.fn(),
    eq: vi.fn(),
    single: vi.fn(),
    order: vi.fn(),
    in: vi.fn(),
    update: vi.fn(),
  };

  beforeEach(() => {
    // Reset all mocks
    vi.clearAllMocks();
    
    // Setup chainable mock
    mockSupabaseQuery.select.mockReturnThis();
    mockSupabaseQuery.eq.mockReturnThis();
    mockSupabaseQuery.single.mockReturnThis();
    mockSupabaseQuery.order.mockReturnThis();
    mockSupabaseQuery.in.mockReturnThis();
    mockSupabaseQuery.update.mockReturnThis();
    
    (supabase.from as any).mockReturnValue(mockSupabaseQuery);
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  describe('getClassEntries', () => {
    const mockClassData = {
      element: 'Interior',
      level: 'Masters',
      section: 'A',
      trial_date: '2023-12-01',
      trial_number: 1,
      areas: 3
    };

    const mockViewData = [
      {
        id: 1,
        armband: 10,
        call_name: 'TestDog',
        breed: 'Golden Retriever',
        handler: 'Test Handler',
        is_scored: false,
        result_text: null,
        search_time: null,
        fault_count: null,
        placement: null,
      }
    ];

    const mockCheckinData = [
      {
        id: 1,
        checkin_status: 1,
        in_ring: false
      }
    ];

    it('should fetch class entries successfully', async () => {
      // Mock class data query
      mockSupabaseQuery.single.mockResolvedValueOnce({
        data: mockClassData,
        error: null
      });

      // Mock view data query  
      mockSupabaseQuery.order.mockResolvedValueOnce({
        data: mockViewData,
        error: null
      });

      // Mock checkin data query
      mockSupabaseQuery.in.mockResolvedValueOnce({
        data: mockCheckinData,
        error: null
      });

      const result = await getClassEntries(1, 'test-license-key');

      expect(result).toHaveLength(1);
      expect(result[0]).toMatchObject({
        id: 1,
        armband: 10,
        callName: 'TestDog',
        breed: 'Golden Retriever',
        handler: 'Test Handler',
        isScored: false,
        checkedIn: true, // Derived from checkin_status > 0
        checkinStatus: 'checked-in'
      });
    });

    it('should throw error when class not found', async () => {
      mockSupabaseQuery.single.mockResolvedValueOnce({
        data: null,
        error: { message: 'Class not found' }
      });

      await expect(getClassEntries(999, 'test-license-key'))
        .rejects.toThrow('Could not find class');
    });

    it('should handle empty entry results', async () => {
      mockSupabaseQuery.single.mockResolvedValueOnce({
        data: mockClassData,
        error: null
      });

      mockSupabaseQuery.order.mockResolvedValueOnce({
        data: [],
        error: null
      });

      const result = await getClassEntries(1, 'test-license-key');
      expect(result).toHaveLength(0);
    });

    it('should convert checkin status codes correctly', async () => {
      mockSupabaseQuery.single.mockResolvedValueOnce({
        data: mockClassData,
        error: null
      });

      mockSupabaseQuery.order.mockResolvedValueOnce({
        data: mockViewData,
        error: null
      });

      const testCheckinData = [
        { id: 1, checkin_status: 0, in_ring: false }, // none
        { id: 2, checkin_status: 2, in_ring: true },  // conflict
        { id: 3, checkin_status: 4, in_ring: false }, // at-gate
      ];

      mockSupabaseQuery.in.mockResolvedValueOnce({
        data: testCheckinData,
        error: null
      });

      // Add more view data to match checkin data
      const extendedViewData = [
        ...mockViewData,
        { ...mockViewData[0], id: 2 },
        { ...mockViewData[0], id: 3 }
      ];

      mockSupabaseQuery.order.mockResolvedValueOnce({
        data: extendedViewData,
        error: null
      });

      const result = await getClassEntries(1, 'test-license-key');

      expect(result[0].checkinStatus).toBe('none');
      expect(result[0].checkedIn).toBe(false);
    });
  });

  describe('submitScore', () => {
    it('should submit score successfully', async () => {
      mockSupabaseQuery.update.mockResolvedValueOnce({
        data: [{ id: 1, is_scored: true }],
        error: null
      });

      const scoreData = {
        resultText: 'Q',
        searchTime: '1:23.45',
        faultCount: 0
      };

      const result = await submitScore(1, scoreData);

      expect(result).toBe(true);
      expect(mockSupabaseQuery.update).toHaveBeenCalledWith({
        is_scored: true,
        result_text: 'Q',
        in_ring: false,
        search_time: '1:23.45',
        fault_count: 0
      });
    });

    it('should throw error on database failure', async () => {
      mockSupabaseQuery.update.mockResolvedValueOnce({
        data: null,
        error: { message: 'Database error', code: '500' }
      });

      const scoreData = { resultText: 'Q' };

      await expect(submitScore(1, scoreData))
        .rejects.toThrow();
    });

    it('should handle optional score fields', async () => {
      mockSupabaseQuery.update.mockResolvedValueOnce({
        data: [{ id: 1 }],
        error: null
      });

      const scoreData = {
        resultText: 'NQ',
        nonQualifyingReason: 'Max Time',
        score: 85
      };

      await submitScore(1, scoreData);

      expect(mockSupabaseQuery.update).toHaveBeenCalledWith({
        is_scored: true,
        result_text: 'NQ',
        in_ring: false,
        reason: 'Max Time',
        score: '85'
      });
    });
  });

  describe('markInRing', () => {
    it('should mark entry as in ring', async () => {
      mockSupabaseQuery.update.mockResolvedValueOnce({
        error: null
      });

      const result = await markInRing(1, true);

      expect(result).toBe(true);
      expect(mockSupabaseQuery.update).toHaveBeenCalledWith({
        in_ring: true
      });
    });

    it('should mark entry as out of ring', async () => {
      mockSupabaseQuery.update.mockResolvedValueOnce({
        error: null
      });

      const result = await markInRing(1, false);

      expect(result).toBe(true);
      expect(mockSupabaseQuery.update).toHaveBeenCalledWith({
        in_ring: false
      });
    });

    it('should handle database errors', async () => {
      mockSupabaseQuery.update.mockResolvedValueOnce({
        error: { message: 'Update failed' }
      });

      await expect(markInRing(1, true))
        .rejects.toThrow();
    });
  });

  describe('updateEntryCheckinStatus', () => {
    it('should convert status strings to codes correctly', async () => {
      mockSupabaseQuery.select.mockResolvedValueOnce({
        data: [{ id: 1, checkin_status: 1 }],
        error: null
      });

      mockSupabaseQuery.update.mockResolvedValueOnce({
        data: [{ id: 1 }],
        error: null
      });

      await updateEntryCheckinStatus(1, 'at-gate');

      expect(mockSupabaseQuery.update).toHaveBeenCalledWith({
        checkin_status: 4,
        in_ring: false
      });
    });

    it('should handle all status types', async () => {
      const statusMap = {
        'none': 0,
        'checked-in': 1,
        'conflict': 2,
        'pulled': 3,
        'at-gate': 4
      };

      for (const [status, code] of Object.entries(statusMap)) {
        vi.clearAllMocks();
        
        mockSupabaseQuery.select.mockResolvedValueOnce({
          data: [{ id: 1, checkin_status: code }],
          error: null
        });

        mockSupabaseQuery.update.mockResolvedValueOnce({
          data: [{ id: 1 }],
          error: null
        });

        await updateEntryCheckinStatus(1, status as any);

        expect(mockSupabaseQuery.update).toHaveBeenCalledWith({
          checkin_status: code,
          in_ring: false
        });
      }
    });

    it('should verify update with read-back', async () => {
      mockSupabaseQuery.update.mockResolvedValueOnce({
        data: [{ id: 1 }],
        error: null
      });

      // Mock the verification read
      mockSupabaseQuery.single.mockResolvedValueOnce({
        data: { id: 1, checkin_status: 1, in_ring: false },
        error: null
      });

      const result = await updateEntryCheckinStatus(1, 'checked-in');

      expect(result).toBe(true);
      // Should call select twice - once in main chain, once for verification
      expect(mockSupabaseQuery.select).toHaveBeenCalledTimes(2);
    });
  });
});