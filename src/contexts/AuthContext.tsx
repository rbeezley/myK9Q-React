import React, { createContext, useContext, useState, useCallback } from 'react';
import { UserRole, UserPermissions, getPermissionsForRole } from '../utils/auth';
import { initializeReplication, clearReplicationCaches, resetReplicationState } from '@/services/replication/initReplication';
import { useOfflineQueueStore } from '@/stores/offlineQueueStore';
import { logger } from '@/utils/logger';

interface ShowContext {
  showId: string;
  showName: string;
  clubName: string;
  showDate: string;
  licenseKey: string;
  org: string; // Organization type (e.g., 'UKC Obedience', 'AKC Scent Work')
  competition_type: string; // Competition type (e.g., 'National', 'Regular')
  showType?: string; // Show type for nationals detection
}

interface AuthState {
  isAuthenticated: boolean;
  role: UserRole | null;
  permissions: UserPermissions | null;
  showContext: ShowContext | null;
  passcode: string | null;
}

interface AuthContextType extends AuthState {
  login: (passcode: string, showData: ShowContext) => void;
  logout: () => void;
  canAccess: (permission: keyof UserPermissions) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// eslint-disable-next-line react-refresh/only-export-components
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: React.ReactNode;
}

const loadAuthFromStorage = (): AuthState => {
  try {
    const stored = localStorage.getItem('myK9Q_auth');
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (error) {
    console.error('Error loading auth from storage:', error);
  }
  
  return {
    isAuthenticated: false,
    role: null,
    permissions: null,
    showContext: null,
    passcode: null,
  };
};

const saveAuthToStorage = (authState: AuthState) => {
  try {
    localStorage.setItem('myK9Q_auth', JSON.stringify(authState));
  } catch (error) {
    console.error('Error saving auth to storage:', error);
  }
};

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [authState, setAuthState] = useState<AuthState>(loadAuthFromStorage);

  const login = useCallback(async (passcode: string, showData: ShowContext) => {
    // CRITICAL: Clear caches on EVERY login to ensure fresh data
    // This handles:
    // 1. Show switch (different license key)
    // 2. Re-login after logout (previousLicenseKey is null but cache may be stale)
    // 3. Re-login to same show (cache may be stale from previous session)
    const previousLicenseKey = authState.showContext?.licenseKey;
    const newLicenseKey = showData.licenseKey;
    const isShowSwitch = previousLicenseKey && previousLicenseKey !== newLicenseKey;
    const isFreshLogin = !previousLicenseKey; // No previous session (logged out or first login)

    logger.log(`[Auth] 🔐 Login: previous=${previousLicenseKey || 'none'}, new=${newLicenseKey}, isShowSwitch=${isShowSwitch}, isFreshLogin=${isFreshLogin}`);

    // CRITICAL: Check for pending offline scores before clearing caches
    // Losing offline scores would be a catastrophic data loss
    const pendingCount = useOfflineQueueStore.getState().getPendingCount();
    const failedCount = useOfflineQueueStore.getState().getFailedCount();

    if (pendingCount > 0 || failedCount > 0) {
      // DO NOT clear caches if there are pending offline scores
      // The old show's data will remain in cache, but that's better than losing scores
      logger.error(
        `[Auth] ⛔ BLOCKING cache clear - ${pendingCount} pending + ${failedCount} failed offline scores would be lost!`
      );
      logger.log(
        `[Auth] ⚠️ Proceeding with login but keeping old cache. User should sync scores first.`
      );
      // Don't clear caches - proceed with login but leave old data in place
      // The license_key filter in useHomeDashboardData will prevent cross-show data display
    } else {
      // Safe to clear caches - no pending offline scores
      // Clear on EVERY login to ensure fresh data (cache will be repopulated by initializeReplication)
      logger.log(`[Auth] ✅ No pending offline scores, clearing caches for fresh start...`);
      try {
        // Clear React Query persisted cache from localStorage
        localStorage.removeItem('myK9Q-react-query-cache');
        logger.log('[Auth] ✅ React Query cache cleared');

        // Clear IndexedDB replication caches
        await clearReplicationCaches();
        logger.log('[Auth] ✅ IndexedDB replication caches cleared');

        // Reset replication state so it can reinitialize with new license key
        resetReplicationState();
        logger.log('[Auth] ✅ Replication state reset');
      } catch (error) {
        logger.error('[Auth] ⚠️ Error clearing caches on login:', error);
        // Continue with login even if cache clearing fails
      }
    }

    // Parse role from passcode (first character)
    const rolePrefix = passcode.charAt(0).toLowerCase();
    let role: UserRole;

    switch (rolePrefix) {
      case 'a':
        role = 'admin';
        break;
      case 'j':
        role = 'judge';
        break;
      case 's':
        role = 'steward';
        break;
      case 'e':
        role = 'exhibitor';
        break;
      default:
        throw new Error('Invalid passcode');
    }

    const permissions = getPermissionsForRole(role);

    const newAuthState = {
      isAuthenticated: true,
      role,
      permissions,
      showContext: showData,
      passcode,
    };

    setAuthState(newAuthState);
    saveAuthToStorage(newAuthState);

    // Initialize replication after login
    // Previously skipped at app startup due to missing license key
    // Now that license key is available, trigger initialization and sync
    try {
      await initializeReplication();
      logger.log('[Auth] ✅ Replication initialized after login');
    } catch (error) {
      logger.error('[Auth] ❌ Failed to initialize replication after login:', error);
      // Don't throw - app should work without replication
    }
  }, [authState.showContext?.licenseKey]);

  const logout = useCallback(async () => {
    logger.log('[Auth] Logging out and clearing all caches...');

    const newAuthState = {
      isAuthenticated: false,
      role: null,
      permissions: null,
      showContext: null,
      passcode: null,
    };

    setAuthState(newAuthState);
    localStorage.removeItem('myK9Q_auth');
    sessionStorage.removeItem('auth');

    // CRITICAL: Clear all caches to prevent multi-tenant data leakage
    try {
      // Clear React Query persisted cache from localStorage
      localStorage.removeItem('myK9Q-react-query-cache');
      logger.log('[Auth] ✅ React Query cache cleared');

      // Clear IndexedDB replication caches
      await clearReplicationCaches();
      logger.log('[Auth] ✅ IndexedDB replication caches cleared');

      // Reset replication state so it can reinitialize with new license key
      resetReplicationState();
      logger.log('[Auth] ✅ Replication state reset');
    } catch (error) {
      logger.error('[Auth] ⚠️ Error clearing caches on logout:', error);
      // Continue with logout even if cache clearing fails
    }

    logger.log('[Auth] ✅ Logout complete - all caches cleared');
  }, []);

  const canAccess = useCallback((permission: keyof UserPermissions): boolean => {
    if (!authState.permissions) return false;
    return authState.permissions[permission];
  }, [authState.permissions]);


  return (
    <AuthContext.Provider
      value={{
        ...authState,
        login,
        logout,
        canAccess,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};