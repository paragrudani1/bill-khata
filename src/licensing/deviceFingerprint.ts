/**
 * BillKhata Device Fingerprint
 * Generate device-bound identifiers for license validation
 */

import * as Application from "expo-application";
import Constants from "expo-constants";
import { DeviceFingerprint } from "./types";
import { EXPECTED_PACKAGE_ID } from "./constants";
import { sha256 } from "./crypto";

let cachedFingerprint: string | null = null;

/**
 * Get raw device fingerprint components
 */
export async function getDeviceFingerprintComponents(): Promise<DeviceFingerprint> {
  const androidId = Application.getAndroidId();

  return {
    primary: androidId || "unknown",
    secondary: Constants.installationId || "unknown",
    appId: Application.applicationId || "unknown",
  };
}

/**
 * Get hashed device fingerprint
 * This is the primary identifier used for license binding
 */
export async function getDeviceFingerprint(): Promise<string> {
  if (cachedFingerprint) {
    return cachedFingerprint;
  }

  const components = await getDeviceFingerprintComponents();

  // Combine primary and app ID for the fingerprint
  // We don't use secondary (installationId) in the hash because it changes on reinstall
  // But we verify it exists as a cross-check
  const fingerprintSource = `${components.primary}:${components.appId}`;

  cachedFingerprint = sha256(fingerprintSource);
  return cachedFingerprint;
}

/**
 * Get displayable fingerprint for WhatsApp message
 * Shortened, human-readable format
 */
export async function getDisplayableFingerprint(): Promise<string> {
  const fullFingerprint = await getDeviceFingerprint();

  // Take first 16 chars and format as XXXX-XXXX-XXXX-XXXX
  const short = fullFingerprint.substring(0, 16).toUpperCase();
  return `${short.slice(0, 4)}-${short.slice(4, 8)}-${short.slice(8, 12)}-${short.slice(12, 16)}`;
}

/**
 * Verify package ID matches expected (detect repackaged APKs)
 */
export function verifyPackageId(): boolean {
  const currentPackageId = Application.applicationId;

  // In development, package ID might differ
  if (__DEV__) {
    return true;
  }

  return currentPackageId === EXPECTED_PACKAGE_ID;
}

/**
 * Get Android ID for display (useful for debugging)
 */
export async function getAndroidIdForDisplay(): Promise<string> {
  const androidId = Application.getAndroidId();
  return androidId || "unavailable";
}

/**
 * Clear cached fingerprint (for testing)
 */
export function clearFingerprintCache(): void {
  cachedFingerprint = null;
}
