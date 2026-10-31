import { useState, useEffect, useCallback } from 'react';
import { Bill } from '../core/types';
import { defaultStorage } from '../storage/local-storage';

export function useBills() {
  const [bills, setBills] = useState<Bill[]>([]);
  const [loading, setLoading] = useState(true);

  const refreshBills = useCallback(async () => {
    try {
      const data = await defaultStorage.getBills();
      setBills(data);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshBills();
  }, [refreshBills]);

  const addBill = useCallback(
    async (billData: Omit<Bill, 'id' | 'createdAt' | 'updatedAt'>) => {
      const newBill = await defaultStorage.addBill(billData);
      await refreshBills();
      return newBill;
    },
    [refreshBills]
  );

  const deleteBill = useCallback(
    async (id: string) => {
      await defaultStorage.deleteBill(id);
      await refreshBills();
    },
    [refreshBills]
  );

  return { bills, loading, refreshBills, addBill, deleteBill };
}
