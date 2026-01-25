/**
 * BillKhata Bill Queries
 * Database operations for invoices and invoice items
 */

import { eq, desc, and, isNull, gte, sql } from 'drizzle-orm';
import { db, getNextBillNumber } from '../client';
import { invoices, invoiceItems, items, itemPrices } from '../schema';
import { generateId, getNowISO, normalizeForSearch } from '../../utils';
import { BillFormData, Invoice, InvoiceItem, PaymentMode, GstRate } from '../../types';

export interface CreateBillInput {
  billDate: string;
  customerName: string | null;
  customerId: string | null;
  lineItems: Array<{
    itemName: string;
    quantity: number;
    pricePaise: number;
    totalPaise: number;
  }>;
  subtotalPaise: number;
  discountPaise: number;
  gstEnabled: boolean;
  gstRate: GstRate | null;
  cgstPaise: number;
  sgstPaise: number;
  totalPaise: number;
  paymentMode: PaymentMode;
  status: 'draft' | 'final';
  notes: string | null;
}

/**
 * Create a new bill with line items
 */
export async function createBill(input: CreateBillInput): Promise<string> {
  const now = getNowISO();
  const billId = generateId();
  const billNumber = getNextBillNumber();

  // Insert invoice
  await db.insert(invoices).values({
    id: billId,
    billNumber,
    billDate: input.billDate,
    customerId: input.customerId,
    customerName: input.customerName,
    subtotalPaise: input.subtotalPaise,
    discountPaise: input.discountPaise,
    gstEnabled: input.gstEnabled,
    gstRate: input.gstRate,
    cgstPaise: input.cgstPaise,
    sgstPaise: input.sgstPaise,
    totalPaise: input.totalPaise,
    paymentMode: input.paymentMode,
    status: input.status,
    notes: input.notes,
    createdAt: now,
    updatedAt: now,
  });

  // Insert line items and update item catalog
  for (let i = 0; i < input.lineItems.length; i++) {
    const lineItem = input.lineItems[i];
    const itemId = await upsertItem(lineItem.itemName, lineItem.pricePaise);

    await db.insert(invoiceItems).values({
      id: generateId(),
      invoiceId: billId,
      itemId,
      itemName: lineItem.itemName,
      quantity: lineItem.quantity,
      pricePaise: lineItem.pricePaise,
      totalPaise: lineItem.totalPaise,
      sortOrder: i,
      createdAt: now,
      updatedAt: now,
    });
  }

  return billId;
}

/**
 * Upsert an item in the catalog (for autocomplete)
 * Updates usage count and price history
 */
async function upsertItem(name: string, pricePaise: number): Promise<string> {
  const normalized = normalizeForSearch(name);
  const now = getNowISO();

  // Check if item exists
  const existing = await db
    .select()
    .from(items)
    .where(eq(items.nameNormalized, normalized))
    .limit(1);

  if (existing.length > 0) {
    const item = existing[0];

    // Update usage count and last price
    await db
      .update(items)
      .set({
        usageCount: item.usageCount + 1,
        lastPricePaise: pricePaise,
        updatedAt: now,
      })
      .where(eq(items.id, item.id));

    // Update price frequency
    await updatePriceFrequency(item.id, pricePaise);

    return item.id;
  }

  // Create new item
  const itemId = generateId();
  await db.insert(items).values({
    id: itemId,
    name,
    nameNormalized: normalized,
    lastPricePaise: pricePaise,
    mostFrequentPricePaise: pricePaise,
    usageCount: 1,
    createdAt: now,
    updatedAt: now,
  });

  // Create initial price entry
  await db.insert(itemPrices).values({
    id: generateId(),
    itemId,
    pricePaise,
    usageCount: 1,
  });

  return itemId;
}

/**
 * Update price frequency for an item
 */
async function updatePriceFrequency(itemId: string, pricePaise: number): Promise<void> {
  // Check if this price exists
  const existingPrice = await db
    .select()
    .from(itemPrices)
    .where(and(eq(itemPrices.itemId, itemId), eq(itemPrices.pricePaise, pricePaise)))
    .limit(1);

  if (existingPrice.length > 0) {
    // Increment usage count
    await db
      .update(itemPrices)
      .set({ usageCount: existingPrice[0].usageCount + 1 })
      .where(eq(itemPrices.id, existingPrice[0].id));
  } else {
    // Add new price
    await db.insert(itemPrices).values({
      id: generateId(),
      itemId,
      pricePaise,
      usageCount: 1,
    });
  }

  // Update most frequent price on the item
  const mostFrequent = await db
    .select()
    .from(itemPrices)
    .where(eq(itemPrices.itemId, itemId))
    .orderBy(desc(itemPrices.usageCount))
    .limit(1);

  if (mostFrequent.length > 0) {
    await db
      .update(items)
      .set({ mostFrequentPricePaise: mostFrequent[0].pricePaise })
      .where(eq(items.id, itemId));
  }
}

