import { supabase, ShowQueue, TrialQueue, ClassQueue } from '../lib/supabase';
import { validatePasscodeAgainstLicenseKey } from '../utils/auth';

export interface ShowData {
  showId: string;
  showName: string;
  clubName: string;
  showDate: string;
  licenseKey: string;
  org: string; // Organization type from view_unique_mobile_app_lic_key
  competition_type: string; // Competition type from view_unique_mobile_app_lic_key
  trials: TrialQueue[];
  classes: ClassQueue[];
}

/**
 * Authenticates a passcode by finding the corresponding show data
 * @param passcode - 5 character passcode (e.g., "j9f3b")
 * @returns ShowData if valid, null if invalid
 */
export async function authenticatePasscode(passcode: string): Promise<ShowData | null> {
  try {
    // Step 1: Get all shows to check passcode against each mobile_app_lic_key
    const { data: shows, error: showError } = await supabase
      .from('shows')
      .select('*')
      .order('created_at', { ascending: false });

    if (showError) {
      console.error('Error fetching shows:', showError);
      return null;
    }

    if (!shows || shows.length === 0) {
      return null;
    }

    // Step 2: Check passcode against each show's license key
    let matchedShow: ShowQueue | null = null;

    for (const show of shows) {
      const validationResult = validatePasscodeAgainstLicenseKey(
        passcode,
        show.license_key
      );

      if (validationResult) {
        matchedShow = show;
        break;
      }
    }

    if (!matchedShow) {
      return null;
    }

    // Step 3: Get trials for this show
    const { data: trials, error: trialsError } = await supabase
      .from('trials')
      .select('*')
      .eq('show_id', matchedShow.id)
      .order('trial_date', { ascending: true });

    if (trialsError) {
      console.error('Error fetching trials:', trialsError);
    }

    // Step 4: Get classes for this show (assuming classes relate to trials)
    // First get all trial IDs for this show
    const trialIds = trials?.map(trial => trial.id) || [];

    let classes = null;
    let classesError = null;

    if (trialIds.length > 0) {
      const classesResult = await supabase
        .from('classes')
        .select('*')
        .in('trial_id', trialIds)
        .order('class_order', { ascending: true });

      classes = classesResult.data;
      classesError = classesResult.error;
    }

    if (classesError) {
      console.error('Error fetching classes:', classesError);
    }

    // Step 5: Get org and competition_type from shows table
    const { data: licenseData, error: licenseError } = await supabase
      .from('shows')
      .select('organization, show_type')
      .eq('license_key', matchedShow.license_key)
      .single();

    if (licenseError) {
      console.error('Error fetching license data:', licenseError);
    }

    // License validation successful - matchedShow contains validated data

    // Step 6: Return show data
    return {
      showId: matchedShow.id.toString(),
      showName: matchedShow.show_name,
      clubName: matchedShow.club_name,
      showDate: (matchedShow as any).start_date,
      licenseKey: matchedShow.license_key,
      org: licenseData?.organization || '', // Get org from shows table
      competition_type: licenseData?.show_type || 'Regular',
      trials: trials || [],
      classes: classes || []
    };

  } catch (error) {
    console.error('Authentication error:', error);
    return null;
  }
}

/**
 * Gets show data by license key (for already authenticated users)
 * @param licenseKey - The mobile_app_lic_key
 * @returns ShowData if found, null if not found
 */
export async function getShowByLicenseKey(licenseKey: string): Promise<ShowData | null> {
  try {
    const { data: show, error: showError } = await supabase
      .from('shows')
      .select('*')
      .eq('license_key', licenseKey)
      .single();

    if (showError || !show) {
      console.error('Error fetching show:', showError);
      return null;
    }

    // Get trials for this show
    const { data: trials, error: trialsError } = await supabase
      .from('trials')
      .select('*')
      .eq('show_id', show.id)
      .order('trial_date', { ascending: true });

    if (trialsError) {
      console.error('Error fetching trials:', trialsError);
    }

    // Get classes for all trials in this show
    let classes = null;
    let classesError = null;

    if (trials && trials.length > 0) {
      const trialIds = trials.map(trial => trial.id);
      const classesResult = await supabase
        .from('classes')
        .select('*')
        .in('trial_id', trialIds)
        .order('class_order', { ascending: true });

      classes = classesResult.data;
      classesError = classesResult.error;

      if (classesError) {
        console.error('Error fetching classes:', classesError);
      }
    }

    // Get org and competition_type from shows table
    const { data: licenseData, error: licenseError } = await supabase
      .from('shows')
      .select('organization, show_type')
      .eq('license_key', licenseKey)
      .single();

    if (licenseError) {
      console.error('Error fetching license data:', licenseError);
    }

    return {
      showId: show.id.toString(),
      showName: show.show_name,
      clubName: show.club_name,
      showDate: (show as any).start_date,
      licenseKey: show.license_key,
      org: show.organization || licenseData?.organization || '', // Try show table first, then fallback
      competition_type: show.show_type || licenseData?.show_type || 'Regular',
      trials: trials || [],
      classes: classes || []
    };

  } catch (error) {
    console.error('Error getting show by license key:', error);
    return null;
  }
}

/**
 * Test database connection
 * @returns boolean indicating if connection is successful
 */
export async function testDatabaseConnection(): Promise<boolean> {
  try {
    const { data: _data, error } = await supabase
      .from('shows')
      .select('count')
      .limit(1);

    if (error) {
      console.error('Database connection error:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Database connection failed:', error);
    return false;
  }
}