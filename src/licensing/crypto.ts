/**
 * BillKhata Licensing Crypto
 * HMAC-SHA256 signing and verification (pure JS implementation)
 */

import { EMBEDDED_SECRET, LICENSE_DATA_VERSION } from './constants';
import { LicensePayload, SignedLicenseData } from './types';

/**
 * Simple SHA256 implementation (pure JavaScript)
 * Based on the FIPS 180-4 specification
 */
export function sha256(message: string): string {
  // Convert string to UTF-8 bytes
  const msgBuffer = new TextEncoder().encode(message);

  // Constants
  const K = [
    0x428a2f98, 0x71374491, 0xb5c0fbcf, 0xe9b5dba5, 0x3956c25b, 0x59f111f1, 0x923f82a4, 0xab1c5ed5,
    0xd807aa98, 0x12835b01, 0x243185be, 0x550c7dc3, 0x72be5d74, 0x80deb1fe, 0x9bdc06a7, 0xc19bf174,
    0xe49b69c1, 0xefbe4786, 0x0fc19dc6, 0x240ca1cc, 0x2de92c6f, 0x4a7484aa, 0x5cb0a9dc, 0x76f988da,
    0x983e5152, 0xa831c66d, 0xb00327c8, 0xbf597fc7, 0xc6e00bf3, 0xd5a79147, 0x06ca6351, 0x14292967,
    0x27b70a85, 0x2e1b2138, 0x4d2c6dfc, 0x53380d13, 0x650a7354, 0x766a0abb, 0x81c2c92e, 0x92722c85,
    0xa2bfe8a1, 0xa81a664b, 0xc24b8b70, 0xc76c51a3, 0xd192e819, 0xd6990624, 0xf40e3585, 0x106aa070,
    0x19a4c116, 0x1e376c08, 0x2748774c, 0x34b0bcb5, 0x391c0cb3, 0x4ed8aa4a, 0x5b9cca4f, 0x682e6ff3,
    0x748f82ee, 0x78a5636f, 0x84c87814, 0x8cc70208, 0x90befffa, 0xa4506ceb, 0xbef9a3f7, 0xc67178f2
  ];

  // Initial hash values
  let H = [
    0x6a09e667, 0xbb67ae85, 0x3c6ef372, 0xa54ff53a,
    0x510e527f, 0x9b05688c, 0x1f83d9ab, 0x5be0cd19
  ];

  // Pre-processing: adding padding bits
  const msgLen = msgBuffer.length;
  const bitLen = msgLen * 8;

  // Calculate padded length: message + 1 byte (0x80) + padding + 8 bytes (length)
  // Total must be multiple of 64 bytes (512 bits)
  const totalLen = msgLen + 1 + 8; // message + 0x80 + 64-bit length
  const paddedLen = Math.ceil(totalLen / 64) * 64;

  // Create padded buffer
  const padded = new Uint8Array(paddedLen);
  padded.set(msgBuffer);
  padded[msgLen] = 0x80;

  // Append length in bits as 64-bit big-endian (we only use lower 32 bits for simplicity)
  const view = new DataView(padded.buffer);
  view.setUint32(paddedLen - 4, bitLen, false);

  // Process each 512-bit block
  for (let i = 0; i < paddedLen; i += 64) {
    const W = new Uint32Array(64);

    // Copy block into first 16 words
    for (let t = 0; t < 16; t++) {
      W[t] = view.getUint32(i + t * 4, false);
    }

    // Extend to 64 words
    for (let t = 16; t < 64; t++) {
      const s0 = rotr(W[t-15], 7) ^ rotr(W[t-15], 18) ^ (W[t-15] >>> 3);
      const s1 = rotr(W[t-2], 17) ^ rotr(W[t-2], 19) ^ (W[t-2] >>> 10);
      W[t] = (W[t-16] + s0 + W[t-7] + s1) >>> 0;
    }

    // Initialize working variables
    let [a, b, c, d, e, f, g, h] = H;

    // Main loop
    for (let t = 0; t < 64; t++) {
      const S1 = rotr(e, 6) ^ rotr(e, 11) ^ rotr(e, 25);
      const ch = (e & f) ^ (~e & g);
      const temp1 = (h + S1 + ch + K[t] + W[t]) >>> 0;
      const S0 = rotr(a, 2) ^ rotr(a, 13) ^ rotr(a, 22);
      const maj = (a & b) ^ (a & c) ^ (b & c);
      const temp2 = (S0 + maj) >>> 0;

      h = g;
      g = f;
      f = e;
      e = (d + temp1) >>> 0;
      d = c;
      c = b;
      b = a;
      a = (temp1 + temp2) >>> 0;
    }

    // Add to hash
    H = [
      (H[0] + a) >>> 0, (H[1] + b) >>> 0, (H[2] + c) >>> 0, (H[3] + d) >>> 0,
      (H[4] + e) >>> 0, (H[5] + f) >>> 0, (H[6] + g) >>> 0, (H[7] + h) >>> 0
    ];
  }

  // Convert to hex string
  return H.map(h => h.toString(16).padStart(8, '0')).join('');
}