/**
 * Get bills for a specific date (for dashboard)
 */
export async function getBillsForDate(date: string): Promise<Invoice[]> {
  const results = await db
    .select()
    .from(invoices)
    .where(and(eq(invoices.billDate, date), isNull(invoices.deletedAt)))
    .orderBy(desc(invoices.createdAt));

  return results as Invoice[];
}

/**
 * Get all bills with pagination
 */
export async function getBills(limit: number = 50, offset: number = 0): Promise<Invoice[]> {
  const results = await db
    .select()
    .from(invoices)
    .where(isNull(invoices.deletedAt))
    .orderBy(desc(invoices.createdAt))
    .limit(limit)
    .offset(offset);

  return results as Invoice[];
}

/**
 * Get a single bill with its line items
 */
export async function getBillById(billId: string): Promise<{
  bill: Invoice;
  items: InvoiceItem[];
} | null> {
  const billResult = await db
    .select()
    .from(invoices)
    .where(eq(invoices.id, billId))
    .limit(1);

  if (billResult.length === 0) return null;

  const itemsResult = await db
    .select()
    .from(invoiceItems)
    .where(eq(invoiceItems.invoiceId, billId))
    .orderBy(invoiceItems.sortOrder);

  return {
    bill: billResult[0] as Invoice,
    items: itemsResult as InvoiceItem[],
  };
}

/**
 * Soft delete a bill
 */
export async function deleteBill(billId: string): Promise<void> {
  await db
    .update(invoices)
    .set({ deletedAt: getNowISO() })
    .where(eq(invoices.id, billId));
}

/**
 * Restore a soft-deleted bill
 */
export async function restoreBill(billId: string): Promise<void> {
  await db
    .update(invoices)
    .set({ deletedAt: null })
    .where(eq(invoices.id, billId));
}

/**
 * Get dashboard stats for today
 */
export async function getDashboardStats(date: string): Promise<{
  totalSalesPaise: number;
  cashSalesPaise: number;
  upiSalesPaise: number;
  billCount: number;
}> {
  const bills = await getBillsForDate(date);

  let totalSalesPaise = 0;
  let cashSalesPaise = 0;
  let upiSalesPaise = 0;

  for (const bill of bills) {
    totalSalesPaise += bill.totalPaise;
    if (bill.paymentMode === 'cash') {
      cashSalesPaise += bill.totalPaise;
    } else {
      upiSalesPaise += bill.totalPaise;
    }
  }

  return {
    totalSalesPaise,
    cashSalesPaise,
    upiSalesPaise,
    billCount: bills.length,
  };
}

/**
 * Search items for autocomplete
 */
export async function searchItems(query: string, limit: number = 10): Promise<Array<{
  id: string;
  name: string;
  suggestedPricePaise: number | null;
}>> {
  if (query.length < 2) return [];

  const normalized = normalizeForSearch(query);

  const results = await db
    .select({
      id: items.id,
      name: items.name,
      suggestedPricePaise: items.mostFrequentPricePaise,
    })
    .from(items)
    .where(sql`${items.nameNormalized} LIKE ${`%${normalized}%`}`)
    .orderBy(desc(items.usageCount))
    .limit(limit);

  return results;
}

/**
 * Get deleted bills (trash)
 */
export async function getDeletedBills(): Promise<Invoice[]> {
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const results = await db
    .select()
    .from(invoices)
    .where(
      and(
        sql`${invoices.deletedAt} IS NOT NULL`,
        gte(invoices.deletedAt, thirtyDaysAgo.toISOString())
      )
    )
    .orderBy(desc(invoices.deletedAt));

  return results as Invoice[];
}

/**
 * Permanently delete bills older than 30 days
 */
export async function purgeOldDeletedBills(): Promise<number> {
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const result = await db
    .delete(invoices)
    .where(
      and(
        sql`${invoices.deletedAt} IS NOT NULL`,
        sql`${invoices.deletedAt} < ${thirtyDaysAgo.toISOString()}`
      )
    );

  return result.changes;
}
