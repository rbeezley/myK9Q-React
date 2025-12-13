import React, { useState } from 'react';
import { SettingsSection } from '../components/SettingsSection';
import { SettingsRow } from '../components/SettingsRow';
import { SettingsToggle } from '../components/SettingsToggle';
import { useSettingsStore } from '@/stores/settingsStore';
import { Bell, Mic, AlertCircle, CheckCircle, Send } from 'lucide-react';
import type { BrowserCompatibility } from '../components/PushNotificationSettings';
import { useAuth } from '@/contexts/AuthContext';

interface NotificationSettingsProps {
    isPushSubscribed: boolean;
    isSubscribing: boolean;
    permissionState: NotificationPermission;
    onPushToggle: (enabled: boolean) => void;
    browserCompatibility: BrowserCompatibility | null;
}

export const NotificationSettings: React.FC<NotificationSettingsProps> = ({
    isPushSubscribed,
    isSubscribing,
    permissionState,
    onPushToggle,
    browserCompatibility: _browserCompatibility
}) => {
    const { settings, updateSettings } = useSettingsStore();
    const { showContext } = useAuth();
    const [testSent, setTestSent] = useState(false);

    /**
     * Send a test notification
     * In production: Uses service worker's SIMULATE_PUSH handler
     * In development: Falls back to direct Notification API (SW is disabled in dev)
     */
    const handleTestNotification = async () => {
        try {
            // Check if service worker is available (it's disabled in dev mode)
            const hasServiceWorker = 'serviceWorker' in navigator && navigator.serviceWorker.controller;

            if (hasServiceWorker) {
                // Production path: Use service worker
                const registration = await navigator.serviceWorker.ready;

                if (registration.active) {
                    const message = {
                        type: 'SIMULATE_PUSH',
                        data: {
                            title: 'Test Notification',
                            content: 'This is a test notification to check styling on your device.',
                            showName: showContext?.showName || 'myK9Q',
                            priority: 'normal',
                            licenseKey: showContext?.licenseKey || 'test'
                        }
                    };
                    registration.active.postMessage(message);
                }
            } else {
                // Development fallback: Use Notification API directly
                const showName = showContext?.showName || 'myK9Q';
                new Notification(`${showName}: Test Notification`, {
                    body: 'This is a test notification to check styling on your device.',
                    icon: '/myK9Q-teal-192.png',
                    badge: '/myK9Q-teal-96.png',
                    tag: `test-${Date.now()}`,
                });
            }

            setTestSent(true);
            // Reset after 3 seconds
            setTimeout(() => setTestSent(false), 3000);
        } catch (error) {
            console.error('[NotificationSettings] Failed to send test notification:', error);
        }
    };

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
                            <AlertCircle size={18} style={{ marginTop: '2px', color: 'var(--token-error)' }} />
                            <div>
                                <div style={{ color: 'var(--token-error)', fontWeight: 600, fontSize: '14px' }}>Notifications Blocked</div>
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
                            <CheckCircle size={18} style={{ color: 'var(--token-success)' }} />
                            <div style={{ color: 'var(--token-success)', fontWeight: 600, fontSize: '14px' }}>
                                Active & Ready
                            </div>
                        </div>
                    )}

                    {/* Test Notification Button - always show when notifications enabled */}
                    <button
                        onClick={handleTestNotification}
                        disabled={testSent || permissionState !== 'granted'}
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '8px',
                            width: '100%',
                            padding: '10px 16px',
                            marginTop: '12px',
                            fontSize: '14px',
                            fontWeight: 500,
                            color: testSent ? 'var(--token-success)' : permissionState !== 'granted' ? 'var(--text-muted)' : 'var(--text-primary)',
                            background: testSent ? 'rgba(16, 185, 129, 0.15)' : 'var(--card-bg)',
                            border: '1px solid var(--card-border)',
                            borderRadius: '8px',
                            cursor: testSent || permissionState !== 'granted' ? 'default' : 'pointer',
                            transition: 'all 0.2s'
                        }}
                    >
                        <Send size={16} />
                        {testSent ? 'Test Notification Sent!' : permissionState !== 'granted' ? 'Grant Permission First' : 'Send Test Notification'}
                    </button>
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
                                onChange={(e) => updateSettings({ notifyYourTurnLeadDogs: parseInt(e.target.value) as 1 | 2 | 3 | 4 | 5 })}
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
