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
      .from('tbl_show_queue')
      .select('*')
      .order('created_at', { ascending: false });

    if (showError) {
      console.error('Error fetching shows:', showError);
      return null;
    }

    if (!shows || shows.length === 0) {
      console.log('No shows found');
      return null;
    }

    // Step 2: Check passcode against each show's license key
    let matchedShow: ShowQueue | null = null;
    
    for (const show of shows) {
      const validationResult = validatePasscodeAgainstLicenseKey(
        passcode, 
        show.mobile_app_lic_key
      );
      
      if (validationResult) {
        matchedShow = show;
        break;
      }
    }

    if (!matchedShow) {
      console.log('No matching show found for passcode');
      return null;
    }

    // Step 3: Get trials for this show
    const { data: trials, error: trialsError } = await supabase
      .from('tbl_trial_queue')
      .select('*')
      .eq('mobile_app_lic_key', matchedShow.mobile_app_lic_key)
      .order('trial_date', { ascending: true });

    if (trialsError) {
      console.error('Error fetching trials:', trialsError);
    }

    // Step 4: Get classes for this show
    const { data: classes, error: classesError } = await supabase
      .from('tbl_class_queue')
      .select('*')
      .eq('mobile_app_lic_key', matchedShow.mobile_app_lic_key)
      .order('class_name', { ascending: true });

    if (classesError) {
      console.error('Error fetching classes:', classesError);
    }

    // Step 5: Get org and competition_type from view_unique_mobile_app_lic_key
    const { data: licenseData, error: licenseError } = await supabase
      .from('view_unique_mobile_app_lic_key')
      .select('org, competition_type')
      .eq('mobile_app_lic_key', matchedShow.mobile_app_lic_key)
      .single();

    if (licenseError) {
      console.error('Error fetching license data:', licenseError);
    }

    console.log('License data from view_unique_mobile_app_lic_key:', licenseData);
    console.log('Matched show data:', {
      id: matchedShow.id,
      show_name: matchedShow.show_name,
      // org: matchedShow.org // Check if org is in the main show table
    });

    // Step 6: Return show data
    return {
      showId: matchedShow.id.toString(),
      showName: matchedShow.show_name,
      clubName: matchedShow.club_name,
      showDate: matchedShow.show_date,
      licenseKey: matchedShow.mobile_app_lic_key,
      org: licenseData?.org || '', // Get org from license data view
      competition_type: licenseData?.competition_type || 'Regular',
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
      .from('tbl_show_queue')
      .select('*')
      .eq('mobile_app_lic_key', licenseKey)
      .single();

    if (showError || !show) {
      console.error('Error fetching show:', showError);
      return null;
    }

    // Get trials and classes
    const [trialsResult, classesResult] = await Promise.all([
      supabase
        .from('tbl_trial_queue')
        .select('*')
        .eq('mobile_app_lic_key', licenseKey)
        .order('trial_date', { ascending: true }),
      
      supabase
        .from('tbl_class_queue')
        .select('*')
        .eq('mobile_app_lic_key', licenseKey)
        .order('class_name', { ascending: true })
    ]);

    // Get org and competition_type from view_unique_mobile_app_lic_key
    const { data: licenseData, error: licenseError } = await supabase
      .from('view_unique_mobile_app_lic_key')
      .select('org, competition_type')
      .eq('mobile_app_lic_key', licenseKey)
      .single();

    if (licenseError) {
      console.error('Error fetching license data:', licenseError);
    }

    return {
      showId: show.id.toString(),
      showName: show.show_name,
      clubName: show.club_name,
      showDate: show.show_date,
      licenseKey: show.mobile_app_lic_key,
      org: show.org || licenseData?.org || '', // Try show table first, then view
      competition_type: show.competition_type || licenseData?.competition_type || 'Regular',
      trials: trialsResult.data || [],
      classes: classesResult.data || []
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
      .from('tbl_show_queue')
      .select('count')
      .limit(1);

    if (error) {
      console.error('Database connection error:', error);
      return false;
    }

    console.log('Database connection successful');
    return true;
  } catch (error) {
    console.error('Database connection failed:', error);
    return false;
  }
}