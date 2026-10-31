import {
  mergeRecordsLWW,
  mergeAllSyncData,
  validateSyncPayload,
} from '../src/core/sync';
import { Bill, Vendor, VendorPayment } from '../src/core/types';

describe('Deterministic Last-Write-Wins (LWW) Synchronization Tests', () => {
  test('Newer incoming update overwrites older local record', () => {
    const localBill: Bill = {
      id: 'b100',
      type: 'purchase',
      entityName: 'Fruit Hub',
      billNumber: '1',
      date: '2026-08-01',
      amount: 1000,
      createdAt: '2026-08-01T10:00:00Z',
      updatedAt: '2026-08-01T10:00:00Z',
    };

    const incomingBill: Bill = {
      id: 'b100',
      type: 'purchase',
      entityName: 'Fruit Hub',
      billNumber: '1',
      date: '2026-08-01',
      amount: 1200, // Updated amount
      createdAt: '2026-08-01T10:00:00Z',
      updatedAt: '2026-08-01T11:00:00Z', // 1 hour newer
    };

    const merged = mergeRecordsLWW([localBill], [incomingBill]);
    expect(merged.length).toBe(1);
    expect(merged[0].amount).toBe(1200);
    expect(merged[0].updatedAt).toBe('2026-08-01T11:00:00Z');
  });

  test('Older incoming update is rejected if local record is newer', () => {
    const localBill: Bill = {
      id: 'b100',
      type: 'purchase',
      entityName: 'Fruit Hub',
      billNumber: '1',
      date: '2026-08-01',
      amount: 1500,
      createdAt: '2026-08-01T10:00:00Z',
      updatedAt: '2026-08-01T12:00:00Z', // Newer local
    };

    const incomingStaleBill: Bill = {
      id: 'b100',
      type: 'purchase',
      entityName: 'Fruit Hub',
      billNumber: '1',
      date: '2026-08-01',
      amount: 1000,
      createdAt: '2026-08-01T10:00:00Z',
      updatedAt: '2026-08-01T10:30:00Z', // Older timestamp
    };

    const merged = mergeRecordsLWW([localBill], [incomingStaleBill]);
    expect(merged.length).toBe(1);
    expect(merged[0].amount).toBe(1500); // Preserves local newer state
  });

  test('Combines disjoint sets of vendors and vendor payments cleanly', () => {
    const localVendor: Vendor = {
      id: 'v1',
      name: 'Pineapple Co.',
      createdAt: '2026-08-01T10:00:00Z',
      updatedAt: '2026-08-01T10:00:00Z',
    };

    const incomingVendor: Vendor = {
      id: 'v2',
      name: 'Banana Wholesalers',
      createdAt: '2026-08-02T10:00:00Z',
      updatedAt: '2026-08-02T10:00:00Z',
    };

    const incomingPayment: VendorPayment = {
      id: 'p1',
      vendorId: 'v2',
      amount: 5000,
      date: '2026-08-03',
      paymentMode: 'Cash',
      createdAt: '2026-08-03T10:00:00Z',
      updatedAt: '2026-08-03T10:00:00Z',
    };

    const res = mergeAllSyncData(
      {
        bills: [],
        settlements: [],
        vendors: [localVendor],
        vendorPayments: [],
      },
      {
        bills: [],
        settlements: [],
        vendors: [incomingVendor],
        vendorPayments: [incomingPayment],
      }
    );

    expect(res.vendors.length).toBe(2);
    expect(res.vendorPayments.length).toBe(1);
    expect(res.vendorPayments[0].amount).toBe(5000);
  });

  test('validateSyncPayload detects malformed data and accepts valid data', () => {
    expect(validateSyncPayload(null).isValid).toBe(false);
    expect(validateSyncPayload({ bills: 'not an array' }).isValid).toBe(false);
    expect(
      validateSyncPayload({
        bills: [{ id: '1', type: 'sale', amount: 'not a number' }],
      }).isValid
    ).toBe(false);
    expect(
      validateSyncPayload({
        bills: [{ id: '1', type: 'sale', amount: 500 }],
        vendorPayments: [{ id: 'p1', vendorId: 'v1', amount: 200 }],
      }).isValid
    ).toBe(true);
  });
});
