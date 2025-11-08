/**
 * Blocking Theme Initialization
 *
 * This script runs BEFORE React renders to prevent flash of unstyled content (FOUC).
 * It reads theme preferences from localStorage and applies them to the HTML element
 * synchronously, ensuring the correct theme is applied before the first paint.
 *
 * CRITICAL: This must be imported in index.html as a blocking script, NOT in React.
 */

interface ThemeSettings {
  theme?: 'light' | 'dark' | 'system';
  themeColor?: 'blue' | 'green' | 'orange';
}

/**
 * Initialize theme before React renders
 * - Reads from localStorage synchronously
 * - Applies theme class to HTML element
 * - Prevents FOUC by running before first paint
 */
export function initializeThemeBlocking(): void {
  try {
    // Read settings from localStorage (synchronous)
    const savedSettings = localStorage.getItem('myK9Q_settings');

    if (!savedSettings) {
      // No saved settings - use defaults (light theme, blue color)
      applyThemeClass('light');
      return;
    }

    const settings: ThemeSettings = JSON.parse(savedSettings);

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
}

/**
 * Apply theme class to HTML element
 */
function applyThemeClass(theme: 'light' | 'dark'): void {
  const html = document.documentElement;

  if (theme === 'dark') {
    html.classList.add('theme-dark');
    html.classList.remove('theme-light');
  } else {
    html.classList.add('theme-light');
    html.classList.remove('theme-dark');
  }
}

/**
 * Apply theme color class to HTML element
 */
function applyThemeColorClass(color: 'blue' | 'green' | 'orange'): void {
  const html = document.documentElement;

  // Remove all theme color classes
  html.classList.remove('theme-blue', 'theme-green', 'theme-orange');

  // Add selected theme color class
  html.classList.add(`theme-${color}`);
}

// Auto-run if called directly (when imported as script in HTML)
if (typeof window !== 'undefined') {
  initializeThemeBlocking();
}
