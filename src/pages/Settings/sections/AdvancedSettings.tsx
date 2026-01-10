import React, { useState } from 'react';
import { SettingsSection } from '../components/SettingsSection';
import { SettingsRow } from '../components/SettingsRow';
import { SettingsToggle } from '../components/SettingsToggle';
import { useSettingsStore } from '@/stores/settingsStore';
import { Database, Download, Trash2, Terminal, RefreshCw, ShieldAlert } from 'lucide-react';
import { formatBytes } from '@/services/dataExportService';
import { useRateLimitSettings } from '@/pages/Admin/hooks/useRateLimitSettings';

interface AdvancedSettingsProps {
    storageUsage: { estimated: number; quota: number; percentUsed: number; localStorageSize: number } | null;
    onExportData: () => void;
    onClearData: () => void;
    onExportSettings: () => void;
    onImportSettings: () => void;
    onRefreshAllData: () => void;
    isClearing: boolean;
    isRefreshing: boolean;
}

export const AdvancedSettings: React.FC<AdvancedSettingsProps> = ({
    storageUsage,
    onExportData,
    onClearData,
    onExportSettings,
    onImportSettings,
    onRefreshAllData,
    isClearing,
    isRefreshing
}) => {
    const { settings, updateSettings } = useSettingsStore();
    const { clearAllRateLimits, isLoading: isClearingRateLimits } = useRateLimitSettings();
    const [rateLimitMessage, setRateLimitMessage] = useState<string | null>(null);

    const handleClearRateLimits = async () => {
        const result = await clearAllRateLimits();
        setRateLimitMessage(result.message);
        // Clear message after 3 seconds
        setTimeout(() => setRateLimitMessage(null), 3000);
    };

    return (
        <SettingsSection title="Advanced (Admin)">
            {/* Data Management */}
            <SettingsRow
                icon={<Database size={20} />}
                label="Storage Usage"
                description={storageUsage ? `${formatBytes(storageUsage.estimated)} used (${storageUsage.percentUsed.toFixed(1)}%)` : 'Calculating...'}
            />

            <SettingsRow
                icon={<RefreshCw size={20} />}
                label={isRefreshing ? "Refreshing..." : "Refresh All Data"}
                description="Sync changes, clear cache, reload fresh data"
                onClick={onRefreshAllData}
            />

            <SettingsRow
                icon={<Download size={20} />}
                label="Export My Data"
                description="Download a backup of your data"
                onClick={onExportData}
            />

            <SettingsRow
                icon={<Download size={20} />}
                label="Export Settings"
                description="Backup your preferences"
                onClick={onExportSettings}
            />

            <SettingsRow
                icon={<Download size={20} />}
                label="Import Settings"
                description="Restore preferences from file"
                onClick={onImportSettings}
            />

            <SettingsRow
                icon={<Trash2 size={20} />}
                label={isClearing ? "Clearing..." : "Clear All Data"}
                description="Permanently delete local data"
                isDestructive
                onClick={onClearData}
            />

            {/* Login Rate Limits */}
            <SettingsRow
                icon={<ShieldAlert size={20} />}
                label={isClearingRateLimits ? "Clearing..." : "Clear Login Rate Limits"}
                description={rateLimitMessage || "Unblock users locked out by failed login attempts"}
                onClick={handleClearRateLimits}
            />

            {/* Developer Tools */}
            <SettingsRow
                icon={<Terminal size={20} />}
                label="Developer Mode"
                description="Enable debugging tools"
                action={
                    <SettingsToggle
                        checked={settings.developerMode}
                        onChange={(checked) => updateSettings({ developerMode: checked })}
                    />
                }
            />

            {settings.developerMode && (
                <SettingsRow
                    label="Console Logging"
                    description="Verbosity level"
                    action={
                        <select
                            value={settings.consoleLogging}
                            onChange={(e) => updateSettings({ consoleLogging: e.target.value as 'none' | 'errors' | 'all' })}
                            className="settings-select"
                            style={{
                                backgroundColor: 'var(--input-bg)',
                                border: '1px solid var(--input-border)',
                                color: 'var(--input-text)',
                                padding: '6px 12px',
                                borderRadius: '8px'
                            }}
                        >
                            <option value="none">None</option>
                            <option value="errors">Errors</option>
                            <option value="all">All</option>
                        </select>
                    }
                />
            )}
        </SettingsSection>
    );
};
