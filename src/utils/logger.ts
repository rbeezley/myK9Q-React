/**
 * Production-safe logging utility
 * Respects user console logging preferences from settings
 */

const isDev = import.meta.env.DEV;

/**
 * Get console logging setting from settingsStore
 * Avoids circular dependency by accessing localStorage directly
 */
function getConsoleLoggingSetting(): 'none' | 'errors' | 'all' {
  try {
    const stored = localStorage.getItem('myK9Q_settings');
    if (stored) {
      const parsed = JSON.parse(stored);
      return parsed?.state?.settings?.consoleLogging || 'errors';
    }
  } catch (_error) {
    // If parsing fails, default to errors
  }
  return 'errors';
}

/**
 * Check if logging is allowed based on settings and environment
 */
function shouldLog(level: 'log' | 'warn' | 'error' | 'debug' | 'info'): boolean {
  const setting = getConsoleLoggingSetting();

  // None = no logging at all (except critical errors)
  if (setting === 'none') {
    return false;
  }

  // Errors = only errors and warnings
  if (setting === 'errors') {
    return level === 'error' || level === 'warn';
  }

  // All = everything in dev mode
  if (setting === 'all') {
    return isDev;
  }

  return false;
}

export const logger = {
  log: (...args: any[]) => {
    if (shouldLog('log')) {
      console.log(...args);
    }
  },
  warn: (...args: any[]) => {
    if (shouldLog('warn')) {
      console.warn(...args);
    }
  },
  error: (...args: any[]) => {
    // Always log errors unless explicitly disabled
    const setting = getConsoleLoggingSetting();
    if (setting !== 'none') {
      console.error(...args);
    }
  },
  debug: (...args: any[]) => {
    if (shouldLog('debug')) {
      console.log('[DEBUG]', ...args);
    }
  },
  info: (...args: any[]) => {
    if (shouldLog('info')) {
      console.info(...args);
    }
  }
};

// Export individual functions for convenience
export const { log, warn, error, debug, info } = logger;
