/**
 * BillKhata Spacing System
 * Consistent spacing values throughout the app
 */

export const spacing = {
  /** 4px - Extra small spacing */
  xs: 4,
  /** 8px - Small spacing */
  sm: 8,
  /** 12px - Medium-small spacing */
  ms: 12,
  /** 16px - Medium spacing (base unit) */
  md: 16,
  /** 20px - Medium-large spacing */
  ml: 20,
  /** 24px - Large spacing */
  lg: 24,
  /** 32px - Extra large spacing */
  xl: 32,
  /** 40px - 2x Extra large spacing */
  xxl: 40,
  /** 48px - 3x Extra large spacing */
  xxxl: 48,
} as const;

export const borderRadius = {
  /** 4px - Small radius */
  sm: 4,
  /** 8px - Medium radius */
  md: 8,
  /** 12px - Large radius */
  lg: 12,
  /** 16px - Extra large radius */
  xl: 16,
  /** 9999px - Full/Pill radius */
  full: 9999,
} as const;

// Touch target sizes (accessibility)
export const touchTargets = {
  /** 44px - Minimum touch target (iOS guideline) */
  minimum: 44,
  /** 48px - Standard touch target (Android guideline) */
  standard: 48,
  /** 56px - Large touch target (for primary CTAs) */
  large: 56,
} as const;
