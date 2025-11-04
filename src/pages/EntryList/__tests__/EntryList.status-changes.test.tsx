/**
 * Tests for EntryList Status Changes - Offline-First Compliance
 *
 * Verifies that status changes follow offline-first pattern:
 * 1. Optimistic updates happen immediately
 * 2. No manual refresh() calls
 * 3. Silent failure when offline
 * 4. No rollback of optimistic updates
 * 5. Real-time subscriptions handle confirmation
 *
 * Tests all status types:
 * - Normal check-in statuses (no-status, checked-in, at-gate, etc.)
 * - Special "in-ring" status
 * - Special "completed" status
 */

import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
import EntryList from '../EntryList';
import { updateEntryCheckinStatus, markInRing, markEntryCompleted } from '@/services/entryService';
import { useEntryListData } from '../hooks/useEntryListData';

// Mock dependencies
vi.mock('@/services/entryService');
vi.mock('@/contexts/AuthContext', () => ({
  useAuth: vi.fn(() => ({
    user: { id: '1', email: 'test@test.com' },
    showContext: { licenseKey: 'test-key', showId: 1 },
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

const mockEntries = [
  {
    id: 1,
    armband: 101,
    callName: 'Buddy',
    status: 'no-status' as const,
    checkinStatus: 'no-status' as const,
    isScored: false,
    inRing: false,
    classId: 10
  },
  {
    id: 2,
    armband: 102,
    callName: 'Max',
    status: 'checked-in' as const,
    checkinStatus: 'checked-in' as const,
    isScored: false,
    inRing: false,
    classId: 10
  }
];

const mockClassInfo = {
  className: 'Novice A',
  element: 'Scent Work',
  level: 'Novice',
  actualClassId: 10,
  selfCheckin: true
};

describe('EntryList - Status Changes - Offline-First Compliance', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    // Mock useEntryListData to return test data
    (useEntryListData as vi.Mock).mockReturnValue({
      entries: mockEntries,
      classInfo: mockClassInfo,
      isStale: false,
      isRefreshing: false,
      fetchError: null,
      refresh: vi.fn(),
      isCombinedView: false
    });

    // Mock successful API calls
    (updateEntryCheckinStatus as vi.Mock).mockResolvedValue(undefined);
    (markInRing as vi.Mock).mockResolvedValue(undefined);
    (markEntryCompleted as vi.Mock).mockResolvedValue(undefined);

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

  describe('Scenario 1: Normal Status Change - Online', () => {
    it('updates UI immediately when changing status', async () => {
      const user = userEvent.setup();
      renderEntryList();

      // Find entry with "No Status"
      const statusBadge = screen.getByText(/No Status/i);
      expect(statusBadge).toBeInTheDocument();

      // Click to open status menu
      await user.click(statusBadge);

      // Select "Checked-in"
      const checkedInOption = await screen.findByText(/Checked-in/i);
      await user.click(checkedInOption);

      // UI should update immediately (before API resolves)
      // Note: This tests the optimistic update in localEntries state
      await waitFor(() => {
        // The badge should show checked-in status immediately
        expect(screen.queryByText(/No Status/i)).not.toBeInTheDocument();
      });
    });

    it('does NOT call refresh() manually after status change', async () => {
      const refreshMock = vi.fn();
      (useEntryListData as vi.Mock).mockReturnValue({
        entries: mockEntries,
        classInfo: mockClassInfo,
        refresh: refreshMock,
        isStale: false,
        isRefreshing: false,
        fetchError: null,
        isCombinedView: false
      });

      const user = userEvent.setup();
      renderEntryList();

      const statusBadge = screen.getByText(/No Status/i);
      await user.click(statusBadge);

      const checkedInOption = await screen.findByText(/Checked-in/i);
      await user.click(checkedInOption);

      // Wait for async operations
      await waitFor(() => {
        expect(updateEntryCheckinStatus).toHaveBeenCalled();
      });

      // Assert refresh was NOT called
      // Real-time subscription should handle this
      expect(refreshMock).not.toHaveBeenCalled();
    });

    it('calls API with correct status value', async () => {
      const user = userEvent.setup();
      renderEntryList();

      const statusBadge = screen.getByText(/No Status/i);
      await user.click(statusBadge);

      const checkedInOption = await screen.findByText(/Checked-in/i);
      await user.click(checkedInOption);

      await waitFor(() => {
        expect(updateEntryCheckinStatus).toHaveBeenCalledWith(1, 'checked-in');
      });
    });
  });

  describe('Scenario 2: Status Change - Offline', () => {
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

      const statusBadge = screen.getByText(/No Status/i);
      await user.click(statusBadge);

      const checkedInOption = await screen.findByText(/Checked-in/i);
      await user.click(checkedInOption);

      // UI should still update immediately even offline
      await waitFor(() => {
        expect(screen.queryByText(/No Status/i)).not.toBeInTheDocument();
      });
    });

    it('does not show error alert when offline', async () => {
      const alertSpy = vi.spyOn(window, 'alert').mockImplementation();
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation();

      (updateEntryCheckinStatus as vi.Mock).mockRejectedValue(
        new Error('Network request failed')
      );

      const user = userEvent.setup();
      renderEntryList();

      const statusBadge = screen.getByText(/No Status/i);
      await user.click(statusBadge);

      const checkedInOption = await screen.findByText(/Checked-in/i);
      await user.click(checkedInOption);

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
      (updateEntryCheckinStatus as vi.Mock).mockRejectedValue(
        new Error('Network error')
      );

      const user = userEvent.setup();
      renderEntryList();

      const statusBadge = screen.getByText(/No Status/i);
      await user.click(statusBadge);

      const checkedInOption = await screen.findByText(/Checked-in/i);
      await user.click(checkedInOption);

      // Wait for sync attempt
      await waitFor(() => {
        expect(updateEntryCheckinStatus).toHaveBeenCalled();
      });

      // UI should STILL show the optimistic update (no rollback)
      expect(screen.queryByText(/No Status/i)).not.toBeInTheDocument();
    });
  });

  describe('Scenario 3: In-Ring Status - Online', () => {
    it('updates UI immediately when marking in-ring', async () => {
      const user = userEvent.setup();
      renderEntryList();

      const statusBadge = screen.getByText(/No Status/i);
      await user.click(statusBadge);

      const inRingOption = await screen.findByText(/In Ring/i);
      await user.click(inRingOption);

      // UI should update immediately
      await waitFor(() => {
        expect(screen.queryByText(/No Status/i)).not.toBeInTheDocument();
      });
    });

    it('does NOT call refresh() after marking in-ring', async () => {
      const refreshMock = vi.fn();
      (useEntryListData as vi.Mock).mockReturnValue({
        entries: mockEntries,
        classInfo: mockClassInfo,
        refresh: refreshMock,
        isStale: false,
        isRefreshing: false,
        fetchError: null,
        isCombinedView: false
      });

      const user = userEvent.setup();
      renderEntryList();

      const statusBadge = screen.getByText(/No Status/i);
      await user.click(statusBadge);

      const inRingOption = await screen.findByText(/In Ring/i);
      await user.click(inRingOption);

      await waitFor(() => {
        expect(markInRing).toHaveBeenCalled();
      });

      // No manual refresh
      expect(refreshMock).not.toHaveBeenCalled();
    });

    it('does not show error when marking in-ring fails', async () => {
      const alertSpy = vi.spyOn(window, 'alert').mockImplementation();
      (markInRing as vi.Mock).mockRejectedValue(new Error('Network error'));

      const user = userEvent.setup();
      renderEntryList();

      const statusBadge = screen.getByText(/No Status/i);
      await user.click(statusBadge);

      const inRingOption = await screen.findByText(/In Ring/i);
      await user.click(inRingOption);

      await waitFor(() => {
        expect(markInRing).toHaveBeenCalled();
      });

      expect(alertSpy).not.toHaveBeenCalled();
      alertSpy.mockRestore();
    });
  });

  describe('Scenario 4: Completed Status - Online', () => {
    it('updates UI immediately when marking completed', async () => {
      const user = userEvent.setup();
      renderEntryList();

      const statusBadge = screen.getByText(/No Status/i);
      await user.click(statusBadge);

      const completedOption = await screen.findByText(/Completed/i);
      await user.click(completedOption);

      // UI should update immediately
      await waitFor(() => {
        expect(screen.queryByText(/No Status/i)).not.toBeInTheDocument();
      });
    });

    it('does NOT call refresh() after marking completed', async () => {
      const refreshMock = vi.fn();
      (useEntryListData as vi.Mock).mockReturnValue({
        entries: mockEntries,
        classInfo: mockClassInfo,
        refresh: refreshMock,
        isStale: false,
        isRefreshing: false,
        fetchError: null,
        isCombinedView: false
      });

      const user = userEvent.setup();
      renderEntryList();

      const statusBadge = screen.getByText(/No Status/i);
      await user.click(statusBadge);

      const completedOption = await screen.findByText(/Completed/i);
      await user.click(completedOption);

      await waitFor(() => {
        expect(markEntryCompleted).toHaveBeenCalled();
      });

      // No manual refresh
      expect(refreshMock).not.toHaveBeenCalled();
    });

    it('does not show error when marking completed fails', async () => {
      const alertSpy = vi.spyOn(window, 'alert').mockImplementation();
      (markEntryCompleted as vi.Mock).mockRejectedValue(new Error('Network error'));

      const user = userEvent.setup();
      renderEntryList();

      const statusBadge = screen.getByText(/No Status/i);
      await user.click(statusBadge);

      const completedOption = await screen.findByText(/Completed/i);
      await user.click(completedOption);

      await waitFor(() => {
        expect(markEntryCompleted).toHaveBeenCalled();
      });

      expect(alertSpy).not.toHaveBeenCalled();
      alertSpy.mockRestore();
    });
  });

  describe('Scenario 5: Multiple Rapid Status Changes', () => {
    it('applies all optimistic updates immediately', async () => {
      const user = userEvent.setup();

      // Mock multiple entries
      const multipleEntries = [
        { ...mockEntries[0], id: 1, armband: 101, status: 'no-status' as const },
        { ...mockEntries[0], id: 2, armband: 102, status: 'no-status' as const },
        { ...mockEntries[0], id: 3, armband: 103, status: 'no-status' as const }
      ];

      (useEntryListData as vi.Mock).mockReturnValue({
        entries: multipleEntries,
        classInfo: mockClassInfo,
        refresh: vi.fn(),
        isStale: false,
        isRefreshing: false,
        fetchError: null,
        isCombinedView: false
      });

      renderEntryList();

      // Find all "No Status" badges
      const statusBadges = screen.getAllByText(/No Status/i);
      expect(statusBadges).toHaveLength(3);

      // Rapidly change all 3 statuses
      for (const badge of statusBadges) {
        await user.click(badge);
        const checkedInOption = await screen.findByText(/Checked-in/i);
        await user.click(checkedInOption);
      }

      // All 3 API calls should be made
      await waitFor(() => {
        expect(updateEntryCheckinStatus).toHaveBeenCalledTimes(3);
      });
    });
  });

  describe('Pattern Compliance Checks', () => {
    it('follows offline-first pattern: optimistic update then background sync', async () => {
      const callOrder: string[] = [];

      (updateEntryCheckinStatus as vi.Mock).mockImplementation(async () => {
        callOrder.push('API');
        await new Promise(resolve => setTimeout(resolve, 100));
      });

      const user = userEvent.setup();
      renderEntryList();

      const startTime = Date.now();

      const statusBadge = screen.getByText(/No Status/i);
      await user.click(statusBadge);

      const checkedInOption = await screen.findByText(/Checked-in/i);
      await user.click(checkedInOption);

      const uiUpdateTime = Date.now() - startTime;

      // UI should update very quickly (optimistic)
      expect(uiUpdateTime).toBeLessThan(200); // Account for test overhead

      // Then API call happens in background
      await waitFor(() => {
        expect(callOrder).toContain('API');
      });
    });
  });
});
