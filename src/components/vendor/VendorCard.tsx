import React, { useState } from 'react';
import { View, Text, StyleSheet, Pressable, useWindowDimensions } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { VendorFinancialSummary } from '../../core/types';
import { formatINR } from '../../core/math';
import { colors } from '../../core/theme';

export interface VendorCardProps {
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
}: VendorCardProps) {
  const { width } = useWindowDimensions();
  const isDesktop = width >= 768;
  const [isHovered, setIsHovered] = useState(false);

  const getStatusBadge = () => {
    switch (summary.status) {
      case 'DUE':
        return {
          label: 'Due Pending',
          dotColor: colors.danger,
          bg: 'rgba(217, 74, 80, 0.12)',
          text: colors.danger,
        };
      case 'SETTLED':
        return {
          label: 'Settled',
          dotColor: colors.brandHighlight,
          bg: 'rgba(117, 184, 61, 0.12)',
          text: colors.brandHighlight,
        };
      case 'ADVANCE':
        return {
          label: 'Advance',
          dotColor: colors.information,
          bg: 'rgba(57, 124, 194, 0.12)',
          text: colors.information,
        };
      default:
        return {
          label: 'No Bills',
          dotColor: colors.textMuted,
          bg: 'rgba(116, 141, 164, 0.12)',
          text: colors.textSecondary,
        };
    }
  };

  const badge = getStatusBadge();

  return (
    <View
      style={[
        styles.rowContainer,
        isHovered && styles.rowContainerHovered,
      ]}
      // @ts-ignore - web hover support
      onMouseEnter={() => setIsHovered(true)}
      // @ts-ignore - web hover support
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Clickable Entity & Financial Info Area */}
      <Pressable
        onPress={() => onSelectVendor(summary.vendorId, summary.vendorName)}
        style={[
          styles.mainPressable,
          isDesktop ? styles.desktopMainPressable : styles.mobileMainPressable,
        ]}
      >
        {/* Column 1: Vendor Name & Contact Meta */}
        <View style={styles.vendorInfoCol}>
          <View style={styles.nameHeaderRow}>
            <Text style={styles.vendorName} numberOfLines={1}>
              {summary.vendorName}
            </Text>
            <View style={[styles.statusBadge, { backgroundColor: badge.bg }]}>
              <View style={[styles.statusDot, { backgroundColor: badge.dotColor }]} />
              <Text style={[styles.statusText, { color: badge.text }]}>
                {badge.label}
              </Text>
            </View>
          </View>

          <View style={styles.metaRow}>
            {contactNumber ? (
              <View style={styles.metaItem}>
                <Feather name="phone" size={11} color={colors.textSecondary} />
                <Text style={styles.metaText}>{contactNumber}</Text>
              </View>
            ) : null}
            <View style={styles.metaItem}>
              <Feather name="file-text" size={11} color={colors.textSecondary} />
              <Text style={styles.metaText}>
                {summary.billCount} bills · {summary.paymentCount} payments
              </Text>
            </View>
            {notes ? (
              <View style={styles.metaItem}>
                <Feather name="info" size={11} color={colors.textMuted} />
                <Text style={styles.notesText} numberOfLines={1}>
                  {notes}
                </Text>
              </View>
            ) : null}
          </View>
        </View>

        {/* Column 2: Due Balance & Lifetime Summary */}
        <View style={[styles.dueInfoCol, isDesktop ? styles.desktopDueCol : styles.mobileDueCol]}>
          {summary.status === 'DUE' ? (
            <>
              <Text style={styles.dueLabel}>DUE BALANCE</Text>
              <Text style={styles.dueAmountDanger}>
                {formatINR(summary.remainingDue)}
              </Text>
              <Text style={styles.dueSubText}>
                Purchases: {formatINR(summary.totalPurchases)} · Paid: {formatINR(summary.totalPaid)}
              </Text>
            </>
          ) : summary.status === 'SETTLED' ? (
            <>
              <Text style={styles.settledLabel}>BALANCE CLEARED</Text>
              <Text style={styles.dueAmountSettled}>
                ₹0 Due
              </Text>
              <Text style={styles.dueSubText}>
                All {formatINR(summary.totalPurchases)} paid in full
              </Text>
            </>
          ) : summary.status === 'ADVANCE' ? (
            <>
              <Text style={styles.advanceLabel}>ADVANCE CREDIT</Text>
              <Text style={styles.dueAmountAdvance}>
                {formatINR(summary.advancePaid)} Adv
              </Text>
              <Text style={styles.dueSubText}>
                Total Paid: {formatINR(summary.totalPaid)}
              </Text>
            </>
          ) : (
            <>
              <Text style={styles.dueLabel}>STATUS</Text>
              <Text style={styles.dueAmountNeutral}>No Bills</Text>
              <Text style={styles.dueSubText}>Zero transaction activity</Text>
            </>
          )}
        </View>
      </Pressable>

      {/* Column 3: Quick Action Area (Add Payment + View Chevron) */}
      <View style={[styles.actionCol, isDesktop ? styles.desktopActionCol : styles.mobileActionCol]}>
        <Pressable
          onPress={() => onOpenPaymentModal(summary.vendorId, summary.vendorName, summary.remainingDue)}
          style={({ pressed }) => [
            styles.addPaymentBtn,
            pressed && styles.addPaymentBtnPressed,
          ]}
          hitSlop={6}
        >
          <Feather name="plus-circle" size={14} color={colors.textPrimary} style={styles.btnIcon} />
          <Text style={styles.addPaymentText}>Add Payment</Text>
        </Pressable>

        <Pressable
          onPress={() => onSelectVendor(summary.vendorId, summary.vendorName)}
          style={({ pressed }) => [
            styles.viewVendorBtn,
            pressed && styles.viewVendorBtnPressed,
          ]}
          hitSlop={8}
        >
          <Text style={styles.viewVendorText}>View</Text>
          <Feather name="chevron-right" size={16} color={colors.textSecondary} />
        </Pressable>
      </View>
    </View>
  );
});

