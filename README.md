# MK Exotic Fruits — React Native Application (`mk-exotix-native`)

High-performance, 100% offline-first native billing and accounting application with fixed-point currency precision, zero data leakage, and Last-Write-Wins peer synchronization.

---

## Key Highlights

- **Framework:** React Native (Expo SDK 52+, TypeScript)
- **Math Precision:** Strict integer cents/paise arithmetic (`src/core/math.ts`) preventing floating-point drift.
- **Vendor Module:**
  - **No month filter:** Continuous, lifetime cumulative dues.
  - Partial payments support with payment mode tracking (Cash, UPI, Bank Transfer, Cheque).
  - Interleaved chronological audit timeline with running balance computation at each step.
- **Customer Module:**
  - Grouped by month (`YYYY-MM`).
  - Single-click monthly settlement status (`PAID` / `UNPAID`).
- **Zero Data Leakage:** Mathematical partitioning between customer sales and vendor purchases, with dedicated unit tests.
- **AI Agent Context:** Complete rules, architectural invariants, workflows, and task tracking persisted in `AGENTS.md`, `RULES.md`, `ARCHITECTURE.md`, `WORKFLOW.md`, and `TASKS.md`.

---

## Automated Tests

Run the test suite:
```bash
npm test
```

Test Suites:
- `__tests__/calculations.test.ts` (Fixed-point currency math, floating point drift protection)
- `__tests__/vendor-audit.test.ts` (Vendor lifetime purchases, partial payments, due amounts, running balance)
- `__tests__/customer-ledger.test.ts` (Monthly customer billing, settlement toggle)
- `__tests__/data-leakage.test.ts` (Cross-entity and cross-type isolation tests)
- `__tests__/lww-sync.test.ts` (Last-Write-Wins conflict resolution & validation)

---

## Running the App

```bash
# Start Metro bundler
npm start

# Run on Android
npm run android

# Run on iOS
npm run ios

# Run in Web browser
npm run web
```
