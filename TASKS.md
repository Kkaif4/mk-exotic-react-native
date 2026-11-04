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

## Phase 7: Vendor Auto-Registration, In-Card Itemized Bills & Modern Search Overhaul
- [x] Auto-register unknown vendors on purchase bill addition in `defaultStorage.addBill`
- [x] Dynamic vendor discovery in `useVendors` across both registered vendors table and all purchase bills
- [x] Itemized bills list and partial payments list directly embedded inside `VendorCard` with delete capability
- [x] Monthly procurement vs payment breakdown displayed alongside lifetime cumulative due
- [x] Search box overhaul: prominent modern input container, focus highlights, multi-field matching (name, bill #, phone, notes)
- [x] All 6 test suites with 28 tests passing cleanly with 100% green

## Phase 8: MK Dark Mode Palette, Deletion Warnings, Vendor Status Filters & Industrial PDF Formats
- [x] Adopt MK Dark Mode Palette tokens (`#071629`, `#0B1D32`, `#10243A`, `#172D44`, `#243B51`, `#E6EDF2`, `#1D7548`, `#75B83D`, `#D94A50`, `#D99A32`, `#397CC2`)
- [x] Implement cross-platform deletion confirmation dialogs (`src/core/confirm.ts`) for bills, payments, and ledger entries with contextual item descriptions
- [x] Highlight vendor name with high-emphasis badge typography in `PaymentModal` (`Pay due balance to <Text style={styles.vendorHighlight}>{vendorName}</Text>`)
- [x] Add interactive Vendor Due Status Filter chips (`ALL`, `DUE`, `SETTLED`, `ADVANCE`) with live entity count badges on `HomeScreen`
- [x] Modernize PDF Statements (`src/core/pdf.ts`) matching `sample_pdf.ts` industrial A4 accounting layout (margins, company metadata, alternating zebra rows, total borders, and standard footers)
- [x] All 6 test suites with 28 tests passing cleanly with 100% green

## Phase 9: Row-Level Vendor List, Vendor View Timeline Filtering & Mandatory Searchable Customer Dropdown
- [x] Redesign vendor component (`VendorCard.tsx` / `VendorRow`) to high-density row level UI with bold due balances, status dots, and quick action `Add Payment` button
- [x] Click vendor row to navigate to `VendorDetailScreen` for full operations (itemized transactions, month breakdown bar, audit timeline filters: All / Bills / Payments, contact editing, PDF export)
- [x] Implement mandatory searchable Customer Dropdown filter (`src/components/customer/CustomerDropdown.tsx`) with instant typeahead search, active selection badges, and bill counts per customer
- [x] Auto-select default customer name on mount and updates
- [x] Display real-time filter result counter banner (`Showing X bills for [Customer] in [YYYY-MM]`) with settlement status badge
- [x] All 6 test suites with 28 tests passing cleanly with 100% green

## Phase 10: PDF Typography & Formatting Fixes, Alternating Row Shading & Default Entity Scoping
- [x] Fix vendor PDF typography: replaced Unicode rupee characters with standard ASCII (`Rs. `) to eliminate `¹` corruption and letter spacing issues
- [x] Simplify PDF layout with alternating light gray (`#F5F7FA`) and crisp white (`#FFFFFF`) backgrounds for every table row across both Customer and Vendor PDFs
- [x] Add default Vendor Name filter (`src/components/vendor/VendorDropdown.tsx`) that automatically defaults to the first vendor, avoiding dumping all vendors at once
- [x] Maintain default Customer Name filter scoping customer bills to the selected entity
- [x] Streamline Customer monthly settlement: enforce single one-click whole-month payment toggle (`Mark Month as Paid` / `Mark Month Unpaid`) with zero row-level confusion
- [x] All 6 test suites with 28 tests passing cleanly with 100% green

## Phase 11: Unified Single-Row Toolbar & Polished Search Focus Styling
- [x] Eliminate ugly browser input outlines on web: applied `outlineStyle: 'none'` across all search and filter inputs with soft elevated glow container styling
- [x] Unify all filters into a single horizontal toolbar row (`styles.unifiedToolbarRow`):
  - Left: Compact tab switcher (`Vendors` / `Customers`)
  - Middle: Searchable entity dropdowns (`VendorDropdown` / `CustomerDropdown`) and contextual filters (`All/Due/Settled/Adv` pills or `Month: YYYY-MM`)
  - Right: Sleek outline-free inline search box with clear button
- [x] All 6 test suites with 28 tests passing cleanly with 100% green





## Phase 12: Month/Year Dropdown Pickers & Keyboard Keystroke Navigation Chaining
- [x] Month & Year Dropdown: Created `MonthYearPicker.tsx` with dedicated Month and Year floating dropdown menus, replacing manual `YYYY-MM` string typing
- [x] Enter Key Selection: In `CustomerDropdown.tsx` and `VendorDropdown.tsx`, hitting Enter instantly selects the top matching item, closes dropdown, and updates selection
- [x] Chained Bill Entry Keystrokes: In `BillForm.tsx`:
  - `entityName`: hitting Enter selects top autocomplete suggestion if available and advances focus to `billNumber`
  - `billNumber`: hitting Enter advances focus to `date`
  - `date`: hitting Enter advances focus to `amount`
  - `amount`: hitting Enter saves the bill
  - On bill save: form clears and automatically refocuses back to the top `entityName` field for rapid entry
- [x] User modifications preserved in `HomeScreen.tsx` (default customer view, tab order, simplified filter pills)
- [x] All 6 test suites with 28 tests passing cleanly with 100% green

## Phase 13: App Logo Branding, Smooth Flash Screen, Full Calendar Spectrum & Styled Warning Modals
- [x] App Logo Branding: Integrated `mk-exotic-loo-new.png` into `assets/logo.png`, configured in `app.json` (icon, splash, favicon, adaptive-icon) and prominently rendered in `HomeScreen.tsx` header
- [x] 3-Second Animated Flash Screen: Built `SplashScreen.tsx` featuring 60/120fps hardware GPU Compositor keyframes, smooth progress bar, and dynamic initialization messages
- [x] Comprehensive Calendar Years: Updated `MonthYearPicker.tsx` to include full calendar spectrum (2020–2035+) along with dynamic inclusion of any future/past years from bills (e.g. 2029)
- [x] Active Tab Bright Highlight: Selected tab in `HomeScreen.tsx` highlighted with bright emerald green (`colors.buttonHover`), elevated shadow, and crisp white typography/icons
- [x] Polished Dark-Mode Warning Popup: Created `WarningModal.tsx` and universal bridge in `confirm.ts`, replacing browser `window.confirm` with glowing danger badges and styled actions
- [x] Two-Step Wipeout Confirmation: Added "Wipe Out All Data" with Step 1 warning dialog followed by Step 2 written confirmation requiring typing "DELETE" to permanently purge records
- [x] Automatic Safety Backup: Wiping out data automatically executes and downloads a full JSON backup file regardless before records are erased
- [x] Descending Date Ordering: All bills across customer ledger cards, PDF exports, and storage queries strictly sorted in descending order of date (newest bills first)
- [x] All 6 test suites with 28 tests passing cleanly with 100% green

## Phase 14: Final Windows Desktop Executable (.exe) Build
- [x] Web Production Bundle: Bundled all React Native Web assets, icons, fonts, and modules via `npx expo export -p web` into `dist/`
- [x] Electron Packaging: Configured `electron-builder.json` and `electron-main.js` with offline local storage persistence, custom icon, and 64-bit Windows portable target
- [x] Executable Generation: Successfully generated `dist-electron/MK Exotic Fruits 1.0.0.exe` (173MB standalone Windows PE32 GUI executable)
- [x] Root Directory Placement: Stored executable directly in project root as `MK-Exotic-Fruits.exe`
- [x] Zero Git Push: Strictly adhered to user directive (no code pushed to remote, no external CI build)

## Phase 15: Windows Desktop Blank Window Bug Resolution & Production Packaging
- [x] Root Cause Diagnosed via Headless Electron:
  - Expo production bundling mangles `ExpoFontLoader` into an anonymous closure `function(){return a}`, causing `expo-modules-core`'s `registerWebModule` to throw `Uncaught Error: Module implementation must be a class`
  - This fatal error crashed React Native Web before `#root` rendered, causing a blank white window on desktop
  - In addition, prior `dist/index.html` regex replacement corrupted script paths into `.//_expo/...`
- [x] Auto-Patch Script Created: Added `scripts/patch-expo.js` and hooked into `package.json` (`postinstall` and `build:web`) to safely register web modules with fallback names even when minified
- [x] Electron Server Hardened: Updated `electron-main.js` with memory-safe `fs.readFile` handling, clean path normalization avoiding UNC path issues on Windows, and F12 DevTools developer shortcut
- [x] Production Verification in Xvfb: Verified the app runs through headless Electron, renders the splash screen, and successfully mounts the full HomeScreen with tabs, ledgers, and forms
- [x] Clean Build Generated:
  - Generated portable executable: `MK-Exotic-Fruits.exe` (173MB) in root directory
  - Generated extracted folder archive: `MK-Exotic-Fruits-Folder.zip` (261MB) in root directory
- [x] All 6 test suites with 28 tests passing cleanly with 100% green

## Phase 16: Free-Form Window Shrinking & Fluid Tiered Responsiveness
- [x] Unlocked Window Minimum Dimensions: Lowered Electron `BrowserWindow` minimum constraints from rigid `minWidth: 940, minHeight: 640` down to `minWidth: 380, minHeight: 500`, allowing users to shrink the desktop app freely down to compact portrait dimensions.
- [x] Tiered Adaptive Breakpoints:
  - Desktop View (`width >= 1024px`): Spacious 2-column layout with fluid flexbox columns (`flex: 0.38, minWidth: 350, maxWidth: 440` on left, `flex: 0.62, minWidth: 0` on right).
  - Tablet / Half-Screen View (`640px <= width < 1024px`): Single-column view with full-width bill entry form, full-width toolbar, and full-width ledger cards.
  - Compact / Shrunk Window View (`width < 640px`): Single-column with vertically stacked 3-card stats strip to ensure currency amounts and badges are never squished or truncated. Reduced screen margins (10px) to maximize usable workspace.
- [x] Flexible Header & Toolbars:
  - Enabled wrap on `HomeScreen` and `VendorDetailScreen` title headers and action buttons.
  - Customer Ledger Card footer actions (`PDF Statement` and `Mark Paid`) wrap gracefully on narrow widths with `gap: 10`.
- [x] Automated Headless Verification:
  - Verified with Xvfb across viewports: 1280px, 900px, 600px, 420px, and 380px. Zero horizontal overflow or content cutoff even at 380px width.
- [x] Production Desktop Executables Rebuilt:
  - Standalone portable executable: `MK-Exotic-Fruits.exe` updated in root directory.
  - Standalone unpacked folder archive: `MK-Exotic-Fruits-Folder.zip` updated in root directory.
- [x] All 6 test suites with 28 tests passing cleanly with 100% green.


