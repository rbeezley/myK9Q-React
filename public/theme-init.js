/**
 * Blocking Theme Initialization Script
 * This runs BEFORE React to prevent FOUC
 *
 * CRITICAL: Must be loaded as blocking script in index.html
 */

(function() {
  try {
    // Read settings from localStorage (synchronous)
    const savedSettings = localStorage.getItem('myK9Q_settings');

    if (!savedSettings) {
      // No saved settings - use defaults
      applyThemeClass('light');
      return;
    }

    const settings = JSON.parse(savedSettings);

    // Apply theme mode (light/dark/system)
    const themeMode = settings.theme || 'light';

    if (themeMode === 'system') {
      // Detect system preference
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      applyThemeClass(prefersDark ? 'dark' : 'light');
    } else {
      applyThemeClass(themeMode);
    }

    // Apply theme color class
    const themeColor = settings.themeColor || 'blue';
    applyThemeColorClass(themeColor);

  } catch (error) {
    // Fail silently - use default light theme
    console.warn('Failed to initialize theme from localStorage:', error);
    applyThemeClass('light');
  }

  function applyThemeClass(theme) {
    const html = document.documentElement;

    if (theme === 'dark') {
      html.classList.add('theme-dark');
      html.classList.remove('theme-light');
    } else {
      html.classList.add('theme-light');
      html.classList.remove('theme-dark');
    }
  }

  function applyThemeColorClass(color) {
    const html = document.documentElement;

    // Remove all theme color classes
    html.classList.remove('theme-blue', 'theme-green', 'theme-orange');

    // Add selected theme color class
    html.classList.add('theme-' + color);
  }
})();
