import React, { useState, useMemo, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  Pressable,
  useWindowDimensions,
  TextInput,
  Alert,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import { useBills } from "../hooks/useBills";
import { useVendors } from "../hooks/useVendors";
import { BillForm } from "../components/forms/BillForm";
import { VendorCard } from "../components/vendor/VendorCard";
import { PaymentModal } from "../components/forms/PaymentModal";
import { CustomerLedgerCard } from "../components/customer/CustomerLedgerCard";
import {
  getUniqueEntityNames,
  calculateCustomerMonthSummary,
  generateVendorAuditTimeline,
} from "../core/ledger";
import { formatINR, sumMoney } from "../core/math";
import { defaultStorage } from "../storage/local-storage";
import { Card } from "../components/common/Card";
import { Button } from "../components/common/Button";
import {
  exportFullJSONBackup,
  importJSONBackup,
  exportCSVReports,
} from "../core/backup";
import { generateVendorLifetimeAuditPDF } from "../core/pdf";
import { colors } from "../core/theme";

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
    deletePayment,
    refreshVendors,
  } = useVendors(bills);

  const [activeTab, setActiveTab] = useState<'vendors' | 'customers'>('vendors');
  const [vendorStatusFilter, setVendorStatusFilter] = useState<'ALL' | 'DUE' | 'SETTLED' | 'ADVANCE'>('ALL');
  const [selectedMonth, setSelectedMonth] = useState(() =>
    new Date().toISOString().substring(0, 7),
  );
  const [searchQuery, setSearchQuery] = useState("");
  const [searchFocused, setSearchFocused] = useState(false);
  const [backupStatus, setBackupStatus] = useState<string | null>(null);

  const [paymentModalData, setPaymentModalData] = useState<{
    visible: boolean;
    vendorId: string;
    vendorName: string;
    currentDue: number;
  }>({
    visible: false,
    vendorId: "",
    vendorName: "",
    currentDue: 0,
  });

  const [settlements, setSettlements] = useState<any[]>([]);

  // Unique names for autocomplete
  const entityNames = useMemo(
    () => getUniqueEntityNames(bills, vendors),
    [bills, vendors],
  );

  // Overall Statistics
  const stats = useMemo(() => {
    const currentMonth = new Date().toISOString().substring(0, 7);
    const monthSales = bills.filter(
      (b) => b.type === "sale" && b.date.startsWith(currentMonth),
    );
    const monthPurchases = bills.filter(
      (b) => b.type === "purchase" && b.date.startsWith(currentMonth),
    );

    return {
      totalBills: bills.length,
      salesCount: bills.filter((b) => b.type === "sale").length,
      purchasesCount: bills.filter((b) => b.type === "purchase").length,
      monthSalesTotal: sumMoney(monthSales.map((b) => b.amount)),
      monthPurchasesTotal: sumMoney(monthPurchases.map((b) => b.amount)),
    };
  }, [bills]);

  const handleAddBill = useCallback(
    async (billData: any) => {
      await addBill(billData);
      await refreshVendors();
    },
    [addBill, refreshVendors],
  );

  const handleDeleteBill = useCallback(
    async (id: string) => {
      await deleteBill(id);
      await refreshVendors();
    },
    [deleteBill, refreshVendors],
  );

  const handleDeletePayment = useCallback(
    async (id: string) => {
      await deletePayment(id);
      await refreshVendors();
    },
    [deletePayment, refreshVendors],
  );

  const handleOpenPayment = useCallback(
    (vendorId: string, vendorName: string, remainingDue: number) => {
      setPaymentModalData({
        visible: true,
        vendorId,
        vendorName,
        currentDue: remainingDue,
      });
    },
    [],
  );

  const handleToggleSettlement = useCallback(
    async (customerName: string, monthStr: string) => {
      await defaultStorage.toggleSettlement(customerName, monthStr);
      const updated = await defaultStorage.getSettlements();
      setSettlements(updated);
    },
    [],
  );

  const handleDownloadVendorPDF = useCallback(
    async (vendorId: string, vendorName: string) => {
      const summary = vendorSummaries.find(
        (s) =>
          s.vendorId === vendorId ||
          s.vendorName.toLowerCase() === vendorName.toLowerCase(),
      );
      if (!summary) return;
      const targetVendor = vendors.find(
        (v) =>
          v.id === vendorId ||
          v.name.toLowerCase() === vendorName.toLowerCase(),
      );
      const timeline = generateVendorAuditTimeline(
        vendorId,
        vendorName,
        bills,
        payments,
      );

      await generateVendorLifetimeAuditPDF(
        summary.vendorName,
        targetVendor?.contactNumber,
        summary.totalPurchases,
        summary.totalPaid,
        summary.remainingDue,
        timeline,
      );
    },
    [vendorSummaries, vendors, bills, payments],
  );

  // Backup & Restore Actions
  const handleExportJSON = async () => {
    try {
      setBackupStatus("Exporting full database JSON...");
      await exportFullJSONBackup();
      setBackupStatus("Backup exported successfully.");
      setTimeout(() => setBackupStatus(null), 4000);
    } catch (err: any) {
      setBackupStatus(`Export failed: ${err.message}`);
    }
  };

  const handleExportCSV = async () => {
    try {
      setBackupStatus("Generating CSV reports...");
      await exportCSVReports();
      setBackupStatus("CSV reports exported successfully.");
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
          setBackupStatus("Database restored & merged successfully!");
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
    if (typeof document !== "undefined") {
      const existing = document.getElementById("backup-file-input");
      if (existing) existing.remove();
      const input = document.createElement("input");
      input.id = "backup-file-input";
      input.type = "file";
      input.accept = ".json,application/json";
      input.style.display = "none";
      input.onchange = (e: any) => {
        const file = e.target?.files?.[0];
        if (file) handleImportFile(file);
      };
      document.body.appendChild(input);
      input.click();
    } else {
      Alert.alert(
        "Backup Import",
        "File upload is supported in browser/desktop environment.",
      );
    }
  };

  // Vendor status breakdown counts
  const vendorCounts = useMemo(() => {
    return {
      all: vendorSummaries.length,
      due: vendorSummaries.filter((v) => v.status === 'DUE').length,
      settled: vendorSummaries.filter((v) => v.status === 'SETTLED').length,
      advance: vendorSummaries.filter((v) => v.status === 'ADVANCE').length,
    };
  }, [vendorSummaries]);

  // Filtered lists based on search & status filter
  const filteredVendors = useMemo(() => {
    let list = vendorSummaries;
    if (vendorStatusFilter !== 'ALL') {
      list = list.filter((v) => v.status === vendorStatusFilter);
    }
    if (!searchQuery.trim()) return list;
    const q = searchQuery.toLowerCase().trim();
    return list.filter((v) => {
      if (v.vendorName.toLowerCase().includes(q)) return true;
      const targetVendor = vendors.find(
        (vnd) =>
          vnd.id === v.vendorId ||
          vnd.name.toLowerCase() === v.vendorName.toLowerCase(),
      );
      if (targetVendor?.contactNumber?.includes(q)) return true;
      if (targetVendor?.notes?.toLowerCase().includes(q)) return true;
      if (v.bills?.some((b) => b.billNumber?.toLowerCase().includes(q)))
        return true;
      return false;
    });
  }, [vendorSummaries, vendors, vendorStatusFilter, searchQuery]);

  const filteredCustomers = useMemo(() => {
    if (!searchQuery.trim()) return entityNames.customers;
    const q = searchQuery.toLowerCase().trim();
    return entityNames.customers.filter((c) => {
      if (c.toLowerCase().includes(q)) return true;
      return bills.some(
        (b) =>
          b.type === "sale" &&
          b.entityName.toLowerCase() === c.toLowerCase() &&
          b.billNumber?.toLowerCase().includes(q),
      );
    });
  }, [entityNames.customers, bills, searchQuery]);

  // Left column elements (Bill Form + Backup & Data Management)
  const leftColumn = (
    <View style={styles.leftColContainer}>
      {/* Bill Entry Form */}
      <BillForm
        existingNames={entityNames}
        registeredVendors={vendors}
        onAddBill={handleAddBill}
      />

      {/* Backup & System Data Tools Card */}
      <Card style={styles.backupCard}>
        <View style={styles.backupCardHeader}>
          <View style={styles.brandRow}>
            <Feather name="database" size={16} color={colors.information} />
            <Text style={styles.backupCardTitle}>Data & Backup Manager</Text>
          </View>
          <Text style={styles.backupCardSub}>100% Offline Local Storage</Text>
        </View>

        {backupStatus ? (
          <View style={styles.statusBanner}>
            <Feather name="info" size={14} color={colors.brandHighlight} />
            <Text style={styles.statusBannerText}>{backupStatus}</Text>
          </View>
        ) : null}

        <View style={styles.backupButtonsGrid}>
          <Button
            title="Export Backup (JSON)"
            variant="secondary"
            icon={
              <Feather name="download" size={13} color={colors.textPrimary} />
            }
            onPress={handleExportJSON}
            style={styles.backupBtn}
          />
          <Button
            title="Import Backup (JSON)"
            variant="secondary"
            icon={
              <Feather name="upload" size={13} color={colors.textPrimary} />
            }
            onPress={triggerFileInput}
            style={styles.backupBtn}
          />
          <Button
            title="Export Reports (CSV)"
            variant="secondary"
            icon={
              <Feather name="file-text" size={13} color={colors.textPrimary} />
            }
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
            <Feather name="file" size={13} color={colors.textSecondary} />
          </View>
          <Text style={styles.statMainVal}>{stats.totalBills}</Text>
          <Text style={styles.statSubText}>
            Sales: {stats.salesCount} · Purchases: {stats.purchasesCount}
          </Text>
        </View>

        <View style={styles.statCard}>
          <View style={styles.statIconRow}>
            <Text style={styles.statTitleGreen}>Month Sales</Text>
            <Feather
              name="trending-up"
              size={13}
              color={colors.brandHighlight}
            />
          </View>
          <Text style={styles.statValGreen}>
            {formatINR(stats.monthSalesTotal)}
          </Text>
          <Text style={styles.statSubText}>Customer Outstandings</Text>
        </View>

        <View style={styles.statCard}>
          <View style={styles.statIconRow}>
            <Text style={styles.statTitleIndigo}>Month Purchases</Text>
            <Feather name="shopping-bag" size={13} color={colors.information} />
          </View>
          <Text style={styles.statValIndigo}>
            {formatINR(stats.monthPurchasesTotal)}
          </Text>
          <Text style={styles.statSubText}>Vendor Procurements</Text>
        </View>
      </View>

      {/* Tabs Selector Bar */}
      <View style={styles.segmentControl}>
        <Pressable
          onPress={() => setActiveTab("customers")}
          style={[
            styles.segmentBtn,
            activeTab === "customers" && styles.segmentBtnActive,
          ]}
        >
          <Feather
            name="users"
            size={13}
            color={
              activeTab === "customers"
                ? colors.textPrimary
                : colors.textSecondary
            }
          />
          <Text
            style={[
              styles.segmentText,
              activeTab === "customers" && styles.segmentTextActive,
            ]}
          >
            Customers (Monthly) ({entityNames.customers.length})
          </Text>
        </Pressable>
        <Pressable
          onPress={() => setActiveTab("vendors")}
          style={[
            styles.segmentBtn,
            activeTab === "vendors" && styles.segmentBtnActive,
          ]}
        >
          <Feather
            name="truck"
            size={13}
            color={
              activeTab === "vendors"
                ? colors.textPrimary
                : colors.textSecondary
            }
          />
          <Text
            style={[
              styles.segmentText,
              activeTab === "vendors" && styles.segmentTextActive,
            ]}
          >
            Vendors (Lifetime Due) ({vendorSummaries.length})
          </Text>
        </Pressable>
      </View>

      {/* Modern, Redesigned Search Box */}
      <View
        style={[
          styles.searchContainer,
          searchFocused && styles.searchContainerFocused,
        ]}
      >
        <Feather
          name="search"
          size={16}
          color={searchFocused ? colors.information : colors.textSecondary}
          style={styles.searchIcon}
        />
        <TextInput
          placeholder={`Search ${activeTab === "vendors" ? "vendors by name, bill #, phone" : "customers by name, bill #"}...`}
          placeholderTextColor={colors.textMuted}
          value={searchQuery}
          onChangeText={setSearchQuery}
          onFocus={() => setSearchFocused(true)}
          onBlur={() => setSearchFocused(false)}
          style={styles.searchInput}
        />
        {searchQuery ? (
          <Pressable
            onPress={() => setSearchQuery("")}
            hitSlop={10}
            style={styles.clearSearchBtn}
          >
            <Feather name="x" size={14} color={colors.textSecondary} />
          </Pressable>
        ) : null}
      </View>

      {/* Tab 1: Vendors (Lifetime Due — NO MONTH FILTER) */}
      {activeTab === 'vendors' && (
        <View style={styles.listContainer}>
          {/* Status Filter Chips */}
          <View style={styles.statusFilterRow}>
            <Pressable
              onPress={() => setVendorStatusFilter('ALL')}
              style={[
                styles.filterChip,
                vendorStatusFilter === 'ALL' && styles.filterChipActive,
              ]}
            >
              <Text
                style={[
                  styles.filterChipText,
                  vendorStatusFilter === 'ALL' && styles.filterChipTextActive,
                ]}
              >
                All ({vendorCounts.all})
              </Text>
            </Pressable>

            <Pressable
              onPress={() => setVendorStatusFilter('DUE')}
              style={[
                styles.filterChip,
                vendorStatusFilter === 'DUE' && styles.filterChipDueActive,
              ]}
            >
              <View style={[styles.filterDot, { backgroundColor: colors.danger }]} />
              <Text
                style={[
                  styles.filterChipText,
                  vendorStatusFilter === 'DUE' && styles.filterChipTextActive,
                ]}
              >
                Due Pending ({vendorCounts.due})
              </Text>
            </Pressable>

            <Pressable
              onPress={() => setVendorStatusFilter('SETTLED')}
              style={[
                styles.filterChip,
                vendorStatusFilter === 'SETTLED' && styles.filterChipSettledActive,
              ]}
            >
              <View style={[styles.filterDot, { backgroundColor: colors.brandHighlight }]} />
              <Text
                style={[
                  styles.filterChipText,
                  vendorStatusFilter === 'SETTLED' && styles.filterChipTextActive,
                ]}
              >
                Settled ({vendorCounts.settled})
              </Text>
            </Pressable>

            <Pressable
              onPress={() => setVendorStatusFilter('ADVANCE')}
              style={[
                styles.filterChip,
                vendorStatusFilter === 'ADVANCE' && styles.filterChipAdvanceActive,
              ]}
            >
              <View style={[styles.filterDot, { backgroundColor: colors.information }]} />
              <Text
                style={[
                  styles.filterChipText,
                  vendorStatusFilter === 'ADVANCE' && styles.filterChipTextActive,
                ]}
              >
                Advance ({vendorCounts.advance})
              </Text>
            </Pressable>
          </View>
          {filteredVendors.length === 0 ? (
            <View style={styles.emptyCard}>
              <Feather name="inbox" size={32} color={colors.textMuted} />
              <Text style={styles.emptyMsg}>
                {searchQuery
                  ? `No vendors found matching "${searchQuery}".`
                  : "No vendors logged yet. Add a purchase bill to track lifetime due."}
              </Text>
            </View>
          ) : (
            filteredVendors.map((summary) => {
              const vendorData = vendors.find(
                (v) =>
                  v.id === summary.vendorId ||
                  v.name.toLowerCase() === summary.vendorName.toLowerCase(),
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
                  onDeleteBill={handleDeleteBill}
                  onDeletePayment={handleDeletePayment}
                />
              );
            })
          )}
        </View>
      )}

      {/* Tab 2: Customers (Monthly Settlement View) */}
      {activeTab === "customers" && (
        <View style={styles.listContainer}>
          {/* Month Selector Strip */}
          <View style={styles.monthSelectorBar}>
            <Text style={styles.monthSelectLabel}>Month Filter:</Text>
            <TextInput
              style={styles.monthInput}
              value={selectedMonth}
              onChangeText={setSelectedMonth}
              placeholder="YYYY-MM"
              placeholderTextColor={colors.textMuted}
            />
            <Text style={styles.monthNotice}>
              Showing all customer sales for {selectedMonth}
            </Text>
          </View>

          {filteredCustomers.length === 0 ? (
            <View style={styles.emptyCard}>
              <Feather name="inbox" size={32} color={colors.textMuted} />
              <Text style={styles.emptyMsg}>
                {searchQuery
                  ? `No customers found matching "${searchQuery}".`
                  : "No customer sales recorded yet."}
              </Text>
            </View>
          ) : (
            filteredCustomers.map((custName) => {
              const summary = calculateCustomerMonthSummary(
                custName,
                selectedMonth,
                bills,
                settlements,
              );
              return (
                <CustomerLedgerCard
                  key={custName}
                  summary={summary}
                  onToggleSettlement={handleToggleSettlement}
                  onDeleteBill={handleDeleteBill}
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
              <Feather name="package" size={20} color={colors.information} />
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
          onSavePayment={async ({
            amount,
            date,
            paymentMode,
            referenceNote,
          }) => {
            await addPayment({
              vendorId: paymentModalData.vendorId,
              amount,
              date,
              paymentMode,
              referenceNote,
            });
            await refreshVendors();
          }}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.appBackground,
  },
  container: {
    padding: 16,
    paddingBottom: 40,
    maxWidth: 1400,
    width: "100%",
    alignSelf: "center",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 18,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    paddingBottom: 14,
  },
  brandRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  logoBadge: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: "rgba(57, 124, 194, 0.15)",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: colors.border,
  },
  appTitle: {
    fontSize: 20,
    fontWeight: "900",
    color: colors.textPrimary,
    letterSpacing: -0.5,
  },
  appSubtitle: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 2,
  },
  headerMeta: {
    flexDirection: "row",
    alignItems: "center",
  },
  onlineBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: colors.surface,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.border,
  },
  onlineDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: colors.brandHighlight,
  },
  onlineText: {
    fontSize: 11,
    color: colors.textSecondary,
    fontWeight: "500",
  },
  desktopGrid: {
    flexDirection: "row",
    gap: 18,
    alignItems: "flex-start",
  },
  desktopLeft: {
    width: 440,
  },
  desktopRight: {
    flex: 1,
  },
  mobileColumn: {
    flexDirection: "column",
    gap: 16,
  },
  leftColContainer: {
    gap: 14,
  },
  rightColContainer: {
    gap: 14,
  },
  statsStrip: {
    flexDirection: "row",
    gap: 10,
  },
  statCard: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 12,
  },
  statIconRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  statTitle: {
    fontSize: 10,
    color: colors.textSecondary,
    fontWeight: "600",
    textTransform: "uppercase",
  },
  statTitleGreen: {
    fontSize: 10,
    color: colors.brandHighlight,
    fontWeight: "600",
    textTransform: "uppercase",
  },
  statTitleIndigo: {
    fontSize: 10,
    color: colors.information,
    fontWeight: "600",
    textTransform: "uppercase",
  },
  statMainVal: {
    fontSize: 20,
    fontWeight: "900",
    color: colors.textPrimary,
    marginTop: 4,
    fontFamily: "monospace",
  },
  statValGreen: {
    fontSize: 15,
    fontWeight: "900",
    color: colors.brandHighlight,
    marginTop: 4,
    fontFamily: "monospace",
  },
  statValIndigo: {
    fontSize: 15,
    fontWeight: "900",
    color: colors.information,
    marginTop: 4,
    fontFamily: "monospace",
  },
  statSubText: {
    fontSize: 10,
    color: colors.textMuted,
    marginTop: 3,
  },
  segmentControl: {
    flexDirection: "row",
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 3,
    borderWidth: 1,
    borderColor: colors.border,
  },
  segmentBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 10,
    borderRadius: 9,
  },
  segmentBtnActive: {
    backgroundColor: colors.elevatedSurface,
  },
  segmentText: {
    fontSize: 12,
    fontWeight: "600",
    color: colors.textSecondary,
  },
  segmentTextActive: {
    color: colors.textPrimary,
    fontWeight: "700",
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.surface,
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 44,
  },
  searchContainerFocused: {
    borderColor: colors.information,
    backgroundColor: colors.elevatedSurface,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    color: colors.textPrimary,
    fontSize: 13,
    flex: 1,
    padding: 0,
  },
  clearSearchBtn: {
    padding: 4,
    backgroundColor: colors.hoverSurface,
    borderRadius: 10,
  },
  monthSelectorBar: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: colors.surface,
    padding: 8,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 10,
  },
  monthSelectLabel: {
    fontSize: 11,
    color: colors.textSecondary,
    fontWeight: "600",
  },
  monthInput: {
    backgroundColor: colors.appBackground,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 6,
    color: colors.textPrimary,
    paddingHorizontal: 8,
    paddingVertical: 4,
    fontSize: 12,
    width: 90,
    fontFamily: "monospace",
    textAlign: "center",
  },
  monthNotice: {
    fontSize: 11,
    color: colors.textMuted,
    fontStyle: "italic",
    flex: 1,
  },
  listContainer: {
    marginTop: 2,
  },
  statusFilterRow: {
    flexDirection: 'row',
    gap: 6,
    flexWrap: 'wrap',
    marginBottom: 10,
  },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: 8,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  filterChipActive: {
    backgroundColor: colors.elevatedSurface,
    borderColor: colors.information,
  },
  filterChipDueActive: {
    backgroundColor: 'rgba(217, 74, 80, 0.15)',
    borderColor: colors.danger,
  },
  filterChipSettledActive: {
    backgroundColor: 'rgba(38, 148, 91, 0.15)',
    borderColor: colors.brandHighlight,
  },
  filterChipAdvanceActive: {
    backgroundColor: 'rgba(57, 124, 194, 0.15)',
    borderColor: colors.information,
  },
  filterDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 6,
  },
  filterChipText: {
    fontSize: 11,
    color: colors.textSecondary,
    fontWeight: '600',
  },
  filterChipTextActive: {
    color: colors.textPrimary,
    fontWeight: '700',
  },
  emptyCard: {
    backgroundColor: colors.surface,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 32,
    alignItems: "center",
    gap: 10,
  },
  emptyMsg: {
    color: colors.textMuted,
    fontSize: 13,
    textAlign: "center",
  },
  backupCard: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: 14,
    padding: 14,
  },
  backupCardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    paddingBottom: 8,
  },
  backupCardTitle: {
    fontSize: 13,
    fontWeight: "700",
    color: colors.textPrimary,
  },
  backupCardSub: {
    fontSize: 10,
    color: colors.textMuted,
  },
  statusBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "rgba(38, 148, 91, 0.15)",
    borderColor: colors.success,
    borderWidth: 1,
    borderRadius: 8,
    padding: 8,
    marginBottom: 10,
  },
  statusBannerText: {
    fontSize: 11,
    color: colors.brandHighlight,
    fontWeight: "500",
  },
  backupButtonsGrid: {
    gap: 8,
  },
  backupBtn: {
    paddingVertical: 8,
  },
});
