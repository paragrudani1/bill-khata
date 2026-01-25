/**
 * BillKhata License Validation
 * Core validation logic for license state
 */

import {
  LicenseStatus,
  ValidationResult,
  SignedLicenseData,
} from './types';
import {
  TRIAL_DURATION_DAYS,
  MAX_TIME_DRIFT_MS,
  INTEGRITY_SCORE_THRESHOLD,
  LICENSE_DATA_VERSION,
} from './constants';
import { getDeviceFingerprint, verifyPackageId } from './deviceFingerprint';
import { verifySignature, createSignedLicenseData, validateLicenseKey } from './crypto';
import {
  readFromAllLocations,
  writeToAllLocations,
  countMatchingLocations,
  getMostTrustedData,
  repairStorage,
  StorageReadResult,
  initializeLicenseTable,
} from './storage';

let lastValidationTime: number = 0;
let cachedValidationResult: ValidationResult | null = null;

/**
 * Initialize the licensing system
 * Should be called once on app startup
 */
export async function initializeLicensing(): Promise<ValidationResult> {
  // Ensure license table exists
  initializeLicenseTable();

  // Perform full validation
  return performFullValidation();
}

/**
 * Perform full validation (reads all storage locations)
 */
export async function performFullValidation(): Promise<ValidationResult> {
  const errors: string[] = [];
  let integrityScore = 100;

  // Get device fingerprint
  const deviceFingerprint = await getDeviceFingerprint();

  // Verify package ID
  if (!verifyPackageId()) {
    errors.push('Package ID mismatch');
    integrityScore -= 30;
  }

  // Read from all storage locations
  const storageResult = await readFromAllLocations();
  const locationCount = countMatchingLocations(storageResult);

  // Check storage consistency
  if (locationCount === 0) {
    // No license data found - start new trial
    return startNewTrial(deviceFingerprint);
  }

  if (locationCount < 3) {
    // Some locations are missing or inconsistent
    errors.push(`Only ${locationCount}/3 storage locations match`);
    integrityScore -= (3 - locationCount) * 15;
  }

  // Get the most trusted data
  const trustedData = getMostTrustedData(storageResult);

  if (!trustedData) {
    // This shouldn't happen if locationCount > 0, but handle it
    return startNewTrial(deviceFingerprint);
  }

  // Verify signature
  if (!verifySignature(trustedData, deviceFingerprint)) {
    errors.push('Signature verification failed');
    integrityScore -= 40;

    // This is likely tampering - return tampered status
    if (integrityScore < INTEGRITY_SCORE_THRESHOLD) {
      return {
        status: 'tampered',
        integrityScore,
        trialStartDate: null,
        daysRemaining: null,
        licenseKey: null,
        errors,
      };
    }
  }

  // Verify device fingerprint matches
  if (trustedData.payload.deviceFingerprint !== deviceFingerprint) {
    errors.push('Device fingerprint mismatch');
    // This APK was copied from another device - start new trial
    return startNewTrial(deviceFingerprint);
  }

  // Check data version
  if (trustedData.payload.version !== LICENSE_DATA_VERSION) {
    errors.push('Data version mismatch');
    integrityScore -= 10;
  }

  // Check for time manipulation
  const timeCheck = checkTimeConsistency(trustedData);
  if (!timeCheck.valid) {
    errors.push(timeCheck.reason);
    integrityScore -= 20;
  }

  // Repair storage if needed
  if (locationCount < 3) {
    await repairStorage(trustedData);
  }

  // Determine license status
  const { status, daysRemaining } = determineLicenseStatus(trustedData);

  const result: ValidationResult = {
    status,
    integrityScore,
    trialStartDate: trustedData.payload.trialStartDate,
    daysRemaining,
    licenseKey: trustedData.payload.licenseKey,
    errors,
  };

  // Cache result
  cachedValidationResult = result;
  lastValidationTime = Date.now();

  return result;
}

/**
 * Quick validation (uses cached result if recent)
 */
