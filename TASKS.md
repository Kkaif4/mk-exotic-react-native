# TASKS.md — Living Roadmap & Task Tracker

## Phase 1: Foundation, Rules & Architecture
- [x] Create project workspace at `MyProjects/mk-exotix-native`
- [x] Document `AGENTS.md` (AI agent rules and invariant guidelines)
- [x] Document `RULES.md` (Domain rules, zero data leak, currency precision)
- [x] Document `ARCHITECTURE.md` (Layered clean architecture)
- [x] Document `WORKFLOW.md` (TDD, linting, git rules)
- [x] Document `README.md` (Project overview and run commands)
- [x] Define TypeScript models (`src/core/types.ts`)

## Phase 2: Pure Core Engine & Automated Tests
- [x] Implement `src/core/math.ts` (Fixed-point currency math, cents/paise conversion)
- [x] Implement `src/core/ledger.ts` (Customer monthly calculations, Vendor lifetime audit, running balance)
- [x] Implement `src/core/sync.ts` (Deterministic LWW sync & validation)
- [x] Implement Automated Tests in `__tests__/`:
  - [x] `calculations.test.ts` (Precision currency arithmetic, no floating-point bugs)
  - [x] `vendor-audit.test.ts` (Vendor lifetime purchases, partial payments, due amounts, running balance)
  - [x] `customer-ledger.test.ts` (Monthly customer billing, settlement toggle)
  - [x] `data-leakage.test.ts` (Multi-entity isolation, cross-type safety)
  - [x] `lww-sync.test.ts` (Delta sync, overwrite resolution, corrupted data rejection)

## Phase 3: Storage Layer & State Management
- [x] Implement storage interface (`src/storage/storage-interface.ts`)
- [x] Implement storage adapter with in-memory test fallback (`src/storage/local-storage.ts`)
- [x] Implement custom reactive hooks (`useBills`, `useVendors`, `useVendorLedger`)

## Phase 4: React Native UI Implementation
- [x] Common UI primitives (`Button`, `Card`, `Input`, `Badge`)
- [x] `BillForm` component (3-field entry with customer/vendor autocomplete)
- [x] `PaymentModal` component (Vendor partial payment entry with payment mode & notes)
- [x] `VendorCard` component (3-stat summary strip, remaining due, quick payment)
- [x] `VendorLedgerTimeline` component (Chronological audit history with line-by-line running balance)
- [x] `CustomerLedgerCard` component (Monthly customer bills with settlement toggle)
- [x] Top-level screens:
  - [x] `HomeScreen` (Overall stats, bill form, vendor & customer tabs)
  - [x] `VendorDetailScreen` (Dedicated vendor audit timeline view)
- [x] Root entry point (`App.tsx`)

## Phase 5: Verification & Integrity Check
- [x] Run full automated test suite (`npm test`): 5 test suites, 23 tests passing with 100% green
- [x] Verify status precedence: `DUE` -> `ADVANCE` -> `SETTLED` -> `NO_BILLS`
- [x] Verify mathematical precision without float drift

## Phase 6: Modern Desktop Responsive UI, PDF Statements & Backup Hub
- [x] Responsive layout with dynamic two-column desktop/laptop view (`HomeScreen`, `VendorDetailScreen`)
- [x] Complete removal of all emojis; upgraded to `@expo/vector-icons` (`Feather`)
- [x] Modern obsidian dark theme styling (`#020617`, `#0b1329`, `#1e293b`) with high readability
- [x] Vendor Profile Card on Vendor Lifetime Due screen (contact phone, notes, registration date, edit info modal)
- [x] PDF Statement Generation:
  - [x] Customer monthly accounting statement (`generateCustomerMonthlyPDF`)
  - [x] Vendor continuous lifetime audit statement (`generateVendorLifetimeAuditPDF`)
- [x] Data Hub & Backup Management:
  - [x] Export full database JSON backup (`exportFullJSONBackup`)
  - [x] Import and LWW merge JSON backup with web file input (`importJSONBackup`)
  - [x] Export itemized CSV reports for sales and purchases (`exportCSVReports`)
- [x] Automated test suite expanded to 6 test suites and 26 tests (`backup-and-export.test.ts`)
- [x] Web build verification (`expo export -p web`) passed cleanly
