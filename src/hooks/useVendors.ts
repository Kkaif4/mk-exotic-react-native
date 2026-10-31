import { useState, useEffect, useCallback, useMemo } from 'react';
import { Vendor, VendorFinancialSummary } from '../core/types';
import { defaultStorage } from '../storage/local-storage';
import { useBills } from './useBills';
import { calculateVendorFinancials } from '../core/ledger';

export function useVendors() {
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [payments, setPayments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { bills, refreshBills } = useBills();

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

  // Compute live lifetime financial rankings for all vendors
  const vendorSummaries: VendorFinancialSummary[] = useMemo(() => {
    return vendors.map((v) =>
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
    addPayment,
    deletePayment,
  };
}
