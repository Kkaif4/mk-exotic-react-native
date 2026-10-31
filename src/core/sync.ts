/**
 * Deterministic Last-Write-Wins (LWW) Synchronization Engine
 * Handles bidirectional delta synchronization and data backup merging.
 */

import { Bill, MonthlySettlement, Vendor, VendorPayment } from './types';

export interface MergeResult {
  bills: Bill[];
  settlements: MonthlySettlement[];
  vendors: Vendor[];
  vendorPayments: VendorPayment[];
}

export function mergeRecordsLWW<T extends { id: string; updatedAt: string }>(
  local: T[],
  incoming: T[]
): T[] {
  const map = new Map<string, T>();

  for (const item of local) {
    if (item && item.id) map.set(item.id, item);
  }

  for (const item of incoming) {
    if (!item || !item.id) continue;
    const existing = map.get(item.id);
    if (!existing) {
      map.set(item.id, item);
    } else {
      const incomingTime = new Date(item.updatedAt).getTime();
      const existingTime = new Date(existing.updatedAt).getTime();
      if (incomingTime > existingTime) {
        map.set(item.id, item);
      }
    }
  }

  return Array.from(map.values());
}

/**
 * Merges entire sync datasets deterministically using Last-Write-Wins
 */
export function mergeAllSyncData(
  local: {
    bills: Bill[];
    settlements: MonthlySettlement[];
    vendors: Vendor[];
    vendorPayments: VendorPayment[];
  },
  incoming: {
    bills?: Bill[];
    settlements?: MonthlySettlement[];
    vendors?: Vendor[];
    vendorPayments?: VendorPayment[];
  }
): MergeResult {
  const mergedBills = mergeRecordsLWW(local.bills || [], incoming.bills || []).sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );

  const mergedSettlements = mergeRecordsLWW(
    local.settlements || [],
    incoming.settlements || []
  );

  const mergedVendors = mergeRecordsLWW(local.vendors || [], incoming.vendors || []).sort(
    (a, b) => a.name.localeCompare(b.name)
  );

  const mergedVendorPayments = mergeRecordsLWW(
    local.vendorPayments || [],
    incoming.vendorPayments || []
  ).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  return {
    bills: mergedBills,
    settlements: mergedSettlements,
    vendors: mergedVendors,
    vendorPayments: mergedVendorPayments,
  };
}

/**
 * Validates whether a parsed JSON object has valid sync data structures
 */
export function validateSyncPayload(data: any): { isValid: boolean; error?: string } {
  if (!data || typeof data !== 'object') {
    return { isValid: false, error: 'Payload is not a valid object' };
  }

  if (data.bills && !Array.isArray(data.bills)) {
    return { isValid: false, error: 'Bills field must be an array' };
  }

  if (Array.isArray(data.bills)) {
    for (const b of data.bills) {
      if (!b.id || !b.type || typeof b.amount !== 'number' || Number.isNaN(b.amount)) {
        return { isValid: false, error: `Malformed bill entry: ${JSON.stringify(b)}` };
      }
    }
  }

  if (data.vendorPayments && !Array.isArray(data.vendorPayments)) {
    return { isValid: false, error: 'VendorPayments field must be an array' };
  }

  if (Array.isArray(data.vendorPayments)) {
    for (const p of data.vendorPayments) {
      if (!p.id || !p.vendorId || typeof p.amount !== 'number' || Number.isNaN(p.amount)) {
        return { isValid: false, error: `Malformed vendor payment entry: ${JSON.stringify(p)}` };
      }
    }
  }

  return { isValid: true };
}
