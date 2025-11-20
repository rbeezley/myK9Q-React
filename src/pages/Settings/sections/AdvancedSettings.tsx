import React from 'react';
import { SettingsSection } from '../components/SettingsSection';
import { SettingsRow } from '../components/SettingsRow';
import { SettingsToggle } from '../components/SettingsToggle';
import { useSettingsStore } from '@/stores/settingsStore';
import { Database, Download, Trash2, Terminal, Activity, Network, Cpu } from 'lucide-react';
import { formatBytes } from '@/services/dataExportService';

interface AdvancedSettingsProps {
    storageUsage: { estimated: number; quota: number; percentUsed: number; localStorageSize: number } | null;
    onExportData: () => void;
    onClearData: () => void;
    onExportSettings: () => void;
    onImportSettings: () => void;
    isClearing: boolean;
}

export const AdvancedSettings: React.FC<AdvancedSettingsProps> = ({
    storageUsage,
    onExportData,
    onClearData,
    onExportSettings,
    onImportSettings,
    isClearing
}) => {
    const { settings, updateSettings } = useSettingsStore();

    return (
        <SettingsSection title="Advanced (Admin)">
            {/* Data Management */}
            <SettingsRow
                icon={<Database size={20} />}
                label="Storage Usage"
                description={storageUsage ? `${formatBytes(storageUsage.estimated)} used (${storageUsage.percentUsed.toFixed(1)}%)` : 'Calculating...'}
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
                <>
                    <SettingsRow
                        icon={<Activity size={20} />}
                        label="FPS Counter"
                        action={
                            <SettingsToggle
                                checked={settings.devShowFPS}
                                onChange={(checked) => updateSettings({ devShowFPS: checked })}
                            />
                        }
                    />
                    <SettingsRow
                        icon={<Cpu size={20} />}
                        label="Memory Monitor"
                        action={
                            <SettingsToggle
                                checked={settings.devShowMemory}
                                onChange={(checked) => updateSettings({ devShowMemory: checked })}
                            />
                        }
                    />
                    <SettingsRow
                        icon={<Network size={20} />}
                        label="Network Inspector"
                        action={
                            <SettingsToggle
                                checked={settings.devShowNetwork}
                                onChange={(checked) => updateSettings({ devShowNetwork: checked })}
                            />
                        }
                    />
                    <SettingsRow
                        label="Console Logging"
                        description="Verbosity level"
                        action={
                            <select
                                value={settings.consoleLogging}
                                onChange={(e) => updateSettings({ consoleLogging: e.target.value as any })}
                                className="settings-select"
                                style={{
                                    background: 'rgba(255,255,255,0.05)',
                                    border: '1px solid var(--border-glass)',
                                    color: 'var(--text-primary)',
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
                </>
            )}
        </SettingsSection>
    );
};
