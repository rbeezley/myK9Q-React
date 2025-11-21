/**
 * Blocking Theme Initialization Script
 * This runs BEFORE React to prevent FOUC
 *
 * CRITICAL: Must be loaded as blocking script in index.html
 * VERSION: 2.0 - Updated for accent color system
 */

(function() {
  try {
    // Read settings from localStorage (synchronous)
    const savedSettings = localStorage.getItem('myK9Q_settings');

    if (!savedSettings) {
      // No saved settings - use defaults (light theme, green accent)
      applyThemeClass('light');
      applyAccentColorClass('green');
      return;
    }

    // Zustand v5 persist stores data in { state: { settings: {...} } } format
    const persistedData = JSON.parse(savedSettings);

    // Extract settings from Zustand persist structure
    let settings = {};
    if (persistedData.state && persistedData.state.settings) {
      settings = persistedData.state.settings;
    } else if (persistedData.settings) {
      settings = persistedData.settings;
    } else {
      settings = persistedData;
    }

    // Apply theme mode (light/dark/auto)
    const themeMode = settings.theme || 'auto';

    if (themeMode === 'auto') {
      // Detect system preference
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      applyThemeClass(prefersDark ? 'dark' : 'light');
    } else {
      applyThemeClass(themeMode);
    }

    // Apply accent color class (new system)
    const accentColor = settings.accentColor || 'green';
    applyAccentColorClass(accentColor);

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

  function applyAccentColorClass(color) {
    const html = document.documentElement;

    // Remove all accent color classes
    html.classList.remove('accent-blue', 'accent-green', 'accent-orange', 'accent-purple');

    // Add selected accent color class
    html.classList.add('accent-' + color);
  }
})();
