import {
  toCents,
  fromCents,
  addMoney,
  subtractMoney,
  sumMoney,
  isValidMoneyAmount,
  formatINR,
} from '../src/core/math';

describe('High-Precision Currency & Mathematical Engine Tests', () => {
  describe('Floating-point drift protection', () => {
    test('0.1 + 0.2 must equal 0.3 without 0.30000000000000004 drift', () => {
      const rawJs = 0.1 + 0.2;
      expect(rawJs).not.toBe(0.3); // Raw JS fails

      const accurateSum = addMoney(0.1, 0.2);
      expect(accurateSum).toBe(0.3);
    });

    test('Decimal cents subtraction avoids precision leakage (e.g. 20000.10 - 10000.05)', () => {
      const result = subtractMoney(20000.10, 10000.05);
      expect(result).toBe(10000.05);
      expect(toCents(result)).toBe(1000005);
    });

    test('toCents and fromCents roundtrip preserves exact values', () => {
      const testCases = [0, 0.01, 10.5, 99.99, 1500, 20000, 999999.99];
      for (const val of testCases) {
        expect(fromCents(toCents(val))).toBe(val);
      }
    });

    test('handles negative/zero and NaN gracefully', () => {
      expect(toCents(NaN)).toBe(0);
      expect(fromCents(NaN)).toBe(0);
      expect(addMoney()).toBe(0);
    });
  });

  describe('sumMoney', () => {
    test('accurately sums long chains of fractional payments', () => {
      const amounts = [10.25, 20.35, 30.40, 40.50, 50.15];
      // 10.25+20.35+30.40+40.50+50.15 = 151.65
      expect(sumMoney(amounts)).toBe(151.65);
    });

    test('sums empty array to 0', () => {
      expect(sumMoney([])).toBe(0);
    });
  });

  describe('isValidMoneyAmount', () => {
    test('accepts valid positive numbers and numeric strings', () => {
      expect(isValidMoneyAmount(100)).toBe(true);
      expect(isValidMoneyAmount(0.5)).toBe(true);
      expect(isValidMoneyAmount('250.75')).toBe(true);
    });

    test('rejects negative, zero, NaN, or non-numeric values', () => {
      expect(isValidMoneyAmount(0)).toBe(false);
      expect(isValidMoneyAmount(-100)).toBe(false);
      expect(isValidMoneyAmount('abc')).toBe(false);
      expect(isValidMoneyAmount(null)).toBe(false);
      expect(isValidMoneyAmount(undefined)).toBe(false);
    });
  });

  describe('formatINR', () => {
    test('formats numbers into standard INR currency strings', () => {
      expect(formatINR(20000)).toBe('₹20,000.00');
      expect(formatINR(10000.5)).toBe('₹10,000.50');
      expect(formatINR(10000.5, false)).toBe('10,000.50');
    });
  });
});
