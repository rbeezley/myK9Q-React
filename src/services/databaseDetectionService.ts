/**
 * Database Detection Service
 *
 * This service implements dual-database auto-detection during the migration period.
 * It checks if a license key exists in the legacy database and redirects to Flutter app if found,
 * otherwise continues with V3 React app.
 */

import { createClient } from '@supabase/supabase-js';

// V3 Database Configuration (default)
const V3_SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const V3_SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Legacy Database Configuration
const LEGACY_SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL_LEGACY;
const LEGACY_SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY_LEGACY;

// Flutter App URL
const FLUTTER_APP_URL = import.meta.env.VITE_LEGACY_APP_URL || 'https://myk9q208.flutterflow.app';

// Create Supabase clients
const supabaseV3 = createClient(V3_SUPABASE_URL, V3_SUPABASE_ANON_KEY);
const supabaseLegacy = LEGACY_SUPABASE_URL && LEGACY_SUPABASE_ANON_KEY
  ? createClient(LEGACY_SUPABASE_URL, LEGACY_SUPABASE_ANON_KEY)
  : null;

export interface DetectionResult {
  database: 'v3' | 'legacy';
  redirectUrl?: string;
  showData?: any;
  message?: string;
}

/**
 * Check if a show exists in the legacy database
 * @param licenseKey The license key to check
 * @returns true if show exists in legacy database
 */
async function checkLegacyDatabase(licenseKey: string): Promise<boolean> {
  if (!supabaseLegacy) {
    console.log('Legacy database not configured');
    return false;
  }

  try {
    // Legacy database uses tbl_show_queue table with mobile_app_lic_key field
    const { data, error } = await supabaseLegacy
      .from('tbl_show_queue')
      .select('id, mobile_app_lic_key')
      .eq('mobile_app_lic_key', licenseKey)
      .single();

    if (error) {
      // Check if error is because row doesn't exist (expected for non-legacy shows)
      if (error.code === 'PGRST116') {
        return false;
      }
      console.error('Legacy database check error:', error);
      return false;
    }

    return data !== null;
  } catch (error) {
    console.error('Legacy database connection error:', error);
    return false;
  }
}

/**
 * Check if a show exists in the V3 database
 * @param licenseKey The license key to check
 * @returns true if show exists in V3 database
 */
async function checkV3Database(licenseKey: string): Promise<boolean> {
  try {
    // V3 database uses shows table with license_key field
    const { data, error } = await supabaseV3
      .from('shows')
      .select('id, license_key')
      .eq('license_key', licenseKey)
      .single();

    if (error) {
      // Check if error is because row doesn't exist
      if (error.code === 'PGRST116') {
        return false;
      }
      console.error('V3 database check error:', error);
      return false;
    }

    return data !== null;
  } catch (error) {
    console.error('V3 database connection error:', error);
    return false;
  }
}

/**
 * Extract license key from passcode
 * This is a simplified version - the full validation happens after database selection
 * @param passcode The 5-character passcode
 * @returns The potential license key patterns to check
 */
function extractPotentialLicenseKeys(passcode: string): string[] {
  if (!passcode || passcode.length !== 5) {
    return [];
  }

  // Extract the 4-character segment from passcode (excluding role prefix)
  const segment = passcode.substring(1);

  // For migration period, we need to check all possible license key formats
  // This is a simplified check - actual validation happens in authService
  const potentialKeys: string[] = [];

  // We'll need to fetch all shows and check against each license key
  // This is handled by the actual authentication service
  // For detection, we return a marker to indicate we need to check all shows
  return ['CHECK_ALL_SHOWS'];
}

/**
 * Detect which database contains the show for a given passcode
 * @param passcode The user's passcode
 * @returns Detection result with database type and optional redirect URL
 */
