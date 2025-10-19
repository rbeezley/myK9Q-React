import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useAnnouncementStore } from '../../stores/announcementStore';
import { Menu, X, Home as HomeIcon, Bell, Shield, Monitor } from 'lucide-react';
import './HamburgerMenu.css';

interface HamburgerMenuProps {
  /** Optional back navigation - if provided, shows as first menu item */
  backNavigation?: {
    label: string;
    action: () => void;
  };
  /** Current page to highlight in menu */
  currentPage?: 'home' | 'announcements' | 'entries' | 'admin' | 'tv';
  /** Additional CSS classes for the menu button */
  className?: string;
}

export const HamburgerMenu: React.FC<HamburgerMenuProps> = ({
  backNavigation,
  currentPage,
  className = ''
}) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [_isAnimating, setIsAnimating] = useState(false);
  const [darkMode, setDarkMode] = useState(() => {
    const saved = localStorage.getItem('theme');
    return saved === 'dark' || (!saved && window.matchMedia('(prefers-color-scheme: dark)').matches);
  });
  
  const navigate = useNavigate();
  const { showContext, role, logout } = useAuth();
  const { unreadCount, setLicenseKey, currentLicenseKey } = useAnnouncementStore();


  // Initialize announcement store with current show context
  useEffect(() => {
    if (showContext?.licenseKey && currentLicenseKey !== showContext.licenseKey) {
      setLicenseKey(showContext.licenseKey, showContext.showName);
    }
  }, [showContext, currentLicenseKey, setLicenseKey]);

  // Apply theme to document
  useEffect(() => {
    if (darkMode) {
      document.documentElement.setAttribute('data-theme', 'dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.setAttribute('data-theme', 'light');
      localStorage.setItem('theme', 'light');
    }
  }, [darkMode]);

  const toggleTheme = () => {
    setDarkMode(!darkMode);
  };

  const handleMenuItemClick = (action: () => void) => {
    action();
    setIsMenuOpen(false);
  };

  // Handle menu opening with animation
  const handleMenuToggle = () => {
    if (!isMenuOpen) {
      setIsMenuOpen(true);
      setIsAnimating(true);
      // Reset animation state after animation completes
      setTimeout(() => setIsAnimating(false), 300);
    } else {
      setIsMenuOpen(false);
    }
  };

  return (
    <>
      <button
        className={`menu-button ${className}`}
        onClick={handleMenuToggle}
        title="Menu"
      >
        <Menu className="h-5 w-5" />
      </button>

      {/* Menu Overlay */}
      {isMenuOpen && (
        <div className="menu-overlay" onClick={() => setIsMenuOpen(false)}>
          <nav
            className="hamburger-menu"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="menu-header">
              <div className="menu-header-info">
                <h3>{showContext?.clubName}</h3>
                <p className="show-info-detail">{showContext?.showName}</p>
                <p className="user-info">
                  Logged in as: <span>{role}</span>
                </p>
              </div>
              <button 
                className="menu-close"
                onClick={() => setIsMenuOpen(false)}
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            
            <div className="menu-items">
              {/* Back Navigation (if provided) */}
              {backNavigation && (
                <>
                  <button
                    className="menu-item"
                    onClick={() => handleMenuItemClick(backNavigation.action)}
                  >
                    <span className="menu-icon">←</span>
                    <span>{backNavigation.label}</span>
                  </button>
                  <div className="menu-divider"></div>
                </>
              )}

              {/* Main Navigation */}
              <button
                className={`menu-item ${currentPage === 'home' ? 'active' : ''}`}
                onClick={() => handleMenuItemClick(() => navigate('/home'))}
              >
                <HomeIcon className="menu-icon" />
                <span>Home</span>
              </button>
              
              <button
                className={`menu-item ${currentPage === 'announcements' ? 'active' : ''}`}
                onClick={() => handleMenuItemClick(() => navigate('/announcements'))}
              >
                <div className="menu-icon-container">
                  <Bell className="menu-icon" />
                  {unreadCount > 0 && (
                    <span className="notification-badge">{unreadCount > 99 ? '99+' : unreadCount}</span>
                  )}
                </div>
                <span>Announcements</span>
              </button>

              {/* Admin Section - Only show for admin users */}
              {role === 'admin' && (
                <>
                  <div className="menu-divider"></div>
                  <button
                    className={`menu-item ${currentPage === 'tv' ? 'active' : ''}`}
                    onClick={() => handleMenuItemClick(() => navigate(`/tv/${showContext?.licenseKey || 'myK9Q1-d8609f3b-d3fd43aa-6323a604'}`))}
                  >
                    <Monitor className="menu-icon" />
                    <span>Run Order Display</span>
                  </button>

                  <button
                    className={`menu-item ${currentPage === 'admin' ? 'active' : ''}`}
                    onClick={() => handleMenuItemClick(() => navigate(`/admin/${showContext?.licenseKey || 'myK9Q1-d8609f3b-d3fd43aa-6323a604'}`))}
                  >
                    <Shield className="menu-icon" />
                    <span>Competition Admin</span>
                  </button>
                </>
              )}

              <div className="menu-divider"></div>
              {/* Theme Toggle */}
              <button
                className="menu-item"
                onClick={() => handleMenuItemClick(toggleTheme)}
              >
                <span className="menu-icon">{darkMode ? '☀️' : '🌙'}</span>
                <span>{darkMode ? 'Light Mode' : 'Dark Mode'}</span>
              </button>
              
              {/* Logout */}
              <button
                className="menu-item logout"
                onClick={() => handleMenuItemClick(() => logout())}
              >
                <span>Logout</span>
              </button>
            </div>
          </nav>
        </div>
      )}
    </>
  );
};