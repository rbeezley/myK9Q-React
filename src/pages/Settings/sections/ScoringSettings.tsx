import React from 'react';
import { SettingsSection } from '../components/SettingsSection';
import { SettingsRow } from '../components/SettingsRow';
import { SettingsToggle } from '../components/SettingsToggle';
import { useSettingsStore } from '@/stores/settingsStore';
import voiceAnnouncementService from '@/services/voiceAnnouncementService';
import { Mic, Timer, Hash, Trophy, Volume2 } from 'lucide-react';

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
                                    background: 'rgba(255,255,255,0.05)',
                                    border: '1px solid var(--border-glass)',
                                    color: 'var(--text-primary)',
                                    padding: '6px 12px',
                                    borderRadius: '8px',
                                    maxWidth: '150px'
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
                        description="Announce 30s, 10s, 5s warnings"
                        action={
                            <SettingsToggle
                                checked={settings.announceTimerCountdown}
                                onChange={(checked) => updateSettings({ announceTimerCountdown: checked })}
                            />
                        }
                    />

                    <SettingsRow
                        icon={<Hash size={20} />}
                        label="Run Number"
                        description="Announce armband and dog name"
                        action={
                            <SettingsToggle
                                checked={settings.announceRunNumber}
                                onChange={(checked) => updateSettings({ announceRunNumber: checked })}
                            />
                        }
                    />

                    <SettingsRow
                        icon={<Trophy size={20} />}
                        label="Results"
                        description="Announce qualification & placement"
                        action={
                            <SettingsToggle
                                checked={settings.announceResults}
                                onChange={(checked) => updateSettings({ announceResults: checked })}
                            />
                        }
                    />
                </>
            )}
        </SettingsSection>
    );
};
