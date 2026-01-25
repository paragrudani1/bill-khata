/**
 * BillKhata Bill Draft Store
 * Manages in-progress bill for auto-save and recovery
 */

import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import { BillLineItemForm, PaymentMode, GstRate } from '../types';
import { getTodayISO, generateId, calculateLineTotal } from '../utils';

interface BillDraftState {
  // Form state
  billDate: string;
  customerName: string;
  customerId: string | null;
  lineItems: BillLineItemForm[];
  discountPaise: number;
  gstEnabled: boolean;
  gstRate: GstRate;
  paymentMode: PaymentMode;
  notes: string;

  // Meta
  isDirty: boolean;
  lastSavedAt: string | null;

  // Actions
  setCustomer: (name: string, id?: string | null) => void;
  setBillDate: (date: string) => void;
  addLineItem: (name: string, quantity: number, pricePaise: number) => void;
  updateLineItem: (id: string, updates: Partial<Omit<BillLineItemForm, 'id'>>) => void;
  removeLineItem: (id: string) => void;
  setDiscount: (paise: number) => void;
  setGstEnabled: (enabled: boolean) => void;
  setGstRate: (rate: GstRate) => void;
  setPaymentMode: (mode: PaymentMode) => void;
  setNotes: (notes: string) => void;
  resetDraft: () => void;
  markSaved: () => void;
}

const initialState = {
  billDate: getTodayISO(),
  customerName: '',
  customerId: null,
  lineItems: [],
  discountPaise: 0,
  gstEnabled: false,
  gstRate: 18 as GstRate,
  paymentMode: 'cash' as PaymentMode,
  notes: '',
  isDirty: false,
  lastSavedAt: null,
};

export const useBillDraftStore = create<BillDraftState>()(
  subscribeWithSelector((set, get) => ({
    ...initialState,

    setCustomer: (customerName, customerId = null) =>
      set({ customerName, customerId, isDirty: true }),

    setBillDate: (billDate) => set({ billDate, isDirty: true }),

    addLineItem: (itemName, quantity, pricePaise) => {
      const newItem: BillLineItemForm = {
        id: generateId(),
        itemName,
        quantity,
        pricePaise,
        totalPaise: calculateLineTotal(quantity, pricePaise),
      };
      set((state) => ({
        lineItems: [...state.lineItems, newItem],
        isDirty: true,
      }));
    },

    updateLineItem: (id, updates) =>
      set((state) => ({
        lineItems: state.lineItems.map((item) => {
          if (item.id !== id) return item;
          const updated = { ...item, ...updates };
          // Recalculate total if qty or price changed
          if (updates.quantity !== undefined || updates.pricePaise !== undefined) {
            updated.totalPaise = calculateLineTotal(updated.quantity, updated.pricePaise);
          }
          return updated;
        }),
        isDirty: true,
      })),

    removeLineItem: (id) =>
      set((state) => ({
        lineItems: state.lineItems.filter((item) => item.id !== id),
        isDirty: true,
      })),

    setDiscount: (discountPaise) => set({ discountPaise, isDirty: true }),

    setGstEnabled: (gstEnabled) => set({ gstEnabled, isDirty: true }),

    setGstRate: (gstRate) => set({ gstRate, isDirty: true }),

    setPaymentMode: (paymentMode) => set({ paymentMode, isDirty: true }),

    setNotes: (notes) => set({ notes, isDirty: true }),

    resetDraft: () => set({ ...initialState, billDate: getTodayISO() }),

    markSaved: () => set({ isDirty: false, lastSavedAt: new Date().toISOString() }),
  }))
);

// Selector for calculating bill summary
export const useBillSummary = () => {
  const lineItems = useBillDraftStore((state) => state.lineItems);
  const discountPaise = useBillDraftStore((state) => state.discountPaise);
  const gstEnabled = useBillDraftStore((state) => state.gstEnabled);
  const gstRate = useBillDraftStore((state) => state.gstRate);

  const subtotalPaise = lineItems.reduce((sum, item) => sum + item.totalPaise, 0);
  const effectiveDiscount = Math.min(discountPaise, subtotalPaise);
  const discountedSubtotalPaise = subtotalPaise - effectiveDiscount;

  let cgstPaise = 0;
  let sgstPaise = 0;
  let totalGstPaise = 0;

  if (gstEnabled && gstRate) {
    totalGstPaise = Math.round(discountedSubtotalPaise * (gstRate / 100));
    cgstPaise = Math.round(totalGstPaise / 2);
    sgstPaise = totalGstPaise - cgstPaise;
  }

  const grandTotalPaise = discountedSubtotalPaise + totalGstPaise;

  return {
    subtotalPaise,
    discountPaise: effectiveDiscount,
    discountedSubtotalPaise,
    cgstPaise,
    sgstPaise,
    totalGstPaise,
    grandTotalPaise,
  };
};
