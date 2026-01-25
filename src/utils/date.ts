/**
 * BillKhata Date Utilities
 */

/**
 * Get today's date as ISO string (YYYY-MM-DD)
 */
export function getTodayISO(): string {
  return new Date().toISOString().split('T')[0];
}

/**
 * Get current timestamp as ISO string
 */
export function getNowISO(): string {
  return new Date().toISOString();
}

/**
 * Format date for display
 * @param isoDate - ISO date string
 * @param format - 'short' (24 Jan), 'long' (24 January 2026), 'relative' (Today, Yesterday)
 */
export function formatDate(
  isoDate: string,
  format: 'short' | 'long' | 'relative' = 'short'
): string {
  const date = new Date(isoDate);
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  const targetDate = new Date(date);
  targetDate.setHours(0, 0, 0, 0);

  if (format === 'relative') {
    if (targetDate.getTime() === today.getTime()) {
      return 'Today';
    }
    if (targetDate.getTime() === yesterday.getTime()) {
      return 'Yesterday';
    }
  }

  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];
  const shortMonths = [
    'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
    'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
  ];

  const day = date.getDate();
  const month = date.getMonth();
  const year = date.getFullYear();

  if (format === 'long') {
    return `${day} ${months[month]} ${year}`;
  }

  // Default to short format
  return `${day} ${shortMonths[month]}`;
}

/**
 * Format time from ISO string
 * @param isoDateTime - ISO datetime string
 * @returns Time in 12-hour format (2:30 PM)
 */
export function formatTime(isoDateTime: string): string {
  const date = new Date(isoDateTime);
  let hours = date.getHours();
  const minutes = date.getMinutes();
  const ampm = hours >= 12 ? 'PM' : 'AM';

  hours = hours % 12;
  hours = hours ? hours : 12; // 0 should be 12

  const minutesStr = minutes < 10 ? '0' + minutes : minutes;

  return `${hours}:${minutesStr} ${ampm}`;
}

/**
 * Check if a date is today
 */
export function isToday(isoDate: string): boolean {
  return isoDate.split('T')[0] === getTodayISO();
}

/**
 * Get date group key for bill history sections
 * @param isoDate - ISO date string
 * @returns Group key (Today, Yesterday, or the date)
 */
export function getDateGroupKey(isoDate: string): string {
  const dateStr = isoDate.split('T')[0];
  const today = getTodayISO();

  if (dateStr === today) {
    return 'Today';
  }

  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  if (dateStr === yesterday.toISOString().split('T')[0]) {
    return 'Yesterday';
  }

  return formatDate(isoDate, 'long');
}
