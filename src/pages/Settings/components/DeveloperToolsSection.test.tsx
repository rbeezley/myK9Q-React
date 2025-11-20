/**
 * Tests for DeveloperToolsSection Component
 */

import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { DeveloperToolsSection } from './DeveloperToolsSection';
import { useSettingsStore } from '@/stores/settingsStore';

// Mock the settings store
vi.mock('@/stores/settingsStore', () => ({
  useSettingsStore: vi.fn()
}));

describe('DeveloperToolsSection', () => {
  const mockUpdateSettings = vi.fn();

  const defaultSettings = {
    developerMode: false,
    devShowFPS: false,
    devShowMemory: false,
    devShowNetwork: false,
    consoleLogging: 'none' as 'none' | 'errors' | 'all'
  };

  beforeEach(() => {
    vi.clearAllMocks();

    (useSettingsStore as any).mockReturnValue({
      settings: defaultSettings,
      updateSettings: mockUpdateSettings
    });
  });

  describe('Developer mode toggle', () => {
    it('should render developer mode toggle', () => {
      render(<DeveloperToolsSection />);

      expect(screen.getByText('Developer Mode')).toBeInTheDocument();
      expect(screen.getByText('Enable debugging tools')).toBeInTheDocument();
    });

    it('should show developer mode as off by default', () => {
      render(<DeveloperToolsSection />);

      const toggle = screen.getByRole('checkbox');
      expect(toggle).not.toBeChecked();
    });

    it('should call updateSettings when toggled on', () => {
      render(<DeveloperToolsSection />);

      const toggle = screen.getByRole('checkbox');
      fireEvent.click(toggle);

      expect(mockUpdateSettings).toHaveBeenCalledWith({ developerMode: true });
    });

    it('should call updateSettings when toggled off', () => {
      (useSettingsStore as any).mockReturnValue({
        settings: { ...defaultSettings, developerMode: true },
        updateSettings: mockUpdateSettings
      });

      render(<DeveloperToolsSection />);

      const toggle = screen.getByRole('checkbox');
      fireEvent.click(toggle);

      expect(mockUpdateSettings).toHaveBeenCalledWith({ developerMode: false });
    });

    it('should render Terminal icon', () => {
      const { container } = render(<DeveloperToolsSection />);

      const terminalIcon = container.querySelector('svg');
      expect(terminalIcon).toBeInTheDocument();
    });
  });

  describe('Conditional developer tools display', () => {
    it('should not show developer tools when developer mode is off', () => {
      render(<DeveloperToolsSection />);

      expect(screen.queryByText('FPS Counter')).not.toBeInTheDocument();
      expect(screen.queryByText('Memory Monitor')).not.toBeInTheDocument();
      expect(screen.queryByText('Network Inspector')).not.toBeInTheDocument();
      expect(screen.queryByText('Console Logging')).not.toBeInTheDocument();
    });

    it('should show all developer tools when developer mode is on', () => {
      (useSettingsStore as any).mockReturnValue({
        settings: { ...defaultSettings, developerMode: true },
        updateSettings: mockUpdateSettings
      });

      render(<DeveloperToolsSection />);

      expect(screen.getByText('FPS Counter')).toBeInTheDocument();
      expect(screen.getByText('Memory Monitor')).toBeInTheDocument();
      expect(screen.getByText('Network Inspector')).toBeInTheDocument();
      expect(screen.getByText('Console Logging')).toBeInTheDocument();
    });
  });

  describe('FPS Counter', () => {
    beforeEach(() => {
      (useSettingsStore as any).mockReturnValue({
        settings: { ...defaultSettings, developerMode: true },
        updateSettings: mockUpdateSettings
      });
    });

    it('should render FPS counter toggle', () => {
      render(<DeveloperToolsSection />);

      expect(screen.getByText('FPS Counter')).toBeInTheDocument();
      expect(screen.getByText('Display frames per second')).toBeInTheDocument();
    });

    it('should call updateSettings when FPS counter is toggled', () => {
      render(<DeveloperToolsSection />);

      const toggles = screen.getAllByRole('checkbox');
      const fpsToggle = toggles[1]; // Second toggle (first is developer mode)
      fireEvent.click(fpsToggle);

      expect(mockUpdateSettings).toHaveBeenCalledWith({ devShowFPS: true });
    });

    it('should show FPS counter as off by default', () => {
      render(<DeveloperToolsSection />);

      const toggles = screen.getAllByRole('checkbox');
      const fpsToggle = toggles[1];
      expect(fpsToggle).not.toBeChecked();
    });

    it('should show FPS counter as on when enabled in settings', () => {
      (useSettingsStore as any).mockReturnValue({
        settings: { ...defaultSettings, developerMode: true, devShowFPS: true },
        updateSettings: mockUpdateSettings
      });

      render(<DeveloperToolsSection />);

      const toggles = screen.getAllByRole('checkbox');
      const fpsToggle = toggles[1];
      expect(fpsToggle).toBeChecked();
    });
  });

  describe('Memory Monitor', () => {
    beforeEach(() => {
      (useSettingsStore as any).mockReturnValue({
        settings: { ...defaultSettings, developerMode: true },
        updateSettings: mockUpdateSettings
      });
    });

    it('should render memory monitor toggle', () => {
      render(<DeveloperToolsSection />);

      expect(screen.getByText('Memory Monitor')).toBeInTheDocument();
      expect(screen.getByText('Show memory usage stats')).toBeInTheDocument();
    });

    it('should call updateSettings when memory monitor is toggled', () => {
      render(<DeveloperToolsSection />);

      const toggles = screen.getAllByRole('checkbox');
      const memoryToggle = toggles[2]; // Third toggle
      fireEvent.click(memoryToggle);

      expect(mockUpdateSettings).toHaveBeenCalledWith({ devShowMemory: true });
    });

    it('should show memory monitor as on when enabled in settings', () => {
      (useSettingsStore as any).mockReturnValue({
        settings: { ...defaultSettings, developerMode: true, devShowMemory: true },
        updateSettings: mockUpdateSettings
      });

      render(<DeveloperToolsSection />);

      const toggles = screen.getAllByRole('checkbox');
      const memoryToggle = toggles[2];
      expect(memoryToggle).toBeChecked();
    });
  });

  describe('Network Inspector', () => {
    beforeEach(() => {
      (useSettingsStore as any).mockReturnValue({
        settings: { ...defaultSettings, developerMode: true },
        updateSettings: mockUpdateSettings
      });
    });

    it('should render network inspector toggle', () => {
      render(<DeveloperToolsSection />);

      expect(screen.getByText('Network Inspector')).toBeInTheDocument();
      expect(screen.getByText('Monitor network requests')).toBeInTheDocument();
    });

    it('should call updateSettings when network inspector is toggled', () => {
      render(<DeveloperToolsSection />);

      const toggles = screen.getAllByRole('checkbox');
      const networkToggle = toggles[3]; // Fourth toggle
      fireEvent.click(networkToggle);

      expect(mockUpdateSettings).toHaveBeenCalledWith({ devShowNetwork: true });
    });

    it('should show network inspector as on when enabled in settings', () => {
      (useSettingsStore as any).mockReturnValue({
        settings: { ...defaultSettings, developerMode: true, devShowNetwork: true },
        updateSettings: mockUpdateSettings
      });

      render(<DeveloperToolsSection />);

      const toggles = screen.getAllByRole('checkbox');
      const networkToggle = toggles[3];
      expect(networkToggle).toBeChecked();
    });
  });

  describe('Console Logging', () => {
    beforeEach(() => {
      (useSettingsStore as any).mockReturnValue({
        settings: { ...defaultSettings, developerMode: true },
        updateSettings: mockUpdateSettings
      });
    });

    it('should render console logging dropdown', () => {
      render(<DeveloperToolsSection />);

      expect(screen.getByText('Console Logging')).toBeInTheDocument();
      expect(screen.getByText('Verbosity level')).toBeInTheDocument();
    });

    it('should render all logging options', () => {
      render(<DeveloperToolsSection />);

      expect(screen.getByRole('option', { name: 'None' })).toBeInTheDocument();
      expect(screen.getByRole('option', { name: 'Errors' })).toBeInTheDocument();
      expect(screen.getByRole('option', { name: 'All' })).toBeInTheDocument();
    });

    it('should have "None" selected by default', () => {
      render(<DeveloperToolsSection />);

      const select = screen.getByRole('combobox') as HTMLSelectElement;
      expect(select.value).toBe('none');
    });

    it('should call updateSettings when logging level is changed to "errors"', () => {
      render(<DeveloperToolsSection />);

      const select = screen.getByRole('combobox');
      fireEvent.change(select, { target: { value: 'errors' } });

      expect(mockUpdateSettings).toHaveBeenCalledWith({ consoleLogging: 'errors' });
    });

    it('should call updateSettings when logging level is changed to "all"', () => {
      render(<DeveloperToolsSection />);

      const select = screen.getByRole('combobox');
      fireEvent.change(select, { target: { value: 'all' } });

      expect(mockUpdateSettings).toHaveBeenCalledWith({ consoleLogging: 'all' });
    });

    it('should show current logging level from settings', () => {
      (useSettingsStore as any).mockReturnValue({
        settings: { ...defaultSettings, developerMode: true, consoleLogging: 'errors' },
        updateSettings: mockUpdateSettings
      });

      render(<DeveloperToolsSection />);

      const select = screen.getByRole('combobox') as HTMLSelectElement;
      expect(select.value).toBe('errors');
    });
  });

  describe('All developer tools enabled', () => {
    it('should handle all developer tools being enabled simultaneously', () => {
      (useSettingsStore as any).mockReturnValue({
        settings: {
          developerMode: true,
          devShowFPS: true,
          devShowMemory: true,
          devShowNetwork: true,
          consoleLogging: 'all'
        },
        updateSettings: mockUpdateSettings
      });

      render(<DeveloperToolsSection />);

      const toggles = screen.getAllByRole('checkbox');
      expect(toggles[0]).toBeChecked(); // Developer mode
      expect(toggles[1]).toBeChecked(); // FPS
      expect(toggles[2]).toBeChecked(); // Memory
      expect(toggles[3]).toBeChecked(); // Network

      const select = screen.getByRole('combobox') as HTMLSelectElement;
      expect(select.value).toBe('all');
    });
  });

  describe('Icon rendering', () => {
    it('should render Terminal icon when developer mode is off', () => {
      const { container } = render(<DeveloperToolsSection />);

      const icons = container.querySelectorAll('svg');
      expect(icons.length).toBe(1); // Only Terminal icon
    });

    it('should render all icons when developer mode is on', () => {
      (useSettingsStore as any).mockReturnValue({
        settings: { ...defaultSettings, developerMode: true },
        updateSettings: mockUpdateSettings
      });

      const { container } = render(<DeveloperToolsSection />);

      const icons = container.querySelectorAll('svg');
      // Terminal + Activity + Cpu + Network = 4 icons
      expect(icons.length).toBe(4);
    });
  });

  describe('Real-world scenarios', () => {
    it('should handle enabling developer mode workflow', () => {
      const { rerender } = render(<DeveloperToolsSection />);

      // Initially developer tools hidden
      expect(screen.queryByText('FPS Counter')).not.toBeInTheDocument();

      // User enables developer mode
      const toggle = screen.getByRole('checkbox');
      fireEvent.click(toggle);
      expect(mockUpdateSettings).toHaveBeenCalledWith({ developerMode: true });

      // Simulate settings update
      (useSettingsStore as any).mockReturnValue({
        settings: { ...defaultSettings, developerMode: true },
        updateSettings: mockUpdateSettings
      });
      rerender(<DeveloperToolsSection />);

      // Developer tools now visible
      expect(screen.getByText('FPS Counter')).toBeInTheDocument();
      expect(screen.getByText('Memory Monitor')).toBeInTheDocument();
    });

    it('should handle performance debugging workflow', () => {
      (useSettingsStore as any).mockReturnValue({
        settings: { ...defaultSettings, developerMode: true },
        updateSettings: mockUpdateSettings
      });

      render(<DeveloperToolsSection />);

      // Enable FPS counter
      const toggles = screen.getAllByRole('checkbox');
      fireEvent.click(toggles[1]);
      expect(mockUpdateSettings).toHaveBeenCalledWith({ devShowFPS: true });

      // Enable memory monitor
      fireEvent.click(toggles[2]);
      expect(mockUpdateSettings).toHaveBeenCalledWith({ devShowMemory: true });

      // Set console logging to "all"
      const select = screen.getByRole('combobox');
      fireEvent.change(select, { target: { value: 'all' } });
      expect(mockUpdateSettings).toHaveBeenCalledWith({ consoleLogging: 'all' });
    });

    it('should handle network debugging workflow', () => {
      (useSettingsStore as any).mockReturnValue({
        settings: { ...defaultSettings, developerMode: true },
        updateSettings: mockUpdateSettings
      });

      render(<DeveloperToolsSection />);

      // Enable network inspector
      const toggles = screen.getAllByRole('checkbox');
      fireEvent.click(toggles[3]);
      expect(mockUpdateSettings).toHaveBeenCalledWith({ devShowNetwork: true });

      // Set console logging to errors only
      const select = screen.getByRole('combobox');
      fireEvent.change(select, { target: { value: 'errors' } });
      expect(mockUpdateSettings).toHaveBeenCalledWith({ consoleLogging: 'errors' });
    });

    it('should handle disabling developer mode', () => {
      (useSettingsStore as any).mockReturnValue({
        settings: {
          developerMode: true,
          devShowFPS: true,
          devShowMemory: true,
          devShowNetwork: true,
          consoleLogging: 'all'
        },
        updateSettings: mockUpdateSettings
      });

      const { rerender } = render(<DeveloperToolsSection />);

      // All tools visible
      expect(screen.getByText('FPS Counter')).toBeInTheDocument();

      // Disable developer mode
      const toggle = screen.getByRole('checkbox');
      fireEvent.click(toggle);
      expect(mockUpdateSettings).toHaveBeenCalledWith({ developerMode: false });

      // Simulate settings update
      (useSettingsStore as any).mockReturnValue({
        settings: {
          developerMode: false,
          devShowFPS: true, // Still enabled but hidden
          devShowMemory: true,
          devShowNetwork: true,
          consoleLogging: 'all'
        },
        updateSettings: mockUpdateSettings
      });
      rerender(<DeveloperToolsSection />);

      // All tools hidden
      expect(screen.queryByText('FPS Counter')).not.toBeInTheDocument();
    });
  });
});
