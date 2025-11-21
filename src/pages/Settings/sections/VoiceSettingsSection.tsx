/**
 * VoiceSettingsSection Component
 *
 * Provides voice customization controls for text-to-speech announcements.
 * Allows users to select voice, adjust speech rate, and test settings.
 *
 * Extracted from Settings.tsx as part of Phase 4 refactoring
 */

import React, { useState, useEffect } from 'react';
import { SettingsSection } from '../components/SettingsSection';
import { SettingsRow } from '../components/SettingsRow';
import { SettingsToggle } from '../components/SettingsToggle';
import { useSettingsStore } from '@/stores/settingsStore';
import { Volume2, MessageSquare } from 'lucide-react';

/**
 * VoiceSettingsSection Component
 *
 * Displays voice customization settings including:
 * - Voice announcements toggle
 * - Voice selection dropdown (browser-available voices)
 * - Speech rate slider (0.5x - 2.0x speed)
 * - Test button to preview settings
 *
 * **Features:**
 * - Loads available browser voices
 * - Real-time speech rate preview
 * - Test button with sample announcement
 * - Graceful fallback if voices not available
 *
 * **Use Cases:**
 * - Accessibility: Users with visual impairments
 * - Hands-free operation during dog handling
 * - Customizing notification experience
 * - Testing voice before enabling notifications
 *
 * @example
 * ```tsx
 * <VoiceSettingsSection />
 * ```
 */
export function VoiceSettingsSection(): React.ReactElement {
  const { settings, updateSettings } = useSettingsStore();
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [isTesting, setIsTesting] = useState(false);

  // Load available voices
  useEffect(() => {
    const loadVoices = () => {
      const availableVoices = window.speechSynthesis?.getVoices() || [];
      setVoices(availableVoices);
    };

    // Load voices (some browsers require this event)
    loadVoices();
    if (window.speechSynthesis) {
      window.speechSynthesis.onvoiceschanged = loadVoices;
    }

    return () => {
      if (window.speechSynthesis) {
        window.speechSynthesis.onvoiceschanged = null;
      }
    };
  }, []);

  // Test voice with sample announcement
  const handleTestVoice = () => {
    if (!window.speechSynthesis) {
      console.warn('Speech synthesis not supported');
      return;
    }

    setIsTesting(true);

    // Cancel any ongoing speech
    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance('Your dog is up next in the ring.');
    utterance.rate = settings.voiceRate;

    // Set voice if one is selected
    if (settings.voiceName) {
      const selectedVoice = voices.find(v => v.name === settings.voiceName);
      if (selectedVoice) {
        utterance.voice = selectedVoice;
      }
    }

    utterance.onend = () => setIsTesting(false);
    utterance.onerror = () => setIsTesting(false);

    window.speechSynthesis.speak(utterance);
  };

  return (
    <SettingsSection title="Voice Settings">
      {/* Voice Announcements Toggle */}
      <SettingsRow
        icon={<Volume2 size={20} />}
        label="Voice Announcements"
        description="Speak notifications aloud"
        action={
          <SettingsToggle
            checked={settings.voiceAnnouncements}
            onChange={(checked) => updateSettings({ voiceAnnouncements: checked })}
          />
        }
      />

      {/* Voice Selection Dropdown */}
      {settings.voiceAnnouncements && (
        <>
          <SettingsRow
            icon={<MessageSquare size={20} />}
            label="Voice"
            description={voices.length > 0 ? 'Select voice for announcements' : 'Loading voices...'}
            action={
              <select
                value={settings.voiceName}
                onChange={(e) => updateSettings({ voiceName: e.target.value })}
                className="settings-select"
                disabled={voices.length === 0}
                style={{
                  backgroundColor: 'var(--input-bg)',
                  border: '1px solid var(--input-border)',
                  color: 'var(--input-text)',
                  padding: '6px 12px',
                  borderRadius: '8px',
                  minWidth: '200px'
                }}
              >
                <option value="">Browser Default</option>
                {voices.map((voice) => (
                  <option key={voice.name} value={voice.name}>
                    {voice.name} ({voice.lang})
                  </option>
                ))}
              </select>
            }
          />

          {/* Speech Rate Slider */}
          <SettingsRow
            label="Speech Rate"
            description={`${settings.voiceRate.toFixed(1)}x speed`}
            action={
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', minWidth: '200px' }}>
                <span style={{ color: 'var(--text-secondary)', fontSize: '13px' }}>0.5x</span>
                <input
                  type="range"
                  min="0.5"
                  max="2.0"
                  step="0.1"
                  value={settings.voiceRate}
                  onChange={(e) => updateSettings({ voiceRate: parseFloat(e.target.value) })}
                  style={{
                    flex: 1,
                    cursor: 'pointer'
                  }}
                />
                <span style={{ color: 'var(--text-secondary)', fontSize: '13px' }}>2.0x</span>
              </div>
            }
          />

          {/* Test Button */}
          <SettingsRow
            label="Test Voice"
            description="Preview your voice settings"
            onClick={!isTesting ? handleTestVoice : undefined}
            action={
              <button
                onClick={handleTestVoice}
                disabled={isTesting}
                className="settings-btn"
                style={{
                  background: isTesting ? 'rgba(255,255,255,0.05)' : 'var(--primary)',
                  color: isTesting ? 'var(--text-secondary)' : 'white',
                  border: '1px solid var(--input-border)',
                  padding: '6px 16px',
                  borderRadius: '8px',
                  cursor: isTesting ? 'not-allowed' : 'pointer',
                  fontSize: '14px',
                  fontWeight: 500
                }}
              >
                {isTesting ? 'Speaking...' : 'Test'}
              </button>
            }
          />
        </>
      )}
    </SettingsSection>
  );
}
