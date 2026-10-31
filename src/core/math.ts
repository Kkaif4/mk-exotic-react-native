/**
 * High-Precision Currency & Mathematical Primitives
 * Eliminates IEEE 754 floating-point rounding bugs (e.g. 0.1 + 0.2 = 0.30000000000000004).
 * All money operations use integer cents/paise internally.
 */

const SCALE = 100;

/** Converts decimal currency amount to integer cents (e.g. 19.99 -> 1999) */
export function toCents(amount: number): number {
  if (!Number.isFinite(amount)) return 0;
  return Math.round(amount * SCALE);
}

/** Converts integer cents back to decimal currency (e.g. 1999 -> 19.99) */
export function fromCents(cents: number): number {
  if (!Number.isFinite(cents)) return 0;
  return cents / SCALE;
}

/** Accurately adds multiple currency amounts */
export function addMoney(...amounts: number[]): number {
  const totalCents = amounts.reduce((acc, curr) => acc + toCents(curr), 0);
  return fromCents(totalCents);
}

/** Accurately subtracts subtrahend from minuend (minuend - subtrahend) */
export function subtractMoney(minuend: number, subtrahend: number): number {
  return fromCents(toCents(minuend) - toCents(subtrahend));
}

/** Accurately sums an array of numbers */
export function sumMoney(amounts: number[]): number {
  return addMoney(...amounts);
}

/** Validates if input is a valid positive money amount */
export function isValidMoneyAmount(amount: any): boolean {
  if (typeof amount !== 'number' && typeof amount !== 'string') return false;
  const num = typeof amount === 'string' ? parseFloat(amount) : amount;
  return Number.isFinite(num) && num > 0;
}

/** Formats a numeric currency into standard Indian Rupee format (e.g. ₹20,000.00) */
export function formatINR(amount: number, includeSymbol: boolean = true): string {
  const safe = Number.isFinite(amount) ? amount : 0;
  const formatted = safe.toLocaleString('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  return includeSymbol ? `₹${formatted}` : formatted;
}
