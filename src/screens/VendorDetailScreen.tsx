import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  Pressable,
  useWindowDimensions,
  TextInput,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useVendorLedger } from '../hooks/useVendorLedger';
import { Card } from '../components/common/Card';
import { Button } from '../components/common/Button';
import { Badge } from '../components/common/Badge';
import { VendorLedgerTimeline } from '../components/vendor/VendorLedgerTimeline';
import { PaymentModal } from '../components/forms/PaymentModal';
import { formatINR } from '../core/math';
import { generateVendorLifetimeAuditPDF } from '../core/pdf';
import { colors } from '../core/theme';

interface VendorDetailScreenProps {
  vendorId: string;
  vendorName: string;
  onBack: () => void;
}

export function VendorDetailScreen({
  vendorId,
  vendorName,
  onBack,
}: VendorDetailScreenProps) {
  const { width } = useWindowDimensions();
  const isDesktop = width >= 1024;

  const {
    vendor,
    financialSummary,
    auditTimeline,
    recordPayment,
    updateVendorDetails,
    deletePayment,
    deleteBill,
  } = useVendorLedger(vendorId, vendorName);

  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [isEditingVendor, setIsEditingVendor] = useState(false);
  const [contactInput, setContactInput] = useState(vendor?.contactNumber || '');
  const [notesInput, setNotesInput] = useState(vendor?.notes || '');
  const [isDownloadingPDF, setIsDownloadingPDF] = useState(false);
  const [timelineFilter, setTimelineFilter] = useState<'all' | 'bills' | 'payments'>('all');

  const displayedTimeline = useMemo(() => {
    if (timelineFilter === 'bills') {
      return auditTimeline.filter((item) => item.type === 'bill');
    }
    if (timelineFilter === 'payments') {
      return auditTimeline.filter((item) => item.type === 'payment');
    }
    return auditTimeline;
  }, [auditTimeline, timelineFilter]);

  const handleSaveVendorInfo = async () => {
    await updateVendorDetails({
      contactNumber: contactInput.trim() || undefined,
      notes: notesInput.trim() || undefined,
    });
    setIsEditingVendor(false);
  };

  const handleDownloadPDF = async () => {
    try {
      setIsDownloadingPDF(true);
      await generateVendorLifetimeAuditPDF(
        vendorName,
        vendor?.contactNumber,
        financialSummary.totalPurchases,
        financialSummary.totalPaid,
        financialSummary.remainingDue,
        auditTimeline
      );
    } catch (err) {
      console.error('Failed to export vendor PDF:', err);
    } finally {
      setIsDownloadingPDF(false);
    }
  };

  const leftColumnContent = (
    <View style={styles.leftColContainer}>
      {/* Vendor Profile & Metadata Card */}
      <Card style={styles.profileCard}>
        <View style={styles.cardHeaderRow}>
          <View style={styles.badgeLabelRow}>
            <Feather name="truck" size={16} color={colors.information} />
            <Text style={styles.cardHeaderTitle}>Vendor Profile</Text>
          </View>
          <Pressable
            onPress={() => {
              setContactInput(vendor?.contactNumber || '');
              setNotesInput(vendor?.notes || '');
              setIsEditingVendor(!isEditingVendor);
            }}
            hitSlop={8}
            style={styles.editBtn}
          >
            <Feather
              name={isEditingVendor ? 'x' : 'edit-2'}
              size={14}
              color={colors.textSecondary}
            />
            <Text style={styles.editText}>
              {isEditingVendor ? 'Cancel' : 'Edit Info'}
            </Text>
          </Pressable>
        </View>

        {isEditingVendor ? (
          <View style={styles.editForm}>
            <Text style={styles.inputLabel}>Contact Phone / Mobile</Text>
            <TextInput
              style={styles.textInput}
              placeholder="+91 9876543210"
              placeholderTextColor={colors.textMuted}
              value={contactInput}
              onChangeText={setContactInput}
            />

            <Text style={styles.inputLabel}>Vendor Notes & Terms</Text>
            <TextInput
              style={[styles.textInput, styles.textArea]}
              placeholder="e.g. GSTIN, wholesale terms, fruit varieties..."
              placeholderTextColor={colors.textMuted}
              value={notesInput}
              onChangeText={setNotesInput}
              multiline
              numberOfLines={2}
            />

            <Button
              title="Save Vendor Info"
              variant="primary"
              icon={<Feather name="check" size={14} color={colors.textPrimary} />}
              onPress={handleSaveVendorInfo}
              style={styles.saveInfoBtn}
            />
          </View>
        ) : (
          <View style={styles.detailsGrid}>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Contact Phone:</Text>
              <Text style={styles.detailValue}>
                {vendor?.contactNumber || 'Not provided'}
              </Text>
            </View>

            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Notes & Info:</Text>
              <Text style={styles.detailValue}>
                {vendor?.notes || 'No notes added'}
              </Text>
            </View>

            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Member Since:</Text>
              <Text style={styles.detailValueSub}>
                {vendor?.createdAt
                  ? new Date(vendor.createdAt).toLocaleDateString('en-IN')
                  : 'N/A'}
              </Text>
            </View>

            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Total Records:</Text>
              <Text style={styles.detailValueSub}>
                {financialSummary.billCount} bills · {financialSummary.paymentCount} payments
              </Text>
            </View>
          </View>
        )}
      </Card>

      {/* Financial Overview Card */}
      <Card style={styles.overviewCard}>
        <View style={styles.statusRow}>
          <Text style={styles.cardHeaderTitle}>Lifetime Financial Due</Text>
          <Badge
            label={
              financialSummary.status === 'DUE'
                ? 'DUE PENDING'
                : financialSummary.status
            }
            variant={
              financialSummary.status === 'DUE'
                ? 'due'
                : financialSummary.status === 'SETTLED'
                ? 'settled'
                : financialSummary.status === 'ADVANCE'
                ? 'advance'
                : 'neutral'
            }
          />
        </View>

        <View style={styles.statsGrid}>
          <View style={styles.statItem}>
            <Text style={styles.statLabel}>Lifetime Purchases</Text>
            <Text style={styles.statValue}>
              {formatINR(financialSummary.totalPurchases)}
            </Text>
          </View>

          <View style={styles.statItem}>
            <Text style={styles.statLabel}>Lifetime Paid</Text>
            <Text style={styles.statValueGreen}>
              {formatINR(financialSummary.totalPaid)}
            </Text>
          </View>

          <View style={styles.statItem}>
            <Text style={styles.statLabel}>Remaining Due</Text>
            <Text
              style={[
                styles.statValueDue,
                financialSummary.remainingDue === 0 && styles.statValueSettled,
              ]}
            >
              {formatINR(financialSummary.remainingDue)}
            </Text>
          </View>
        </View>

        {/* Monthly Breakdown Strip */}
        <View style={styles.monthBreakdownBar}>
          <View style={styles.monthCol}>
            <Text style={styles.monthLabel}>This Month Purchases:</Text>
            <Text style={styles.monthValueWhite}>
              {formatINR(financialSummary.thisMonthPurchases || 0)}
            </Text>
          </View>
          <View style={styles.monthDivider} />
          <View style={styles.monthCol}>
            <Text style={styles.monthLabel}>This Month Paid:</Text>
            <Text style={styles.monthValueGreen}>
              {formatINR(financialSummary.thisMonthPaid || 0)}
            </Text>
          </View>
        </View>

        <View style={styles.buttonActionRow}>
          <Button
            title={isDownloadingPDF ? 'Exporting PDF...' : 'Download Statement (PDF)'}
            variant="secondary"
            icon={<Feather name="file-text" size={14} color={colors.textPrimary} />}
            onPress={handleDownloadPDF}
            style={styles.pdfBtn}
          />
          <Button
            title="Record Payment"
            variant="primary"
            icon={<Feather name="credit-card" size={14} color={colors.textPrimary} />}
            onPress={() => setPaymentModalOpen(true)}
            style={styles.payBtn}
          />
        </View>
      </Card>
    </View>
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        {/* Header with Back Button */}
        <View style={styles.header}>
          <Pressable onPress={onBack} hitSlop={12} style={styles.backButton}>
            <Feather name="arrow-left" size={18} color={colors.textPrimary} />
            <Text style={styles.backText}>All Ledgers</Text>
          </Pressable>
          <View style={styles.titleCol}>
            <Text style={styles.vendorName}>{vendorName}</Text>
            <Text style={styles.subtitle}>
              Continuous Cumulative Ledger · Strictly Lifetime (Zero Month Filter)
            </Text>
          </View>
        </View>

        {/* Responsive Content: 2 Columns on Desktop, Single Column on Mobile */}
        {isDesktop ? (
          <View style={styles.desktopLayout}>
            <View style={styles.desktopLeft}>{leftColumnContent}</View>
            <View style={styles.desktopRight}>
              <View style={styles.timelineHeaderRow}>
                <View style={styles.timelineTitleGroup}>
                  <Feather name="clock" size={15} color={colors.information} />
                  <Text style={styles.timelineTitle}>
                    Audit Timeline ({displayedTimeline.length})
                  </Text>
                </View>

                <View style={styles.timelineFilterGroup}>
                  <Pressable
                    onPress={() => setTimelineFilter('all')}
                    style={[
                      styles.timelineFilterBtn,
                      timelineFilter === 'all' && styles.timelineFilterBtnActive,
                    ]}
                  >
                    <Text
                      style={[
                        styles.timelineFilterText,
                        timelineFilter === 'all' && styles.timelineFilterTextActive,
                      ]}
                    >
                      All ({auditTimeline.length})
                    </Text>
                  </Pressable>

                  <Pressable
                    onPress={() => setTimelineFilter('bills')}
                    style={[
                      styles.timelineFilterBtn,
                      timelineFilter === 'bills' && styles.timelineFilterBtnActive,
                    ]}
                  >
                    <Text
                      style={[
                        styles.timelineFilterText,
                        timelineFilter === 'bills' && styles.timelineFilterTextActive,
                      ]}
                    >
                      Bills ({financialSummary.billCount})
                    </Text>
                  </Pressable>

                  <Pressable
                    onPress={() => setTimelineFilter('payments')}
                    style={[
                      styles.timelineFilterBtn,
                      timelineFilter === 'payments' && styles.timelineFilterBtnActive,
                    ]}
                  >
                    <Text
                      style={[
                        styles.timelineFilterText,
                        timelineFilter === 'payments' && styles.timelineFilterTextActive,
                      ]}
                    >
                      Payments ({financialSummary.paymentCount})
                    </Text>
                  </Pressable>
                </View>
              </View>

              <VendorLedgerTimeline
                timeline={displayedTimeline}
                onDeleteBill={deleteBill}
                onDeletePayment={deletePayment}
              />
            </View>
          </View>
        ) : (
          <View style={styles.mobileLayout}>
            {leftColumnContent}
            <View style={styles.timelineHeaderRow}>
              <View style={styles.timelineTitleGroup}>
                <Feather name="clock" size={15} color={colors.information} />
                <Text style={styles.timelineTitle}>
                  Audit Timeline ({displayedTimeline.length})
                </Text>
              </View>

              <View style={styles.timelineFilterGroup}>
                <Pressable
                  onPress={() => setTimelineFilter('all')}
                  style={[
                    styles.timelineFilterBtn,
                    timelineFilter === 'all' && styles.timelineFilterBtnActive,
                  ]}
                >
                  <Text
                    style={[
                      styles.timelineFilterText,
                      timelineFilter === 'all' && styles.timelineFilterTextActive,
                    ]}
                  >
                    All ({auditTimeline.length})
                  </Text>
                </Pressable>

                <Pressable
                  onPress={() => setTimelineFilter('bills')}
                  style={[
                    styles.timelineFilterBtn,
                    timelineFilter === 'bills' && styles.timelineFilterBtnActive,
                  ]}
                >
                  <Text
                    style={[
                      styles.timelineFilterText,
                      timelineFilter === 'bills' && styles.timelineFilterTextActive,
                    ]}
                  >
                    Bills ({financialSummary.billCount})
                  </Text>
                </Pressable>

                <Pressable
                  onPress={() => setTimelineFilter('payments')}
                  style={[
                    styles.timelineFilterBtn,
                    timelineFilter === 'payments' && styles.timelineFilterBtnActive,
                  ]}
                >
                  <Text
                    style={[
                      styles.timelineFilterText,
                      timelineFilter === 'payments' && styles.timelineFilterTextActive,
                    ]}
                  >
                    Payments ({financialSummary.paymentCount})
                  </Text>
                </Pressable>
              </View>
            </View>

            <VendorLedgerTimeline
              timeline={displayedTimeline}
              onDeleteBill={deleteBill}
              onDeletePayment={deletePayment}
            />
          </View>
        )}
      </View>

      {/* Payment Modal */}
      {paymentModalOpen && (
        <PaymentModal
          visible={paymentModalOpen}
          vendorName={vendorName}
          currentDue={financialSummary.remainingDue}
          onClose={() => setPaymentModalOpen(false)}
          onSavePayment={({ amount, date, paymentMode, referenceNote }) => {
            recordPayment(amount, date, paymentMode, referenceNote);
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
    flex: 1,
    padding: 16,
    maxWidth: 1380,
    width: '100%',
    alignSelf: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    gap: 14,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    paddingBottom: 12,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.surface,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
  },
  backText: {
    fontSize: 13,
    color: colors.textPrimary,
    fontWeight: '600',
  },
  titleCol: {
    flex: 1,
    minWidth: 200,
  },
  vendorName: {
    fontSize: 20,
    fontWeight: '800',
    color: colors.textPrimary,
    letterSpacing: -0.3,
  },
  subtitle: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 2,
  },
  desktopLayout: {
    flex: 1,
    flexDirection: 'row',
    gap: 16,
  },
  desktopLeft: {
    flex: 0.38,
    minWidth: 350,
    maxWidth: 440,
  },
  desktopRight: {
    flex: 0.62,
    minWidth: 0,
  },
  mobileLayout: {
    flex: 1,
  },
  leftColContainer: {
    gap: 14,
    marginBottom: 14,
  },
  profileCard: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: 14,
    padding: 14,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    paddingBottom: 8,
  },
  badgeLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  cardHeaderTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  editBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    padding: 4,
  },
  editText: {
    fontSize: 12,
    color: colors.textSecondary,
    fontWeight: '600',
  },
  editForm: {
    gap: 6,
  },
  inputLabel: {
    fontSize: 11,
    color: colors.textSecondary,
    fontWeight: '600',
    marginTop: 4,
  },
  textInput: {
    backgroundColor: colors.appBackground,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    color: colors.textPrimary,
    paddingHorizontal: 10,
    paddingVertical: 7,
    fontSize: 13,
  },
  textArea: {
    minHeight: 52,
    textAlignVertical: 'top',
  },
  saveInfoBtn: {
    marginTop: 8,
    paddingVertical: 8,
  },
  detailsGrid: {
    gap: 8,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  detailLabel: {
    fontSize: 12,
    color: colors.textSecondary,
    fontWeight: '500',
  },
  detailValue: {
    fontSize: 12,
    color: colors.textPrimary,
    fontWeight: '600',
  },
  detailValueSub: {
    fontSize: 12,
    color: colors.textSecondary,
    fontFamily: 'monospace',
  },
  overviewCard: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: 14,
    padding: 14,
  },
  statusRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  statsGrid: {
    flexDirection: 'row',
    backgroundColor: colors.appBackground,
    borderRadius: 10,
    padding: 12,
    gap: 8,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: colors.border,
  },
  statItem: {
    flex: 1,
  },
  statLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: colors.textSecondary,
    textTransform: 'uppercase',
  },
  statValue: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.textPrimary,
    marginTop: 3,
    fontFamily: 'monospace',
  },
  statValueGreen: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.brandHighlight,
    marginTop: 3,
    fontFamily: 'monospace',
  },
  statValueDue: {
    fontSize: 15,
    fontWeight: '800',
    color: colors.danger,
    marginTop: 3,
    fontFamily: 'monospace',
  },
  statValueSettled: {
    color: colors.brandHighlight,
  },
  buttonActionRow: {
    flexDirection: 'row',
    gap: 8,
  },
  monthBreakdownBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.elevatedSurface,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 12,
  },
  monthCol: {
    flex: 1,
  },
  monthLabel: {
    fontSize: 9,
    color: colors.textSecondary,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  monthValueWhite: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.textPrimary,
    marginTop: 2,
    fontFamily: 'monospace',
  },
  monthValueGreen: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.brandHighlight,
    marginTop: 2,
    fontFamily: 'monospace',
  },
  monthDivider: {
    width: 1,
    height: 24,
    backgroundColor: colors.border,
    marginHorizontal: 8,
  },
  pdfBtn: {
    flex: 1,
    paddingVertical: 9,
  },
  payBtn: {
    flex: 1,
    paddingVertical: 9,
  },
  timelineHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 4,
    marginBottom: 10,
  },
  timelineTitleGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  timelineTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  timelineFilterGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    padding: 2,
    gap: 2,
  },
  timelineFilterBtn: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  timelineFilterBtnActive: {
    backgroundColor: colors.elevatedSurface,
  },
  timelineFilterText: {
    fontSize: 11,
    color: colors.textSecondary,
    fontWeight: '500',
  },
  timelineFilterTextActive: {
    color: colors.textPrimary,
    fontWeight: '700',
  },
});
