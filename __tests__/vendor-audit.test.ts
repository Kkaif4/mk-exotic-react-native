import {
  calculateVendorFinancials,
  generateVendorAuditTimeline,
} from '../src/core/ledger';
import { Bill, VendorPayment } from '../src/core/types';

describe('Vendor Audit & Lifetime Balance Tests', () => {
  const vendorId = 'vendor_mango_corp';
  const vendorName = 'Mango Corporation';

  test('User Scenario: 20k purchase bill -> 20k due', () => {
    const bills: Bill[] = [
      {
        id: 'b1',
        type: 'purchase',
        entityName: vendorName,
        vendorId,
        billNumber: 'INV-001',
        date: '2026-08-01',
        amount: 20000,
        createdAt: '2026-08-01T10:00:00Z',
        updatedAt: '2026-08-01T10:00:00Z',
      },
    ];
    const payments: VendorPayment[] = [];

    const summary = calculateVendorFinancials(vendorId, vendorName, bills, payments);
    expect(summary.totalPurchases).toBe(20000);
    expect(summary.totalPaid).toBe(0);
    expect(summary.remainingDue).toBe(20000);
    expect(summary.status).toBe('DUE');
  });

  test('User Scenario: 20k purchase + 10k partial payment -> 10k paid, 10k remaining due', () => {
    const bills: Bill[] = [
      {
        id: 'b1',
        type: 'purchase',
        entityName: vendorName,
        vendorId,
        billNumber: 'INV-001',
        date: '2026-08-01',
        amount: 20000,
        createdAt: '2026-08-01T10:00:00Z',
        updatedAt: '2026-08-01T10:00:00Z',
      },
    ];
    const payments: VendorPayment[] = [
      {
        id: 'p1',
        vendorId,
        amount: 10000,
        date: '2026-08-05',
        paymentMode: 'UPI',
        referenceNote: 'Advance partial installment',
        createdAt: '2026-08-05T12:00:00Z',
        updatedAt: '2026-08-05T12:00:00Z',
      },
    ];

    const summary = calculateVendorFinancials(vendorId, vendorName, bills, payments);
    expect(summary.totalPurchases).toBe(20000);
    expect(summary.totalPaid).toBe(10000);
    expect(summary.remainingDue).toBe(10000);
    expect(summary.status).toBe('DUE');
  });

  test('Multiple purchases across multiple months without month filter restriction', () => {
    // User purchases a lot over different months
    const bills: Bill[] = [
      {
        id: 'b1',
        type: 'purchase',
        entityName: vendorName,
        vendorId,
        billNumber: 'INV-001',
        date: '2026-01-10', // Jan
        amount: 15000,
        createdAt: '2026-01-10T10:00:00Z',
        updatedAt: '2026-01-10T10:00:00Z',
      },
      {
        id: 'b2',
        type: 'purchase',
        entityName: vendorName,
        vendorId,
        billNumber: 'INV-002',
        date: '2026-05-12', // May
        amount: 25000,
        createdAt: '2026-05-12T10:00:00Z',
        updatedAt: '2026-05-12T10:00:00Z',
      },
      {
        id: 'b3',
        type: 'purchase',
        entityName: vendorName,
        vendorId,
        billNumber: 'INV-003',
        date: '2026-10-31', // Oct
        amount: 10000,
        createdAt: '2026-10-31T10:00:00Z',
        updatedAt: '2026-10-31T10:00:00Z',
      },
    ];

    // Payments in different months
    const payments: VendorPayment[] = [
      {
        id: 'p1',
        vendorId,
        amount: 10000,
        date: '2026-02-01',
        paymentMode: 'Cash',
        createdAt: '2026-02-01T10:00:00Z',
        updatedAt: '2026-02-01T10:00:00Z',
      },
      {
        id: 'p2',
        vendorId,
        amount: 20000,
        date: '2026-06-15',
        paymentMode: 'Bank Transfer',
        createdAt: '2026-06-15T10:00:00Z',
        updatedAt: '2026-06-15T10:00:00Z',
      },
    ];

    const summary = calculateVendorFinancials(vendorId, vendorName, bills, payments);
    // Total purchases = 15000 + 25000 + 10000 = 50,000
    // Total paid = 10000 + 20000 = 30,000
    // Remaining due = 20,000
    expect(summary.totalPurchases).toBe(50000);
    expect(summary.totalPaid).toBe(30000);
    expect(summary.remainingDue).toBe(20000);
    expect(summary.billCount).toBe(3);
    expect(summary.paymentCount).toBe(2);
    expect(summary.status).toBe('DUE');
  });

  test('Full settlement flips status to SETTLED with zero due', () => {
    const bills: Bill[] = [
      {
        id: 'b1',
        type: 'purchase',
        entityName: vendorName,
        vendorId,
        billNumber: 'INV-10',
        date: '2026-09-01',
        amount: 12500.5,
        createdAt: '2026-09-01T10:00:00Z',
        updatedAt: '2026-09-01T10:00:00Z',
      },
    ];
    const payments: VendorPayment[] = [
      {
        id: 'p1',
        vendorId,
        amount: 12500.5,
        date: '2026-09-02',
        paymentMode: 'UPI',
        createdAt: '2026-09-02T10:00:00Z',
        updatedAt: '2026-09-02T10:00:00Z',
      },
    ];

    const summary = calculateVendorFinancials(vendorId, vendorName, bills, payments);
    expect(summary.remainingDue).toBe(0);
    expect(summary.status).toBe('SETTLED');
  });

  test('Overpayment accurately reflects ADVANCE status without negative due amounts', () => {
    const bills: Bill[] = [
      {
        id: 'b1',
        type: 'purchase',
        entityName: vendorName,
        vendorId,
        billNumber: 'INV-11',
        date: '2026-09-01',
        amount: 5000,
        createdAt: '2026-09-01T10:00:00Z',
        updatedAt: '2026-09-01T10:00:00Z',
      },
    ];
    const payments: VendorPayment[] = [
      {
        id: 'p1',
        vendorId,
        amount: 8000, // 3000 advance
        date: '2026-09-02',
        paymentMode: 'Bank Transfer',
        createdAt: '2026-09-02T10:00:00Z',
        updatedAt: '2026-09-02T10:00:00Z',
      },
    ];

    const summary = calculateVendorFinancials(vendorId, vendorName, bills, payments);
    expect(summary.remainingDue).toBe(0);
    expect(summary.advancePaid).toBe(3000);
    expect(summary.status).toBe('ADVANCE');
  });

  test('Audit timeline calculates accurate chronological running balance line by line', () => {
    const bills: Bill[] = [
      {
        id: 'b1',
        type: 'purchase',
        entityName: vendorName,
        vendorId,
        billNumber: 'B01',
        date: '2026-08-01',
        amount: 20000,
        createdAt: '2026-08-01T09:00:00Z',
        updatedAt: '2026-08-01T09:00:00Z',
      },
      {
        id: 'b2',
        type: 'purchase',
        entityName: vendorName,
        vendorId,
        billNumber: 'B02',
        date: '2026-08-10',
        amount: 15000,
        createdAt: '2026-08-10T09:00:00Z',
        updatedAt: '2026-08-10T09:00:00Z',
      },
    ];

    const payments: VendorPayment[] = [
      {
        id: 'p1',
        vendorId,
        amount: 10000,
        date: '2026-08-05',
        paymentMode: 'UPI',
        createdAt: '2026-08-05T09:00:00Z',
        updatedAt: '2026-08-05T09:00:00Z',
      },
      {
        id: 'p2',
        vendorId,
        amount: 20000,
        date: '2026-08-15',
        paymentMode: 'Cash',
        createdAt: '2026-08-15T09:00:00Z',
        updatedAt: '2026-08-15T09:00:00Z',
      },
    ];

    // Chronological sequence:
    // 1. Aug 01: Bill +20,000 -> Running: 20,000
    // 2. Aug 05: Payment -10,000 -> Running: 10,000
    // 3. Aug 10: Bill +15,000 -> Running: 25,000
    // 4. Aug 15: Payment -20,000 -> Running: 5,000

    const timeline = generateVendorAuditTimeline(vendorId, vendorName, bills, payments);
    expect(timeline.length).toBe(4);

    // Timeline is returned descending (newest first for UI):
    expect(timeline[0].id).toBe('p2');
    expect(timeline[0].runningBalance).toBe(5000);

    expect(timeline[1].id).toBe('b2');
    expect(timeline[1].runningBalance).toBe(25000);

    expect(timeline[2].id).toBe('p1');
    expect(timeline[2].runningBalance).toBe(10000);

    expect(timeline[3].id).toBe('b1');
    expect(timeline[3].runningBalance).toBe(20000);
  });

  test('calculateVendorFinancials attaches bills, payments and monthly breakdown', () => {
    const curMonth = new Date().toISOString().substring(0, 7);
    const bills: Bill[] = [
      {
        id: 'b_cur',
        type: 'purchase',
        entityName: 'Texxt Vendor',
        vendorId: 'v_texxt',
        billNumber: 'INV-TXT-01',
        date: `${curMonth}-05`,
        amount: 35000,
        createdAt: '2026-10-05T10:00:00Z',
        updatedAt: '2026-10-05T10:00:00Z',
      },
    ];
    const payments: VendorPayment[] = [
      {
        id: 'p_cur',
        vendorId: 'v_texxt',
        amount: 15000,
        date: `${curMonth}-06`,
        paymentMode: 'UPI',
        createdAt: '2026-10-06T10:00:00Z',
        updatedAt: '2026-10-06T10:00:00Z',
      },
    ];

    const summary = calculateVendorFinancials('v_texxt', 'Texxt Vendor', bills, payments);

    expect(summary.totalPurchases).toBe(35000);
    expect(summary.totalPaid).toBe(15000);
    expect(summary.remainingDue).toBe(20000);
    expect(summary.thisMonthPurchases).toBe(35000);
    expect(summary.thisMonthPaid).toBe(15000);
    expect(summary.bills).toHaveLength(1);
    expect(summary.payments).toHaveLength(1);
    expect(summary.bills?.[0].billNumber).toBe('INV-TXT-01');
    expect(summary.payments?.[0].paymentMode).toBe('UPI');
  });
});
