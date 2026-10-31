/**
 * Core Domain Models for MK Exotic Fruits
 * Platform-independent, strictly typed.
 */

export type BillType = 'sale' | 'purchase';

export interface Bill {
  id: string;
  type: BillType;
  entityName: string; // Customer name (if sale) or Vendor name (if purchase)
  vendorId?: string;  // Explicit link to Vendor entity if type === 'purchase'
  billNumber: string; // e.g. "INV-1001" or empty
  date: string;       // YYYY-MM-DD
  amount: number;     // Standard decimal currency value (e.g. 20000.50)
  createdAt: string;  // ISO 8601 UTC
  updatedAt: string;  // ISO 8601 UTC
}

export type SettlementStatus = 'PAID' | 'UNPAID';

export interface MonthlySettlement {
  id: string;
  entityName: string; // Customer name
  type: BillType;     // Strictly 'sale'
  monthStr: string;   // YYYY-MM
  status: SettlementStatus;
  settledAt?: string; // ISO 8601 UTC
  updatedAt: string;  // ISO 8601 UTC
}

export interface Vendor {
  id: string;
  name: string;
  contactNumber?: string;
  notes?: string;
  createdAt: string;  // ISO 8601 UTC
  updatedAt: string;  // ISO 8601 UTC
}

export type PaymentMode = 'Cash' | 'Bank Transfer' | 'UPI' | 'Cheque';

export interface VendorPayment {
  id: string;
  vendorId: string;
  amount: number;     // Amount paid (e.g. 10000)
  date: string;       // YYYY-MM-DD
  paymentMode: PaymentMode;
  referenceNote?: string;
  createdAt: string;  // ISO 8601 UTC
  updatedAt: string;  // ISO 8601 UTC
}

export type AuditItemType = 'bill' | 'payment';

export interface VendorAuditItem {
  id: string;
  type: AuditItemType;
  date: string;
  debit: number;        // Purchase bill amount (increases due)
  credit: number;       // Payment amount (decreases due)
  runningBalance: number; // Balance after this entry
  description: string;
  paymentMode?: PaymentMode;
  billNumber?: string;
  timestamp: number;    // Epoch ms for sorting
}

export interface VendorFinancialSummary {
  vendorId: string;
  vendorName: string;
  totalPurchases: number;
  totalPaid: number;
  remainingDue: number;
  advancePaid: number;
  billCount: number;
  paymentCount: number;
  status: 'DUE' | 'SETTLED' | 'ADVANCE' | 'NO_BILLS';
}

export interface CustomerMonthSummary {
  customerName: string;
  monthStr: string;
  bills: Bill[];
  totalDue: number;
  status: SettlementStatus;
  settledAt?: string;
}

export interface SyncPacket {
  deviceId: string;
  timestamp: string;
  bills: Bill[];
  settlements: MonthlySettlement[];
  vendors: Vendor[];
  vendorPayments: VendorPayment[];
}
