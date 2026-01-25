/**
 * BillKhata Type Definitions - Settings
 */

import { InvoiceTheme } from '../theme';

export interface ShopSettings {
  shopName: string;
  shopPhone: string;
  shopAddress: string;
  shopLogoUri: string | null;
  invoiceTemplate: InvoiceTemplate;
  invoiceColorTheme: InvoiceTheme;
  footerNote: string;
  defaultGstEnabled: boolean;
  defaultGstRate: 5 | 12 | 18 | 28;
  lastPaymentMode: 'cash' | 'upi';
  wizardCompleted: boolean;
  language: SupportedLanguage;
}

export type InvoiceTemplate = 'classic' | 'modern' | 'compact';
export type SupportedLanguage = 'en' | 'hi';

export const defaultSettings: ShopSettings = {
  shopName: '',
  shopPhone: '',
  shopAddress: '',
  shopLogoUri: null,
  invoiceTemplate: 'classic',
  invoiceColorTheme: 'blue',
  footerNote: 'Thank you for your business!',
  defaultGstEnabled: false,
  defaultGstRate: 18,
  lastPaymentMode: 'cash',
  wizardCompleted: false,
  language: 'en',
};
