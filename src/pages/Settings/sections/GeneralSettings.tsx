import React from 'react';
import { SettingsSection } from '../components/SettingsSection';
import { SettingsRow } from '../components/SettingsRow';
import { SettingsToggle } from '../components/SettingsToggle';
import { useSettingsStore } from '@/stores/settingsStore';
import { Smartphone, RefreshCw, RotateCcw } from 'lucide-react';

interface GeneralSettingsProps {
    onShowOnboarding: () => void;
}

export const GeneralSettings: React.FC<GeneralSettingsProps> = ({ onShowOnboarding }) => {
    const { settings, updateSettings } = useSettingsStore();

    return (
        <SettingsSection title="General">
            <SettingsRow
                icon={<Smartphone size={20} />}
                label="Haptic Feedback"
                description="Vibrate on touch interactions"
                action={
                    <SettingsToggle
                        checked={settings.hapticFeedback}
                        onChange={(checked) => updateSettings({ hapticFeedback: checked })}
                    />
                }
            />

            <SettingsRow
                icon={<RefreshCw size={20} />}
                label="Pull to Refresh"
                description="Swipe down to reload lists"
                action={
                    <SettingsToggle
                        checked={settings.pullToRefresh}
                        onChange={(checked) => updateSettings({ pullToRefresh: checked })}
                    />
                }
            />

            <SettingsRow
                icon={<RotateCcw size={20} />}
                label="Replay Onboarding"
                description="View the welcome tour again"
                onClick={onShowOnboarding}
            />
        </SettingsSection>
    );
};
