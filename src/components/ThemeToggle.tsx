import { useState, useEffect, useCallback } from 'react';
import './ThemeToggle.css';

/**
 * ThemeToggle - Developer tool for testing green theme
 *
 * This component lets you toggle between blue (original) and green theme
 * without editing code. Perfect for A/B comparison.
 *
 * Usage: Add <ThemeToggle /> anywhere in your app (e.g., Settings page)
 */
export function ThemeToggle() {
  const [isGreenTheme, setIsGreenTheme] = useState(() => {
    // Initialize from localStorage
    const saved = localStorage.getItem('myK9Q_greenTheme');
    return saved === 'true';
  });

  const applyTheme = useCallback((enabled: boolean) => {
    if (enabled) {
      // Dynamically import green theme CSS
      const link = document.createElement('link');
      link.id = 'green-theme-link';
      link.rel = 'stylesheet';
      link.href = '/src/styles/green-theme.css';
      document.head.appendChild(link);

      // Add debug class to body
      document.body.classList.add('green-theme-debug');
    } else {
      // Remove green theme CSS
      const link = document.getElementById('green-theme-link');
      if (link) {
        link.remove();
      }

      // Remove debug class
      document.body.classList.remove('green-theme-debug');
    }
  }, []);

  useEffect(() => {
    // Apply theme based on current state
    applyTheme(isGreenTheme);
  }, [applyTheme, isGreenTheme]);

  const toggleTheme = () => {
    const newValue = !isGreenTheme;
    setIsGreenTheme(newValue);
    localStorage.setItem('myK9Q_greenTheme', String(newValue));
    applyTheme(newValue);

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
          <button
            className={`theme-option ${!isGreenTheme ? 'active' : ''}`}
            onClick={() => !isGreenTheme || toggleTheme()}
          >
            <div className="theme-color-preview" style={{ background: '#007AFF' }}></div>
            <div className="theme-option-content">
              <strong>Original Blue</strong>
              <span>Apple system color</span>
            </div>
            {!isGreenTheme && <span className="active-indicator">✓ Active</span>}
          </button>

          <button
            className={`theme-option ${isGreenTheme ? 'active' : ''}`}
            onClick={() => isGreenTheme || toggleTheme()}
          >
            <div className="theme-color-preview" style={{ background: '#10b981' }}></div>
            <div className="theme-option-content">
              <strong>Emerald Green</strong>
              <span>Landing page match</span>
            </div>
            {isGreenTheme && <span className="active-indicator">✓ Active</span>}
          </button>
        </div>

        <div className="theme-toggle-footer">
          <button
            className="theme-toggle-button"
            onClick={toggleTheme}
          >
            Switch to {isGreenTheme ? 'Blue' : 'Green'} Theme
          </button>
        </div>

        {isGreenTheme && (
          <div className="theme-notice">
            <strong>🟢 Green Theme Active</strong>
            <p>Navigate through the app to see all changes. Check buttons, badges, and status colors.</p>
          </div>
        )}
      </div>
    </div>
  );
}
