import { IAppStorage } from './storage-interface';
import { Bill, MonthlySettlement, Vendor, VendorPayment, SyncPacket } from '../core/types';
import { mergeAllSyncData, validateSyncPayload } from '../core/sync';

const KEYS = {
  DEVICE_ID: '@mk_exotic_device_id',
  BILLS: '@mk_exotic_bills',
  SETTLEMENTS: '@mk_exotic_settlements',
  VENDORS: '@mk_exotic_vendors',
  PAYMENTS: '@mk_exotic_vendor_payments',
};

// In-memory fallback if AsyncStorage is unavailable (e.g. Node.js unit tests)
const memoryStore: Record<string, string> = {};

async function getItem(key: string): Promise<string | null> {
  try {
    const AsyncStorage = require('@react-native-async-storage/async-storage').default;
    if (AsyncStorage?.getItem) {
      return await AsyncStorage.getItem(key);
    }
  } catch {
    // Fallback to memory
  }
  return memoryStore[key] || null;
}

async function setItem(key: string, value: string): Promise<void> {
  try {
    const AsyncStorage = require('@react-native-async-storage/async-storage').default;
    if (AsyncStorage?.setItem) {
      await AsyncStorage.setItem(key, value);
      return;
    }
  } catch {
    // Fallback to memory
  }
  memoryStore[key] = value;
}

async function removeItem(key: string): Promise<void> {
  try {
    const AsyncStorage = require('@react-native-async-storage/async-storage').default;
    if (AsyncStorage?.removeItem) {
      await AsyncStorage.removeItem(key);
      return;
    }
  } catch {
    // Fallback to memory
  }
  delete memoryStore[key];
}

export class NativeAppStorage implements IAppStorage {
  async getDeviceId(): Promise<string> {
    let id = await getItem(KEYS.DEVICE_ID);
    if (!id) {
      id = 'device_' + Math.random().toString(36).substring(2, 11);
      await setItem(KEYS.DEVICE_ID, id);
    }
    return id;
  }

  async getBills(): Promise<Bill[]> {
    const raw = await getItem(KEYS.BILLS);
    const bills: Bill[] = raw ? JSON.parse(raw) : [];
    return bills.sort(
      (a, b) =>
        b.date.localeCompare(a.date) ||
        (b.createdAt || '').localeCompare(a.createdAt || '')
    );
  }

  async saveBills(bills: Bill[]): Promise<void> {
    await setItem(KEYS.BILLS, JSON.stringify(bills));
  }

  async addBill(billData: Omit<Bill, 'id' | 'createdAt' | 'updatedAt'>): Promise<Bill> {
    const bills = await this.getBills();
    const now = new Date().toISOString();
    let vendorId = billData.vendorId;

    // If purchase bill, ensure the vendor entity is registered
    if (billData.type === 'purchase' && billData.entityName) {
      const vendors = await this.getVendors();
      const norm = billData.entityName.trim().toLowerCase();
      const existingVendor = vendors.find(
        (v) => (vendorId && v.id === vendorId) || v.name.trim().toLowerCase() === norm
      );

      if (existingVendor) {
        vendorId = existingVendor.id;
      } else {
        const createdVendor = await this.addVendor({
          name: billData.entityName.trim(),
        });
        vendorId = createdVendor.id;
      }
    }

    const newBill: Bill = {
      ...billData,
      vendorId,
      id: 'bill_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
      createdAt: now,
      updatedAt: now,
    };
    bills.unshift(newBill);
    await this.saveBills(bills);
    return newBill;
  }

  async deleteBill(id: string): Promise<void> {
    const bills = await this.getBills();
    const filtered = bills.filter((b) => b.id !== id);
    await this.saveBills(filtered);
  }

  async getSettlements(): Promise<MonthlySettlement[]> {
    const raw = await getItem(KEYS.SETTLEMENTS);
    return raw ? JSON.parse(raw) : [];
  }

  async saveSettlements(settlements: MonthlySettlement[]): Promise<void> {
    await setItem(KEYS.SETTLEMENTS, JSON.stringify(settlements));
  }

  async toggleSettlement(entityName: string, monthStr: string): Promise<MonthlySettlement> {
    const settlements = await this.getSettlements();
    const norm = entityName.trim().toLowerCase();
    const idx = settlements.findIndex(
      (s) => s.entityName.trim().toLowerCase() === norm && s.monthStr === monthStr
    );

    const now = new Date().toISOString();
    let updated: MonthlySettlement;

    if (idx >= 0) {
      const current = settlements[idx];
      const nextStatus = current.status === 'PAID' ? 'UNPAID' : 'PAID';
      updated = {
        ...current,
        status: nextStatus,
        settledAt: nextStatus === 'PAID' ? now : undefined,
        updatedAt: now,
      };
      settlements[idx] = updated;
    } else {
      updated = {
        id: 'set_' + Date.now(),
        entityName,
        type: 'sale',
        monthStr,
        status: 'PAID',
        settledAt: now,
        updatedAt: now,
      };
      settlements.push(updated);
    }

    await this.saveSettlements(settlements);
    return updated;
  }

