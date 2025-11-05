/**
 * Tests for EntryList Reset Score - Offline-First Compliance
 *
 * Verifies that reset score follows offline-first pattern:
 * 1. Optimistic updates happen immediately
 * 2. No manual refresh() calls
 * 3. Silent failure when offline
 * 4. No rollback of optimistic updates
 * 5. Real-time subscriptions handle confirmation
 */

import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
import EntryList from '../EntryList';
import { resetEntryScore } from '@/services/entryService';
import { useEntryListData } from '../hooks/useEntryListData';

// Mock dependencies
vi.mock('@/services/entryService');
vi.mock('@/contexts/AuthContext', () => ({
  useAuth: vi.fn(() => ({
    user: { id: '1', email: 'test@test.com' },
    showContext: { licenseKey: 'test-key', showId: 1 },
    role: 'admin',
    canAccess: vi.fn(() => true),
    loading: false
  })),
  AuthProvider: ({ children }: any) => children
}));
vi.mock('../hooks/useEntryListData');
vi.mock('../hooks/useEntryListActions', () => ({
  useEntryListActions: vi.fn(() => ({
    handleStatusChange: vi.fn(),
    handleResetScore: vi.fn(),
    handleMarkInRing: vi.fn(),
    handleMarkCompleted: vi.fn(),
    isSyncing: false,
    hasError: false
  }))
}));
vi.mock('../hooks/useEntryListSubscriptions', () => ({
  useEntryListSubscriptions: vi.fn()
}));

const mockScoredEntry = {
  id: 1,
  armband: 101,
  callName: 'Buddy',
  status: 'completed' as const,
  checkinStatus: 'checked-in' as const,
  isScored: true,
  inRing: false,
  resultText: 'Q',
  searchTime: '1:23.45',
  faultCount: 0,
  placement: 1,
  classId: 10
};

const mockClassInfo = {
  className: 'Novice A',
  element: 'Scent Work',
  level: 'Novice',
  actualClassId: 10,
  selfCheckin: true
};

