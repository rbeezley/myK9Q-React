/**
 * PWAInstallBanner Component
 *
 * Smart banner that appears at the top of the app when:
 * - User is not logged in
 * - App is not installed as PWA
 * - Browser supports PWA installation
 *
 * Disappears automatically when app is installed.
 * Separate from push notification settings.
 */

import { useState } from 'react';
import { usePWAInstall } from '@/hooks/usePWAInstall';
import { Download, X } from 'lucide-react';
import './PWAInstallBanner.css';

export function PWAInstallBanner() {
  const { isInstalled, canInstall, promptInstall } = usePWAInstall();
  // Check if banner was previously dismissed using lazy initializer
  const [isDismissed, setIsDismissed] = useState(() => {
    const dismissed = localStorage.getItem('pwa_banner_dismissed');
    return dismissed === 'true';
  });

  // Don't show if installed, can't install, or user dismissed
  if (isInstalled || !canInstall || isDismissed) {
    return null;
  }

  const handleDismiss = () => {
    setIsDismissed(true);
    localStorage.setItem('pwa_banner_dismissed', 'true');
  };

  const handleInstall = async () => {
    const success = await promptInstall();
    if (success) {
      // Banner will auto-hide when isInstalled becomes true
      localStorage.removeItem('pwa_banner_dismissed');
    }
  };

  return (
    <div className="pwa-install-banner">
      <div className="pwa-banner-content">
        <Download size={20} className="pwa-banner-icon" />
        <div className="pwa-banner-text">
          <strong>Install myK9Q</strong>
          <span>Quick access from your home screen</span>
        </div>
        <button
          className="pwa-banner-install-btn"
          onClick={handleInstall}
        >
          Install
        </button>
        <button
          className="pwa-banner-close-btn"
          onClick={handleDismiss}
          aria-label="Dismiss banner"
        >
          <X size={18} />
        </button>
      </div>
    </div>
  );
}
