import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { Menu, X, Home as HomeIcon, MessageSquare, Calendar, Settings, Shield, Monitor } from 'lucide-react';
import './HamburgerMenu.css';

interface HamburgerMenuProps {
  /** Optional back navigation - if provided, shows as first menu item */
  backNavigation?: {
    label: string;
    action: () => void;
  };
  /** Current page to highlight in menu */
  currentPage?: 'home' | 'announcements' | 'calendar' | 'settings' | 'entries' | 'admin' | 'tv';
  /** Additional CSS classes for the menu button */
  className?: string;
}

export const HamburgerMenu: React.FC<HamburgerMenuProps> = ({
  backNavigation,
  currentPage,
  className = ''
}) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const [containerOffset, setContainerOffset] = useState(0);
  const [darkMode, setDarkMode] = useState(() => {
    const saved = localStorage.getItem('theme');
    return saved === 'dark' || (!saved && window.matchMedia('(prefers-color-scheme: dark)').matches);
  });
  
  const navigate = useNavigate();
  const { showContext, role, logout } = useAuth();

  // Calculate container offset for proper hamburger menu positioning
  useEffect(() => {
    const calculateOffset = () => {
      // Only calculate for desktop breakpoints (≥1024px)
      if (window.innerWidth < 1024) {
        console.log('🍔 Mobile/tablet width detected, using left: 0');
        setContainerOffset(0);
        return;
      }

      // Add a slight delay to ensure DOM is fully rendered
      requestAnimationFrame(() => {
        // Find the container element
        const container = document.querySelector('.app-container, .app-container-wide, .app-container-narrow');

        if (container) {
          const containerRect = container.getBoundingClientRect();
          const offset = containerRect.left;
          const calculatedOffset = Math.max(0, offset);

          console.log('🍔 Desktop - Container found:', container.className);
          console.log('🍔 Container tagName:', container.tagName);
          console.log('🍔 Container left offset:', offset);
          console.log('🍔 Container rect:', containerRect);
          console.log('🍔 Container computed style max-width:', window.getComputedStyle(container).maxWidth);
          console.log('🍔 Final offset:', calculatedOffset);
          console.log('🍔 Window width:', window.innerWidth);
          console.log('🍔 Current URL:', window.location.pathname);
          console.log('🍔 Container element HTML:', container.outerHTML.substring(0, 200));

          setContainerOffset(calculatedOffset);
        } else {
          console.log('🍔 No container found, using fallback calculation');

          // Check for different container types and calculate accordingly
          const containerWide = document.querySelector('.app-container-wide');
          const containerNarrow = document.querySelector('.app-container-narrow');

          let maxWidth: number;
          if (containerWide) {
            // Wide container: 1400px max-width (1440px on very large screens)
            maxWidth = window.innerWidth >= 1440 ? 1440 : 1400;
            console.log('🍔 Detected wide container, max-width:', maxWidth);
          } else if (containerNarrow) {
            // Narrow container: 800px max-width
            maxWidth = 800;
            console.log('🍔 Detected narrow container, max-width:', maxWidth);
          } else {
            // Standard container: 1200px max-width (but check actual computed value)
            const computedMaxWidth = window.getComputedStyle(document.querySelector('.app-container') || document.body).maxWidth;
            if (computedMaxWidth && computedMaxWidth !== 'none') {
              maxWidth = parseInt(computedMaxWidth);
              console.log('🍔 Using computed max-width:', maxWidth);
            } else {
              maxWidth = 1200;
            }
            console.log('🍔 Detected standard container, max-width:', maxWidth);
          }

          const padding = 32; // 2rem padding
          const calculatedOffset = Math.max(0, (window.innerWidth - maxWidth - padding * 2) / 2);
          console.log('🍔 Fallback offset:', calculatedOffset);
          console.log('🍔 Window width:', window.innerWidth);

          setContainerOffset(calculatedOffset);
        }
      });
    };

    // Calculate immediately
    calculateOffset();

    // Recalculate on window resize with debouncing
    let resizeTimeout: number;
    const handleResize = () => {
      clearTimeout(resizeTimeout);
      resizeTimeout = window.setTimeout(calculateOffset, 100);
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      clearTimeout(resizeTimeout);
    };
  }, [isMenuOpen]); // Re-run when menu state changes

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
          {/* Debug indicator for container offset - only in development */}
          {process.env.NODE_ENV === 'development' && window.innerWidth >= 1024 && (
            <div
              style={{
                position: 'fixed',
                top: '10px',
                right: '10px',
                background: 'rgba(255, 0, 0, 0.8)',
                color: 'white',
                padding: '4px 8px',
                fontSize: '12px',
                borderRadius: '4px',
                zIndex: 1000001,
                fontFamily: 'monospace',
                pointerEvents: 'none'
              }}
            >
              Offset: {containerOffset}px
              <br />
              Window: {window.innerWidth}px
            </div>
          )}
          <nav
            className="hamburger-menu"
            style={{
              position: 'fixed',
              top: 0,
              left: window.innerWidth >= 1024 && (document.querySelector('.app-container-wide') || document.querySelector('.app-container-narrow')) ? `${containerOffset}px` : 0,
              zIndex: 1000000
            }}
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
                <MessageSquare className="menu-icon" />
                <span>News</span>
              </button>
              
              <button
                className={`menu-item ${currentPage === 'calendar' ? 'active' : ''}`}
                onClick={() => handleMenuItemClick(() => navigate('/calendar'))}
              >
                <Calendar className="menu-icon" />
                <span>Calendar</span>
              </button>
              
              <button
                className={`menu-item ${currentPage === 'settings' ? 'active' : ''}`}
                onClick={() => handleMenuItemClick(() => navigate('/settings'))}
              >
                <Settings className="menu-icon" />
                <span>Settings</span>
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
                    <span>TV Dashboard</span>
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