/**
 * VoiceSettingsSection Component
 *
 * Shared voice configuration for all voice announcements.
 * Settings here apply to both notification voice and scoring/timer voice.
 * The toggles to enable voice are in the respective sections (Notifications, Scoring).
 */

import React, { useState, useEffect, useMemo } from 'react';
import { SettingsSection } from '../components/SettingsSection';
import { SettingsRow } from '../components/SettingsRow';
import { useSettingsStore } from '@/stores/settingsStore';
import { Volume2, MessageSquare, Info } from 'lucide-react';
import voiceAnnouncementService from '@/services/voiceAnnouncementService';

/**
 * Detect if running on iOS device
 */
function isIOSDevice(): boolean {
    const ua = navigator.userAgent;
    return /iPad|iPhone|iPod/.test(ua) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
}

/**
 * Detect if running as installed PWA (standalone mode)
 */
function isStandaloneMode(): boolean {
    return window.matchMedia('(display-mode: standalone)').matches ||
           (window.navigator as unknown as { standalone?: boolean }).standalone === true;
}

export function VoiceSettingsSection(): React.ReactElement {
    const { settings, updateSettings } = useSettingsStore();
    const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
    const [isTesting, setIsTesting] = useState(false);

    // Detect iOS + PWA limitation
    const showIOSWarning = useMemo(() => {
        return isIOSDevice();
    }, []);

    const isInstalledPWA = useMemo(() => {
        return isStandaloneMode();
    }, []);

    // Load available voices
    useEffect(() => {
        const loadVoices = () => {
            const availableVoices = window.speechSynthesis?.getVoices() || [];
            // Filter to English voices for clarity
            const englishVoices = availableVoices.filter(v => v.lang.startsWith('en'));
            setVoices(englishVoices);
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
        setIsTesting(true);
        voiceAnnouncementService.testVoice('This is a test of your selected voice.');
        // Reset after speech completes (estimate ~3 seconds)
        setTimeout(() => setIsTesting(false), 3000);
    };

    return (
        <SettingsSection title="Voice Settings">
            {/* iOS Voice Limitation Warning */}
            {showIOSWarning && (
                <div style={{
                    display: 'flex',
                    gap: '12px',
                    padding: '12px 16px',
                    backgroundColor: 'var(--warning-bg, rgba(251, 191, 36, 0.1))',
                    borderRadius: '8px',
                    marginBottom: '16px',
                    alignItems: 'flex-start'
                }}>
                    <Info size={20} style={{ color: 'var(--warning-text, #d97706)', flexShrink: 0, marginTop: '2px' }} />
                    <div style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>
                        <strong style={{ color: 'var(--warning-text, #d97706)' }}>iOS Limitation:</strong>
                        {' '}
                        {isInstalledPWA ? (
                            <>Voice announcements don&apos;t work when installed as an app. Open myK9Q in Safari browser to use voice features.</>
                        ) : (
                            <>Voice announcements may not work when this app is installed to your home screen. For reliable voice, use Safari browser directly.</>
                        )}
                    </div>
                </div>
            )}

            <SettingsRow
                icon={<MessageSquare size={20} />}
                label="Voice"
                description={voices.length > 0 ? 'Choose speaker' : 'Loading voices...'}
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
                            minWidth: '180px'
                        }}
                    >
                        <option value="">Default</option>
                        {voices.map((voice) => (
                            <option key={voice.name} value={voice.name}>
                                {voice.name}
                            </option>
                        ))}
                    </select>
                }
            />

            <SettingsRow
                label={`Speed: ${settings.voiceRate.toFixed(1)}x`}
                description="Speaking rate"
                action={
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ color: 'var(--text-secondary)', fontSize: '12px' }}>0.5x</span>
                        <input
                            type="range"
                            min="0.5"
                            max="2.0"
                            step="0.1"
                            value={settings.voiceRate}
                            onChange={(e) => updateSettings({ voiceRate: parseFloat(e.target.value) })}
                            style={{ width: '100px', accentColor: 'var(--accent-primary)' }}
                        />
                        <span style={{ color: 'var(--text-secondary)', fontSize: '12px' }}>2x</span>
                    </div>
                }
            />

            <SettingsRow
                icon={<Volume2 size={20} />}
                label={isTesting ? 'Speaking...' : 'Test Voice'}
                description="Tap to hear a sample"
                onClick={!isTesting ? handleTestVoice : undefined}
            />
        </SettingsSection>
    );
}
