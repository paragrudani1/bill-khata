/**
 * BillKhata Licensing Types
 * Type definitions for the licensing system
 */

export type LicenseStatus = 'unknown' | 'trial' | 'licensed' | 'expired' | 'tampered';

export interface LicenseState {
  status: LicenseStatus;
  trialStartDate: string | null;     // ISO date
  daysRemaining: number | null;
  deviceFingerprint: string;         // Hashed
  licenseKey: string | null;
  lastValidatedAt: string;
  integrityScore: number;            // 0-100
}

export interface LicensePayload {
  trialStartDate: string;
  deviceFingerprint: string;
  licenseKey: string | null;
  version: number;
}

export interface SignedLicenseData {
  payload: LicensePayload;
  signature: string;  // HMAC-SHA256(payload, deviceDerivedKey)
}

export interface DeviceFingerprint {
  primary: string;      // Android ID (stable across reinstalls)
  secondary: string;    // Installation ID (changes on reinstall)
  appId: string;        // Package verification
}

export interface StorageLocation {
  name: 'asyncStorage' | 'sqlite' | 'fileSystem';
  read: () => Promise<SignedLicenseData | null>;
  write: (data: SignedLicenseData) => Promise<void>;
}

export interface ValidationResult {
  status: LicenseStatus;
  integrityScore: number;
  trialStartDate: string | null;
  daysRemaining: number | null;
  licenseKey: string | null;
  errors: string[];
}

// Features that require license
export type ProtectedFeature =
  | 'createBill'
  | 'editBill'
  | 'editShopSettings'
  | 'changeInvoiceTemplate';

// Features that are always free
export type FreeFeature =
  | 'viewBills'
  | 'viewBillDetails'
  | 'searchBills'
  | 'shareBill'
  | 'exportBill'
  | 'viewSettings';
