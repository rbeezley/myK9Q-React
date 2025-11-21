import React from 'react';
import { SettingsSection } from '../components/SettingsSection';
import { SettingsRow } from '../components/SettingsRow';
import { SettingsToggle } from '../components/SettingsToggle';
import { useSettingsStore } from '@/stores/settingsStore';
import { Bell, Volume2, Mic, AlertCircle, CheckCircle } from 'lucide-react';

interface NotificationSettingsProps {
    isPushSubscribed: boolean;
    isSubscribing: boolean;
    permissionState: NotificationPermission;
    onPushToggle: (enabled: boolean) => void;
    browserCompatibility: any;
}

export const NotificationSettings: React.FC<NotificationSettingsProps> = ({
    isPushSubscribed,
    isSubscribing,
    permissionState,
    onPushToggle,
    browserCompatibility: _browserCompatibility
}) => {
    const { settings, updateSettings } = useSettingsStore();

    return (
        <SettingsSection title="Notifications">
            {/* Master Toggle */}
            <SettingsRow
                icon={<Bell size={20} />}
                label="Enable Notifications"
                description="Get alerts when your dog is up next"
                action={
                    <SettingsToggle
                        checked={settings.enableNotifications}
                        onChange={onPushToggle}
                        disabled={isSubscribing}
                    />
                }
            />

            {/* Warnings / Status */}
            {settings.enableNotifications && (
                <div style={{ padding: '0 20px 16px 20px' }}>
                    {permissionState === 'denied' && (
                        <div style={{
                            background: 'rgba(239, 68, 68, 0.1)',
                            border: '1px solid rgba(239, 68, 68, 0.2)',
                            borderRadius: '8px',
                            padding: '12px',
                            display: 'flex',
                            gap: '12px',
                            alignItems: 'start'
                        }}>
                            <AlertCircle size={18} color="#ef4444" style={{ marginTop: '2px' }} />
                            <div>
                                <div style={{ color: '#ef4444', fontWeight: 600, fontSize: '14px' }}>Notifications Blocked</div>
                                <div style={{ color: 'var(--text-secondary)', fontSize: '13px', marginTop: '4px' }}>
                                    Please enable notifications in your browser settings to receive alerts.
                                </div>
                            </div>
                        </div>
                    )}

                    {permissionState === 'granted' && isPushSubscribed && (
                        <div style={{
                            background: 'rgba(16, 185, 129, 0.1)',
                            border: '1px solid rgba(16, 185, 129, 0.2)',
                            borderRadius: '8px',
                            padding: '12px',
                            display: 'flex',
                            gap: '12px',
                            alignItems: 'center'
                        }}>
                            <CheckCircle size={18} color="#10b981" />
                            <div style={{ color: '#10b981', fontWeight: 600, fontSize: '14px' }}>
                                Active & Ready
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* Sub-settings */}
            {settings.enableNotifications && (
                <>
                    <SettingsRow
                        label="Notify when my dog is..."
                        description="Set your lead time preference"
                        action={
                            <select
                                value={settings.notifyYourTurnLeadDogs}
                                onChange={(e) => updateSettings({ notifyYourTurnLeadDogs: parseInt(e.target.value) as any })}
                                className="settings-select"
                                style={{
                                    backgroundColor: 'var(--input-bg)',
                                    border: '1px solid var(--input-border)',
                                    color: 'var(--input-text)',
                                    padding: '6px 12px',
                                    borderRadius: '8px'
                                }}
                            >
                                <option value="1">Next in ring</option>
                                <option value="2">2nd in line</option>
                                <option value="3">3rd in line</option>
                                <option value="4">4th in line</option>
                                <option value="5">5th in line</option>
                            </select>
                        }
                    />

                    <SettingsRow
                        icon={<Volume2 size={20} />}
                        label="Sound"
                        description="Play sound with alerts"
                        action={
                            <SettingsToggle
                                checked={settings.notificationSound}
                                onChange={(checked) => updateSettings({ notificationSound: checked })}
                            />
                        }
                    />

                    <SettingsRow
                        icon={<Mic size={20} />}
                        label="Voice Announcements"
                        description="Speak notifications aloud"
                        action={
                            <SettingsToggle
                                checked={settings.voiceNotifications}
                                onChange={(checked) => updateSettings({ voiceNotifications: checked })}
                            />
                        }
                    />
                </>
            )}
        </SettingsSection>
    );
};
