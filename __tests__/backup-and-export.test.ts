import { defaultStorage } from '../src/storage/local-storage';
import { Bill, Vendor, VendorPayment } from '../src/core/types';

describe('Backup, Export & Import Invariants', () => {
  beforeEach(async () => {
    await defaultStorage.clearAll();
  });

  test('exportJSON returns complete and valid sync packet structure', async () => {
    // Seed initial data
    const vendor = await defaultStorage.addVendor({
      name: 'Shimla Apple Orchards',
      contactNumber: '+91 9998887776',
      notes: 'Grade A Royal Gala supplier',
    });

    await defaultStorage.addBill({
      type: 'purchase',
      entityName: vendor.name,
      vendorId: vendor.id,
      billNumber: 'INV-AP-01',
      date: '2026-10-01',
      amount: 45000,
    });

    await defaultStorage.addVendorPayment({
      vendorId: vendor.id,
      amount: 20000,
      date: '2026-10-02',
      paymentMode: 'Bank Transfer',
      referenceNote: 'Advance rtgs',
    });

    await defaultStorage.addBill({
      type: 'sale',
      entityName: 'Royal Fresh Mart',
      billNumber: 'SAL-001',
      date: '2026-10-03',
      amount: 15000,
    });

    await defaultStorage.toggleSettlement('Royal Fresh Mart', '2026-10');

    const backup = await defaultStorage.exportJSON();

    expect(backup.deviceId).toBeDefined();
    expect(backup.bills).toHaveLength(2);
    expect(backup.vendors).toHaveLength(1);
    expect(backup.vendorPayments).toHaveLength(1);
    expect(backup.settlements).toHaveLength(1);

    expect(backup.vendors[0].name).toBe('Shimla Apple Orchards');
    expect(backup.vendors[0].contactNumber).toBe('+91 9998887776');
  });

  test('updateVendor correctly updates contact and notes without corrupting id or name', async () => {
    const vendor = await defaultStorage.addVendor({
      name: 'Nagpur Oranges Co',
      contactNumber: '1111111111',
    });

    const updated = await defaultStorage.updateVendor(vendor.id, {
      contactNumber: '+91 9423112233',
      notes: 'Deliveries on Tuesdays only',
    });

    expect(updated).not.toBeNull();
    expect(updated?.contactNumber).toBe('+91 9423112233');
    expect(updated?.notes).toBe('Deliveries on Tuesdays only');
    expect(updated?.name).toBe('Nagpur Oranges Co');

    const list = await defaultStorage.getVendors();
    expect(list[0].contactNumber).toBe('+91 9423112233');
    expect(list[0].notes).toBe('Deliveries on Tuesdays only');
  });

  test('importJSON safely merges external backup packets with local store', async () => {
    // Local data
    await defaultStorage.addVendor({
      name: 'Local Farmer A',
    });

    const externalPacket = {
      deviceId: 'device_external_99',
      timestamp: new Date().toISOString(),
      vendors: [
        {
          id: 'v_ext_1',
          name: 'Kashmir Cherry Guild',
          contactNumber: '+91 9876500001',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      ],
      bills: [
        {
          id: 'bill_ext_1',
          type: 'purchase' as const,
          entityName: 'Kashmir Cherry Guild',
          vendorId: 'v_ext_1',
          billNumber: 'KC-101',
          date: '2026-10-05',
          amount: 80000,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      ],
      settlements: [],
      vendorPayments: [],
    };

    const res = await defaultStorage.importJSON(JSON.stringify(externalPacket));
    expect(res.success).toBe(true);

    const mergedVendors = await defaultStorage.getVendors();
    expect(mergedVendors).toHaveLength(2);

    const mergedBills = await defaultStorage.getBills();
    expect(mergedBills).toHaveLength(1);
    expect(mergedBills[0].amount).toBe(80000);
  });
});
