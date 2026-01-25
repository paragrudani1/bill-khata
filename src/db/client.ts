/**
 * BillKhata Database Client
 * Initialize SQLite database with Drizzle ORM
 */

import { drizzle } from 'drizzle-orm/expo-sqlite';
import { openDatabaseSync } from 'expo-sqlite';
import * as schema from './schema';

// Open the database
const expoDb = openDatabaseSync('billkhata.db');

// Create Drizzle client
export const db = drizzle(expoDb, { schema });

// SQL statements for creating tables
const createTableStatements = [
  `CREATE TABLE IF NOT EXISTS invoices (
    id TEXT PRIMARY KEY,
    bill_number INTEGER NOT NULL UNIQUE,
    bill_date TEXT NOT NULL,
    customer_id TEXT,
    customer_name TEXT,
    subtotal_paise INTEGER NOT NULL DEFAULT 0,
    discount_paise INTEGER NOT NULL DEFAULT 0,
    gst_enabled INTEGER NOT NULL DEFAULT 0,
    gst_rate INTEGER,
    cgst_paise INTEGER DEFAULT 0,
    sgst_paise INTEGER DEFAULT 0,
    total_paise INTEGER NOT NULL DEFAULT 0,
    payment_mode TEXT NOT NULL DEFAULT 'cash',
    status TEXT NOT NULL DEFAULT 'draft',
    notes TEXT,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    deleted_at TEXT
  )`,
  `CREATE TABLE IF NOT EXISTS invoice_items (
    id TEXT PRIMARY KEY,
    invoice_id TEXT NOT NULL,
    item_id TEXT,
    item_name TEXT NOT NULL,
    quantity REAL NOT NULL DEFAULT 1,
    price_paise INTEGER NOT NULL,
    total_paise INTEGER NOT NULL,
    sort_order INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    FOREIGN KEY (invoice_id) REFERENCES invoices(id) ON DELETE CASCADE
  )`,
  `CREATE TABLE IF NOT EXISTS items (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    name_normalized TEXT NOT NULL,
    last_price_paise INTEGER,
    most_frequent_price_paise INTEGER,
    usage_count INTEGER NOT NULL DEFAULT 1,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
  )`,
  `CREATE TABLE IF NOT EXISTS item_prices (
    id TEXT PRIMARY KEY,
    item_id TEXT NOT NULL,
    price_paise INTEGER NOT NULL,
    usage_count INTEGER NOT NULL DEFAULT 1,
    FOREIGN KEY (item_id) REFERENCES items(id) ON DELETE CASCADE
  )`,
  `CREATE TABLE IF NOT EXISTS customers (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    name_normalized TEXT NOT NULL,
    phone TEXT,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    deleted_at TEXT
  )`,
  `CREATE TABLE IF NOT EXISTS bill_drafts (
    id TEXT PRIMARY KEY DEFAULT 'current',
    draft_data TEXT NOT NULL,
    updated_at TEXT NOT NULL
  )`,
];

// Index creation statements
const createIndexStatements = [
  'CREATE INDEX IF NOT EXISTS idx_invoices_bill_date ON invoices(bill_date)',
  'CREATE INDEX IF NOT EXISTS idx_invoices_customer_id ON invoices(customer_id)',
  'CREATE INDEX IF NOT EXISTS idx_invoices_deleted_at ON invoices(deleted_at)',
  'CREATE INDEX IF NOT EXISTS idx_invoice_items_invoice_id ON invoice_items(invoice_id)',
  'CREATE INDEX IF NOT EXISTS idx_items_name_normalized ON items(name_normalized)',
  'CREATE INDEX IF NOT EXISTS idx_items_usage_count ON items(usage_count DESC)',
  'CREATE INDEX IF NOT EXISTS idx_customers_name_normalized ON customers(name_normalized)',
];

/**
 * Initialize the database tables and indexes
 * Should be called once on app startup
 */
export async function initializeDatabase(): Promise<void> {
  try {
    // Create tables
    for (const sql of createTableStatements) {
      expoDb.execSync(sql);
    }

    // Create indexes
    for (const sql of createIndexStatements) {
      expoDb.execSync(sql);
    }

    console.log('Database initialized successfully');
  } catch (error) {
    console.error('Failed to initialize database:', error);
    throw error;
  }
}

/**
 * Get the next bill number
 */
export function getNextBillNumber(): number {
  const result = expoDb.getFirstSync<{ maxNum: number | null }>(
    'SELECT MAX(bill_number) as maxNum FROM invoices'
  );
  return (result?.maxNum ?? 0) + 1;
}

export { schema };
