/**
 * BillKhata Type Definitions - Bills
 */

export interface Invoice {
  id: string;
  billNumber: number;
  billDate: string; // ISO date string
  customerId: string | null;
  customerName: string | null;
  subtotalPaise: number;
  discountPaise: number;
  gstEnabled: boolean;
  gstRate: 5 | 12 | 18 | 28 | null;
  cgstPaise: number;
  sgstPaise: number;
  totalPaise: number;
  paymentMode: PaymentMode;
  status: BillStatus;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
}

export interface InvoiceItem {
  id: string;
  invoiceId: string;
  itemId: string | null;
  itemName: string;
  quantity: number;
  pricePaise: number;
  totalPaise: number;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}

export interface Item {
  id: string;
  name: string;
  nameNormalized: string;
  lastPricePaise: number | null;
  mostFrequentPricePaise: number | null;
  usageCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface ItemPrice {
  id: string;
  itemId: string;
  pricePaise: number;
  usageCount: number;
}

export type PaymentMode = 'cash' | 'upi';
export type BillStatus = 'draft' | 'final';
export type GstRate = 5 | 12 | 18 | 28;

// Form types for bill creation
export interface BillLineItemForm {
  id: string; // Temporary ID for UI
  itemName: string;
  quantity: number;
  pricePaise: number;
  totalPaise: number;
}

export interface BillFormData {
  billDate: string;
  customerId: string | null;
  customerName: string;
  lineItems: BillLineItemForm[];
  discountPaise: number;
  gstEnabled: boolean;
  gstRate: GstRate | null;
  paymentMode: PaymentMode;
  notes: string;
}

// Calculated bill summary
export interface BillSummary {
  subtotalPaise: number;
  discountPaise: number;
  discountedSubtotalPaise: number;
  gstAmountPaise: number;
  cgstPaise: number;
  sgstPaise: number;
  totalPaise: number;
}
