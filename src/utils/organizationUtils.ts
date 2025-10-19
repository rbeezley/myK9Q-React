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
