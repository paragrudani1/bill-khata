/**
 * BillKhata License Storage
 * Multi-location storage for tamper resistance
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { Paths, File } from 'expo-file-system';
import { openDatabaseSync } from 'expo-sqlite';
import { SignedLicenseData } from './types';
import {
  ASYNC_STORAGE_LICENSE_KEY,
  LICENSE_FILE_NAME,
  LICENSE_TABLE_NAME,
} from './constants';

// Get the existing database instance
const db = openDatabaseSync('billkhata.db');

/**
 * Initialize license table in SQLite
 */
export function initializeLicenseTable(): void {
  db.execSync(`
    CREATE TABLE IF NOT EXISTS ${LICENSE_TABLE_NAME} (
      id TEXT PRIMARY KEY DEFAULT 'license',
      data TEXT NOT NULL,
      updated_at TEXT NOT NULL
    )
  `);
}

// ============= AsyncStorage Location =============

export async function readFromAsyncStorage(): Promise<SignedLicenseData | null> {
  try {
    const data = await AsyncStorage.getItem(ASYNC_STORAGE_LICENSE_KEY);
    if (!data) return null;
    return JSON.parse(data) as SignedLicenseData;
  } catch (error) {
    console.warn('Failed to read license from AsyncStorage:', error);
    return null;
  }
}

export async function writeToAsyncStorage(data: SignedLicenseData): Promise<void> {
  try {
    await AsyncStorage.setItem(ASYNC_STORAGE_LICENSE_KEY, JSON.stringify(data));
  } catch (error) {
    console.error('Failed to write license to AsyncStorage:', error);
    throw error;
  }
}

// ============= SQLite Location =============

export function readFromSQLite(): SignedLicenseData | null {
  try {
    const result = db.getFirstSync<{ data: string }>(
      `SELECT data FROM ${LICENSE_TABLE_NAME} WHERE id = 'license'`
    );
    if (!result) return null;
    return JSON.parse(result.data) as SignedLicenseData;
  } catch (error) {
    console.warn('Failed to read license from SQLite:', error);
    return null;
  }
}

export function writeToSQLite(data: SignedLicenseData): void {
  try {
    const now = new Date().toISOString();
    const jsonData = JSON.stringify(data);

    db.runSync(
      `INSERT OR REPLACE INTO ${LICENSE_TABLE_NAME} (id, data, updated_at) VALUES ('license', ?, ?)`,
      [jsonData, now]
    );
  } catch (error) {
    console.error('Failed to write license to SQLite:', error);
    throw error;
  }
}

// ============= FileSystem Location =============

function getLicenseFile(): File {
  return new File(Paths.document, LICENSE_FILE_NAME);
}

export async function readFromFileSystem(): Promise<SignedLicenseData | null> {
  try {
    const file = getLicenseFile();
    if (!file.exists) return null;

    const content = await file.text();
    return JSON.parse(content) as SignedLicenseData;
  } catch (error) {
    console.warn('Failed to read license from FileSystem:', error);
    return null;
  }
}

export async function writeToFileSystem(data: SignedLicenseData): Promise<void> {
  try {
    const file = getLicenseFile();
    await file.write(JSON.stringify(data));
  } catch (error) {
    console.error('Failed to write license to FileSystem:', error);
    throw error;
  }
}

// ============= Multi-Location Operations =============

export interface StorageReadResult {
  asyncStorage: SignedLicenseData | null;
  sqlite: SignedLicenseData | null;
  fileSystem: SignedLicenseData | null;
}

/**
 * Read license data from all three locations
 */
export async function readFromAllLocations(): Promise<StorageReadResult> {
  const [asyncStorage, fileSystem] = await Promise.all([
    readFromAsyncStorage(),
    readFromFileSystem(),
  ]);

  // SQLite is synchronous
  const sqlite = readFromSQLite();

  return { asyncStorage, sqlite, fileSystem };
}

/**
 * Write license data to all three locations
 */
export async function writeToAllLocations(data: SignedLicenseData): Promise<void> {
  // Write to all locations, don't fail if one fails
  const errors: Error[] = [];

  try {
    await writeToAsyncStorage(data);
  } catch (e) {
    errors.push(e as Error);
  }

  try {
    writeToSQLite(data);
  } catch (e) {
    errors.push(e as Error);
  }

  try {
    await writeToFileSystem(data);
  } catch (e) {
    errors.push(e as Error);
  }

  // If all three failed, throw
  if (errors.length === 3) {
    throw new Error('Failed to write license to any storage location');
  }
}

/**
 * Count how many locations have matching data
 */
export function countMatchingLocations(result: StorageReadResult): number {
  const values = [result.asyncStorage, result.sqlite, result.fileSystem];
  const nonNull = values.filter(v => v !== null) as SignedLicenseData[];

  if (nonNull.length === 0) return 0;
  if (nonNull.length === 1) return 1;

  // Compare signatures - if they match, the data is consistent
  const firstSig = nonNull[0].signature;
  let matchCount = 1;

  for (let i = 1; i < nonNull.length; i++) {
    if (nonNull[i].signature === firstSig) {
      matchCount++;
    }
  }

  return matchCount;
}

/**
 * Get the most trusted license data (majority wins, or most complete)
 */
export function getMostTrustedData(result: StorageReadResult): SignedLicenseData | null {
  const values = [
    { source: 'asyncStorage', data: result.asyncStorage },
    { source: 'sqlite', data: result.sqlite },
    { source: 'fileSystem', data: result.fileSystem },
  ].filter(v => v.data !== null);

  if (values.length === 0) return null;
  if (values.length === 1) return values[0].data;

  // Group by signature
  const signatureGroups = new Map<string, SignedLicenseData[]>();

  for (const { data } of values) {
    const sig = data!.signature;
    if (!signatureGroups.has(sig)) {
      signatureGroups.set(sig, []);
    }
    signatureGroups.get(sig)!.push(data!);
  }

  // Find the group with most entries (majority)
  let maxCount = 0;
  let majorityData: SignedLicenseData | null = null;

  for (const [_, group] of signatureGroups) {
    if (group.length > maxCount) {
      maxCount = group.length;
      majorityData = group[0];
    }
  }

  return majorityData;
}

/**
 * Repair inconsistent storage locations
 */
export async function repairStorage(trustedData: SignedLicenseData): Promise<void> {
  await writeToAllLocations(trustedData);
}
