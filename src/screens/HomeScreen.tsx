import React, { useState, useMemo, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  Pressable,
  useWindowDimensions,
  TextInput,
  Platform,
  Alert,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useBills } from '../hooks/useBills';
import { useVendors } from '../hooks/useVendors';
import { BillForm } from '../components/forms/BillForm';
import { VendorCard } from '../components/vendor/VendorCard';
import { PaymentModal } from '../components/forms/PaymentModal';
import { CustomerLedgerCard } from '../components/customer/CustomerLedgerCard';
import {
  getUniqueEntityNames,
  calculateCustomerMonthSummary,
  generateVendorAuditTimeline,
} from '../core/ledger';
import { formatINR, sumMoney } from '../core/math';
import { defaultStorage } from '../storage/local-storage';
import { Card } from '../components/common/Card';
import { Button } from '../components/common/Button';
import {
  exportFullJSONBackup,
  importJSONBackup,
  exportCSVReports,
} from '../core/backup';
import { generateVendorLifetimeAuditPDF } from '../core/pdf';

export function HomeScreen({
  onNavigateToVendor,
}: {
  onNavigateToVendor: (vendorId: string, vendorName: string) => void;
}) {
  const { width } = useWindowDimensions();
  const isDesktop = width >= 860;

  const { bills, addBill, deleteBill, refreshBills } = useBills();
  const {
    vendors,
    payments,
    vendorSummaries,
    addPayment,
    refreshVendors,
  } = useVendors();

  const [activeTab, setActiveTab] = useState<'vendors' | 'customers'>('vendors');
  const [selectedMonth, setSelectedMonth] = useState(() =>
    new Date().toISOString().substring(0, 7)
  );
  const [searchQuery, setSearchQuery] = useState('');
  const [backupStatus, setBackupStatus] = useState<string | null>(null);

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

  const handleDownloadVendorPDF = useCallback(
    async (vendorId: string, vendorName: string) => {
      const summary = vendorSummaries.find(
        (s) => s.vendorId === vendorId || s.vendorName.toLowerCase() === vendorName.toLowerCase()
      );
      if (!summary) return;
      const targetVendor = vendors.find(
        (v) => v.id === vendorId || v.name.toLowerCase() === vendorName.toLowerCase()
      );
      const timeline = generateVendorAuditTimeline(vendorId, vendorName, bills, payments);

      await generateVendorLifetimeAuditPDF(
        summary.vendorName,
        targetVendor?.contactNumber,
        summary.totalPurchases,
        summary.totalPaid,
        summary.remainingDue,
        timeline
      );
    },
    [vendorSummaries, vendors, bills, payments]
  );

  // Backup & Restore Actions
  const handleExportJSON = async () => {
    try {
      setBackupStatus('Exporting full database JSON...');
      await exportFullJSONBackup();
      setBackupStatus('Backup exported successfully.');
      setTimeout(() => setBackupStatus(null), 4000);
    } catch (err: any) {
      setBackupStatus(`Export failed: ${err.message}`);
    }
  };

  const handleExportCSV = async () => {
    try {
      setBackupStatus('Generating CSV reports...');
      await exportCSVReports();
      setBackupStatus('CSV reports exported successfully.');
      setTimeout(() => setBackupStatus(null), 4000);
    } catch (err: any) {
      setBackupStatus(`CSV export failed: ${err.message}`);
    }
  };

  const handleImportFile = (file: File) => {
    const reader = new FileReader();
    reader.onload = async (e) => {
      const text = e.target?.result as string;
      if (!text) return;
      try {
        const res = await importJSONBackup(text);
        if (res.success) {
          setBackupStatus('Database restored & merged successfully!');
          await Promise.all([refreshBills(), refreshVendors()]);
        } else {
          setBackupStatus(`Import failed: ${res.error}`);
        }
      } catch (err: any) {
        setBackupStatus(`Import error: ${err.message}`);
      }
      setTimeout(() => setBackupStatus(null), 5000);
    };
    reader.readAsText(file);
  };

  const triggerFileInput = () => {
    if (typeof document !== 'undefined') {
      const existing = document.getElementById('backup-file-input');
      if (existing) existing.remove();
      const input = document.createElement('input');
      input.id = 'backup-file-input';
      input.type = 'file';
      input.accept = '.json,application/json';
      input.style.display = 'none';
      input.onchange = (e: any) => {
        const file = e.target?.files?.[0];
        if (file) handleImportFile(file);
      };
      document.body.appendChild(input);
      input.click();
    } else {
      Alert.alert('Backup Import', 'File upload is supported in browser/desktop environment.');
    }
  };

  // Filtered lists based on search
  const filteredVendors = useMemo(() => {
    if (!searchQuery.trim()) return vendorSummaries;
    const q = searchQuery.toLowerCase();
    return vendorSummaries.filter((v) => v.vendorName.toLowerCase().includes(q));
  }, [vendorSummaries, searchQuery]);

  const filteredCustomers = useMemo(() => {
    if (!searchQuery.trim()) return entityNames.customers;
    const q = searchQuery.toLowerCase();
    return entityNames.customers.filter((c) => c.toLowerCase().includes(q));
  }, [entityNames.customers, searchQuery]);

  // Left column elements (Bill Form + Backup & Data Management)
  const leftColumn = (
    <View style={styles.leftColContainer}>
      {/* Bill Entry Form */}
      <BillForm
        existingNames={entityNames}
        registeredVendors={vendors}
        onAddBill={addBill}
      />

      {/* Backup & System Data Tools Card */}
      <Card style={styles.backupCard}>
        <View style={styles.backupCardHeader}>
          <View style={styles.brandRow}>
            <Feather name="database" size={16} color="#818cf8" />
            <Text style={styles.backupCardTitle}>Data & Backup Manager</Text>
          </View>
          <Text style={styles.backupCardSub}>100% Offline Local Storage</Text>
        </View>

        {backupStatus ? (
          <View style={styles.statusBanner}>
            <Feather name="info" size={14} color="#34d399" />
            <Text style={styles.statusBannerText}>{backupStatus}</Text>
          </View>
        ) : null}

        <View style={styles.backupButtonsGrid}>
          <Button
            title="Export Backup (JSON)"
            variant="secondary"
            icon={<Feather name="download" size={13} color="#e2e8f0" />}
            onPress={handleExportJSON}
            style={styles.backupBtn}
          />
          <Button
            title="Import Backup (JSON)"
            variant="secondary"
            icon={<Feather name="upload" size={13} color="#e2e8f0" />}
            onPress={triggerFileInput}
            style={styles.backupBtn}
          />
          <Button
            title="Export Reports (CSV)"
            variant="secondary"
            icon={<Feather name="file-text" size={13} color="#e2e8f0" />}
            onPress={handleExportCSV}
            style={styles.backupBtn}
          />
        </View>
      </Card>
    </View>
  );

  // Right column elements (Metrics strip, search & tabs, ledgers)
  const rightColumn = (
    <View style={styles.rightColContainer}>
      {/* Top 3-Card Summary Strip */}
      <View style={styles.statsStrip}>
        <View style={styles.statCard}>
          <View style={styles.statIconRow}>
            <Text style={styles.statTitle}>Total Invoices</Text>
            <Feather name="file" size={13} color="#94a3b8" />
          </View>
          <Text style={styles.statMainVal}>{stats.totalBills}</Text>
          <Text style={styles.statSubText}>
            Sales: {stats.salesCount} · Purchases: {stats.purchasesCount}
          </Text>
        </View>

        <View style={styles.statCard}>
          <View style={styles.statIconRow}>
            <Text style={styles.statTitleGreen}>Month Sales</Text>
            <Feather name="trending-up" size={13} color="#34d399" />
          </View>
          <Text style={styles.statValGreen}>{formatINR(stats.monthSalesTotal)}</Text>
          <Text style={styles.statSubText}>Customer Outstandings</Text>
        </View>

        <View style={styles.statCard}>
          <View style={styles.statIconRow}>
            <Text style={styles.statTitleIndigo}>Month Purchases</Text>
            <Feather name="shopping-bag" size={13} color="#818cf8" />
          </View>
          <Text style={styles.statValIndigo}>{formatINR(stats.monthPurchasesTotal)}</Text>
          <Text style={styles.statSubText}>Vendor Procurements</Text>
        </View>
      </View>

      {/* Tabs & Search Header Strip */}
      <View style={styles.listControlBar}>
        <View style={styles.segmentControl}>
          <Pressable
            onPress={() => setActiveTab('vendors')}
            style={[styles.segmentBtn, activeTab === 'vendors' && styles.segmentBtnActive]}
          >
            <Feather
              name="truck"
              size={13}
              color={activeTab === 'vendors' ? '#ffffff' : '#94a3b8'}
            />
            <Text
              style={[
                styles.segmentText,
                activeTab === 'vendors' && styles.segmentTextActive,
              ]}
            >
              Vendors (Lifetime Due)
            </Text>
          </Pressable>

          <Pressable
            onPress={() => setActiveTab('customers')}
            style={[styles.segmentBtn, activeTab === 'customers' && styles.segmentBtnActive]}
          >
            <Feather
              name="users"
              size={13}
              color={activeTab === 'customers' ? '#ffffff' : '#94a3b8'}
            />
            <Text
              style={[
                styles.segmentText,
                activeTab === 'customers' && styles.segmentTextActive,
              ]}
            >
              Customers (Monthly)
            </Text>
          </Pressable>
        </View>

        {/* Search Bar */}
        <View style={styles.searchBox}>
          <Feather name="search" size={14} color="#94a3b8" />
          <TextInput
            placeholder={`Search ${activeTab}...`}
            placeholderTextColor="#64748b"
            value={searchQuery}
            onChangeText={setSearchQuery}
            style={styles.searchInput}
          />
          {searchQuery ? (
            <Pressable onPress={() => setSearchQuery('')} hitSlop={8}>
              <Feather name="x" size={14} color="#94a3b8" />
            </Pressable>
          ) : null}
        </View>
      </View>

      {/* Tab 1: Vendors (Lifetime Due — NO MONTH FILTER) */}
      {activeTab === 'vendors' && (
        <View style={styles.listContainer}>
          {filteredVendors.length === 0 ? (
            <View style={styles.emptyCard}>
              <Feather name="inbox" size={32} color="#475569" />
              <Text style={styles.emptyMsg}>
                {searchQuery
                  ? `No vendors found matching "${searchQuery}".`
                  : 'No vendors logged yet. Add a purchase bill to track lifetime due.'}
              </Text>
            </View>
          ) : (
            filteredVendors.map((summary) => {
              const vendorData = vendors.find(
                (v) =>
                  v.id === summary.vendorId ||
                  v.name.toLowerCase() === summary.vendorName.toLowerCase()
              );
              return (
                <VendorCard
                  key={summary.vendorId || summary.vendorName}
                  summary={summary}
                  contactNumber={vendorData?.contactNumber}
                  notes={vendorData?.notes}
                  onSelectVendor={onNavigateToVendor}
                  onOpenPaymentModal={handleOpenPayment}
                  onDownloadPDF={handleDownloadVendorPDF}
                />
              );
            })
          )}
        </View>
      )}

      {/* Tab 2: Customers (Monthly Settlement View) */}
      {activeTab === 'customers' && (
        <View style={styles.listContainer}>
          {/* Month Selector Strip */}
          <View style={styles.monthSelectorBar}>
            <Text style={styles.monthSelectLabel}>Month Filter:</Text>
            <TextInput
              style={styles.monthInput}
              value={selectedMonth}
              onChangeText={setSelectedMonth}
              placeholder="YYYY-MM"
              placeholderTextColor="#64748b"
            />
            <Text style={styles.monthNotice}>
              Showing all customer sales for {selectedMonth}
            </Text>
          </View>

          {filteredCustomers.length === 0 ? (
            <View style={styles.emptyCard}>
              <Feather name="inbox" size={32} color="#475569" />
              <Text style={styles.emptyMsg}>
                {searchQuery
                  ? `No customers found matching "${searchQuery}".`
                  : 'No customer sales recorded yet.'}
              </Text>
            </View>
          ) : (
            filteredCustomers.map((custName) => {
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
    </View>
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container}>
        {/* Modern Sleek App Header */}
        <View style={styles.header}>
          <View style={styles.brandRow}>
            <View style={styles.logoBadge}>
              <Feather name="package" size={20} color="#38bdf8" />
            </View>
            <View>
              <Text style={styles.appTitle}>MK EXOTIC FRUITS</Text>
              <Text style={styles.appSubtitle}>
                Enterprise Accounting · Offline-First Ledger & Settlement
              </Text>
            </View>
          </View>

          <View style={styles.headerMeta}>
            <View style={styles.onlineBadge}>
              <View style={styles.onlineDot} />
              <Text style={styles.onlineText}>Local Storage Active</Text>
            </View>
          </View>
        </View>

        {/* Responsive Content: 2-Column Desktop Grid or 1-Column Mobile */}
        {isDesktop ? (
          <View style={styles.desktopGrid}>
            <View style={styles.desktopLeft}>{leftColumn}</View>
            <View style={styles.desktopRight}>{rightColumn}</View>
          </View>
        ) : (
          <View style={styles.mobileColumn}>
            {leftColumn}
            {rightColumn}
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
    maxWidth: 1400,
    width: '100%',
    alignSelf: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 18,
    borderBottomWidth: 1,
    borderBottomColor: '#1e293b',
    paddingBottom: 14,
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  logoBadge: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: 'rgba(56, 189, 248, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.3)',
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
    marginTop: 2,
  },
  headerMeta: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  onlineBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#0f172a',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#1e293b',
  },
  onlineDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: '#10b981',
  },
  onlineText: {
    fontSize: 11,
    color: '#cbd5e1',
    fontWeight: '500',
  },
  desktopGrid: {
    flexDirection: 'row',
    gap: 18,
    alignItems: 'flex-start',
  },
  desktopLeft: {
    width: 440,
  },
  desktopRight: {
    flex: 1,
  },
  mobileColumn: {
    flexDirection: 'column',
    gap: 16,
  },
  leftColContainer: {
    gap: 14,
  },
  rightColContainer: {
    gap: 14,
  },
  statsStrip: {
    flexDirection: 'row',
    gap: 10,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#0b1329',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#1e293b',
    padding: 12,
  },
  statIconRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
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
    fontSize: 20,
    fontWeight: '900',
    color: '#ffffff',
    marginTop: 4,
    fontFamily: 'monospace',
  },
  statValGreen: {
    fontSize: 15,
    fontWeight: '900',
    color: '#34d399',
    marginTop: 4,
    fontFamily: 'monospace',
  },
  statValIndigo: {
    fontSize: 15,
    fontWeight: '900',
    color: '#818cf8',
    marginTop: 4,
    fontFamily: 'monospace',
  },
  statSubText: {
    fontSize: 10,
    color: '#64748b',
    marginTop: 3,
  },
  listControlBar: {
    flexDirection: 'row',
    gap: 10,
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  segmentControl: {
    flexDirection: 'row',
    backgroundColor: '#0f172a',
    borderRadius: 10,
    padding: 3,
    borderWidth: 1,
    borderColor: '#1e293b',
    flex: 1,
  },
  segmentBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 9,
    borderRadius: 7,
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
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0b1329',
    borderWidth: 1,
    borderColor: '#1e293b',
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 7,
    gap: 8,
    minWidth: 200,
  },
  searchInput: {
    color: '#ffffff',
    fontSize: 12,
    padding: 0,
    flex: 1,
  },
  monthSelectorBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#0b1329',
    padding: 8,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#1e293b',
    marginBottom: 10,
  },
  monthSelectLabel: {
    fontSize: 11,
    color: '#94a3b8',
    fontWeight: '600',
  },
  monthInput: {
    backgroundColor: '#020617',
    borderWidth: 1,
    borderColor: '#334155',
    borderRadius: 6,
    color: '#ffffff',
    paddingHorizontal: 8,
    paddingVertical: 4,
    fontSize: 12,
    width: 90,
    fontFamily: 'monospace',
    textAlign: 'center',
  },
  monthNotice: {
    fontSize: 11,
    color: '#64748b',
    fontStyle: 'italic',
    flex: 1,
  },
  listContainer: {
    marginTop: 4,
  },
  emptyCard: {
    backgroundColor: '#0b1329',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#1e293b',
    padding: 32,
    alignItems: 'center',
    gap: 10,
  },
  emptyMsg: {
    color: '#64748b',
    fontSize: 13,
    textAlign: 'center',
  },
  backupCard: {
    backgroundColor: '#0b1329',
    borderColor: '#1e293b',
    borderRadius: 14,
    padding: 14,
  },
  backupCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#1e293b',
    paddingBottom: 8,
  },
  backupCardTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#ffffff',
  },
  backupCardSub: {
    fontSize: 10,
    color: '#64748b',
  },
  statusBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(52, 211, 153, 0.1)',
    borderColor: 'rgba(52, 211, 153, 0.3)',
    borderWidth: 1,
    borderRadius: 8,
    padding: 8,
    marginBottom: 10,
  },
  statusBannerText: {
    fontSize: 11,
    color: '#34d399',
    fontWeight: '500',
  },
  backupButtonsGrid: {
    gap: 8,
  },
  backupBtn: {
    paddingVertical: 8,
  },
});
