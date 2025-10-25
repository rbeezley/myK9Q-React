/**
 * Performance Settings Panel
 *
 * User-facing settings for performance preferences.
 * Allows users to see device info and override performance mode.
 */

import { useState } from 'react';
import { useDeviceCapabilities, usePerformanceSettings } from '@/hooks/usePerformance';
import { setPerformanceOverrides } from '@/utils/deviceDetection';
import './shared-ui.css';

export interface PerformanceSettingsPanelProps {
  /** Callback when settings change */
  onSettingsChange?: () => void;

  /** Show as modal */
  isModal?: boolean;

  /** Close modal callback */
  onClose?: () => void;
}

export function PerformanceSettingsPanel({
  onSettingsChange,
  isModal = false,
  onClose,
}: PerformanceSettingsPanelProps) {
  const capabilities = useDeviceCapabilities();
  const settings = usePerformanceSettings();
  const [selectedMode, setSelectedMode] = useState<'auto' | 'low' | 'medium' | 'high'>('auto');

  if (!capabilities || !settings) {
    return null;
  }

  const handleModeChange = (mode: 'auto' | 'low' | 'medium' | 'high') => {
    setSelectedMode(mode);

    if (mode === 'auto') {
      // Reset to auto-detection
      localStorage.removeItem('myK9Q_perf_overrides');
      window.location.reload();
      return;
    }

    const overrides = {
      low: {
        animations: false,
        blurEffects: false,
        shadows: false,
        virtualScrollThreshold: 20,
        realTimeSync: false,
        prefetchLevel: 0.3,
        imageQuality: 0.7,
        maxConcurrentRequests: 2,
      },
      medium: {
        animations: true,
        blurEffects: false,
        shadows: true,
        virtualScrollThreshold: 30,
        realTimeSync: true,
        prefetchLevel: 0.7,
        imageQuality: 0.85,
        maxConcurrentRequests: 4,
      },
      high: {
        animations: true,
        blurEffects: true,
        shadows: true,
        virtualScrollThreshold: 50,
        realTimeSync: true,
        prefetchLevel: 1,
        imageQuality: 1,
        maxConcurrentRequests: 6,
      },
    };

    setPerformanceOverrides(overrides[mode]);
    onSettingsChange?.();
  };

  const getTierIcon = (tier: string) => {
    switch (tier) {
      case 'high':
        return '🚀';
      case 'medium':
        return '⚡';
      case 'low':
        return '🔋';
      default:
        return '📱';
    }
  };

  const getTierLabel = (tier: string) => {
    switch (tier) {
      case 'high':
        return 'High Performance';
      case 'medium':
        return 'Balanced';
      case 'low':
        return 'Power Saver';
      default:
        return 'Unknown';
    }
  };

  const content = (
    <div className="perf-settings-content">
      <div className="perf-settings-header">
        <h2>Performance Settings</h2>
        {isModal && onClose && (
          <button className="perf-close-btn" onClick={onClose} aria-label="Close">
            ✕
          </button>
        )}
      </div>

      <div className="perf-section">
        <h3>Your Device</h3>
        <div className="device-info-card">
          <div className="device-tier-badge">
            <span className="tier-icon">{getTierIcon(capabilities.tier)}</span>
            <div className="tier-info">
              <div className="tier-label">{getTierLabel(capabilities.tier)}</div>
              <div className="tier-sublabel">Automatically detected</div>
            </div>
          </div>

          <div className="device-specs">
            <div className="spec-item">
              <span className="spec-label">Processor</span>
              <span className="spec-value">{capabilities.cores} cores</span>
            </div>
            <div className="spec-item">
              <span className="spec-label">Memory</span>
              <span className="spec-value">{capabilities.memory}GB RAM</span>
            </div>
            <div className="spec-item">
              <span className="spec-label">Graphics</span>
              <span className="spec-value">{capabilities.gpu}</span>
            </div>
            <div className="spec-item">
              <span className="spec-label">Connection</span>
              <span className="spec-value">{capabilities.connection}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="perf-section">
        <h3>Performance Mode</h3>
        <p className="perf-description">
          Choose how the app should perform. Auto mode adapts to your device automatically.
        </p>

        <div className="perf-modes">
          <label className={`perf-mode-card ${selectedMode === 'auto' ? 'selected' : ''}`}>
            <input
              type="radio"
              name="performance-mode"
              value="auto"
              checked={selectedMode === 'auto'}
              onChange={() => handleModeChange('auto')}
            />
            <div className="mode-icon">🎯</div>
            <div className="mode-info">
              <div className="mode-name">Auto</div>
              <div className="mode-desc">Adapts to your device</div>
            </div>
          </label>

          <label className={`perf-mode-card ${selectedMode === 'high' ? 'selected' : ''}`}>
            <input
              type="radio"
              name="performance-mode"
              value="high"
              checked={selectedMode === 'high'}
              onChange={() => handleModeChange('high')}
            />
            <div className="mode-icon">🚀</div>
            <div className="mode-info">
              <div className="mode-name">High Performance</div>
              <div className="mode-desc">All effects enabled</div>
            </div>
          </label>

          <label className={`perf-mode-card ${selectedMode === 'medium' ? 'selected' : ''}`}>
            <input
              type="radio"
              name="performance-mode"
              value="medium"
              checked={selectedMode === 'medium'}
              onChange={() => handleModeChange('medium')}
            />
            <div className="mode-icon">⚡</div>
            <div className="mode-info">
              <div className="mode-name">Balanced</div>
              <div className="mode-desc">Good speed & battery</div>
            </div>
          </label>

          <label className={`perf-mode-card ${selectedMode === 'low' ? 'selected' : ''}`}>
            <input
              type="radio"
              name="performance-mode"
              value="low"
              checked={selectedMode === 'low'}
              onChange={() => handleModeChange('low')}
            />
            <div className="mode-icon">🔋</div>
            <div className="mode-info">
              <div className="mode-name">Power Saver</div>
              <div className="mode-desc">Best battery life</div>
            </div>
          </label>
        </div>
      </div>

      <div className="perf-section">
        <h3>Current Settings</h3>
        <div className="settings-grid">
          <div className="setting-item">
            <span className="setting-label">Animations</span>
            <span className="setting-value">{settings.animations ? 'On' : 'Off'}</span>
          </div>
          <div className="setting-item">
            <span className="setting-label">Visual Effects</span>
            <span className="setting-value">{settings.blurEffects ? 'On' : 'Off'}</span>
          </div>
          <div className="setting-item">
            <span className="setting-label">Real-time Sync</span>
            <span className="setting-value">{settings.realTimeSync ? 'On' : 'Off'}</span>
          </div>
          <div className="setting-item">
            <span className="setting-label">Image Quality</span>
            <span className="setting-value">{(settings.imageQuality * 100).toFixed(0)}%</span>
          </div>
        </div>
      </div>

      <div className="perf-footer">
        <p className="perf-note">
          💡 <strong>Tip:</strong> Auto mode is recommended for best experience.
          Manual modes require page reload to apply.
        </p>
      </div>
    </div>
  );

  if (isModal) {
    return (
      <div className="perf-settings-modal-overlay" onClick={onClose}>
        <div className="perf-settings-modal" onClick={(e) => e.stopPropagation()}>
          {content}
        </div>
      </div>
    );
  }

  return <div className="perf-settings-panel">{content}</div>;
}
