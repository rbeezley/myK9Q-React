import React, { createContext, useContext, useState, useCallback } from 'react';
import { UserRole, UserPermissions, getPermissionsForRole } from '../utils/auth';

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

  const login = useCallback((passcode: string, showData: ShowContext) => {
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

    // Replication system already initialized at app startup in main.tsx
    // No need to re-initialize here (previously caused fourth initialization race condition)
  }, []);

  const logout = useCallback(() => {
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