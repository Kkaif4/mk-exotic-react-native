import { useMemo, useCallback } from 'react';
import { useBills } from './useBills';
import { useVendors } from './useVendors';
import {
  calculateVendorFinancials,
  generateVendorAuditTimeline,
} from '../core/ledger';

export function useVendorLedger(vendorId: string, vendorName: string) {
  const { bills, deleteBill } = useBills();
  const { vendors, payments, addPayment, updateVendor, deletePayment, refreshVendors } = useVendors();

  const vendor = useMemo(() => {
    return (
      vendors.find((v) => v.id === vendorId) ||
      vendors.find((v) => v.name.trim().toLowerCase() === vendorName.trim().toLowerCase()) ||
      null
    );
  }, [vendors, vendorId, vendorName]);

  const financialSummary = useMemo(() => {
    return calculateVendorFinancials(vendorId, vendorName, bills, payments);
  }, [vendorId, vendorName, bills, payments]);

  const auditTimeline = useMemo(() => {
    return generateVendorAuditTimeline(vendorId, vendorName, bills, payments);
  }, [vendorId, vendorName, bills, payments]);

  const recordPayment = useCallback(
    async (amount: number, date: string, paymentMode: any, referenceNote?: string) => {
      await addPayment({
        vendorId,
        amount,
        date,
        paymentMode,
        referenceNote,
      });
      await refreshVendors();
    },
    [vendorId, addPayment, refreshVendors]
  );

  const updateVendorDetails = useCallback(
    async (updates: { contactNumber?: string; notes?: string }) => {
      if (vendor?.id) {
        await updateVendor(vendor.id, updates);
        await refreshVendors();
      }
    },
    [vendor, updateVendor, refreshVendors]
  );

  return {
    vendor,
    financialSummary,
    auditTimeline,
    recordPayment,
    updateVendorDetails,
    deletePayment,
    deleteBill,
  };
}
