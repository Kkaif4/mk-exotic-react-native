import React, { useState, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  Pressable,
} from 'react-native';
import { useBills } from '../hooks/useBills';
import { useVendors } from '../hooks/useVendors';
import { BillForm } from '../components/forms/BillForm';
import { VendorCard } from '../components/vendor/VendorCard';
import { PaymentModal } from '../components/forms/PaymentModal';
import { CustomerLedgerCard } from '../components/customer/CustomerLedgerCard';
import {
  getUniqueEntityNames,
  calculateCustomerMonthSummary,
} from '../core/ledger';
import { formatINR, sumMoney } from '../core/math';
import { defaultStorage } from '../storage/local-storage';

export function HomeScreen({
  onNavigateToVendor,
}: {
  onNavigateToVendor: (vendorId: string, vendorName: string) => void;
}) {
  const { bills, addBill, deleteBill } = useBills();
  const { vendors, vendorSummaries, addPayment } = useVendors();

  const [activeTab, setActiveTab] = useState<'customers' | 'vendors'>('vendors');
  const [selectedMonth, setSelectedMonth] = useState(() =>
    new Date().toISOString().substring(0, 7)
  );
  const [paymentModalData, setPaymentModalData] = useState<{
    visible: boolean;
    vendorId: string;
    vendorName: string;
    currentDue: number;
  }>({
    visible: false,
    vendorId: '',
    vendorName: '',
    currentDue: 0,
  });

  const [settlements, setSettlements] = useState<any[]>([]);

  // Unique names for autocomplete
  const entityNames = useMemo(
    () => getUniqueEntityNames(bills, vendors),
    [bills, vendors]
  );

  // Overall Statistics
  const stats = useMemo(() => {
    const currentMonth = new Date().toISOString().substring(0, 7);
    const monthSales = bills.filter(
      (b) => b.type === 'sale' && b.date.startsWith(currentMonth)
    );
    const monthPurchases = bills.filter(
      (b) => b.type === 'purchase' && b.date.startsWith(currentMonth)
    );

    return {
      totalBills: bills.length,
      salesCount: bills.filter((b) => b.type === 'sale').length,
      purchasesCount: bills.filter((b) => b.type === 'purchase').length,
      monthSalesTotal: sumMoney(monthSales.map((b) => b.amount)),
      monthPurchasesTotal: sumMoney(monthPurchases.map((b) => b.amount)),
    };
  }, [bills]);

  const handleOpenPayment = useCallback(
    (vendorId: string, vendorName: string, remainingDue: number) => {
      setPaymentModalData({
        visible: true,
        vendorId,
        vendorName,
        currentDue: remainingDue,
      });
    },
    []
  );

  const handleToggleSettlement = useCallback(
    async (customerName: string, monthStr: string) => {
      await defaultStorage.toggleSettlement(customerName, monthStr);
      const updated = await defaultStorage.getSettlements();
      setSettlements(updated);
    },
    []
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container}>
        {/* App Title */}
        <View style={styles.header}>
          <Text style={styles.appEmoji}>🍍</Text>
          <View>
            <Text style={styles.appTitle}>MK EXOTIC FRUITS</Text>
            <Text style={styles.appSubtitle}>Native Offline-First Billing & Ledger</Text>
          </View>
        </View>

        {/* Dashboard 3-Card Summary Strip */}
        <View style={styles.statsStrip}>
          <View style={styles.statCard}>
            <Text style={styles.statTitle}>Total Bills</Text>
            <Text style={styles.statMainVal}>{stats.totalBills}</Text>
            <Text style={styles.statSubText}>
              S: {stats.salesCount} | P: {stats.purchasesCount}
            </Text>
          </View>

          <View style={styles.statCard}>
            <Text style={styles.statTitleGreen}>This Month Sales</Text>
            <Text style={styles.statValGreen}>{formatINR(stats.monthSalesTotal)}</Text>
            <Text style={styles.statSubText}>Customer Dues</Text>
          </View>

          <View style={styles.statCard}>
            <Text style={styles.statTitleIndigo}>Month Purchases</Text>
            <Text style={styles.statValIndigo}>{formatINR(stats.monthPurchasesTotal)}</Text>
            <Text style={styles.statSubText}>Vendor Invoices</Text>
          </View>
        </View>

        {/* Quick 3-Field Bill Entry Form */}
        <BillForm
          existingNames={entityNames}
          registeredVendors={vendors}
          onAddBill={addBill}
        />

        {/* Ledger Segmented Control */}
        <View style={styles.segmentControl}>
          <Pressable
            onPress={() => setActiveTab('vendors')}
            style={[styles.segmentBtn, activeTab === 'vendors' && styles.segmentBtnActive]}
          >
            <Text
              style={[
                styles.segmentText,
                activeTab === 'vendors' && styles.segmentTextActive,
              ]}
            >
              📦 Vendors (Lifetime Due)
            </Text>
          </Pressable>

          <Pressable
            onPress={() => setActiveTab('customers')}
            style={[styles.segmentBtn, activeTab === 'customers' && styles.segmentBtnActive]}
          >
            <Text
              style={[
                styles.segmentText,
                activeTab === 'customers' && styles.segmentTextActive,
              ]}
            >
              🛒 Customers (Monthly)
            </Text>
          </Pressable>
        </View>

        {/* Tab 1: Vendors (Lifetime Due — NO MONTH FILTER) */}
        {activeTab === 'vendors' && (
          <View>
            {vendorSummaries.length === 0 ? (
              <View style={styles.emptyCard}>
                <Text style={styles.emptyMsg}>
                  No vendors logged yet. Add a purchase bill above to automatically track vendor balances.
                </Text>
              </View>
            ) : (
              vendorSummaries.map((summary) => (
                <VendorCard
                  key={summary.vendorId || summary.vendorName}
                  summary={summary}
                  onSelectVendor={onNavigateToVendor}
                  onOpenPaymentModal={handleOpenPayment}
                />
              ))
            )}
          </View>
        )}

        {/* Tab 2: Customers (Monthly Settlement View) */}
        {activeTab === 'customers' && (
          <View>
            {entityNames.customers.length === 0 ? (
              <View style={styles.emptyCard}>
                <Text style={styles.emptyMsg}>
                  No customers logged yet. Add a customer sale bill above to see monthly dues.
                </Text>
              </View>
            ) : (
              entityNames.customers.map((custName) => {
                const summary = calculateCustomerMonthSummary(
                  custName,
                  selectedMonth,
                  bills,
                  settlements
                );
                return (
                  <CustomerLedgerCard
                    key={custName}
                    summary={summary}
                    onToggleSettlement={handleToggleSettlement}
                    onDeleteBill={deleteBill}
                  />
                );
              })
            )}
          </View>
        )}
      </ScrollView>

      {/* Record Payment Modal */}
      {paymentModalData.visible && (
        <PaymentModal
          visible={paymentModalData.visible}
          vendorName={paymentModalData.vendorName}
          currentDue={paymentModalData.currentDue}
          onClose={() =>
            setPaymentModalData((prev) => ({ ...prev, visible: false }))
          }
          onSavePayment={({ amount, date, paymentMode, referenceNote }) => {
            addPayment({
              vendorId: paymentModalData.vendorId,
              amount,
              date,
              paymentMode,
              referenceNote,
            });
          }}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#020617', // Slate 950
  },
  container: {
    padding: 16,
    paddingBottom: 40,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    gap: 12,
  },
  appEmoji: {
    fontSize: 32,
  },
  appTitle: {
    fontSize: 20,
    fontWeight: '900',
    color: '#ffffff',
    letterSpacing: -0.5,
  },
  appSubtitle: {
    fontSize: 12,
    color: '#94a3b8',
  },
  statsStrip: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#0f172a',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#1e293b',
    padding: 12,
  },
  statTitle: {
    fontSize: 10,
    color: '#94a3b8',
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  statTitleGreen: {
    fontSize: 10,
    color: '#34d399',
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  statTitleIndigo: {
    fontSize: 10,
    color: '#818cf8',
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  statMainVal: {
    fontSize: 18,
    fontWeight: '900',
    color: '#ffffff',
    marginTop: 4,
    fontFamily: 'monospace',
  },
  statValGreen: {
    fontSize: 14,
    fontWeight: '900',
    color: '#34d399',
    marginTop: 4,
    fontFamily: 'monospace',
  },
  statValIndigo: {
    fontSize: 14,
    fontWeight: '900',
    color: '#818cf8',
    marginTop: 4,
    fontFamily: 'monospace',
  },
  statSubText: {
    fontSize: 10,
    color: '#64748b',
    marginTop: 2,
  },
  segmentControl: {
    flexDirection: 'row',
    backgroundColor: '#0f172a',
    borderRadius: 12,
    padding: 4,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#1e293b',
  },
  segmentBtn: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 8,
  },
  segmentBtnActive: {
    backgroundColor: '#1e293b',
  },
  segmentText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#94a3b8',
  },
  segmentTextActive: {
    color: '#ffffff',
    fontWeight: '700',
  },
  emptyCard: {
    backgroundColor: '#0f172a',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#1e293b',
    padding: 24,
    alignItems: 'center',
  },
  emptyMsg: {
    color: '#64748b',
    fontSize: 13,
    textAlign: 'center',
    fontStyle: 'italic',
  },
});