export async function detectDatabase(passcode: string): Promise<DetectionResult> {
  console.log('Starting database detection for passcode:', passcode);

  // During migration, we need to check both databases
  // Since we can't directly map passcode to license key without checking all shows,
  // we'll need to try authentication against both databases

  try {
    // First, try to find the show in V3 database
    // This requires checking all shows since passcode is derived from license key
    const { data: v3Shows, error: v3Error } = await supabaseV3
      .from('shows')
      .select('license_key')
      .order('created_at', { ascending: false });

    if (!v3Error && v3Shows && v3Shows.length > 0) {
      // Check if passcode matches any V3 show
      // The actual validation is done in authService
      // For now, we'll attempt V3 first
      console.log('Found shows in V3 database, attempting V3 authentication');
      return {
        database: 'v3',
        message: 'Attempting V3 authentication'
      };
    }

    // If no shows in V3 or error, check legacy database
    if (supabaseLegacy) {
      const { data: legacyShows, error: legacyError } = await supabaseLegacy
        .from('tbl_show_queue')
        .select('mobile_app_lic_key')
        .order('created_at', { ascending: false })
        .limit(1);

      if (!legacyError && legacyShows && legacyShows.length > 0) {
        console.log('Found shows in legacy database, redirecting to Flutter app');
        return {
          database: 'legacy',
          redirectUrl: FLUTTER_APP_URL,
          message: 'Redirecting to legacy app'
        };
      }
    }

    // Default to V3 if no clear determination
    return {
      database: 'v3',
      message: 'No shows found, defaulting to V3'
    };

  } catch (error) {
    console.error('Database detection error:', error);
    // Default to V3 on error
    return {
      database: 'v3',
      message: 'Detection error, defaulting to V3'
    };
  }
}

/**
 * Enhanced detection that actually validates the passcode
 * This is the recommended approach during migration
 */
export async function detectDatabaseWithValidation(passcode: string): Promise<DetectionResult> {
  console.log('Starting enhanced database detection with validation');

  // Import auth validation function
  const { validatePasscodeAgainstLicenseKey } = await import('../utils/auth');

  try {
    // Check V3 database first
    const { data: v3Shows, error: v3Error } = await supabaseV3
      .from('shows')
      .select('*')
      .order('created_at', { ascending: false });

    if (!v3Error && v3Shows) {
      for (const show of v3Shows) {
        if (validatePasscodeAgainstLicenseKey(passcode, show.license_key)) {
          console.log('Passcode validated against V3 database');
          console.log('V3 show data:', show);

          // Map V3 database fields to showContext format
          const showData = {
            showId: show.id,
            showName: show.show_name,
            clubName: show.club_name,
            showDate: show.show_date,
            licenseKey: show.license_key,
            org: show.org || show.organization || '',
            competition_type: show.competition_type || 'Regular',
            show_type: show.show_type || show.competition_type || 'Regular'
          };

          console.log('Mapped showContext:', showData);

          return {
            database: 'v3',
            showData,
            message: 'Show found in V3 database'
          };
        }
      }
    }

    // Check legacy database if configured
    if (supabaseLegacy) {
      const { data: legacyShows, error: legacyError } = await supabaseLegacy
        .from('tbl_show_queue')
        .select('*')
        .order('created_at', { ascending: false });

      if (!legacyError && legacyShows) {
        for (const show of legacyShows) {
          // Legacy database uses mobile_app_lic_key field
          if (validatePasscodeAgainstLicenseKey(passcode, show.mobile_app_lic_key)) {
            console.log('Passcode validated against legacy database, redirecting to Flutter');

            // Pass passcode to Flutter app for auto-login (backwards compatible)
            // If Flutter doesn't read the URL param, user can still login manually
            const flutterUrl = new URL(FLUTTER_APP_URL);
            flutterUrl.searchParams.set('passcode', passcode);

            console.log('Flutter redirect URL with passcode:', flutterUrl.toString());

            return {
              database: 'legacy',
              redirectUrl: flutterUrl.toString(),
              showData: show,
              message: 'Show found in legacy database - redirecting to Flutter app (auto-login if supported)'
            };
          }
        }
      }
    }

    // No match found in either database
    return {
      database: 'v3',
      message: 'Invalid passcode - no matching show found'
    };

  } catch (error) {
    console.error('Database validation error:', error);
    return {
      database: 'v3',
      message: 'Validation error - please try again'
    };
  }
}

/**
 * Check if migration mode is enabled
 * @returns true if both databases are configured
 */
export function isMigrationModeEnabled(): boolean {
  return !!(LEGACY_SUPABASE_URL && LEGACY_SUPABASE_ANON_KEY);
}

/**
 * Get migration status for display to users
 */
export function getMigrationStatus(): {
  enabled: boolean;
  v3Configured: boolean;
  legacyConfigured: boolean;
  flutterUrl: string;
} {
  return {
    enabled: isMigrationModeEnabled(),
    v3Configured: !!(V3_SUPABASE_URL && V3_SUPABASE_ANON_KEY),
    legacyConfigured: !!(LEGACY_SUPABASE_URL && LEGACY_SUPABASE_ANON_KEY),
    flutterUrl: FLUTTER_APP_URL
  };
}