  async getVendors(): Promise<Vendor[]> {
    const raw = await getItem(KEYS.VENDORS);
    let vendors: Vendor[] = raw ? JSON.parse(raw) : [];

    // Auto-discover and backfill any vendors from purchase bills
    const rawBills = await getItem(KEYS.BILLS);
    const bills: Bill[] = rawBills ? JSON.parse(rawBills) : [];
    let hasNew = false;

    for (const b of bills) {
      if (b.type === 'purchase' && b.entityName) {
        const norm = b.entityName.trim().toLowerCase();
        const exists = vendors.some(
          (v) => v.name.trim().toLowerCase() === norm || (b.vendorId && v.id === b.vendorId)
        );
        if (!exists) {
          vendors.push({
            id: b.vendorId || ('v_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6)),
            name: b.entityName.trim(),
            createdAt: b.createdAt || new Date().toISOString(),
            updatedAt: b.updatedAt || new Date().toISOString(),
          });
          hasNew = true;
        }
      }
    }

    if (hasNew) {
      await this.saveVendors(vendors);
    }

    return vendors;
  }

  async saveVendors(vendors: Vendor[]): Promise<void> {
    await setItem(KEYS.VENDORS, JSON.stringify(vendors));
  }

  async addVendor(vendorData: Omit<Vendor, 'id' | 'createdAt' | 'updatedAt'>): Promise<Vendor> {
    const vendors = await this.getVendors();
    const now = new Date().toISOString();
    const newVendor: Vendor = {
      ...vendorData,
      id: 'v_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
      createdAt: now,
      updatedAt: now,
    };
    vendors.push(newVendor);
    await this.saveVendors(vendors);
    return newVendor;
  }

  async updateVendor(
    id: string,
    updates: Partial<Omit<Vendor, 'id' | 'createdAt' | 'updatedAt'>>
  ): Promise<Vendor | null> {
    const vendors = await this.getVendors();
    const idx = vendors.findIndex((v) => v.id === id);
    if (idx < 0) return null;
    const updated: Vendor = {
      ...vendors[idx],
      ...updates,
      updatedAt: new Date().toISOString(),
    };
    vendors[idx] = updated;
    await this.saveVendors(vendors);
    return updated;
  }

  async getVendorPayments(): Promise<VendorPayment[]> {
    const raw = await getItem(KEYS.PAYMENTS);
    return raw ? JSON.parse(raw) : [];
  }

  async saveVendorPayments(payments: VendorPayment[]): Promise<void> {
    await setItem(KEYS.PAYMENTS, JSON.stringify(payments));
  }

  async addVendorPayment(
    paymentData: Omit<VendorPayment, 'id' | 'createdAt' | 'updatedAt'>
  ): Promise<VendorPayment> {
    const payments = await this.getVendorPayments();
    const now = new Date().toISOString();
    const newPayment: VendorPayment = {
      ...paymentData,
      id: 'vp_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
      createdAt: now,
      updatedAt: now,
    };
    payments.push(newPayment);
    await this.saveVendorPayments(payments);
    return newPayment;
  }

  async deleteVendorPayment(id: string): Promise<void> {
    const payments = await this.getVendorPayments();
    const filtered = payments.filter((p) => p.id !== id);
    await this.saveVendorPayments(filtered);
  }

  async exportJSON(): Promise<SyncPacket> {
    const [deviceId, bills, settlements, vendors, vendorPayments] = await Promise.all([
      this.getDeviceId(),
      this.getBills(),
      this.getSettlements(),
      this.getVendors(),
      this.getVendorPayments(),
    ]);

    return {
      deviceId,
      timestamp: new Date().toISOString(),
      bills,
      settlements,
      vendors,
      vendorPayments,
    };
  }

  async importJSON(jsonString: string): Promise<{ success: boolean; error?: string }> {
    try {
      const data = JSON.parse(jsonString);
      const validation = validateSyncPayload(data);
      if (!validation.isValid) {
        return { success: false, error: validation.error };
      }

      const [localBills, localSettlements, localVendors, localPayments] = await Promise.all([
        this.getBills(),
        this.getSettlements(),
        this.getVendors(),
        this.getVendorPayments(),
      ]);

      const merged = mergeAllSyncData(
        {
          bills: localBills,
          settlements: localSettlements,
          vendors: localVendors,
          vendorPayments: localPayments,
        },
        data
      );

      await Promise.all([
        this.saveBills(merged.bills),
        this.saveSettlements(merged.settlements),
        this.saveVendors(merged.vendors),
        this.saveVendorPayments(merged.vendorPayments),
      ]);

      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message || 'JSON Parse error' };
    }
  }

  async clearAll(): Promise<void> {
    for (const key of Object.values(KEYS)) {
      await removeItem(key);
      delete memoryStore[key];
    }
  }
}

export const defaultStorage = new NativeAppStorage();
