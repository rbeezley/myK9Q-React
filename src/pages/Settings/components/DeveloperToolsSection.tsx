/**
 * DeveloperToolsSection Component
 *
 * Provides developer tools and debugging controls for advanced users.
 * Includes performance monitors, network inspector, and console logging.
 *
 * Extracted from AdvancedSettings.tsx
 */

import React from 'react';
import { SettingsRow } from './SettingsRow';
import { SettingsToggle } from './SettingsToggle';
import { Terminal, Activity, Cpu, Network } from 'lucide-react';
import { useSettingsStore } from '@/stores/settingsStore';

/**
 * DeveloperToolsSection Component
 *
 * Displays developer mode toggle and conditionally shows debugging tools:
 * - FPS Counter: Frame rate monitor for performance tracking
 * - Memory Monitor: Real-time memory usage display
 * - Network Inspector: Network request monitoring
 * - Console Logging: Verbosity level control (none/errors/all)
 *
 * **Features:**
 * - Developer mode master toggle
 * - Conditional display of debug tools
 * - Independent control of each monitor
 * - Console logging verbosity selection
 * - Settings persist across sessions
 *
 * **Use Cases:**
 * - Performance debugging and optimization
 * - Identifying bottlenecks in production
 * - Monitoring network requests
 * - Troubleshooting with verbose logging
 * - Beta feature testing
 *
 * @example
 * ```tsx
 * <DeveloperToolsSection />
 * ```
 */
export function DeveloperToolsSection(): React.ReactElement {
  const { settings, updateSettings } = useSettingsStore();

  return (
    <>
      {/* Developer Mode Toggle */}
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

      {/* Conditional Developer Tools */}
      {settings.developerMode && (
        <>
          {/* FPS Counter */}
          <SettingsRow
            icon={<Activity size={20} />}
            label="FPS Counter"
            description="Display frames per second"
            action={
              <SettingsToggle
                checked={settings.devShowFPS}
                onChange={(checked) => updateSettings({ devShowFPS: checked })}
              />
            }
          />

          {/* Memory Monitor */}
          <SettingsRow
            icon={<Cpu size={20} />}
            label="Memory Monitor"
            description="Show memory usage stats"
            action={
              <SettingsToggle
                checked={settings.devShowMemory}
                onChange={(checked) => updateSettings({ devShowMemory: checked })}
              />
            }
          />

          {/* Network Inspector */}
          <SettingsRow
            icon={<Network size={20} />}
            label="Network Inspector"
            description="Monitor network requests"
            action={
              <SettingsToggle
                checked={settings.devShowNetwork}
                onChange={(checked) => updateSettings({ devShowNetwork: checked })}
              />
            }
          />

          {/* Console Logging */}
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
    </>
  );
}
