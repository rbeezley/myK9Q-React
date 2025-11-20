import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useNotifications } from '../../contexts/NotificationContext';
import { useAnnouncementStore } from '../../stores/announcementStore';
import { Menu, X, Home as HomeIcon, Bell, Shield, Monitor, Settings as SettingsIcon, BookOpen, Video, Sun, Moon, Info, BarChart3, ChevronDown, HelpCircle } from 'lucide-react';
import { AboutDialog } from '../dialogs/AboutDialog';
import './shared-ui.css';
import { version } from '../../../package.json';

/**
 * HamburgerMenu Component
 *
 * A slide-out navigation menu that appears from the left side of the viewport.
 *
 * Architecture:
 * - Uses React Portal to render the menu overlay at document.body level
 * - This ensures the menu is always positioned relative to the viewport, not parent containers
 * - Desktop pages with .page-container margins won't affect menu positioning
 * - Provides consistent behavior across all pages
 *
 * @example
 * <HamburgerMenu currentPage="home" />
 */
interface HamburgerMenuProps {
  /** Optional back navigation - if provided, shows as first menu item */
  backNavigation?: {
    label: string;
    action: () => void;
  };
  /** Current page to highlight in menu */
  currentPage?: 'home' | 'announcements' | 'settings' | 'stats' | 'entries' | 'admin' | 'tv';
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
  const [isAboutDialogOpen, setIsAboutDialogOpen] = useState(false);
  const [isHelpExpanded, setIsHelpExpanded] = useState(false);
  const [darkMode, setDarkMode] = useState(() => {
    const saved = localStorage.getItem('theme');
    return saved === 'dark' || (!saved && window.matchMedia('(prefers-color-scheme: dark)').matches);
  });

  const navigate = useNavigate();
  const { showContext, role, logout } = useAuth();
  const { unreadCount: _announcementUnreadCount, setLicenseKey, currentLicenseKey } = useAnnouncementStore();
  const { unreadCount, togglePanel } = useNotifications();


  // Initialize announcement store with current show context
  useEffect(() => {
    if (showContext?.licenseKey && currentLicenseKey !== showContext.licenseKey) {
      setLicenseKey(showContext.licenseKey, showContext.showName);
    }
  }, [showContext, currentLicenseKey, setLicenseKey]);

  // Apply theme to document
  useEffect(() => {
    const root = document.documentElement;
    if (darkMode) {
      root.classList.remove('theme-light');
      root.classList.add('theme-dark');
      localStorage.setItem('theme', 'dark');
    } else {
      root.classList.remove('theme-dark');
      root.classList.add('theme-light');
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

      {/* Menu Overlay - Rendered at document root using Portal */}
      {isMenuOpen && createPortal(
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
                className="menu-item"
                onClick={() => handleMenuItemClick(() => togglePanel())}
              >
                <div className="menu-icon-container">
                  <Bell className="menu-icon" />
                  {unreadCount > 0 && (
                    <span className="notification-badge">{unreadCount > 99 ? '99+' : unreadCount}</span>
                  )}
                </div>
                <span>Notifications</span>
              </button>

              <button
                className={`menu-item ${currentPage === 'announcements' ? 'active' : ''}`}
                onClick={() => handleMenuItemClick(() => navigate('/announcements'))}
              >
                <BookOpen className="menu-icon" />
                <span>Announcements</span>
              </button>

              <button
                className={`menu-item ${currentPage === 'settings' ? 'active' : ''}`}
                onClick={() => handleMenuItemClick(() => navigate('/settings'))}
              >
                <SettingsIcon className="menu-icon" />
                <span>Settings</span>
              </button>

              <button
                className={`menu-item ${currentPage === 'stats' ? 'active' : ''}`}
                onClick={() => handleMenuItemClick(() => navigate('/stats'))}
              >
                <BarChart3 className="menu-icon" />
                <span>Statistics</span>
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
                    <span>Results Control</span>
                  </button>
                </>
              )}

              <div className="menu-divider"></div>

              {/* Collapsible Help Section */}
              <button
                className="menu-collapsible-header"
                onClick={() => setIsHelpExpanded(!isHelpExpanded)}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--token-space-lg)' }}>
                  <HelpCircle className="menu-icon" />
                  <span>Help & Support</span>
                </div>
                <ChevronDown className={`menu-collapsible-icon ${isHelpExpanded ? 'open' : ''}`} />
              </button>

              <div className={`menu-collapsible-content ${isHelpExpanded ? 'open' : ''}`}>
                <a
                  href="https://myk9t.com/docs"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="menu-item"
                  onClick={() => setIsMenuOpen(false)}
                >
                  <BookOpen className="menu-icon" />
                  <span>User Guide</span>
                </a>

                <a
                  href="https://www.youtube.com/watch?v=WRaKZnFPtmI&list=PL6PN3duVGm8-WDKvOobppaZC7Mc_13Xdj"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="menu-item"
                  onClick={() => setIsMenuOpen(false)}
                >
                  <Video className="menu-icon" />
                  <span>Video Tutorials</span>
                </a>

                <button
                  className="menu-item"
                  onClick={() => handleMenuItemClick(() => setIsAboutDialogOpen(true))}
                >
                  <Info className="menu-icon" />
                  <span>About</span>
                </button>
              </div>

              <div className="menu-divider"></div>

              {/* Theme Toggle */}
              <button
                className="menu-item"
                onClick={() => handleMenuItemClick(toggleTheme)}
              >
                {darkMode ? <Sun className="menu-icon" /> : <Moon className="menu-icon" />}
                <span>{darkMode ? 'Light Mode' : 'Dark Mode'}</span>
              </button>

              {/* Logout */}
              <button
                className="menu-item logout"
                onClick={() => handleMenuItemClick(() => logout())}
              >
                <span>Logout</span>
              </button>

              {/* Version Number */}
              <div className="menu-version">
                v{version}
              </div>
            </div>
          </nav>
        </div>,
        document.body
      )}

      {/* About Dialog */}
      <AboutDialog
        isOpen={isAboutDialogOpen}
        onClose={() => setIsAboutDialogOpen(false)}
        licenseKey={showContext?.licenseKey}
      />
    </>
  );
};