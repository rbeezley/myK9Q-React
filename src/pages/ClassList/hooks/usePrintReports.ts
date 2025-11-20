/**
 * usePrintReports Hook
 *
 * Manages check-in and results sheet generation for classes.
 * Handles data fetching, validation, and report generation.
 *
 * Extracted from ClassList.tsx
 */

import { useCallback } from 'react';
import { generateCheckInSheet, generateResultsSheet, type ReportClassInfo } from '@/services/reportService';
import { getClassEntries } from '@/services/entryService';
import { parseOrganizationData } from '@/utils/organizationUtils';
import type { ClassEntry, TrialInfo } from './useClassListData';
import type { Entry } from '@/stores/entryStore';

/**
 * Result type for report operations
 */
export interface ReportOperationResult {
  success: boolean;
  error?: string;
}

/**
 * Hook return type
 */
export interface UsePrintReportsReturn {
  handleGenerateCheckIn: (
    classId: number,
    classes: ClassEntry[],
    trialInfo: TrialInfo | null,
    licenseKey: string,
    organization: string,
    onComplete?: () => void
  ) => Promise<ReportOperationResult>;
  handleGenerateResults: (
    classId: number,
    classes: ClassEntry[],
    trialInfo: TrialInfo | null,
    licenseKey: string,
    organization: string,
    onComplete?: () => void
  ) => Promise<ReportOperationResult>;
}

/**
 * Custom hook for managing print report generation
 *
 * Provides methods for:
 * - **Check-In Sheet**: Generate printable check-in sheet for class
 * - **Results Sheet**: Generate printable results sheet with scored entries only
 * - **Data Fetching**: Automatically fetches class entries from database
 * - **Validation**: Checks for required data before generating reports
 * - **Organization Data**: Parses organization info for header
 *
 * **Check-In Sheet**: Shows all entries with check-in boxes
 * **Results Sheet**: Shows only scored entries with placements/times
 * **Validation**: Results sheet validates that scored entries exist
 *
 * @returns Report generation methods
 *
 * @example
 * ```tsx
 * function ClassList() {
 *   const { handleGenerateCheckIn, handleGenerateResults } = usePrintReports();
 *
 *   const printCheckIn = async (classId: number) => {
 *     const result = await handleGenerateCheckIn(
 *       classId,
 *       classes,
 *       trialInfo,
 *       licenseKey,
 *       organization,
 *       () => closePopup()
 *     );
 *     if (!result.success) {
 *       alert(result.error);
 *     }
 *   };
 *
 *   const printResults = async (classId: number) => {
 *     const result = await handleGenerateResults(
 *       classId,
 *       classes,
 *       trialInfo,
 *       licenseKey,
 *       organization,
 *       () => closePopup()
 *     );
 *     if (!result.success) {
 *       alert(result.error);
 *     }
 *   };
 *
 *   return (
 *     <div>
 *       <button onClick={() => printCheckIn(1)}>Check-In Sheet</button>
 *       <button onClick={() => printResults(1)}>Results Sheet</button>
 *     </div>
 *   );
 * }
 * ```
 */
export function usePrintReports(): UsePrintReportsReturn {
  /**
   * Generate check-in sheet for class
   * Includes all entries with check-in boxes
   */
  const handleGenerateCheckIn = useCallback(async (
    classId: number,
    classes: ClassEntry[],
    trialInfo: TrialInfo | null,
    licenseKey: string,
    organization: string,
    onComplete?: () => void
  ): Promise<ReportOperationResult> => {
    try {
      const classData = classes.find(c => c.id === classId);
      if (!classData) {
        return {
          success: false,
          error: 'Class not found'
        };
      }

      if (!licenseKey) {
        return {
          success: false,
          error: 'License key required'
        };
      }

      // Fetch entries for class
      const entries = await getClassEntries(classId, licenseKey);

      // Parse organization data for header
      const orgData = parseOrganizationData(organization);

      // Build report class info
      const reportClassInfo: ReportClassInfo = {
        className: classData.class_name || '',
        element: classData.element || '',
        level: classData.level || '',
        section: classData.section || '',
        trialDate: trialInfo?.trial_date || '',
        trialNumber: trialInfo?.trial_number?.toString() || '',
        judgeName: classData.judge_name || 'TBD',
        organization: orgData.organization,
        activityType: orgData.activity_type
      };

      // Generate check-in sheet
      generateCheckInSheet(reportClassInfo, entries);

      // Call completion callback (e.g., close popup)
      onComplete?.();

      return { success: true };
    } catch (error) {
      console.error('Error generating check-in sheet:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to generate check-in sheet'
      };
    }
  }, []);

  /**
   * Generate results sheet for class
   * Includes only scored entries with placements
   */
  const handleGenerateResults = useCallback(async (
    classId: number,
    classes: ClassEntry[],
    trialInfo: TrialInfo | null,
    licenseKey: string,
    organization: string,
    onComplete?: () => void
  ): Promise<ReportOperationResult> => {
    try {
      const classData = classes.find(c => c.id === classId);
      if (!classData) {
        return {
          success: false,
          error: 'Class not found'
        };
      }

      if (!licenseKey) {
        return {
          success: false,
          error: 'License key required'
        };
      }

      // Fetch entries for class
      const entries = await getClassEntries(classId, licenseKey);

      // Filter to only scored entries
      const completedEntries = entries.filter((e: Entry) => e.isScored);

      if (completedEntries.length === 0) {
        onComplete?.();
        return {
          success: false,
          error: 'No scored entries to display in results sheet'
        };
      }

      // Parse organization data for header
      const orgData = parseOrganizationData(organization);

      // Build report class info
      const reportClassInfo: ReportClassInfo = {
        className: classData.class_name || '',
        element: classData.element || '',
        level: classData.level || '',
        section: classData.section || '',
        trialDate: trialInfo?.trial_date || '',
        trialNumber: trialInfo?.trial_number?.toString() || '',
        judgeName: classData.judge_name || 'TBD',
        organization: orgData.organization,
        activityType: orgData.activity_type
      };

      // Generate results sheet
      generateResultsSheet(reportClassInfo, entries);

      // Call completion callback (e.g., close popup)
      onComplete?.();

      return { success: true };
    } catch (error) {
      console.error('Error generating results sheet:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to generate results sheet'
      };
    }
  }, []);

  return {
    handleGenerateCheckIn,
    handleGenerateResults,
  };
}
