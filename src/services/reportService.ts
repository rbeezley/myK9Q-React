import ReactDOMServer from 'react-dom/server';
import React from 'react';
import { Entry } from '../stores/entryStore';
import { CheckInSheet, CheckInSheetProps } from '../components/reports/CheckInSheet';
import { ResultsSheet, ResultsSheetProps } from '../components/reports/ResultsSheet';

/**
 * Report generation service
 * Opens a new window with the report and triggers print dialog
 */

export interface ReportClassInfo {
  className: string;
  element: string;
  level: string;
  section: string;
  trialDate: string;
  trialNumber: string;
  judgeName: string;
  timeLimit?: string;
  showName?: string;
  organization?: string;
  activityType?: string; // e.g., "Scent Work", "FastCat"
}

/**
 * Inline CSS styles for print reports
 * Embedded directly to avoid external file loading issues
 */
const PRINT_STYLES = `
@page { size: letter; margin: 0.5in; }
.print-report { font-family: Arial, sans-serif; color: #000; background: #fff; max-width: 8.5in; margin: 0 auto; padding: 0.5in; box-sizing: border-box; }
.print-header { position: relative; text-align: center; margin-bottom: 1.5rem; padding-top: 0.5rem; }
.print-logo { position: absolute; left: 0; top: 0; display: flex; align-items: center; gap: 8px; }
.print-logo .logo-img { height: 40px; width: 40px; display: block; }
.print-logo .logo-text { font-size: 24px; font-weight: bold; color: #007AFF; letter-spacing: -0.5px; }
.print-title { font-size: 24px; font-weight: bold; margin: 0; padding: 0; line-height: 1.2; }
.show-id { position: absolute; right: 0; top: 0; font-size: 14px; font-weight: normal; }
.show-name { text-align: left; font-size: 16px; font-weight: 600; margin: 0.5rem 0; }
.trial-info-box { border: 1px solid #000; padding: 0.75rem; margin: 1rem 0 1.5rem 0; display: grid; grid-template-columns: 1fr 1fr; gap: 0.5rem 1rem; }
.info-row { display: flex; gap: 0.5rem; }
.info-label { font-weight: 600; }
.info-value { font-weight: normal; }
.print-table { width: 100%; border-collapse: collapse; margin: 1rem 0; font-size: 11px; }
.print-table.with-margin { margin: 2rem 0; }
.print-table th { background-color: #f0f0f0; border: 1px solid #000; padding: 6px 8px; text-align: left; font-weight: bold; font-size: 10px; color: #666; text-transform: uppercase; letter-spacing: 0.5px; }
.print-table td { border: 1px solid #000; padding: 6px 8px; vertical-align: middle; }
.print-table tbody tr:nth-child(even) { background-color: #fafafa; }
.checkbox-cell { text-align: center; padding: 4px; }
.checkbox-square { display: inline-block; width: 16px; height: 16px; border: 2px solid #000; vertical-align: middle; }
.qualified-text { color: #10b981; font-weight: bold; }
.nq-text { color: #ef4444; font-weight: bold; }
.place-cell { font-weight: bold; text-align: center; }
.time-cell { font-family: 'Courier New', monospace; }
.print-footer { margin-top: 2rem; display: flex; justify-content: space-between; font-size: 11px; padding-top: 1rem; border-top: 1px solid #e0e0e0; }
.qualified-count { margin-left: 1.5rem; }
@media print {
  .print-table th { background-color: #f0f0f0 !important; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
  .print-table tbody tr:nth-child(even) { background-color: #fafafa !important; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
  .qualified-text { color: #10b981 !important; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
  .nq-text { color: #ef4444 !important; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
}
`;

/**
 * Generate complete HTML document for printing
 */
const generatePrintHTML = (title: string, content: string): string => {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
  <style>${PRINT_STYLES}</style>
</head>
<body class="print-preview">
  ${content}
  <script>
    window.onload = function() { window.print(); };
    window.onafterprint = function() { setTimeout(function() { window.close(); }, 500); };
  </script>
</body>
</html>
  `.trim();
};

/**
 * Generate and print check-in sheet
 */
export const generateCheckInSheet = (classInfo: ReportClassInfo, entries: Entry[]): void => {
  try {
    // Create props for CheckInSheet component
    const props: CheckInSheetProps = {
      classInfo,
      entries
    };

    // Render component to HTML string
    const componentHTML = ReactDOMServer.renderToStaticMarkup(
      React.createElement(CheckInSheet, props)
    );

    // Generate complete HTML document
    const htmlDoc = generatePrintHTML(
      `${classInfo.element} ${classInfo.level} Check-in Sheet`,
      componentHTML
    );

    // Open new window and write HTML
    const printWindow = window.open('', '_blank', 'width=800,height=600');
    if (printWindow) {
      printWindow.document.write(htmlDoc);
      printWindow.document.close();
    } else {
      console.error('Failed to open print window. Please check popup blocker settings.');
      alert('Unable to open print window. Please check your browser\'s popup blocker settings.');
    }
  } catch (error) {
    console.error('Error generating check-in sheet:', error);
    alert('Error generating check-in sheet. Please try again.');
  }
};

/**
 * Generate and print results sheet
 */
export const generateResultsSheet = (classInfo: ReportClassInfo, entries: Entry[]): void => {
  try {
    // Filter to only scored entries
    const scoredEntries = entries.filter(entry => entry.isScored);

    if (scoredEntries.length === 0) {
      alert('No scored entries to display in results sheet.');
      return;
    }

    // Create props for ResultsSheet component
    const props: ResultsSheetProps = {
      classInfo,
      entries: scoredEntries
    };

    // Render component to HTML string
    const componentHTML = ReactDOMServer.renderToStaticMarkup(
      React.createElement(ResultsSheet, props)
    );

    // Generate complete HTML document
    const htmlDoc = generatePrintHTML(
      `${classInfo.element} ${classInfo.level} Results`,
      componentHTML
    );

    // Open new window and write HTML
    const printWindow = window.open('', '_blank', 'width=800,height=600');
    if (printWindow) {
      printWindow.document.write(htmlDoc);
      printWindow.document.close();
    } else {
      console.error('Failed to open print window. Please check popup blocker settings.');
      alert('Unable to open print window. Please check your browser\'s popup blocker settings.');
    }
  } catch (error) {
    console.error('Error generating results sheet:', error);
    alert('Error generating results sheet. Please try again.');
  }
};
