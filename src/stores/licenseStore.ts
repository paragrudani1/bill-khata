/**
 * BillKhata License Store
 * Zustand store for managing license state
 */

import { create } from 'zustand';
import {
  LicenseStatus,
  ValidationResult,
  initializeLicensing,
  performFullValidation,
  performQuickValidation,
  activateLicenseKey as activateKey,
  getDisplayableFingerprint,
  TRIAL_DURATION_DAYS,
} from '../licensing';

interface LicenseStore {
  // State
  status: LicenseStatus;
  isInitialized: boolean;
  isLoading: boolean;
  trialStartDate: string | null;
  daysRemaining: number | null;
  licenseKey: string | null;
  deviceFingerprint: string | null;
  integrityScore: number;
  errors: string[];

  // Computed
  canCreateBill: boolean;
  canEditBill: boolean;
  canEditSettings: boolean;
  isTrialActive: boolean;
  isLicensed: boolean;
  isExpired: boolean;

  // Actions
  initialize: () => Promise<void>;
  refresh: () => Promise<void>;
  quickRefresh: () => Promise<void>;
  activateLicense: (key: string) => Promise<{ success: boolean; error?: string }>;
  getDisplayFingerprint: () => Promise<string>;
}

function computeDerivedState(result: ValidationResult) {
  const canPerformActions = result.status === 'trial' || result.status === 'licensed';

  return {
    canCreateBill: canPerformActions,
    canEditBill: canPerformActions,
    canEditSettings: canPerformActions,
    isTrialActive: result.status === 'trial',
    isLicensed: result.status === 'licensed',
    isExpired: result.status === 'expired',
  };
}

export const useLicenseStore = create<LicenseStore>()((set, get) => ({
  // Initial state
  status: 'unknown',
  isInitialized: false,
  isLoading: false,
  trialStartDate: null,
  daysRemaining: null,
  licenseKey: null,
  deviceFingerprint: null,
  integrityScore: 100,
  errors: [],

  // Computed (will be updated when state changes)
  canCreateBill: true, // Default to true (fail open)
  canEditBill: true,
  canEditSettings: true,
  isTrialActive: false,
  isLicensed: false,
  isExpired: false,

  // Actions
  initialize: async () => {
    if (get().isInitialized || get().isLoading) return;

    set({ isLoading: true });

    try {
      const result = await initializeLicensing();
      const fingerprint = await getDisplayableFingerprint();

      set({
        status: result.status,
        isInitialized: true,
        isLoading: false,
        trialStartDate: result.trialStartDate,
        daysRemaining: result.daysRemaining,
        licenseKey: result.licenseKey,
        deviceFingerprint: fingerprint,
        integrityScore: result.integrityScore,
        errors: result.errors,
        ...computeDerivedState(result),
      });
    } catch (error) {
      console.error('Failed to initialize license:', error);
      // Fail open - allow all actions if initialization fails
      set({
        status: 'unknown',
        isInitialized: true,
        isLoading: false,
        canCreateBill: true,
        canEditBill: true,
        canEditSettings: true,
        errors: ['Initialization failed'],
      });
    }
  },

  refresh: async () => {
    set({ isLoading: true });

    try {
      const result = await performFullValidation();

      set({
        status: result.status,
        isLoading: false,
        trialStartDate: result.trialStartDate,
        daysRemaining: result.daysRemaining,
        licenseKey: result.licenseKey,
        integrityScore: result.integrityScore,
        errors: result.errors,
        ...computeDerivedState(result),
      });
    } catch (error) {
      console.error('Failed to refresh license:', error);
      set({ isLoading: false });
    }
  },

  quickRefresh: async () => {
    try {
      const result = await performQuickValidation();

      set({
        status: result.status,
        daysRemaining: result.daysRemaining,
        ...computeDerivedState(result),
      });
    } catch (error) {
      console.error('Failed to quick refresh license:', error);
    }
  },

  activateLicense: async (key: string) => {
    set({ isLoading: true });

    try {
      const result = await activateKey(key);

      if (result.success) {
        // Refresh state after activation
        await get().refresh();
      } else {
        set({ isLoading: false });
      }

      return result;
    } catch (error) {
      console.error('Failed to activate license:', error);
      set({ isLoading: false });
      return { success: false, error: 'Activation failed' };
    }
  },

  getDisplayFingerprint: async () => {
    const current = get().deviceFingerprint;
    if (current) return current;

    const fingerprint = await getDisplayableFingerprint();
    set({ deviceFingerprint: fingerprint });
    return fingerprint;
  },
}));
