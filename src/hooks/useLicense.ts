/**
 * BillKhata License Hook
 * React hook for easy license state access
 */

import { useCallback, useState } from 'react';
import { useLicenseStore } from '../stores/licenseStore';
import { SUPPORT_WHATSAPP_NUMBER, TRIAL_DURATION_DAYS } from '../licensing';
import { Linking } from 'react-native';

import { LicenseStatus } from '../licensing';

interface UseLicenseReturn {
  // Status
  status: LicenseStatus;
  isInitialized: boolean;
  isLoading: boolean;

  // Permissions
  canCreateBill: boolean;
  canEditBill: boolean;
  canEditSettings: boolean;

  // Trial info
  isTrialActive: boolean;
  isLicensed: boolean;
  isExpired: boolean;
  daysRemaining: number | null;
  trialDuration: number;

  // Device info
  deviceFingerprint: string | null;

  // Actions
  activateLicense: (key: string) => Promise<{ success: boolean; error?: string }>;
  refresh: () => Promise<void>;
  openWhatsAppSupport: () => Promise<void>;

  // UI helpers
  showUpgradePrompt: boolean;
  upgradeMessage: string;
}

export function useLicense(): UseLicenseReturn {
  const store = useLicenseStore();

  const showUpgradePrompt = store.isExpired || store.status === 'tampered';

  const upgradeMessage = store.status === 'expired'
    ? 'Your trial has ended'
    : store.status === 'tampered'
    ? 'License verification failed'
    : store.isTrialActive && store.daysRemaining !== null && store.daysRemaining <= 3
    ? `Trial ends in ${store.daysRemaining} day${store.daysRemaining === 1 ? '' : 's'}`
    : '';

  const openWhatsAppSupport = useCallback(async () => {
    const fingerprint = await store.getDisplayFingerprint();
    const message = encodeURIComponent(
      `Hi, I want to upgrade BillKhata.\n\nDevice ID: ${fingerprint}`
    );
    const url = `https://wa.me/${SUPPORT_WHATSAPP_NUMBER}?text=${message}`;

    try {
      await Linking.openURL(url);
    } catch (error) {
      console.error('Failed to open WhatsApp:', error);
    }
  }, [store]);

  return {
    status: store.status,
    isInitialized: store.isInitialized,
    isLoading: store.isLoading,

    canCreateBill: store.canCreateBill,
    canEditBill: store.canEditBill,
    canEditSettings: store.canEditSettings,

    isTrialActive: store.isTrialActive,
    isLicensed: store.isLicensed,
    isExpired: store.isExpired,
    daysRemaining: store.daysRemaining,
    trialDuration: TRIAL_DURATION_DAYS,

    deviceFingerprint: store.deviceFingerprint,

    activateLicense: store.activateLicense,
    refresh: store.refresh,
    openWhatsAppSupport,

    showUpgradePrompt,
    upgradeMessage,
  };
}

/**
 * Hook for checking if a specific action is allowed
 * Returns a function that either performs the action or shows upgrade prompt
 */
export function useProtectedAction(
  action: () => void,
  featureType: 'createBill' | 'editBill' | 'editSettings' = 'createBill'
): {
  perform: () => void;
  isAllowed: boolean;
  showPrompt: boolean;
  setShowPrompt: (show: boolean) => void;
} {
  const license = useLicense();
  const [showPrompt, setShowPrompt] = useState(false);

  const isAllowed = featureType === 'createBill'
    ? license.canCreateBill
    : featureType === 'editBill'
    ? license.canEditBill
    : license.canEditSettings;

  const perform = useCallback(() => {
    if (isAllowed) {
      action();
    } else {
      setShowPrompt(true);
    }
  }, [isAllowed, action]);

  return {
    perform,
    isAllowed,
    showPrompt,
    setShowPrompt,
  };
}
