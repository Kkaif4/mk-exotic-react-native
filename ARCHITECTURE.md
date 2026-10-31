# ARCHITECTURE.md — System Architecture & Data Flow

```
┌────────────────────────────────────────────────────────┐
│                   React Native UI                      │
│   (Screens, Navigation, FlashList, Native Modals)      │
└───────────────────────────▲────────────────────────────┘
                            │ (Hooks & Reactive State)
┌───────────────────────────┴────────────────────────────┐
│                    Application Hooks                   │
│   (useBills, useVendors, useVendorLedger, useSync)     │
└───────────────────────────▲────────────────────────────┘
                            │
┌───────────────────────────┴────────────────────────────┐
│              Pure Core Calculation Engine              │
│  • Fixed-Point Currency Arithmetic (src/core/math.ts)  │
│  • Domain Models & Validation (src/core/types.ts)      │
│  • Ledger & Balance Aggregators (src/core/ledger.ts)   │
│  • LWW Conflict-Free Sync Engine (src/core/sync.ts)    │
└───────────────────────────▲────────────────────────────┘
                            │
┌───────────────────────────┴────────────────────────────┐
│                  Storage Abstraction                   │
│  • Local Storage Adapter (AsyncStorage / SQLite)       │
│  • Snapshot & JSON Import/Export                       │
│  • Wi-Fi Delta Sync Protocol                           │
└────────────────────────────────────────────────────────┘
```

## Key Architectural Principles

1. **Unidirectional Data Flow:** Storage -> Core Aggregators -> Reactive Hooks -> Presentation Components.
2. **Platform Independence of Core:** Core calculation code can run identically in Node.js, Jest, React Native iOS/Android, and Desktop.
3. **Immutability:** All calculation engine functions are pure; inputs are never mutated.
4. **Deterministic Audits:** Sorting transactions (bills & payments) chronologically creates a verifiable running balance table at each step:
   $$\text{RunningBalance}_i = \text{RunningBalance}_{i-1} + \text{Debit}_i - \text{Credit}_i$$
