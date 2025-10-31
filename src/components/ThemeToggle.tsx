import { useState, useEffect, useCallback } from 'react';
import './ThemeToggle.css';

/**
 * ThemeToggle - Theme accent color selector
 *
 * This component lets you choose between three primary colors:
 * - Blue (original Apple system color)
 * - Green (matches landing page aesthetic)
 * - Orange (energetic & sporty)
 *
 * Usage: Add <ThemeToggle /> anywhere in your app (e.g., Settings page)
 */

type ThemeColor = 'blue' | 'green' | 'orange';

export function ThemeToggle() {
  const [activeTheme, setActiveTheme] = useState<ThemeColor>(() => {
    // Initialize from localStorage
    const saved = localStorage.getItem('myK9Q_themeColor');
    return (saved as ThemeColor) || 'blue';
  });

  const applyTheme = useCallback((theme: ThemeColor) => {
    // Remove all theme CSS links
    const greenLink = document.getElementById('green-theme-link');
    const orangeLink = document.getElementById('orange-theme-link');
    if (greenLink) greenLink.remove();
    if (orangeLink) orangeLink.remove();

    // Apply selected theme
    if (theme === 'green') {
      const link = document.createElement('link');
      link.id = 'green-theme-link';
      link.rel = 'stylesheet';
      link.href = '/src/styles/green-theme.css';
      document.head.appendChild(link);
    } else if (theme === 'orange') {
      const link = document.createElement('link');
      link.id = 'orange-theme-link';
      link.rel = 'stylesheet';
      link.href = '/src/styles/orange-theme.css';
      document.head.appendChild(link);
    }
    // Blue theme is default, no additional CSS needed
  }, []);

  useEffect(() => {
    // Apply theme based on current state
    applyTheme(activeTheme);
  }, [applyTheme, activeTheme]);

  const switchTheme = (theme: ThemeColor) => {
    setActiveTheme(theme);
    localStorage.setItem('myK9Q_themeColor', theme);
    applyTheme(theme);

    // Force full page reload to ensure all styles apply
    setTimeout(() => {
      window.location.reload();
    }, 100);
  };

  return (
    <div className="theme-toggle-container">
      <div className="theme-toggle-card">
        <div className="theme-toggle-header">
          <h3>🎨 Theme Experiment</h3>
          <span className="theme-toggle-badge">Developer Tool</span>
        </div>

        <p className="theme-toggle-description">
          Toggle between the original blue primary color and the new emerald green
          to match the landing page aesthetic.
        </p>

        <div className="theme-toggle-controls">
          {/* Blue Theme */}
          <button
            className={`theme-option ${activeTheme === 'blue' ? 'active' : ''}`}
            onClick={() => switchTheme('blue')}
          >
            <div className="theme-color-preview" style={{ background: '#007AFF' }}></div>
            <div className="theme-option-content">
              <strong>Original Blue</strong>
              <span>Apple system color</span>
            </div>
            {activeTheme === 'blue' && <span className="active-indicator">✓ Active</span>}
          </button>

          {/* Green Theme */}
          <button
            className={`theme-option ${activeTheme === 'green' ? 'active' : ''}`}
            onClick={() => switchTheme('green')}
          >
            <div className="theme-color-preview" style={{ background: '#10b981' }}></div>
            <div className="theme-option-content">
              <strong>Emerald Green</strong>
              <span>Landing page match</span>
            </div>
            {activeTheme === 'green' && <span className="active-indicator">✓ Active</span>}
          </button>

          {/* Orange Theme */}
          <button
            className={`theme-option ${activeTheme === 'orange' ? 'active' : ''}`}
            onClick={() => switchTheme('orange')}
          >
            <div className="theme-color-preview" style={{ background: '#f97316' }}></div>
            <div className="theme-option-content">
              <strong>Vibrant Orange</strong>
              <span>Energetic & sporty</span>
            </div>
            {activeTheme === 'orange' && <span className="active-indicator">✓ Active</span>}
          </button>
        </div>

        <div className="theme-toggle-footer">
          <button
            className="theme-toggle-button"
            onClick={() => {
              const themes: ThemeColor[] = ['blue', 'green', 'orange'];
              const currentIndex = themes.indexOf(activeTheme);
              const nextTheme = themes[(currentIndex + 1) % themes.length];
              switchTheme(nextTheme);
            }}
          >
            Switch to {activeTheme === 'blue' ? 'Green' : activeTheme === 'green' ? 'Orange' : 'Blue'} Theme
          </button>
        </div>

        {activeTheme === 'green' && (
          <div className="theme-notice">
            <strong>🟢 Green Theme Active</strong>
            <p>Navigate through the app to see all changes. Check buttons, badges, and status colors.</p>
          </div>
        )}

        {activeTheme === 'orange' && (
          <div className="theme-notice" style={{ background: 'rgba(249, 115, 22, 0.1)', borderColor: '#f97316' }}>
            <strong>🟠 Orange Theme Active</strong>
            <p>Navigate through the app to see all changes. Check buttons, badges, and status colors.</p>
          </div>
        )}
      </div>
    </div>
  );
}
