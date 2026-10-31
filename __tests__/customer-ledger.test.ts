import { calculateCustomerMonthSummary } from '../src/core/ledger';
import { Bill, MonthlySettlement } from '../src/core/types';

describe('Customer Monthly Ledger Tests', () => {
  const customer = 'Fresh Mart Supermarket';

  test('Calculates monthly dues strictly for the specified month', () => {
    const bills: Bill[] = [
      // August 2026 bills
      {
        id: 'b1',
        type: 'sale',
        entityName: customer,
        billNumber: 'S01',
        date: '2026-08-02',
        amount: 5000,
        createdAt: '2026-08-02T10:00:00Z',
        updatedAt: '2026-08-02T10:00:00Z',
      },
      {
        id: 'b2',
        type: 'sale',
        entityName: customer,
        billNumber: 'S02',
        date: '2026-08-15',
        amount: 8500.5,
        createdAt: '2026-08-15T10:00:00Z',
        updatedAt: '2026-08-15T10:00:00Z',
      },
      // September 2026 bill (must NOT appear in August due)
      {
        id: 'b3',
        type: 'sale',
        entityName: customer,
        billNumber: 'S03',
        date: '2026-09-01',
        amount: 12000,
        createdAt: '2026-09-01T10:00:00Z',
        updatedAt: '2026-09-01T10:00:00Z',
      },
    ];

    const settlements: MonthlySettlement[] = [];

    // Check August: 5000 + 8500.5 = 13500.50
    const augSummary = calculateCustomerMonthSummary(customer, '2026-08', bills, settlements);
    expect(augSummary.totalDue).toBe(13500.5);
    expect(augSummary.bills.length).toBe(2);
    expect(augSummary.status).toBe('UNPAID');

    // Check September: 12000
    const sepSummary = calculateCustomerMonthSummary(customer, '2026-09', bills, settlements);
    expect(sepSummary.totalDue).toBe(12000);
    expect(sepSummary.bills.length).toBe(1);
  });

  test('Reflects settlement status accurately', () => {
    const bills: Bill[] = [
      {
        id: 'b1',
        type: 'sale',
        entityName: customer,
        billNumber: 'S01',
        date: '2026-08-02',
        amount: 5000,
        createdAt: '2026-08-02T10:00:00Z',
        updatedAt: '2026-08-02T10:00:00Z',
      },
    ];

    const settlements: MonthlySettlement[] = [
      {
        id: 'set_1',
        entityName: customer,
        type: 'sale',
        monthStr: '2026-08',
        status: 'PAID',
        settledAt: '2026-08-31T18:00:00Z',
        updatedAt: '2026-08-31T18:00:00Z',
      },
    ];

    const summary = calculateCustomerMonthSummary(customer, '2026-08', bills, settlements);
    expect(summary.status).toBe('PAID');
    expect(summary.settledAt).toBe('2026-08-31T18:00:00Z');
  });
});