export async function performQuickValidation(maxAgeMs: number = 5 * 60 * 1000): Promise<ValidationResult> {
  if (cachedValidationResult && (Date.now() - lastValidationTime) < maxAgeMs) {
    return cachedValidationResult;
  }

  return performFullValidation();
}

/**
 * Start a new trial period
 */
async function startNewTrial(deviceFingerprint: string): Promise<ValidationResult> {
  const now = new Date().toISOString();

  const signedData = createSignedLicenseData(now, deviceFingerprint, null);

  await writeToAllLocations(signedData);

  const result: ValidationResult = {
    status: 'trial',
    integrityScore: 100,
    trialStartDate: now,
    daysRemaining: TRIAL_DURATION_DAYS,
    licenseKey: null,
    errors: [],
  };

  cachedValidationResult = result;
  lastValidationTime = Date.now();

  return result;
}

/**
 * Determine license status based on stored data
 */
function determineLicenseStatus(data: SignedLicenseData): { status: LicenseStatus; daysRemaining: number | null } {
  // If has valid license key, user is licensed forever
  if (data.payload.licenseKey) {
    const deviceFingerprint = data.payload.deviceFingerprint;
    if (validateLicenseKey(data.payload.licenseKey, deviceFingerprint)) {
      return { status: 'licensed', daysRemaining: null };
    }
  }

  // Otherwise, check trial status
  const trialStart = new Date(data.payload.trialStartDate);
  const now = new Date();
  const daysSinceStart = Math.floor((now.getTime() - trialStart.getTime()) / (1000 * 60 * 60 * 24));
  const daysRemaining = TRIAL_DURATION_DAYS - daysSinceStart;

  if (daysRemaining > 0) {
    return { status: 'trial', daysRemaining };
  }

  return { status: 'expired', daysRemaining: 0 };
}

/**
 * Check for time manipulation
 */
function checkTimeConsistency(data: SignedLicenseData): { valid: boolean; reason: string } {
  const trialStart = new Date(data.payload.trialStartDate);
  const now = new Date();

  // Trial start date should be in the past
  if (trialStart.getTime() > now.getTime() + MAX_TIME_DRIFT_MS) {
    return { valid: false, reason: 'Trial start date is in the future' };
  }

  // Trial start date shouldn't be unreasonably old (e.g., before app was created)
  const appCreationDate = new Date('2024-01-01');
  if (trialStart.getTime() < appCreationDate.getTime()) {
    return { valid: false, reason: 'Trial start date is before app creation' };
  }

  return { valid: true, reason: '' };
}

/**
 * Activate a license key
 */
export async function activateLicenseKey(licenseKey: string): Promise<{ success: boolean; error?: string }> {
  const deviceFingerprint = await getDeviceFingerprint();

  // Validate the license key
  if (!validateLicenseKey(licenseKey, deviceFingerprint)) {
    return { success: false, error: 'Invalid license key' };
  }

  // Read current data to preserve trial start date
  const storageResult = await readFromAllLocations();
  const currentData = getMostTrustedData(storageResult);

  const trialStartDate = currentData?.payload.trialStartDate || new Date().toISOString();

  // Create new signed data with license key
  const signedData = createSignedLicenseData(trialStartDate, deviceFingerprint, licenseKey);

  await writeToAllLocations(signedData);

  // Clear cache to force re-validation
  cachedValidationResult = null;

  return { success: true };
}

/**
 * Check if a protected action is allowed
 */
export function canPerformProtectedAction(): boolean {
  if (!cachedValidationResult) {
    // If not validated yet, allow action (fail open)
    return true;
  }

  return cachedValidationResult.status === 'trial' || cachedValidationResult.status === 'licensed';
}

/**
 * Get cached validation result (for quick state checks)
 */
export function getCachedValidationResult(): ValidationResult | null {
  return cachedValidationResult;
}

/**
 * Clear validation cache (for testing)
 */
export function clearValidationCache(): void {
  cachedValidationResult = null;
  lastValidationTime = 0;
}
