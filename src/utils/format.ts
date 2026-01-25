/**
 * BillKhata Format Utilities
 */

/**
 * Normalize text for search (lowercase, trim whitespace)
 */
export function normalizeForSearch(text: string): string {
  return text.toLowerCase().trim();
}

/**
 * Truncate text with ellipsis
 * @param text - Text to truncate
 * @param maxLength - Maximum length before truncation
 */
export function truncate(text: string, maxLength: number): string {
  if (text.length <= maxLength) {
    return text;
  }
  return text.slice(0, maxLength - 1) + '…';
}

/**
 * Format phone number for display
 * Adds spaces for Indian phone numbers
 */
export function formatPhoneNumber(phone: string): string {
  // Remove all non-digits
  const digits = phone.replace(/\D/g, '');

  // Indian mobile number format: +91 98765 43210
  if (digits.length === 10) {
    return `${digits.slice(0, 5)} ${digits.slice(5)}`;
  }
  if (digits.length === 12 && digits.startsWith('91')) {
    return `+91 ${digits.slice(2, 7)} ${digits.slice(7)}`;
  }

  return phone;
}

/**
 * Format bill number for display
 * @param billNumber - Sequential bill number
 * @returns Formatted string like "#42"
 */
export function formatBillNumber(billNumber: number): string {
  return `#${billNumber}`;
}

/**
 * Validate phone number (Indian mobile)
 */
export function isValidIndianPhone(phone: string): boolean {
  const digits = phone.replace(/\D/g, '');

  // 10 digit number starting with 6-9
  if (digits.length === 10) {
    return /^[6-9]/.test(digits);
  }

  // With country code
  if (digits.length === 12 && digits.startsWith('91')) {
    return /^91[6-9]/.test(digits);
  }

  return false;
}

/**
 * Generate a UUID v4
 */
export function generateId(): string {
  // Use crypto.randomUUID if available, otherwise fallback
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }

  // Fallback UUID generation
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}
