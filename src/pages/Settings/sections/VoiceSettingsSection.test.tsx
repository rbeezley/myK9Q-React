/**
 * Tests for VoiceSettingsSection Component
 */

import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { VoiceSettingsSection } from './VoiceSettingsSection';
import { useSettingsStore } from '@/stores/settingsStore';

// Mock the settings store
vi.mock('@/stores/settingsStore', () => ({
  useSettingsStore: vi.fn()
}));

describe('VoiceSettingsSection', () => {
  const mockUpdateSettings = vi.fn();
  const mockGetVoices = vi.fn();
  const mockCancel = vi.fn();
  const mockSpeak = vi.fn();

  const defaultSettings = {
    voiceAnnouncements: false,
    voiceName: '',
    voiceRate: 1.0
  };

  const mockVoices: SpeechSynthesisVoice[] = [
    { name: 'Alex', lang: 'en-US', voiceURI: 'Alex', localService: true, default: true } as SpeechSynthesisVoice,
    { name: 'Samantha', lang: 'en-US', voiceURI: 'Samantha', localService: true, default: false } as SpeechSynthesisVoice,
    { name: 'Google UK English Female', lang: 'en-GB', voiceURI: 'Google UK English Female', localService: false, default: false } as SpeechSynthesisVoice
  ];

  beforeEach(() => {
    vi.clearAllMocks();

    (useSettingsStore as any).mockReturnValue({
      settings: defaultSettings,
      updateSettings: mockUpdateSettings
    });

    // Mock speechSynthesis
    mockGetVoices.mockReturnValue(mockVoices);
    Object.defineProperty(window, 'speechSynthesis', {
      writable: true,
      value: {
        getVoices: mockGetVoices,
        cancel: mockCancel,
        speak: mockSpeak,
        onvoiceschanged: null
      }
    });
  });

  describe('Rendering', () => {
    it('should render the section title', () => {
      render(<VoiceSettingsSection />);
      expect(screen.getByText('Voice Settings')).toBeInTheDocument();
    });

    it('should render voice announcements toggle', () => {
      render(<VoiceSettingsSection />);
      expect(screen.getByText('Voice Announcements')).toBeInTheDocument();
      expect(screen.getByText('Speak notifications aloud')).toBeInTheDocument();
    });

    it('should not show voice controls when announcements are disabled', () => {
      render(<VoiceSettingsSection />);
      expect(screen.queryByText('Voice')).not.toBeInTheDocument();
      expect(screen.queryByText('Speech Rate')).not.toBeInTheDocument();
      expect(screen.queryByText('Test Voice')).not.toBeInTheDocument();
    });

    it('should show voice controls when announcements are enabled', () => {
      (useSettingsStore as any).mockReturnValue({
        settings: { ...defaultSettings, voiceAnnouncements: true },
        updateSettings: mockUpdateSettings
      });

      render(<VoiceSettingsSection />);

      expect(screen.getByText('Voice')).toBeInTheDocument();
      expect(screen.getByText('Speech Rate')).toBeInTheDocument();
      expect(screen.getByText('Test Voice')).toBeInTheDocument();
    });
  });

  describe('Voice announcements toggle', () => {
    it('should call updateSettings when toggled on', () => {
      render(<VoiceSettingsSection />);

      const toggle = screen.getByRole('checkbox');
      fireEvent.click(toggle);

      expect(mockUpdateSettings).toHaveBeenCalledWith({ voiceAnnouncements: true });
    });

    it('should call updateSettings when toggled off', () => {
      (useSettingsStore as any).mockReturnValue({
        settings: { ...defaultSettings, voiceAnnouncements: true },
        updateSettings: mockUpdateSettings
      });

      render(<VoiceSettingsSection />);

      const toggle = screen.getByRole('checkbox');
      fireEvent.click(toggle);

      expect(mockUpdateSettings).toHaveBeenCalledWith({ voiceAnnouncements: false });
    });
  });

  describe('Voice selection dropdown', () => {
    beforeEach(() => {
      (useSettingsStore as any).mockReturnValue({
        settings: { ...defaultSettings, voiceAnnouncements: true },
        updateSettings: mockUpdateSettings
      });
    });

    it('should show loading message when no voices available', () => {
      mockGetVoices.mockReturnValue([]);
      render(<VoiceSettingsSection />);

      expect(screen.getByText('Loading voices...')).toBeInTheDocument();
    });

    it('should render Browser Default option', () => {
      render(<VoiceSettingsSection />);

      expect(screen.getByRole('option', { name: 'Browser Default' })).toBeInTheDocument();
    });

    it('should render all available voices', () => {
      render(<VoiceSettingsSection />);

      expect(screen.getByRole('option', { name: /Alex.*en-US/ })).toBeInTheDocument();
      expect(screen.getByRole('option', { name: /Samantha.*en-US/ })).toBeInTheDocument();
      expect(screen.getByRole('option', { name: /Google UK English Female.*en-GB/ })).toBeInTheDocument();
    });

    it('should call updateSettings when voice is changed', () => {
      render(<VoiceSettingsSection />);

      const select = screen.getByRole('combobox');
      fireEvent.change(select, { target: { value: 'Alex' } });

      expect(mockUpdateSettings).toHaveBeenCalledWith({ voiceName: 'Alex' });
    });

    it('should disable dropdown when no voices available', () => {
      mockGetVoices.mockReturnValue([]);
      render(<VoiceSettingsSection />);

      const select = screen.getByRole('combobox');
      expect(select).toBeDisabled();
    });

    it('should select the current voice from settings', () => {
      (useSettingsStore as any).mockReturnValue({
        settings: { ...defaultSettings, voiceAnnouncements: true, voiceName: 'Samantha' },
        updateSettings: mockUpdateSettings
      });

      render(<VoiceSettingsSection />);

      const select = screen.getByRole('combobox') as HTMLSelectElement;
      expect(select.value).toBe('Samantha');
    });
  });

  describe('Speech rate slider', () => {
    beforeEach(() => {
      (useSettingsStore as any).mockReturnValue({
        settings: { ...defaultSettings, voiceAnnouncements: true },
        updateSettings: mockUpdateSettings
      });
    });

    it('should display current speech rate', () => {
      render(<VoiceSettingsSection />);
      expect(screen.getByText('1.0x speed')).toBeInTheDocument();
    });

    it('should display updated speech rate', () => {
      (useSettingsStore as any).mockReturnValue({
        settings: { ...defaultSettings, voiceAnnouncements: true, voiceRate: 1.5 },
        updateSettings: mockUpdateSettings
      });

      render(<VoiceSettingsSection />);
      expect(screen.getByText('1.5x speed')).toBeInTheDocument();
    });

    it('should call updateSettings when slider is moved', () => {
      render(<VoiceSettingsSection />);

      const slider = screen.getByRole('slider');
      fireEvent.change(slider, { target: { value: '1.5' } });

      expect(mockUpdateSettings).toHaveBeenCalledWith({ voiceRate: 1.5 });
    });

    it('should have correct min and max values', () => {
      render(<VoiceSettingsSection />);

      const slider = screen.getByRole('slider') as HTMLInputElement;
      expect(slider.min).toBe('0.5');
      expect(slider.max).toBe('2.0');
      expect(slider.step).toBe('0.1');
    });

    it('should show min and max labels', () => {
      render(<VoiceSettingsSection />);
      expect(screen.getByText('0.5x')).toBeInTheDocument();
      expect(screen.getByText('2.0x')).toBeInTheDocument();
    });
  });

  describe('Test voice button', () => {
    beforeEach(() => {
      (useSettingsStore as any).mockReturnValue({
        settings: { ...defaultSettings, voiceAnnouncements: true },
        updateSettings: mockUpdateSettings
      });
    });

    it('should render test button', () => {
      render(<VoiceSettingsSection />);
      expect(screen.getByRole('button', { name: 'Test' })).toBeInTheDocument();
    });

    it('should cancel ongoing speech before testing', () => {
      render(<VoiceSettingsSection />);

      const testButton = screen.getByRole('button', { name: 'Test' });
      fireEvent.click(testButton);

      expect(mockCancel).toHaveBeenCalled();
    });

    it('should call speak with correct utterance', () => {
      render(<VoiceSettingsSection />);

      const testButton = screen.getByRole('button', { name: 'Test' });
      fireEvent.click(testButton);

      expect(mockSpeak).toHaveBeenCalled();
      const utterance = mockSpeak.mock.calls[0][0];
      expect(utterance.text).toBe('Your dog is up next in the ring.');
      expect(utterance.rate).toBe(1.0);
    });

    it('should use custom speech rate', () => {
      (useSettingsStore as any).mockReturnValue({
        settings: { ...defaultSettings, voiceAnnouncements: true, voiceRate: 1.5 },
        updateSettings: mockUpdateSettings
      });

      render(<VoiceSettingsSection />);

      const testButton = screen.getByRole('button', { name: 'Test' });
      fireEvent.click(testButton);

      const utterance = mockSpeak.mock.calls[0][0];
      expect(utterance.rate).toBe(1.5);
    });

    it('should show "Speaking..." while testing', async () => {
      render(<VoiceSettingsSection />);

      const testButton = screen.getByRole('button', { name: 'Test' });
      fireEvent.click(testButton);

      await waitFor(() => {
        expect(screen.getByText('Speaking...')).toBeInTheDocument();
      });
    });

    it('should disable button while testing', async () => {
      render(<VoiceSettingsSection />);

      const testButton = screen.getByRole('button', { name: 'Test' });
      fireEvent.click(testButton);

      await waitFor(() => {
        expect(testButton).toBeDisabled();
      });
    });
  });

  describe('Voice loading', () => {
    it('should load voices on mount', () => {
      render(<VoiceSettingsSection />);
      expect(mockGetVoices).toHaveBeenCalled();
    });

    it('should set onvoiceschanged handler', () => {
      render(<VoiceSettingsSection />);
      expect(window.speechSynthesis.onvoiceschanged).toBeTruthy();
    });

    it('should clean up onvoiceschanged handler on unmount', () => {
      const { unmount } = render(<VoiceSettingsSection />);
      unmount();
      expect(window.speechSynthesis.onvoiceschanged).toBeNull();
    });
  });

  describe('Browser compatibility', () => {
    it('should handle missing speechSynthesis gracefully', () => {
      Object.defineProperty(window, 'speechSynthesis', {
        writable: true,
        value: undefined
      });

      render(<VoiceSettingsSection />);
      expect(screen.getByText('Voice Settings')).toBeInTheDocument();
    });

    it('should not crash when testing without speechSynthesis', () => {
      Object.defineProperty(window, 'speechSynthesis', {
        writable: true,
        value: undefined
      });

      (useSettingsStore as any).mockReturnValue({
        settings: { ...defaultSettings, voiceAnnouncements: true },
        updateSettings: mockUpdateSettings
      });

      render(<VoiceSettingsSection />);

      const testButton = screen.getByRole('button', { name: 'Test' });
      expect(() => fireEvent.click(testButton)).not.toThrow();
    });
  });
});
