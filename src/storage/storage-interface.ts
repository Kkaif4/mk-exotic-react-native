import { Bill, MonthlySettlement, Vendor, VendorPayment, SyncPacket } from '../core/types';

export interface IAppStorage {
  getDeviceId(): Promise<string>;
  getBills(): Promise<Bill[]>;
  saveBills(bills: Bill[]): Promise<void>;
  addBill(bill: Omit<Bill, 'id' | 'createdAt' | 'updatedAt'>): Promise<Bill>;
  deleteBill(id: string): Promise<void>;

  getSettlements(): Promise<MonthlySettlement[]>;
  saveSettlements(settlements: MonthlySettlement[]): Promise<void>;
  toggleSettlement(entityName: string, monthStr: string): Promise<MonthlySettlement>;

  getVendors(): Promise<Vendor[]>;
  saveVendors(vendors: Vendor[]): Promise<void>;
  addVendor(vendor: Omit<Vendor, 'id' | 'createdAt' | 'updatedAt'>): Promise<Vendor>;
  updateVendor(id: string, updates: Partial<Omit<Vendor, 'id' | 'createdAt' | 'updatedAt'>>): Promise<Vendor | null>;

  getVendorPayments(): Promise<VendorPayment[]>;
  saveVendorPayments(payments: VendorPayment[]): Promise<void>;
  addVendorPayment(payment: Omit<VendorPayment, 'id' | 'createdAt' | 'updatedAt'>): Promise<VendorPayment>;
  deleteVendorPayment(id: string): Promise<void>;

  exportJSON(): Promise<SyncPacket>;
  importJSON(jsonString: string): Promise<{ success: boolean; error?: string }>;
  clearAll(): Promise<void>;
}
