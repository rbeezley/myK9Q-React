import React from 'react';
import { SettingsSection } from '../components/SettingsSection';
import { SettingsRow } from '../components/SettingsRow';
import { SettingsToggle } from '../components/SettingsToggle';
import { useSettingsStore } from '@/stores/settingsStore';
import voiceAnnouncementService from '@/services/voiceAnnouncementService';
import { Mic, Timer, Volume2 } from 'lucide-react';

export const ScoringSettings: React.FC = () => {
    const { settings, updateSettings } = useSettingsStore();

    return (
        <SettingsSection title="Scoring">
            <SettingsRow
                icon={<Mic size={20} />}
                label="Voice Announcements"
                description="Speak timer warnings and results"
                action={
                    <SettingsToggle
                        checked={settings.voiceAnnouncements}
                        onChange={(checked) => updateSettings({ voiceAnnouncements: checked })}
                    />
                }
            />

            {settings.voiceAnnouncements && (
                <>
                    <SettingsRow
                        label="Voice"
                        description="Choose speaker"
                        action={
                            <select
                                value={settings.voiceName}
                                onChange={(e) => updateSettings({ voiceName: e.target.value })}
                                className="settings-select"
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
                                {voiceAnnouncementService.getAvailableVoices()
                                    .filter(v => v.lang.startsWith('en'))
                                    .map(v => (
                                        <option key={v.name} value={v.name}>{v.name}</option>
                                    ))
                                }
                            </select>
                        }
                    />

                    <SettingsRow
                        label={`Speed: ${settings.voiceRate}x`}
                        description="Speaking rate"
                        action={
                            <input
                                type="range"
                                min="0.5"
                                max="2.0"
                                step="0.1"
                                value={settings.voiceRate}
                                onChange={(e) => updateSettings({ voiceRate: parseFloat(e.target.value) })}
                                style={{ width: '100px', accentColor: 'var(--accent-primary)' }}
                            />
                        }
                    />

                    <SettingsRow
                        icon={<Volume2 size={20} />}
                        label="Test Voice"
                        description="Tap to hear a sample"
                        onClick={() => voiceAnnouncementService.testVoice()}
                    />

                    <SettingsRow
                        icon={<Timer size={20} />}
                        label="Timer Countdown"
                        description="Announce 30 second warning"
                        action={
                            <SettingsToggle
                                checked={settings.announceTimerCountdown}
                                onChange={(checked) => updateSettings({ announceTimerCountdown: checked })}
                            />
                        }
                    />
                </>
            )}
        </SettingsSection>
    );
};
