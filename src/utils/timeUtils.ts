/**
 * Time utility functions for formatting and converting time values
 */

/**
 * Convert seconds (decimal) to MM:SS.HH format
 * @param seconds - Time in seconds (can be decimal)
 * @returns Formatted time string in MM:SS.HH format
 */
export function formatSecondsToTime(seconds: number | string | null): string {
  if (!seconds || seconds === '') return '00:00.00';

  const numSeconds = typeof seconds === 'string' ? parseFloat(seconds) : seconds;

  if (isNaN(numSeconds) || numSeconds < 0) return '00:00.00';

  const minutes = Math.floor(numSeconds / 60);
  const remainingSeconds = numSeconds % 60;

  // Format: MM:SS.HH
  const minutesStr = minutes.toString().padStart(2, '0');
  const secondsStr = remainingSeconds.toFixed(2).padStart(5, '0');

  return `${minutesStr}:${secondsStr}`;
}

/**
 * Convert time string (MM:SS.ss or SS.ss) to decimal seconds
 * @param timeString - Time string in various formats
 * @returns Time in decimal seconds
 */
export function convertTimeToSeconds(timeString: string): number {
  if (!timeString || timeString.trim() === '') return 0;

  // Handle different time formats
  if (timeString.includes(':')) {
    // Format: MM:SS.ss or M:SS.ss
    const parts = timeString.split(':');
    if (parts.length === 2) {
      const minutes = parseInt(parts[0]) || 0;
      const seconds = parseFloat(parts[1]) || 0;
      return minutes * 60 + seconds;
    }
  } else {
    // Format: SS.ss (just seconds)
    return parseFloat(timeString) || 0;
  }

  return 0;
}

/**
 * Format time for display based on the input type
 * If the input is already in MM:SS format, return as-is
 * If the input is in seconds, convert to MM:SS.HH format
 * @param time - Time value (can be seconds or already formatted)
 * @returns Formatted time string
 */
export function formatTimeForDisplay(time: string | number | null): string {
  if (!time && time !== 0) return '00:00.00';

  const timeStr = time.toString();

  // If it already contains a colon, it's likely already formatted
  if (timeStr.includes(':')) {
    return timeStr;
  }

  // Otherwise, treat it as seconds and format it
  return formatSecondsToTime(timeStr);
}