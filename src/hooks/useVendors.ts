import { useState, useEffect, useCallback, useMemo } from 'react';
import { Bill, Vendor, VendorFinancialSummary } from '../core/types';
import { defaultStorage } from '../storage/local-storage';
import { useBills } from './useBills';
import { calculateVendorFinancials } from '../core/ledger';

export function useVendors(passedBills?: Bill[]) {
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [payments, setPayments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { bills: internalBills } = useBills();
  const bills = passedBills || internalBills;

  const refreshVendors = useCallback(async () => {
    try {
      const [v, p] = await Promise.all([
        defaultStorage.getVendors(),
        defaultStorage.getVendorPayments(),
      ]);
      setVendors(v);
      setPayments(p);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshVendors();
  }, [refreshVendors]);

  const addVendor = useCallback(
    async (vendorData: Omit<Vendor, 'id' | 'createdAt' | 'updatedAt'>) => {
      const created = await defaultStorage.addVendor(vendorData);
      await refreshVendors();
      return created;
    },
    [refreshVendors]
  );

  const updateVendor = useCallback(
    async (
      id: string,
      updates: Partial<Omit<Vendor, 'id' | 'createdAt' | 'updatedAt'>>
    ) => {
      const updated = await defaultStorage.updateVendor(id, updates);
      await refreshVendors();
      return updated;
    },
    [refreshVendors]
  );

  const addPayment = useCallback(
    async (paymentData: {
      vendorId: string;
      amount: number;
      date: string;
      paymentMode: any;
      referenceNote?: string;
    }) => {
      const created = await defaultStorage.addVendorPayment(paymentData);
      await refreshVendors();
      return created;
    },
    [refreshVendors]
  );

  const deletePayment = useCallback(
    async (id: string) => {
      await defaultStorage.deleteVendorPayment(id);
      await refreshVendors();
    },
    [refreshVendors]
  );

  // Compute live lifetime financial rankings for all vendors (from vendor entities + purchase bills)
  const vendorSummaries: VendorFinancialSummary[] = useMemo(() => {
    // Unique list of vendors by name / id
    const vendorMap = new Map<string, { id: string; name: string }>();

    vendors.forEach((v) => {
      vendorMap.set(v.name.trim().toLowerCase(), { id: v.id, name: v.name });
    });

    bills.forEach((b) => {
      if (b.type === 'purchase' && b.entityName) {
        const key = b.entityName.trim().toLowerCase();
        if (!vendorMap.has(key)) {
          vendorMap.set(key, { id: b.vendorId || ('v_' + key), name: b.entityName.trim() });
        }
      }
    });

    return Array.from(vendorMap.values()).map((v) =>
      calculateVendorFinancials(v.id, v.name, bills, payments)
    );
  }, [vendors, bills, payments]);

  return {
    vendors,
    payments,
    vendorSummaries,
    loading,
    refreshVendors,
    addVendor,
    updateVendor,
    addPayment,
    deletePayment,
  };
}