function rotr(n: number, x: number): number {
  return (n >>> x) | (n << (32 - x));
}

/**
 * HMAC-SHA256 implementation
 */
export function hmacSha256(key: string, message: string): string {
  const blockSize = 64;

  // Convert key to bytes
  let keyBytes: Uint8Array<ArrayBufferLike> = new TextEncoder().encode(key);

  // If key is longer than block size, hash it
  if (keyBytes.length > blockSize) {
    keyBytes = hexToBytes(sha256(key));
  }

  // Pad key to block size
  const paddedKey = new Uint8Array(blockSize);
  paddedKey.set(keyBytes);

  // Create inner and outer padding
  const ipad = new Uint8Array(blockSize);
  const opad = new Uint8Array(blockSize);

  for (let i = 0; i < blockSize; i++) {
    ipad[i] = paddedKey[i] ^ 0x36;
    opad[i] = paddedKey[i] ^ 0x5c;
  }

  // Inner hash: H(ipad || message)
  const innerInput = bytesToString(ipad) + message;
  const innerHash = sha256(innerInput);

  // Outer hash: H(opad || innerHash)
  const outerInput = bytesToString(opad) + hexToString(innerHash);
  return sha256(outerInput);
}

function hexToBytes(hex: string): Uint8Array {
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < hex.length; i += 2) {
    bytes[i / 2] = parseInt(hex.substr(i, 2), 16);
  }
  return bytes;
}

function bytesToString(bytes: Uint8Array): string {
  return Array.from(bytes).map(b => String.fromCharCode(b)).join('');
}

function hexToString(hex: string): string {
  return bytesToString(hexToBytes(hex));
}

/**
 * Derive device-bound key from embedded secret and device fingerprint
 */
export function deriveDeviceKey(deviceFingerprint: string): string {
  return hmacSha256(EMBEDDED_SECRET, deviceFingerprint);
}

/**
 * Sign a license payload
 */
export function signPayload(payload: LicensePayload, deviceFingerprint: string): string {
  const deviceKey = deriveDeviceKey(deviceFingerprint);
  const payloadString = JSON.stringify(payload);
  return hmacSha256(deviceKey, payloadString);
}

/**
 * Verify a signed license payload
 */
export function verifySignature(data: SignedLicenseData, deviceFingerprint: string): boolean {
  const expectedSignature = signPayload(data.payload, deviceFingerprint);
  return data.signature === expectedSignature;
}

/**
 * Create signed license data
 */
export function createSignedLicenseData(
  trialStartDate: string,
  deviceFingerprint: string,
  licenseKey: string | null
): SignedLicenseData {
  const payload: LicensePayload = {
    trialStartDate,
    deviceFingerprint,
    licenseKey,
    version: LICENSE_DATA_VERSION,
  };

  const signature = signPayload(payload, deviceFingerprint);

  return { payload, signature };
}

/**
 * Validate license key format and decode
 * License key format: XXXX-XXXX-XXXX-XXXX
 * Encoding: First 12 chars = device fingerprint prefix, Last 4 = checksum
 */
export function validateLicenseKey(licenseKey: string, deviceFingerprint: string): boolean {
  // Check format
  const cleanKey = licenseKey.toUpperCase().replace(/-/g, '');
  if (cleanKey.length !== 16 || !/^[A-Z0-9]+$/.test(cleanKey)) {
    return false;
  }

  // Extract parts
  const devicePart = cleanKey.substring(0, 12);
  const checksumPart = cleanKey.substring(12, 16);

  // Get expected device part from fingerprint
  const expectedDevicePart = deviceFingerprint.substring(0, 12).toUpperCase();

  // Verify device binding
  if (devicePart !== expectedDevicePart) {
    return false;
  }

  // Verify checksum
  const expectedChecksum = generateChecksum(devicePart);
  if (checksumPart !== expectedChecksum) {
    return false;
  }

  return true;
}

/**
 * Generate checksum for license key
 * Simple: hash the device part and take first 4 chars
 */
function generateChecksum(devicePart: string): string {
  const hash = sha256(devicePart + EMBEDDED_SECRET);
  return hash.substring(0, 4).toUpperCase();
}

/**
 * Generate a license key for a device (for key generation tool)
 * This would normally run on your server/computer, not in the app
 */
export function generateLicenseKey(deviceFingerprint: string): string {
  const devicePart = deviceFingerprint.substring(0, 12).toUpperCase();
  const checksumPart = generateChecksum(devicePart);
  const fullKey = devicePart + checksumPart;

  // Format as XXXX-XXXX-XXXX-XXXX
  return `${fullKey.slice(0, 4)}-${fullKey.slice(4, 8)}-${fullKey.slice(8, 12)}-${fullKey.slice(12, 16)}`;
}
