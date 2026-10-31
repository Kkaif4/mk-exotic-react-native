import {
  calculateVendorFinancials,
  calculateCustomerMonthSummary,
} from '../src/core/ledger';
import { Bill, VendorPayment, MonthlySettlement } from '../src/core/types';

describe('Data Isolation & Zero-Leakage Tests', () => {
  test('Customer Sale bills NEVER leak into Vendor Purchase calculations', () => {
    const sharedName = 'Golden Harvest Co.';

    const bills: Bill[] = [
      // Customer Sale of 50,000
      {
        id: 'sale_1',
        type: 'sale',
        entityName: sharedName,
        billNumber: 'S-101',
        date: '2026-08-01',
        amount: 50000,
        createdAt: '2026-08-01T10:00:00Z',
        updatedAt: '2026-08-01T10:00:00Z',
      },
      // Vendor Purchase of 20,000
      {
        id: 'purch_1',
        type: 'purchase',
        entityName: sharedName,
        vendorId: 'vendor_gh',
        billNumber: 'P-101',
        date: '2026-08-02',
        amount: 20000,
        createdAt: '2026-08-02T10:00:00Z',
        updatedAt: '2026-08-02T10:00:00Z',
      },
    ];

    const payments: VendorPayment[] = [
      {
        id: 'pay_1',
        vendorId: 'vendor_gh',
        amount: 5000,
        date: '2026-08-03',
        paymentMode: 'Cash',
        createdAt: '2026-08-03T10:00:00Z',
        updatedAt: '2026-08-03T10:00:00Z',
      },
    ];

    // Vendor calculation must ONLY see the 20,000 purchase and 5,000 payment -> 15,000 due
    const vendorSummary = calculateVendorFinancials(
      'vendor_gh',
      sharedName,
      bills,
      payments
    );
    expect(vendorSummary.totalPurchases).toBe(20000); // NOT 70,000
    expect(vendorSummary.totalPaid).toBe(5000);
    expect(vendorSummary.remainingDue).toBe(15000);

    // Customer calculation must ONLY see the 50,000 sale
    const settlements: MonthlySettlement[] = [];
    const customerSummary = calculateCustomerMonthSummary(
      sharedName,
      '2026-08',
      bills,
      settlements
    );
    expect(customerSummary.totalDue).toBe(50000); // NOT 70,000
    expect(customerSummary.bills.length).toBe(1);
    expect(customerSummary.bills[0].id).toBe('sale_1');
  });

  test('Transactions from Vendor A NEVER leak into Vendor B', () => {
    const bills: Bill[] = [
      {
        id: 'b_a',
        type: 'purchase',
        entityName: 'Vendor Alpha',
        vendorId: 'v_alpha',
        billNumber: 'VA-1',
        date: '2026-08-01',
        amount: 30000,
        createdAt: '2026-08-01T10:00:00Z',
        updatedAt: '2026-08-01T10:00:00Z',
      },
      {
        id: 'b_b',
        type: 'purchase',
        entityName: 'Vendor Beta',
        vendorId: 'v_beta',
        billNumber: 'VB-1',
        date: '2026-08-02',
        amount: 45000,
        createdAt: '2026-08-02T10:00:00Z',
        updatedAt: '2026-08-02T10:00:00Z',
      },
    ];

    const payments: VendorPayment[] = [
      {
        id: 'p_a',
        vendorId: 'v_alpha',
        amount: 15000,
        date: '2026-08-03',
        paymentMode: 'UPI',
        createdAt: '2026-08-03T10:00:00Z',
        updatedAt: '2026-08-03T10:00:00Z',
      },
    ];

    const summaryA = calculateVendorFinancials('v_alpha', 'Vendor Alpha', bills, payments);
    expect(summaryA.totalPurchases).toBe(30000);
    expect(summaryA.totalPaid).toBe(15000);
    expect(summaryA.remainingDue).toBe(15000);

    const summaryB = calculateVendorFinancials('v_beta', 'Vendor Beta', bills, payments);
    expect(summaryB.totalPurchases).toBe(45000);
    expect(summaryB.totalPaid).toBe(0);
    expect(summaryB.remainingDue).toBe(45000);
  });
});
