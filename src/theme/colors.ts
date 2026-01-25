/**
 * BillKhata Color Palette
 * Design system colors for light and dark modes
 */

export const colors = {
  light: {
    // Primary brand colors
    primary: '#2563EB', // Blue-600
    primaryLight: '#3B82F6', // Blue-500
    primaryDark: '#1D4ED8', // Blue-700

    // Secondary colors
    secondary: '#64748B', // Slate-500
    secondaryLight: '#94A3B8', // Slate-400
    secondaryDark: '#475569', // Slate-600

    // Semantic colors
    success: '#16A34A', // Green-600
    successLight: '#22C55E', // Green-500
    warning: '#F59E0B', // Amber-500
    warningLight: '#FBBF24', // Amber-400
    error: '#DC2626', // Red-600
    errorLight: '#EF4444', // Red-500

    // Background colors
    background: '#FFFFFF',
    backgroundSecondary: '#F8FAFC', // Slate-50
    surface: '#FFFFFF',
    surfaceSecondary: '#F1F5F9', // Slate-100

    // Border colors
    border: '#E2E8F0', // Slate-200
    borderLight: '#F1F5F9', // Slate-100
    borderDark: '#CBD5E1', // Slate-300

    // Text colors
    text: '#0F172A', // Slate-900
    textSecondary: '#64748B', // Slate-500
    textTertiary: '#94A3B8', // Slate-400
    textDisabled: '#CBD5E1', // Slate-300
    textInverse: '#FFFFFF',

    // Special colors
    overlay: 'rgba(15, 23, 42, 0.5)', // Slate-900 @ 50%
    shadow: 'rgba(0, 0, 0, 0.1)',
  },

  dark: {
    // Primary brand colors
    primary: '#3B82F6', // Blue-500
    primaryLight: '#60A5FA', // Blue-400
    primaryDark: '#2563EB', // Blue-600

    // Secondary colors
    secondary: '#94A3B8', // Slate-400
    secondaryLight: '#CBD5E1', // Slate-300
    secondaryDark: '#64748B', // Slate-500

    // Semantic colors
    success: '#22C55E', // Green-500
    successLight: '#4ADE80', // Green-400
    warning: '#FBBF24', // Amber-400
    warningLight: '#FCD34D', // Amber-300
    error: '#EF4444', // Red-500
    errorLight: '#F87171', // Red-400

    // Background colors
    background: '#0F172A', // Slate-900
    backgroundSecondary: '#1E293B', // Slate-800
    surface: '#1E293B', // Slate-800
    surfaceSecondary: '#334155', // Slate-700

    // Border colors
    border: '#334155', // Slate-700
    borderLight: '#475569', // Slate-600
    borderDark: '#1E293B', // Slate-800

    // Text colors
    text: '#F8FAFC', // Slate-50
    textSecondary: '#94A3B8', // Slate-400
    textTertiary: '#64748B', // Slate-500
    textDisabled: '#475569', // Slate-600
    textInverse: '#0F172A', // Slate-900

    // Special colors
    overlay: 'rgba(0, 0, 0, 0.7)',
    shadow: 'rgba(0, 0, 0, 0.3)',
  },

  // Invoice color themes (used for PDF generation)
  invoiceThemes: {
    blue: '#2563EB',
    green: '#16A34A',
    orange: '#EA580C',
    purple: '#9333EA',
  },
} as const;

export type ColorScheme = 'light' | 'dark';
export type InvoiceTheme = keyof typeof colors.invoiceThemes;
