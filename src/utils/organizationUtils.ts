/**
 * Organization utility functions for myK9Q application
 */

export interface OrganizationData {
  organization: string;
  activity_type: string;
}

/**
 * Parse organization string to extract organization and activity type
 * @param orgString - Organization string like "AKC Scent Work", "UKC Obedience"
 * @returns Object with organization and activity_type
 * @example
 * parseOrganizationData("AKC Scent Work") // { organization: "AKC", activity_type: "Scent Work" }
 * parseOrganizationData("UKC Obedience") // { organization: "UKC", activity_type: "Obedience" }
 */
export const parseOrganizationData = (orgString: string): OrganizationData => {
  if (!orgString || orgString.trim() === '') {
    // Default to AKC Scent Work for this show based on the user's report
    return {
      organization: 'AKC',
      activity_type: 'Scent Work'
    };
  }

  // Parse organization string like "UKC Obedience", "AKC Scent Work"
  const parts = orgString.split(' ');
  const result = {
    organization: parts[0], // "UKC", "AKC", "ASCA"
    activity_type: parts.slice(1).join(' '), // "Obedience", "Scent Work", "FastCat"
  };

  return result;
};

/**
 * Check if max times are rule-defined (not settable by judges)
 * Some organizations/activities have fixed max times in their rules,
 * so the "Set Max Time" option should be hidden.
 *
 * Currently applies to:
 * - ASCA (all activities) - fixed max times per level
 * - UKC Nosework - fixed max times per level (3/4/5/6/6 min for Novice through Elite)
 */
export const hasRuleDefinedMaxTimes = (orgData: OrganizationData): boolean => {
  // ASCA has rule-defined max times for all activities
  if (orgData.organization === 'ASCA') {
    return true;
  }

  // UKC Nosework has fixed max times per level
  if (orgData.organization === 'UKC' && orgData.activity_type.toLowerCase().includes('nosework')) {
    return true;
  }

  return false;
};
