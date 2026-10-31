import React, { useState } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { Card } from '../common/Card';
import { Badge } from '../common/Badge';
import { Button } from '../common/Button';
import { VendorFinancialSummary } from '../../core/types';
import { formatINR } from '../../core/math';
import { colors } from '../../core/theme';

interface VendorCardProps {
  summary: VendorFinancialSummary;
  contactNumber?: string;
  notes?: string;
  onSelectVendor: (vendorId: string, vendorName: string) => void;
  onOpenPaymentModal: (vendorId: string, vendorName: string, remainingDue: number) => void;
  onDownloadPDF?: (vendorId: string, vendorName: string) => void;
  onDeleteBill?: (id: string) => void;
  onDeletePayment?: (id: string) => void;
}

export const VendorCard = React.memo(function VendorCard({
  summary,
  contactNumber,
  notes,
  onSelectVendor,
  onOpenPaymentModal,
  onDownloadPDF,
  onDeleteBill,
  onDeletePayment,
}: VendorCardProps) {
  const [activeSubTab, setActiveSubTab] = useState<'bills' | 'payments'>('bills');
  const [expanded, setExpanded] = useState(true);

  const getBadgeVariant = (status: VendorFinancialSummary['status']) => {
    switch (status) {
      case 'DUE':
        return 'due';
      case 'SETTLED':
        return 'settled';
      case 'ADVANCE':
        return 'advance';
      default:
        return 'neutral';
    }
  };

  const bills = summary.bills || [];
  const payments = summary.payments || [];

  return (
    <Card style={styles.card}>
      {/* Header Info */}
      <View style={styles.header}>
        <Pressable
          onPress={() => onSelectVendor(summary.vendorId, summary.vendorName)}
          style={styles.nameBlock}
        >
          <Text style={styles.name}>{summary.vendorName}</Text>
          {contactNumber ? (
            <View style={styles.metaRow}>
              <Feather name="phone" size={11} color={colors.textSecondary} />
              <Text style={styles.metaText}>{contactNumber}</Text>
            </View>
          ) : null}
          {notes ? (
            <Text style={styles.notesText} numberOfLines={1}>
              {notes}
            </Text>
          ) : null}
        </Pressable>

        <Badge
          label={summary.status === 'DUE' ? 'DUE PENDING' : summary.status}
          variant={getBadgeVariant(summary.status)}
        />
      </View>

      {/* 3-Stat Financial Strip (Lifetime) */}
      <View style={styles.statsRow}>
        <View style={styles.statBox}>
          <Text style={styles.statLabel}>Purchases ({summary.billCount})</Text>
          <Text style={styles.statValWhite}>{formatINR(summary.totalPurchases)}</Text>
        </View>
        <View style={styles.statBox}>
          <Text style={styles.statLabel}>Paid ({summary.paymentCount})</Text>
          <Text style={styles.statValGreen}>{formatINR(summary.totalPaid)}</Text>
        </View>
        <View style={styles.statBox}>
          <Text style={styles.statLabel}>Remaining Due</Text>
          <Text
            style={[
              styles.statValDue,
              summary.remainingDue === 0 && styles.statValSettled,
            ]}
          >
            {formatINR(summary.remainingDue)}
          </Text>
        </View>
      </View>

      {/* Monthly Tracking Badge / Sub-Bar */}
      <View style={styles.monthBreakdownBar}>
        <View style={styles.monthCol}>
          <Text style={styles.monthLabel}>This Month Purchases:</Text>
          <Text style={styles.monthValueWhite}>
            {formatINR(summary.thisMonthPurchases || 0)}
          </Text>
        </View>
        <View style={styles.monthDivider} />
        <View style={styles.monthCol}>
          <Text style={styles.monthLabel}>This Month Paid:</Text>
          <Text style={styles.monthValueGreen}>
            {formatINR(summary.thisMonthPaid || 0)}
          </Text>
        </View>
      </View>

      {/* Toggle to expand/collapse itemized records */}
      <View style={styles.toggleRow}>
        <View style={styles.subTabGroup}>
          <Pressable
            onPress={() => setActiveSubTab('bills')}
            style={[styles.subTabBtn, activeSubTab === 'bills' && styles.subTabBtnActive]}
          >
            <Feather
              name="file-text"
              size={11}
              color={activeSubTab === 'bills' ? colors.textPrimary : colors.textSecondary}
            />
            <Text
              style={[
                styles.subTabText,
                activeSubTab === 'bills' && styles.subTabTextActive,
              ]}
            >
              Bills ({bills.length})
            </Text>
          </Pressable>

          <Pressable
            onPress={() => setActiveSubTab('payments')}
            style={[
              styles.subTabBtn,
              activeSubTab === 'payments' && styles.subTabBtnActive,
            ]}
          >
            <Feather
              name="credit-card"
              size={11}
              color={activeSubTab === 'payments' ? colors.brandHighlight : colors.textSecondary}
            />
            <Text
              style={[
                styles.subTabText,
                activeSubTab === 'payments' && styles.subTabTextActive,
              ]}
            >
              Partial Payments ({payments.length})
            </Text>
          </Pressable>
        </View>

        <Pressable
          onPress={() => setExpanded(!expanded)}
          hitSlop={8}
          style={styles.expandToggle}
        >
          <Feather
            name={expanded ? 'chevron-up' : 'chevron-down'}
            size={14}
            color={colors.textSecondary}
          />
          <Text style={styles.expandText}>{expanded ? 'Hide' : 'Show'}</Text>
        </Pressable>
      </View>

      {/* Itemized Lists (Bills / Payments) */}
      {expanded && (
        <View style={styles.recordsContainer}>
          {activeSubTab === 'bills' && (
            <View style={styles.recordsList}>
              {bills.length === 0 ? (
                <Text style={styles.emptyRecordsText}>
                  No purchase bills recorded for this vendor.
                </Text>
              ) : (
                bills.map((bill) => (
                  <View key={bill.id} style={styles.recordRow}>
                    <View style={styles.recordLeft}>
                      <Text style={styles.recordDate}>{bill.date}</Text>
                      {bill.billNumber ? (
                        <Text style={styles.billBadge}>#{bill.billNumber}</Text>
                      ) : null}
                    </View>
                    <View style={styles.recordRight}>
                      <Text style={styles.recordAmountDebit}>
                        + {formatINR(bill.amount)}
                      </Text>
                      {onDeleteBill ? (
                        <Pressable
                          onPress={() => onDeleteBill(bill.id)}
                          hitSlop={8}
                          style={styles.deleteBtn}
                        >
                          <Feather name="trash-2" size={12} color={colors.danger} />
                        </Pressable>
                      ) : null}
                    </View>
                  </View>
                ))
              )}
            </View>
          )}

          {activeSubTab === 'payments' && (
            <View style={styles.recordsList}>
              {payments.length === 0 ? (
                <Text style={styles.emptyRecordsText}>
                  No partial payments recorded for this vendor.
                </Text>
              ) : (
                payments.map((p) => (
                  <View key={p.id} style={styles.recordRow}>
                    <View style={styles.recordLeft}>
                      <Text style={styles.recordDate}>{p.date}</Text>
                      <Text style={styles.paymentModeBadge}>{p.paymentMode}</Text>
                      {p.referenceNote ? (
                        <Text style={styles.noteSnippet} numberOfLines={1}>
                          {p.referenceNote}
                        </Text>
                      ) : null}
                    </View>
                    <View style={styles.recordRight}>
                      <Text style={styles.recordAmountCredit}>
                        - {formatINR(p.amount)}
                      </Text>
                      {onDeletePayment ? (
                        <Pressable
                          onPress={() => onDeletePayment(p.id)}
                          hitSlop={8}
                          style={styles.deleteBtn}
                        >
                          <Feather name="trash-2" size={12} color={colors.danger} />
                        </Pressable>
                      ) : null}
                    </View>
                  </View>
                ))
              )}
            </View>
          )}
        </View>
      )}

      {/* Footer Actions */}
      <View style={styles.footerActions}>
        <Button
          title="Audit Ledger"
          variant="secondary"
          icon={<Feather name="clock" size={13} color={colors.textPrimary} />}
          onPress={() => onSelectVendor(summary.vendorId, summary.vendorName)}
          style={styles.actionBtn}
        />
        {onDownloadPDF ? (
          <Button
            title="PDF"
            variant="secondary"
            icon={<Feather name="file-text" size={13} color={colors.textPrimary} />}
            onPress={() => onDownloadPDF(summary.vendorId, summary.vendorName)}
            style={styles.actionBtnSmall}
          />
        ) : null}
        <Button
          title="Add Payment"
          variant="primary"
          icon={<Feather name="credit-card" size={13} color={colors.textPrimary} />}
          onPress={() =>
            onOpenPaymentModal(
              summary.vendorId,
              summary.vendorName,
              summary.remainingDue
            )
          }
          style={styles.actionBtn}
        />
      </View>
    </Card>
  );
});

