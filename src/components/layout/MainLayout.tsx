import { ReactNode } from 'react';
import { PWAInstallBanner } from '../PWAInstallBanner';
import { DatabaseRecovery } from '../diagnostics/DatabaseRecovery';
import { AutoLogoutWarning } from '../ui/AutoLogoutWarning';
import { ToastContainer } from '../notifications/ToastContainer';
import { NotificationCenter } from '../notifications/NotificationCenter';
import { OfflineIndicator, OfflineQueueStatus } from '../ui';
import { MonitoringDashboard } from '../monitoring/MonitoringDashboard';
import { PerformanceMonitor } from '../monitoring/PerformanceMonitor';
import { NetworkInspector } from '../monitoring/NetworkInspector';
import { StateInspector } from '../monitoring/StateInspector';
import { SubscriptionMonitor } from '../debug/SubscriptionMonitor';

interface AutoLogoutState {
  showWarning: boolean;
  secondsRemaining: number;
  extendSession: () => void;
  logoutNow: () => void;
  dismissWarning: () => void;
}

interface MainLayoutProps {
  children: ReactNode;
  autoLogout: AutoLogoutState;
}

/**
 * Main application layout component
 *
 * Provides a consistent layout structure including:
 * - PWA installation banner
 * - Database recovery UI
 * - Auto-logout warning
 * - Toast notifications
 * - Notification center
 * - Offline indicators
 * - Monitoring dashboards
 * - Developer tools
 *
 * @param children - The main application content (typically Routes)
 * @param autoLogout - Auto-logout state and callbacks
 */
export function MainLayout({ children, autoLogout }: MainLayoutProps) {
  return (
    <>
      <PWAInstallBanner />
      <DatabaseRecovery />

      {autoLogout.showWarning && (
        <AutoLogoutWarning
          secondsRemaining={autoLogout.secondsRemaining}
          onExtend={autoLogout.extendSession}
          onLogoutNow={autoLogout.logoutNow}
          onDismiss={autoLogout.dismissWarning}
        />
      )}

      <ToastContainer />
      <NotificationCenter />
      <OfflineIndicator />
      <OfflineQueueStatus />
      {/* SyncFailureToast removed - the OfflineIndicator is more accurate */}
      <MonitoringDashboard />

      {/* Developer Tools */}
      <PerformanceMonitor />
      <NetworkInspector />
      <StateInspector />
      <SubscriptionMonitor />

      {/* Main Application Content */}
      {children}
    </>
  );
}
