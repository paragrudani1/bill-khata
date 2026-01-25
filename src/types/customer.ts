/**
 * BillKhata Type Definitions - Customer
 */

export interface Customer {
  id: string;
  name: string;
  nameNormalized: string;
  phone: string | null;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
}

export interface CustomerFormData {
  name: string;
  phone: string;
}
