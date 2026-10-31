import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { Card } from '../common/Card';
import { Badge } from '../common/Badge';
import { Button } from '../common/Button';
import { VendorFinancialSummary } from '../../core/types';
import { formatINR } from '../../core/math';

interface VendorCardProps {
  summary: VendorFinancialSummary;
  contactNumber?: string;
  notes?: string;
  onSelectVendor: (vendorId: string, vendorName: string) => void;
  onOpenPaymentModal: (vendorId: string, vendorName: string, remainingDue: number) => void;
  onDownloadPDF?: (vendorId: string, vendorName: string) => void;
}

export const VendorCard = React.memo(function VendorCard({
  summary,
  contactNumber,
  notes,
  onSelectVendor,
  onOpenPaymentModal,
  onDownloadPDF,
}: VendorCardProps) {
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

  return (
    <Card style={styles.card}>
      <Pressable
        onPress={() => onSelectVendor(summary.vendorId, summary.vendorName)}
        style={styles.clickableHeader}
      >
        <View style={styles.titleRow}>
          <View style={styles.nameBlock}>
            <Text style={styles.name}>{summary.vendorName}</Text>
            {contactNumber ? (
              <View style={styles.metaRow}>
                <Feather name="phone" size={11} color="#94a3b8" />
                <Text style={styles.metaText}>{contactNumber}</Text>
              </View>
            ) : null}
            {notes ? (
              <Text style={styles.notesText} numberOfLines={1}>
                {notes}
              </Text>
            ) : null}
          </View>

          <Badge
            label={summary.status === 'DUE' ? 'DUE PENDING' : summary.status}
            variant={getBadgeVariant(summary.status)}
          />
        </View>

        {/* 3-Stat Financial Strip */}
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
      </Pressable>

      <View style={styles.footerActions}>
        <Button
          title="Details & Audit"
          variant="secondary"
          icon={<Feather name="clock" size={14} color="#e2e8f0" />}
          onPress={() => onSelectVendor(summary.vendorId, summary.vendorName)}
          style={styles.actionBtn}
        />
        {onDownloadPDF ? (
          <Button
            title="PDF"
            variant="secondary"
            icon={<Feather name="file-text" size={14} color="#e2e8f0" />}
            onPress={() => onDownloadPDF(summary.vendorId, summary.vendorName)}
            style={styles.actionBtnSmall}
          />
        ) : null}
        <Button
          title="Add Payment"
          variant="primary"
          icon={<Feather name="credit-card" size={14} color="#ffffff" />}
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
    marginBottom: 12,
    backgroundColor: '#0b1329',
    borderColor: '#1e293b',
    borderWidth: 1,
    borderRadius: 14,
  },
  clickableHeader: {
    paddingBottom: 10,
  },
  titleRow: {
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
    color: '#ffffff',
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 3,
  },
  metaText: {
    fontSize: 12,
    color: '#94a3b8',
    fontWeight: '500',
  },
  notesText: {
    fontSize: 11,
    color: '#64748b',
    marginTop: 2,
    fontStyle: 'italic',
  },
  statsRow: {
    flexDirection: 'row',
    backgroundColor: '#020617',
    borderRadius: 10,
    padding: 10,
    gap: 8,
    borderWidth: 1,
    borderColor: '#0f172a',
  },
  statBox: {
    flex: 1,
  },
  statLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: '#94a3b8',
    textTransform: 'uppercase',
  },
  statValWhite: {
    fontSize: 13,
    fontWeight: '700',
    color: '#ffffff',
    marginTop: 2,
    fontFamily: 'monospace',
  },
  statValGreen: {
    fontSize: 13,
    fontWeight: '700',
    color: '#34d399',
    marginTop: 2,
    fontFamily: 'monospace',
  },
  statValDue: {
    fontSize: 14,
    fontWeight: '800',
    color: '#fb7185',
    marginTop: 2,
    fontFamily: 'monospace',
  },
  statValSettled: {
    color: '#34d399',
  },
  footerActions: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#1e293b',
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
