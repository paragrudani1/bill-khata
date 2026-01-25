/**
 * BillKhata Settings Store
 * Manages shop settings and app preferences
 */

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ShopSettings, defaultSettings, InvoiceTemplate, SupportedLanguage } from '../types';
import { InvoiceTheme } from '../theme';

interface SettingsState extends ShopSettings {
  // Actions
  setShopName: (name: string) => void;
  setShopPhone: (phone: string) => void;
  setShopAddress: (address: string) => void;
  setShopLogo: (uri: string | null) => void;
  setInvoiceTemplate: (template: InvoiceTemplate) => void;
  setInvoiceColorTheme: (theme: InvoiceTheme) => void;
  setFooterNote: (note: string) => void;
  setDefaultGstEnabled: (enabled: boolean) => void;
  setDefaultGstRate: (rate: 5 | 12 | 18 | 28) => void;
  setLastPaymentMode: (mode: 'cash' | 'upi') => void;
  setWizardCompleted: (completed: boolean) => void;
  setLanguage: (language: SupportedLanguage) => void;
  resetSettings: () => void;
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      // Initial state
      ...defaultSettings,

      // Actions
      setShopName: (shopName) => set({ shopName }),
      setShopPhone: (shopPhone) => set({ shopPhone }),
      setShopAddress: (shopAddress) => set({ shopAddress }),
      setShopLogo: (shopLogoUri) => set({ shopLogoUri }),
      setInvoiceTemplate: (invoiceTemplate) => set({ invoiceTemplate }),
      setInvoiceColorTheme: (invoiceColorTheme) => set({ invoiceColorTheme }),
      setFooterNote: (footerNote) => set({ footerNote }),
      setDefaultGstEnabled: (defaultGstEnabled) => set({ defaultGstEnabled }),
      setDefaultGstRate: (defaultGstRate) => set({ defaultGstRate }),
      setLastPaymentMode: (lastPaymentMode) => set({ lastPaymentMode }),
      setWizardCompleted: (wizardCompleted) => set({ wizardCompleted }),
      setLanguage: (language) => set({ language }),
      resetSettings: () => set(defaultSettings),
    }),
    {
      name: 'billkhata-settings',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
