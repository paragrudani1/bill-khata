/**
 * BillKhata Licensing Constants
 * Configuration for trial duration, contact info, and feature tiers
 */

// Trial configuration
export const TRIAL_DURATION_DAYS = 14;

// WhatsApp support number (replace with your actual number)
export const SUPPORT_WHATSAPP_NUMBER = '919638421195'; // Format: country code + number, no +

// License key format
export const LICENSE_KEY_FORMAT = /^[A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{4}$/;

// Validation intervals
export const FULL_VALIDATION_INTERVAL_MS = 5 * 60 * 1000; // 5 minutes

// Storage keys
export const ASYNC_STORAGE_LICENSE_KEY = '@billkhata_license';
export const LICENSE_FILE_NAME = '.license_meta';
export const LICENSE_TABLE_NAME = 'license_meta';

// Integrity thresholds
export const INTEGRITY_SCORE_THRESHOLD = 50; // Below this, consider tampered

// Embedded secret for HMAC (in production, obfuscate this)
// This is combined with device fingerprint to create device-bound keys
export const EMBEDDED_SECRET = 'BK_L1C3NS3_S3CR3T_2024_v1';

// License data version (for migrations)
export const LICENSE_DATA_VERSION = 1;

// Expected package ID (for repackaging detection)
export const EXPECTED_PACKAGE_ID = 'com.billkhata.app';

// Time drift tolerance (for clock manipulation detection)
export const MAX_TIME_DRIFT_MS = 24 * 60 * 60 * 1000; // 24 hours

// Protected features (require trial/license)
export const PROTECTED_FEATURES = [
  'createBill',
  'editBill',
  'editShopSettings',
  'changeInvoiceTemplate',
] as const;

// Free features (always accessible)
export const FREE_FEATURES = [
  'viewBills',
  'viewBillDetails',
  'searchBills',
  'shareBill',
  'exportBill',
  'viewSettings',
] as const;
