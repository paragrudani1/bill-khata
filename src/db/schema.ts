/**
 * BillKhata Database Schema
 * Using Drizzle ORM with expo-sqlite
 */

import { sqliteTable, text, integer, real } from 'drizzle-orm/sqlite-core';

// Invoices (Bills)
export const invoices = sqliteTable('invoices', {
  id: text('id').primaryKey(),
  billNumber: integer('bill_number').notNull().unique(),
  billDate: text('bill_date').notNull(),
  customerId: text('customer_id'),
  customerName: text('customer_name'),
  subtotalPaise: integer('subtotal_paise').notNull().default(0),
  discountPaise: integer('discount_paise').notNull().default(0),
  gstEnabled: integer('gst_enabled', { mode: 'boolean' }).notNull().default(false),
  gstRate: integer('gst_rate'),
  cgstPaise: integer('cgst_paise').default(0),
  sgstPaise: integer('sgst_paise').default(0),
  totalPaise: integer('total_paise').notNull().default(0),
  paymentMode: text('payment_mode', { enum: ['cash', 'upi'] }).notNull().default('cash'),
  status: text('status', { enum: ['draft', 'final'] }).notNull().default('draft'),
  notes: text('notes'),
  createdAt: text('created_at').notNull(),
  updatedAt: text('updated_at').notNull(),
  deletedAt: text('deleted_at'),
});

// Invoice Line Items
export const invoiceItems = sqliteTable('invoice_items', {
  id: text('id').primaryKey(),
  invoiceId: text('invoice_id').notNull().references(() => invoices.id, { onDelete: 'cascade' }),
  itemId: text('item_id'),
  itemName: text('item_name').notNull(),
  quantity: real('quantity').notNull().default(1),
  pricePaise: integer('price_paise').notNull(),
  totalPaise: integer('total_paise').notNull(),
  sortOrder: integer('sort_order').notNull().default(0),
  createdAt: text('created_at').notNull(),
  updatedAt: text('updated_at').notNull(),
});

// Items (Auto-created from usage for autocomplete)
export const items = sqliteTable('items', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  nameNormalized: text('name_normalized').notNull(),
  lastPricePaise: integer('last_price_paise'),
  mostFrequentPricePaise: integer('most_frequent_price_paise'),
  usageCount: integer('usage_count').notNull().default(1),
  createdAt: text('created_at').notNull(),
  updatedAt: text('updated_at').notNull(),
});

// Item Price History (for most-frequent calculation)
export const itemPrices = sqliteTable('item_prices', {
  id: text('id').primaryKey(),
  itemId: text('item_id').notNull().references(() => items.id, { onDelete: 'cascade' }),
  pricePaise: integer('price_paise').notNull(),
  usageCount: integer('usage_count').notNull().default(1),
});

// Customers
export const customers = sqliteTable('customers', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  nameNormalized: text('name_normalized').notNull(),
  phone: text('phone'),
  createdAt: text('created_at').notNull(),
  updatedAt: text('updated_at').notNull(),
  deletedAt: text('deleted_at'),
});

// Bill Drafts (for auto-save recovery)
export const billDrafts = sqliteTable('bill_drafts', {
  id: text('id').primaryKey().default('current'),
  draftData: text('draft_data').notNull(), // JSON blob
  updatedAt: text('updated_at').notNull(),
});

// Type exports for use in queries
export type InvoiceRow = typeof invoices.$inferSelect;
export type InvoiceInsert = typeof invoices.$inferInsert;
export type InvoiceItemRow = typeof invoiceItems.$inferSelect;
export type InvoiceItemInsert = typeof invoiceItems.$inferInsert;
export type ItemRow = typeof items.$inferSelect;
export type ItemInsert = typeof items.$inferInsert;
export type CustomerRow = typeof customers.$inferSelect;
export type CustomerInsert = typeof customers.$inferInsert;
