/**
 * BillKhata Customer Queries
 * Database operations for customers
 */

import { eq, and, isNull, sql, desc } from 'drizzle-orm';
import { db } from '../client';
import { customers } from '../schema';
import { generateId, getNowISO, normalizeForSearch } from '../../utils';
import { Customer } from '../../types';

/**
 * Create a new customer
 */
export async function createCustomer(name: string, phone?: string): Promise<string> {
  const now = getNowISO();
  const customerId = generateId();

  await db.insert(customers).values({
    id: customerId,
    name,
    nameNormalized: normalizeForSearch(name),
    phone: phone || null,
    createdAt: now,
    updatedAt: now,
  });

  return customerId;
}

/**
 * Get or create customer by name
 */
export async function getOrCreateCustomer(name: string, phone?: string): Promise<string> {
  const normalized = normalizeForSearch(name);

  const existing = await db
    .select()
    .from(customers)
    .where(and(eq(customers.nameNormalized, normalized), isNull(customers.deletedAt)))
    .limit(1);

  if (existing.length > 0) {
    return existing[0].id;
  }

  return createCustomer(name, phone);
}

/**
 * Search customers for autocomplete
 */
export async function searchCustomers(query: string, limit: number = 10): Promise<Array<{
  id: string;
  name: string;
  phone: string | null;
}>> {
  if (query.length < 2) return [];

  const normalized = normalizeForSearch(query);

  const results = await db
    .select({
      id: customers.id,
      name: customers.name,
      phone: customers.phone,
    })
    .from(customers)
    .where(
      and(
        sql`${customers.nameNormalized} LIKE ${`%${normalized}%`}`,
        isNull(customers.deletedAt)
      )
    )
    .orderBy(customers.name)
    .limit(limit);

  return results;
}

/**
 * Get all customers
 */
export async function getAllCustomers(): Promise<Customer[]> {
  const results = await db
    .select()
    .from(customers)
    .where(isNull(customers.deletedAt))
    .orderBy(customers.name);

  return results as Customer[];
}

/**
 * Get customer by ID
 */
export async function getCustomerById(customerId: string): Promise<Customer | null> {
  const results = await db
    .select()
    .from(customers)
    .where(eq(customers.id, customerId))
    .limit(1);

  return results.length > 0 ? (results[0] as Customer) : null;
}

/**
 * Update customer
 */
export async function updateCustomer(
  customerId: string,
  updates: { name?: string; phone?: string }
): Promise<void> {
  const updateData: Record<string, any> = { updatedAt: getNowISO() };

  if (updates.name) {
    updateData.name = updates.name;
    updateData.nameNormalized = normalizeForSearch(updates.name);
  }
  if (updates.phone !== undefined) {
    updateData.phone = updates.phone || null;
  }

  await db.update(customers).set(updateData).where(eq(customers.id, customerId));
}

/**
 * Soft delete customer
 */
export async function deleteCustomer(customerId: string): Promise<void> {
  await db
    .update(customers)
    .set({ deletedAt: getNowISO() })
    .where(eq(customers.id, customerId));
}
