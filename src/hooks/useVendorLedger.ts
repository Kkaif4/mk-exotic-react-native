import { useMemo, useCallback } from 'react';
import { useBills } from './useBills';
import { useVendors } from './useVendors';
import {
  calculateVendorFinancials,
  generateVendorAuditTimeline,
} from '../core/ledger';

export function useVendorLedger(vendorId: string, vendorName: string) {
  const { bills, deleteBill } = useBills();
  const { payments, addPayment, deletePayment, refreshVendors } = useVendors();

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

  return {
    financialSummary,
    auditTimeline,
    recordPayment,
    deletePayment,
    deleteBill,
  };
}
