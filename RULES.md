# RULES.md — System Rules & Calculation Invariants

## Rule 1: Currency Calculation Integrity
```typescript
// ALWAYS use math.ts
import { addMoney, subtractMoney, sumMoney, formatINR } from '../core/math';

// FORBIDDEN:
const total = bills.reduce((acc, b) => acc + b.amount, 0); // VIOLATION: precision loss
const due = total - paid;                                  // VIOLATION: precision loss

// REQUIRED:
const total = sumMoney(bills.map(b => b.amount));
const due = subtractMoney(total, paid);
```

## Rule 2: Multi-Entity Partitioning (Anti-Data-Leak)
- Bills with `type: 'sale'` are strictly Customers.
- Bills with `type: 'purchase'` are strictly Vendors.
- Filtering or aggregating by an entity name MUST always include the `type` constraint:
```typescript
// REQUIRED
const vendorBills = bills.filter(b => b.type === 'purchase' && (b.vendorId === v.id || b.entityName === v.name));
```

## Rule 3: Vendor Module Specifications
- **No Month Filter:** Vendor screens and calculations must process all bills regardless of date.
- **Partial Payments:** Any positive payment amount is accepted and recorded as a `VendorPayment`.
- **Status Computation:**
  - `Remaining Due > 0`: Status is `DUE` (in red).
  - `Remaining Due === 0 && Total Purchases > 0`: Status is `SETTLED` (in green).
  - `Total Purchases === 0`: Status is `NO_BILLS` (neutral).
  - `Total Paid > Total Purchases`: Status is `ADVANCE` (advance paid balance).

## Rule 4: Customer Module Specifications
- Grouped strictly by `YYYY-MM`.
- Monthly settlement applies to that specific customer for that specific month string (`status: 'PAID' | 'UNPAID'`).

## Rule 5: Conflict-Free Last-Write-Wins (LWW) Merging
- Records have `createdAt` and `updatedAt` ISO 8601 strings.
- When merging incoming records from peer devices (via Wi-Fi or backup import), if an ID matches:
  - If `new Date(incoming.updatedAt) > new Date(local.updatedAt)`, update local record.
  - Otherwise, preserve local record.
- If incoming ID does not exist locally, insert it.
