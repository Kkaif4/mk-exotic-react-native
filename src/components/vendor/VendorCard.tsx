import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { Card } from '../common/Card';
import { Badge } from '../common/Badge';
import { Button } from '../common/Button';
import { VendorFinancialSummary } from '../../core/types';
import { formatINR } from '../../core/math';

interface VendorCardProps {
  summary: VendorFinancialSummary;
  onSelectVendor: (vendorId: string, vendorName: string) => void;
  onOpenPaymentModal: (vendorId: string, vendorName: string, remainingDue: number) => void;
}

export const VendorCard = React.memo(function VendorCard({
  summary,
  onSelectVendor,
  onOpenPaymentModal,
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
          <Text style={styles.name}>{summary.vendorName}</Text>
          <Badge
            label={summary.status === 'DUE' ? 'DUE PENDING' : summary.status}
            variant={getBadgeVariant(summary.status)}
          />
        </View>

        {/* 3-Stat Financial Strip */}
        <View style={styles.statsRow}>
          <View style={styles.statBox}>
            <Text style={styles.statLabel}>Purchases</Text>
            <Text style={styles.statValWhite}>{formatINR(summary.totalPurchases)}</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={styles.statLabel}>Total Paid</Text>
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
          title="Audit Ledger"
          variant="secondary"
          onPress={() => onSelectVendor(summary.vendorId, summary.vendorName)}
          style={styles.actionBtn}
        />
        <Button
          title="💳 Add Payment"
          variant="primary"
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
  },
  clickableHeader: {
    paddingBottom: 10,
  },
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  name: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  statsRow: {
    flexDirection: 'row',
    backgroundColor: '#020617',
    borderRadius: 12,
    padding: 10,
    gap: 8,
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
  },
  statValGreen: {
    fontSize: 13,
    fontWeight: '700',
    color: '#34d399',
    marginTop: 2,
  },
  statValDue: {
    fontSize: 14,
    fontWeight: '900',
    color: '#fb7185',
    marginTop: 2,
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
});
