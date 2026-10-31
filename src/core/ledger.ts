/**
 * Pure Ledger & Calculation Engine
 * 100% Deterministic & Unit-Testable.
 */

import {
  Bill,
  MonthlySettlement,
  Vendor,
  VendorPayment,
  VendorFinancialSummary,
  VendorAuditItem,
  CustomerMonthSummary,
} from './types';
import { toCents, fromCents, sumMoney, subtractMoney } from './math';

/**
 * Calculates lifetime financial position for a specific vendor.
 * INVARIANT: Vendors have NO month filter. Calculations are 100% lifetime cumulative.
 */
export function calculateVendorFinancials(
  vendorId: string,
  vendorName: string,
  allBills: Bill[],
  allPayments: VendorPayment[]
): VendorFinancialSummary {
  const normName = (vendorName || '').trim().toLowerCase();

  // Strict isolation: Only purchase bills matching this vendor ID or normalized name
  const vendorBills = allBills.filter((b) => {
    if (b.type !== 'purchase') return false; // Strictly purchases
    if (b.vendorId && b.vendorId === vendorId) return true;
    return b.entityName.trim().toLowerCase() === normName;
  });

  // Strict isolation: Only payments matching this vendor ID
  const vendorPayments = allPayments.filter((p) => p.vendorId === vendorId);

  const totalPurchases = sumMoney(vendorBills.map((b) => b.amount));
  const totalPaid = sumMoney(vendorPayments.map((p) => p.amount));

  const diff = subtractMoney(totalPurchases, totalPaid);
  const remainingDue = diff > 0 ? diff : 0;
  const advancePaid = diff < 0 ? Math.abs(diff) : 0;

  let status: VendorFinancialSummary['status'] = 'NO_BILLS';
  if (remainingDue > 0) {
    status = 'DUE';
  } else if (advancePaid > 0) {
    status = 'ADVANCE';
  } else if (totalPurchases > 0) {
    status = 'SETTLED';
  }

  return {
    vendorId,
    vendorName,
    totalPurchases,
    totalPaid,
    remainingDue,
    advancePaid,
    billCount: vendorBills.length,
    paymentCount: vendorPayments.length,
    status,
  };
}

/**
 * Builds an interleaved chronological audit ledger of all purchases and payments for a vendor.
 * Computes exact running balance at every step.
 */
export function generateVendorAuditTimeline(
  vendorId: string,
  vendorName: string,
  allBills: Bill[],
  allPayments: VendorPayment[]
): VendorAuditItem[] {
  const normName = (vendorName || '').trim().toLowerCase();

  const bills = allBills.filter(
    (b) =>
      b.type === 'purchase' &&
      (b.vendorId === vendorId || b.entityName.trim().toLowerCase() === normName)
  );

  const payments = allPayments.filter((p) => p.vendorId === vendorId);

  // Map to unified chronological items
  const rawItems: Array<{
    id: string;
    type: 'bill' | 'payment';
    date: string;
    debit: number;
    credit: number;
    description: string;
    paymentMode?: VendorPayment['paymentMode'];
    billNumber?: string;
    timestamp: number;
  }> = [];

  for (const b of bills) {
    const ts = new Date(b.date || b.createdAt).getTime();
    rawItems.push({
      id: b.id,
      type: 'bill',
      date: b.date,
      debit: b.amount,
      credit: 0,
      description: b.billNumber ? `Purchase Bill #${b.billNumber}` : 'Purchase Bill',
      billNumber: b.billNumber,
      timestamp: Number.isNaN(ts) ? 0 : ts,
    });
  }

  for (const p of payments) {
    const ts = new Date(p.date || p.createdAt).getTime();
    rawItems.push({
      id: p.id,
      type: 'payment',
      date: p.date,
      debit: 0,
      credit: p.amount,
      description: p.referenceNote
        ? `Payment (${p.paymentMode}): ${p.referenceNote}`
        : `Payment via ${p.paymentMode}`,
      paymentMode: p.paymentMode,
      timestamp: Number.isNaN(ts) ? 0 : ts,
    });
  }

  // Sort ascending chronologically (oldest first) to compute accurate running balance
  rawItems.sort((a, b) => a.timestamp - b.timestamp || a.date.localeCompare(b.date));

  let runningBalanceCents = 0;
  const auditTrail: VendorAuditItem[] = [];

  for (const item of rawItems) {
    runningBalanceCents += toCents(item.debit) - toCents(item.credit);
    auditTrail.push({
      ...item,
      runningBalance: fromCents(runningBalanceCents),
    });
  }

  // Return descending (newest on top) for convenient UI inspection
  return auditTrail.reverse();
}

/**
 * Calculates customer monthly ledger summary for a specific month.
 * INVARIANT: Customer bills are strictly filtered by monthStr (YYYY-MM).
 */
export function calculateCustomerMonthSummary(
  customerName: string,
  monthStr: string,
  allBills: Bill[],
  allSettlements: MonthlySettlement[]
): CustomerMonthSummary {
  const normName = (customerName || '').trim().toLowerCase();

  const customerBills = allBills
    .filter(
      (b) =>
        b.type === 'sale' &&
        b.entityName.trim().toLowerCase() === normName &&
        b.date.startsWith(monthStr)
    )
    .sort((a, b) => a.date.localeCompare(b.date));

  const totalDue = sumMoney(customerBills.map((b) => b.amount));

  const settlement = allSettlements.find(
    (s) =>
      s.type === 'sale' &&
      s.entityName.trim().toLowerCase() === normName &&
      s.monthStr === monthStr
  );

  return {
    customerName,
    monthStr,
    bills: customerBills,
    totalDue,
    status: settlement ? settlement.status : 'UNPAID',
    settledAt: settlement?.settledAt,
  };
}

/**
 * Groups and returns unique entity names for customer sales and vendor purchases.
 */
export function getUniqueEntityNames(
  bills: Bill[],
  vendors: Vendor[]
): { customers: string[]; vendors: string[] } {
  const customersSet = new Set<string>();
  const vendorsSet = new Set<string>();

  for (const b of bills) {
    if (b.type === 'sale') customersSet.add(b.entityName.trim());
    if (b.type === 'purchase') vendorsSet.add(b.entityName.trim());
  }

  for (const v of vendors) {
    vendorsSet.add(v.name.trim());
  }

  return {
    customers: Array.from(customersSet).filter(Boolean).sort(),
    vendors: Array.from(vendorsSet).filter(Boolean).sort(),
  };
}
