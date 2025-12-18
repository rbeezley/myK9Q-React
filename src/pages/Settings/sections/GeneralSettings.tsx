import React from 'react';
import { SettingsSection } from '../components/SettingsSection';
import { SettingsRow } from '../components/SettingsRow';
import { SettingsToggle } from '../components/SettingsToggle';
import { useSettingsStore } from '@/stores/settingsStore';
import { Smartphone, RotateCcw } from 'lucide-react';

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
                icon={<RotateCcw size={20} />}
                label="Replay Onboarding"
                description="View the welcome tour again"
                onClick={onShowOnboarding}
            />
        </SettingsSection>
    );
};
