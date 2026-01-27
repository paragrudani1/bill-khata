/**
 * BillKhata i18n Configuration
 * Internationalization setup using i18next and react-i18next
 */

import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

// Import translation files
import enCommon from '../locales/en/common.json';
import enBills from '../locales/en/bills.json';
import enSettings from '../locales/en/settings.json';

import guCommon from '../locales/gu/common.json';
import guBills from '../locales/gu/bills.json';
import guSettings from '../locales/gu/settings.json';

import hiCommon from '../locales/hi/common.json';
import hiBills from '../locales/hi/bills.json';
import hiSettings from '../locales/hi/settings.json';

// Language display names
export const LANGUAGE_NAMES: Record<string, string> = {
  en: 'English',
  gu: 'ગુજરાતી',
  hi: 'हिंदी',
};

// Initialize i18next
i18n
  .use(initReactI18next)
  .init({
    resources: {
      en: {
        common: enCommon,
        bills: enBills,
        settings: enSettings,
      },
      gu: {
        common: guCommon,
        bills: guBills,
        settings: guSettings,
      },
      hi: {
        common: hiCommon,
        bills: hiBills,
        settings: hiSettings,
      },
    },
    lng: 'en', // Default language
    fallbackLng: 'en',
    ns: ['common', 'bills', 'settings'],
    defaultNS: 'common',
    interpolation: {
      escapeValue: false, // React already escapes values
    },
    react: {
      useSuspense: false, // Disable suspense for React Native
    },
  });

/**
 * Change the current language
 */
export const changeLanguage = (language: string) => {
  i18n.changeLanguage(language);
};

/**
 * Get current language
 */
export const getCurrentLanguage = () => {
  return i18n.language;
};

export default i18n;
