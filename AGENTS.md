# AGENTS.md — AI Agent Directives & Codebase Conventions
**Project:** MK Exotic Fruits Native (`mk-exotix-native`)  
**Target Platform:** React Native / Expo (Android, iOS, Web/Desktop)  
**Primary Mission:** 100% offline-first accounting, billing, customer settlements, and vendor lifetime ledger with mathematical precision and zero data leakage.

---

## 1. Golden Invariants (NEVER VIOLATE)

1. **Precision Currency Arithmetic:**
   - NEVER perform raw floating-point operations on currency amounts (e.g., `a - b` or `sum + amount`).
   - ALWAYS use the mathematical primitives in `src/core/math.ts` (`addMoney`, `subtractMoney`, `sumMoney`, `toCents`, `fromCents`).
   - Internal storage can be numeric floats or integer cents, but calculations MUST round to the nearest cent/paise to prevent IEEE 754 drift.

2. **Strict Entity & Domain Isolation (Zero Data Leakage):**
   - Customer Sales (`type: 'sale'`) and Vendor Purchases (`type: 'purchase'`) are strictly partitioned.
   - A Vendor's due balance MUST NEVER include customer sale bills or another vendor's bills.
   - When querying transactions for vendor `X`, filter strictly by `vendorId === X.id || (entityName === X.name && type === 'purchase')`.

3. **Vendor Module Rules:**
   - **NO MONTH FILTER for Vendors:** Vendor balances and ledgers are **strictly lifetime cumulative**.
   - Partial payments are recorded as separate `VendorPayment` records.
   - Remaining Due = `Total Purchases - Total Payments`. If payments exceed purchases, Due is 0 and Advance is shown.
   - Both bills and payments MUST be visible in an interleaved, chronological audit timeline.

4. **Customer Module Rules:**
   - Grouped by month (`YYYY-MM`).
   - Customer dues have single-click monthly settlement status (`PAID` / `UNPAID`).

5. **Clean Architecture Separation:**
   - `src/core/` is 100% pure TypeScript. NO React, NO React Native, and NO platform-specific dependencies.
   - All calculation functions must be pure, deterministic, and testable via Jest without mocks.

---

## 2. Directory Layout & Roles

| Path | Purpose |
|---|---|
| `src/core/types.ts` | Single source of truth for TypeScript domain models |
| `src/core/math.ts` | Currency math, decimal precision, formatting |
| `src/core/ledger.ts` | Pure ledger calculation engine (customer & vendor balances) |
| `src/core/sync.ts` | Deterministic Last-Write-Wins (LWW) delta merge engine |
| `src/storage/` | Local storage abstraction (AsyncStorage / SQLite adapter) |
| `src/hooks/` | React custom hooks connecting storage to UI |
| `src/components/common/` | Reusable atomic UI components |
| `src/components/forms/` | Input forms (BillForm, PaymentForm) |
| `src/components/vendor/` | Vendor cards, ledger timelines, due badges |
| `src/components/customer/` | Customer month selector, customer ledger cards |
| `src/screens/` | Top-level screen views |
| `__tests__/` | Automated logical test suites (must always pass 100%) |

---

## 3. React Native Design Guidelines (from react-native-skills)

- **Pressables:** Use `Pressable` with proper feedback instead of `TouchableOpacity`.
- **List Performance:** Use `FlashList` or optimized `FlatList` with `keyExtractor` and memoized components (`React.memo`).
- **No Inline Styles:** Use `StyleSheet.create` outside the component scope to avoid garbage collection pressure during renders.
- **Safe Area:** Always wrap screens in `SafeAreaView` or use `useSafeAreaInsets()`.
- **Text Safety:** Always wrap strings in `<Text>` components (never bare strings inside `<View>`).

---

## 4. Verification Checklist Before Finishing Any Task

- [ ] Run `npm test` — all test suites must pass cleanly.
- [ ] Verify that no new floating-point math was introduced outside `src/core/math.ts`.
- [ ] Verify vendor queries do not filter by month.
- [ ] Verify `TASKS.md` is updated with completed actions and next steps.