export const VendorRow = VendorCard;

const styles = StyleSheet.create({
  rowContainer: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    marginBottom: 8,
    overflow: 'hidden',
    transitionDuration: '150ms',
  },
  rowContainerHovered: {
    borderColor: colors.information,
    backgroundColor: colors.elevatedSurface,
  },
  mainPressable: {
    padding: 14,
    cursor: 'pointer',
  },
  desktopMainPressable: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    flex: 1,
  },
  mobileMainPressable: {
    flexDirection: 'column',
    gap: 8,
  },
  vendorInfoCol: {
    flex: 1.6,
    paddingRight: 12,
  },
  nameHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 4,
    flexWrap: 'wrap',
  },
  vendorName: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.textPrimary,
    letterSpacing: -0.2,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
    gap: 5,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 0.2,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 12,
    marginTop: 2,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metaText: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  notesText: {
    fontSize: 12,
    color: colors.textMuted,
    maxWidth: 160,
  },
  dueInfoCol: {
    flex: 1.2,
  },
  desktopDueCol: {
    paddingHorizontal: 12,
    alignItems: 'flex-start',
  },
  mobileDueCol: {
    marginTop: 6,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: 'rgba(36, 59, 81, 0.4)',
  },
  dueLabel: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.6,
    color: colors.danger,
    marginBottom: 1,
  },
  settledLabel: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.6,
    color: colors.brandHighlight,
    marginBottom: 1,
  },
  advanceLabel: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.6,
    color: colors.information,
    marginBottom: 1,
  },
  dueAmountDanger: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.danger,
    letterSpacing: -0.3,
  },
  dueAmountSettled: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.brandHighlight,
    letterSpacing: -0.3,
  },
  dueAmountAdvance: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.information,
    letterSpacing: -0.3,
  },
  dueAmountNeutral: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.textMuted,
  },
  dueSubText: {
    fontSize: 11,
    color: colors.textMuted,
    marginTop: 1,
  },
  actionCol: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  desktopActionCol: {
    paddingRight: 14,
    paddingLeft: 8,
  },
  mobileActionCol: {
    paddingHorizontal: 14,
    paddingBottom: 12,
    justifyContent: 'flex-end',
  },
  addPaymentBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primaryButton,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 8,
    gap: 5,
  },
  addPaymentBtnPressed: {
    backgroundColor: colors.buttonHover,
    opacity: 0.9,
  },
  btnIcon: {
    marginRight: 1,
  },
  addPaymentText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  viewVendorBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 7,
    borderRadius: 8,
    gap: 2,
    backgroundColor: 'rgba(36, 59, 81, 0.5)',
  },
  viewVendorBtnPressed: {
    backgroundColor: colors.hoverSurface,
  },
  viewVendorText: {
    fontSize: 12,
    color: colors.textSecondary,
    fontWeight: '500',
  },
});