describe('EntryList - Reset Score - Offline-First Compliance', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    // Mock useEntryListData to return scored entry
    (useEntryListData as vi.Mock).mockReturnValue({
      entries: [mockScoredEntry],
      classInfo: mockClassInfo,
      isStale: false,
      isRefreshing: false,
      fetchError: null,
      refresh: vi.fn(),
      isCombinedView: false
    });

    // Mock successful reset
    (resetEntryScore as vi.Mock).mockResolvedValue(undefined);

    // Reset navigator.onLine
    Object.defineProperty(navigator, 'onLine', {
      writable: true,
      configurable: true,
      value: true
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  const renderEntryList = () => {
    return render(
      <BrowserRouter>
        <EntryList />
      </BrowserRouter>
    );
  };

  describe('Scenario 1: Reset Score - Online', () => {
    it('updates UI immediately when resetting score', async () => {
      const user = userEvent.setup();
      renderEntryList();

      // Entry should be in completed tab initially
      const completedTab = screen.getByText(/Completed/i);
      await user.click(completedTab);

      // Find the entry card
      const entryCard = await screen.findByText('Buddy');
      expect(entryCard).toBeInTheDocument();

      // Find and click reset score button (assuming it exists on the card)
      // Note: May need to adjust selector based on actual implementation
      const moreButton = screen.getByLabelText(/more options/i);
      await user.click(moreButton);

      const resetButton = await screen.findByText(/reset score/i);
      await user.click(resetButton);

      // Confirm dialog
      const confirmButton = await screen.findByText(/confirm/i);
      await user.click(confirmButton);

      // UI should update immediately - entry moves to pending tab
      // This tests the optimistic update in localEntries state
      await waitFor(() => {
        expect(screen.queryByText('Buddy')).not.toBeInTheDocument();
      });

      // Check pending tab
      const pendingTab = screen.getByText(/Pending/i);
      await user.click(pendingTab);

      await waitFor(() => {
        expect(screen.getByText('Buddy')).toBeInTheDocument();
      });
    });

    it('does NOT call refresh() manually after reset', async () => {
      const refreshMock = vi.fn();
      (useEntryListData as vi.Mock).mockReturnValue({
        entries: [mockScoredEntry],
        classInfo: mockClassInfo,
        refresh: refreshMock,
        isStale: false,
        isRefreshing: false,
        fetchError: null,
        isCombinedView: false
      });

      const user = userEvent.setup();
      renderEntryList();

      const completedTab = screen.getByText(/Completed/i);
      await user.click(completedTab);

      const moreButton = screen.getByLabelText(/more options/i);
      await user.click(moreButton);

      const resetButton = await screen.findByText(/reset score/i);
      await user.click(resetButton);

      const confirmButton = await screen.findByText(/confirm/i);
      await user.click(confirmButton);

      // Wait for API call
      await waitFor(() => {
        expect(resetEntryScore).toHaveBeenCalled();
      });

      // Assert refresh was NOT called manually
      // Real-time subscription should handle this
      expect(refreshMock).not.toHaveBeenCalled();
    });

    it('calls API with correct entry ID', async () => {
      const user = userEvent.setup();
      renderEntryList();

      const completedTab = screen.getByText(/Completed/i);
      await user.click(completedTab);

      const moreButton = screen.getByLabelText(/more options/i);
      await user.click(moreButton);

      const resetButton = await screen.findByText(/reset score/i);
      await user.click(resetButton);

      const confirmButton = await screen.findByText(/confirm/i);
      await user.click(confirmButton);

      await waitFor(() => {
        expect(resetEntryScore).toHaveBeenCalledWith(mockScoredEntry.id);
      });
    });

    it('resets all score fields in optimistic update', async () => {
      const user = userEvent.setup();
      renderEntryList();

      const completedTab = screen.getByText(/Completed/i);
      await user.click(completedTab);

      // Verify entry has score data initially
      expect(screen.getByText(/Q/i)).toBeInTheDocument();
      expect(screen.getByText(/1:23.45/i)).toBeInTheDocument();

      const moreButton = screen.getByLabelText(/more options/i);
      await user.click(moreButton);

      const resetButton = await screen.findByText(/reset score/i);
      await user.click(resetButton);

      const confirmButton = await screen.findByText(/confirm/i);
      await user.click(confirmButton);

      // After reset, score data should be cleared
      await waitFor(() => {
        expect(screen.queryByText(/Q/i)).not.toBeInTheDocument();
        expect(screen.queryByText(/1:23.45/i)).not.toBeInTheDocument();
      });
    });
  });

  describe('Scenario 2: Reset Score - Offline', () => {
    beforeEach(() => {
      Object.defineProperty(navigator, 'onLine', {
        writable: true,
        configurable: true,
        value: false
      });
    });

    it('updates UI immediately when offline', async () => {
      const user = userEvent.setup();
      renderEntryList();

      const completedTab = screen.getByText(/Completed/i);
      await user.click(completedTab);

      const moreButton = screen.getByLabelText(/more options/i);
      await user.click(moreButton);

      const resetButton = await screen.findByText(/reset score/i);
      await user.click(resetButton);

      const confirmButton = await screen.findByText(/confirm/i);
      await user.click(confirmButton);

      // UI should still update immediately even offline
      await waitFor(() => {
        expect(screen.queryByText('Buddy')).not.toBeInTheDocument();
      });

      // Entry should be in pending tab
      const pendingTab = screen.getByText(/Pending/i);
      await user.click(pendingTab);

      await waitFor(() => {
        expect(screen.getByText('Buddy')).toBeInTheDocument();
      });
    });

    it('does not show error alert when offline', async () => {
      const alertSpy = vi.spyOn(window, 'alert').mockImplementation();
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation();

      (resetEntryScore as vi.Mock).mockRejectedValue(
        new Error('Network request failed')
      );

      const user = userEvent.setup();
      renderEntryList();

      const completedTab = screen.getByText(/Completed/i);
      await user.click(completedTab);

      const moreButton = screen.getByLabelText(/more options/i);
      await user.click(moreButton);

      const resetButton = await screen.findByText(/reset score/i);
      await user.click(resetButton);

      const confirmButton = await screen.findByText(/confirm/i);
      await user.click(confirmButton);

      // Wait for error to be logged
      await waitFor(() => {
        expect(consoleErrorSpy).toHaveBeenCalled();
      });

      // No alert shown to user
      expect(alertSpy).not.toHaveBeenCalled();

      alertSpy.mockRestore();
      consoleErrorSpy.mockRestore();
    });

    it('does not rollback optimistic update when offline', async () => {
      (resetEntryScore as vi.Mock).mockRejectedValue(
        new Error('Network error')
      );

      const user = userEvent.setup();
      renderEntryList();

      const completedTab = screen.getByText(/Completed/i);
      await user.click(completedTab);

      const entryName = screen.getByText('Buddy');
      expect(entryName).toBeInTheDocument();

      const moreButton = screen.getByLabelText(/more options/i);
      await user.click(moreButton);

      const resetButton = await screen.findByText(/reset score/i);
      await user.click(resetButton);

      const confirmButton = await screen.findByText(/confirm/i);
      await user.click(confirmButton);

      // Wait for sync attempt
      await waitFor(() => {
        expect(resetEntryScore).toHaveBeenCalled();
      });

      // Entry should STILL be in pending (no rollback to completed)
      const pendingTab = screen.getByText(/Pending/i);
      await user.click(pendingTab);

      expect(screen.getByText('Buddy')).toBeInTheDocument();
    });
  });

  describe('Scenario 3: Connection Drops Mid-Reset', () => {
    it('does not rollback optimistic update if reset fails', async () => {
      (resetEntryScore as vi.Mock).mockRejectedValue(
        new Error('Request timeout')
      );

      const user = userEvent.setup();
      renderEntryList();

      const completedTab = screen.getByText(/Completed/i);
      await user.click(completedTab);

      const moreButton = screen.getByLabelText(/more options/i);
      await user.click(moreButton);

      const resetButton = await screen.findByText(/reset score/i);
      await user.click(resetButton);

      const confirmButton = await screen.findByText(/confirm/i);
      await user.click(confirmButton);

      // Entry should move to pending
      await waitFor(() => {
        expect(screen.queryByText('Buddy')).not.toBeInTheDocument();
      });

      const pendingTab = screen.getByText(/Pending/i);
      await user.click(pendingTab);

      // Should STILL be in pending (not rolled back to completed)
      expect(screen.getByText('Buddy')).toBeInTheDocument();
    });

    it('does not show error to user when reset fails', async () => {
      const alertSpy = vi.spyOn(window, 'alert').mockImplementation();
      (resetEntryScore as vi.Mock).mockRejectedValue(
        new Error('Network error')
      );

      const user = userEvent.setup();
      renderEntryList();

      const completedTab = screen.getByText(/Completed/i);
      await user.click(completedTab);

      const moreButton = screen.getByLabelText(/more options/i);
      await user.click(moreButton);

      const resetButton = await screen.findByText(/reset score/i);
      await user.click(resetButton);

      const confirmButton = await screen.findByText(/confirm/i);
      await user.click(confirmButton);

      await waitFor(() => {
        expect(resetEntryScore).toHaveBeenCalled();
      });

      expect(alertSpy).not.toHaveBeenCalled();
      alertSpy.mockRestore();
    });
  });

  describe('Scenario 4: Multiple Rapid Resets', () => {
    it('applies all optimistic updates immediately', async () => {
      const user = userEvent.setup();

      // Mock multiple scored entries
      const multipleScoredEntries = [
        { ...mockScoredEntry, id: 1, armband: 101, callName: 'Buddy' },
        { ...mockScoredEntry, id: 2, armband: 102, callName: 'Max' },
        { ...mockScoredEntry, id: 3, armband: 103, callName: 'Charlie' }
      ];

      (useEntryListData as vi.Mock).mockReturnValue({
        entries: multipleScoredEntries,
        classInfo: mockClassInfo,
        refresh: vi.fn(),
        isStale: false,
        isRefreshing: false,
        fetchError: null,
        isCombinedView: false
      });

      renderEntryList();

      const completedTab = screen.getByText(/Completed/i);
      await user.click(completedTab);

      // Reset all 3 entries rapidly
      for (const entry of multipleScoredEntries) {
        const moreButton = screen.getAllByLabelText(/more options/i)[0];
        await user.click(moreButton);

        const resetButton = await screen.findByText(/reset score/i);
        await user.click(resetButton);

        const confirmButton = await screen.findByText(/confirm/i);
        await user.click(confirmButton);
      }

      // All 3 API calls should be made
      await waitFor(() => {
        expect(resetEntryScore).toHaveBeenCalledTimes(3);
      });
    });
  });

  describe('Scenario 5: Status Badge After Reset', () => {
    it('resets status badge to "No Status"', async () => {
      const user = userEvent.setup();
      renderEntryList();

      const completedTab = screen.getByText(/Completed/i);
      await user.click(completedTab);

      const moreButton = screen.getByLabelText(/more options/i);
      await user.click(moreButton);

      const resetButton = await screen.findByText(/reset score/i);
      await user.click(resetButton);

      const confirmButton = await screen.findByText(/confirm/i);
      await user.click(confirmButton);

      // Check pending tab
      const pendingTab = screen.getByText(/Pending/i);
      await user.click(pendingTab);

      // Status badge should show "No Status" not "Completed"
      await waitFor(() => {
        expect(screen.getByText('Buddy')).toBeInTheDocument();
        expect(screen.getByText(/No Status/i)).toBeInTheDocument();
        expect(screen.queryByText(/Completed/i)).not.toBeInTheDocument();
      });
    });
  });

  describe('Pattern Compliance Checks', () => {
    it('follows offline-first pattern: optimistic update then background sync', async () => {
      const callOrder: string[] = [];

      (resetEntryScore as vi.Mock).mockImplementation(async () => {
        callOrder.push('API');
        await new Promise(resolve => setTimeout(resolve, 100));
      });

      const user = userEvent.setup();
      renderEntryList();

      const startTime = Date.now();

      const completedTab = screen.getByText(/Completed/i);
      await user.click(completedTab);

      const moreButton = screen.getByLabelText(/more options/i);
      await user.click(moreButton);

      const resetButton = await screen.findByText(/reset score/i);
      await user.click(resetButton);

      const confirmButton = await screen.findByText(/confirm/i);
      await user.click(confirmButton);

      const uiUpdateTime = Date.now() - startTime;

      // UI should update very quickly (optimistic)
      expect(uiUpdateTime).toBeLessThan(500); // Account for test overhead

      // Then API call happens in background
      await waitFor(() => {
        expect(callOrder).toContain('API');
      });
    });

    it('switches to pending tab immediately', async () => {
      const user = userEvent.setup();
      renderEntryList();

      const completedTab = screen.getByText(/Completed/i);
      await user.click(completedTab);

      expect(screen.getByText('Buddy')).toBeInTheDocument();

      const moreButton = screen.getByLabelText(/more options/i);
      await user.click(moreButton);

      const resetButton = await screen.findByText(/reset score/i);
      await user.click(resetButton);

      const confirmButton = await screen.findByText(/confirm/i);
      await user.click(confirmButton);

      // Should auto-switch to pending tab
      await waitFor(() => {
        const pendingTab = screen.getByRole('tab', { name: /Pending/i });
        expect(pendingTab).toHaveAttribute('aria-selected', 'true');
      });
    });
  });
});
