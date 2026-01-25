/**
 * BillKhata Licensing
 * Public exports for the licensing system
 */

// Types
export type {
  LicenseStatus,
  LicenseState,
  LicensePayload,
  SignedLicenseData,
  DeviceFingerprint,
  ValidationResult,
  ProtectedFeature,
  FreeFeature,
} from './types';

// Constants
export {
  TRIAL_DURATION_DAYS,
  SUPPORT_WHATSAPP_NUMBER,
  LICENSE_KEY_FORMAT,
  PROTECTED_FEATURES,
  FREE_FEATURES,
} from './constants';

// Device Fingerprint
export {
  getDeviceFingerprint,
  getDisplayableFingerprint,
  getDeviceFingerprintComponents,
  verifyPackageId,
} from './deviceFingerprint';

// Validation
export {
  initializeLicensing,
  performFullValidation,
  performQuickValidation,
  activateLicenseKey,
  canPerformProtectedAction,
  getCachedValidationResult,
} from './validation';

// Crypto (for key generation tool)
export {
  generateLicenseKey,
  validateLicenseKey,
} from './crypto';