const styles = StyleSheet.create({
  card: {
    marginBottom: 14,
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: 14,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 10,
    gap: 8,
  },
  nameBlock: {
    flex: 1,
  },
  name: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 3,
  },
  metaText: {
    fontSize: 12,
    color: colors.textSecondary,
    fontWeight: '500',
  },
  notesText: {
    fontSize: 11,
    color: colors.textMuted,
    marginTop: 2,
    fontStyle: 'italic',
  },
  statsRow: {
    flexDirection: 'row',
    backgroundColor: colors.appBackground,
    borderRadius: 10,
    padding: 10,
    gap: 8,
    borderWidth: 1,
    borderColor: colors.border,
  },
  statBox: {
    flex: 1,
  },
  statLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: colors.textSecondary,
    textTransform: 'uppercase',
  },
  statValWhite: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.textPrimary,
    marginTop: 2,
    fontFamily: 'monospace',
  },
  statValGreen: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.brandHighlight,
    marginTop: 2,
    fontFamily: 'monospace',
  },
  statValDue: {
    fontSize: 14,
    fontWeight: '800',
    color: colors.danger,
    marginTop: 2,
    fontFamily: 'monospace',
  },
  statValSettled: {
    color: colors.brandHighlight,
  },
  monthBreakdownBar: {
    flexDirection: 'row',
    backgroundColor: colors.elevatedSurface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    paddingVertical: 6,
    paddingHorizontal: 10,
    marginTop: 8,
    alignItems: 'center',
  },
  monthCol: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 4,
  },
  monthDivider: {
    width: 1,
    height: 14,
    backgroundColor: colors.border,
  },
  monthLabel: {
    fontSize: 10,
    color: colors.textSecondary,
    fontWeight: '500',
  },
  monthValueWhite: {
    fontSize: 11,
    color: colors.textPrimary,
    fontWeight: '700',
    fontFamily: 'monospace',
  },
  monthValueGreen: {
    fontSize: 11,
    color: colors.brandHighlight,
    fontWeight: '700',
    fontFamily: 'monospace',
  },
  toggleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 10,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  subTabGroup: {
    flexDirection: 'row',
    gap: 6,
  },
  subTabBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 6,
    backgroundColor: colors.appBackground,
    borderWidth: 1,
    borderColor: colors.border,
  },
  subTabBtnActive: {
    borderColor: colors.information,
    backgroundColor: 'rgba(57, 124, 194, 0.15)',
  },
  subTabText: {
    fontSize: 10,
    color: colors.textSecondary,
    fontWeight: '600',
  },
  subTabTextActive: {
    color: colors.textPrimary,
    fontWeight: '700',
  },
  expandToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    padding: 3,
  },
  expandText: {
    fontSize: 11,
    color: colors.textSecondary,
  },
  recordsContainer: {
    marginTop: 8,
  },
  recordsList: {
    gap: 5,
  },
  emptyRecordsText: {
    color: colors.textMuted,
    fontSize: 11,
    fontStyle: 'italic',
    paddingVertical: 6,
    textAlign: 'center',
  },
  recordRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: colors.appBackground,
    paddingVertical: 6,
    paddingHorizontal: 8,
    borderRadius: 7,
    borderWidth: 1,
    borderColor: colors.border,
  },
  recordLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flex: 1,
  },
  recordDate: {
    fontSize: 11,
    color: colors.textSecondary,
    fontFamily: 'monospace',
  },
  billBadge: {
    fontSize: 10,
    color: colors.information,
    backgroundColor: 'rgba(57, 124, 194, 0.15)',
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 4,
    fontFamily: 'monospace',
  },
  paymentModeBadge: {
    fontSize: 10,
    color: colors.brandHighlight,
    backgroundColor: 'rgba(117, 184, 61, 0.15)',
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 4,
  },
  noteSnippet: {
    fontSize: 10,
    color: colors.textMuted,
    flex: 1,
  },
  recordRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  recordAmountDebit: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.textPrimary,
    fontFamily: 'monospace',
  },
  recordAmountCredit: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.brandHighlight,
    fontFamily: 'monospace',
  },
  deleteBtn: {
    padding: 3,
  },
  footerActions: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 10,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: 10,
  },
  actionBtn: {
    flex: 1,
    paddingVertical: 9,
  },
  actionBtnSmall: {
    paddingHorizontal: 12,
    paddingVertical: 9,
  },
});
