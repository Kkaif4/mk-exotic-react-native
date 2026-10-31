import React, { useState } from 'react';
import { View, Text, StyleSheet, SafeAreaView, Pressable } from 'react-native';
import { useVendorLedger } from '../hooks/useVendorLedger';
import { Card } from '../components/common/Card';
import { Button } from '../components/common/Button';
import { Badge } from '../components/common/Badge';
import { VendorLedgerTimeline } from '../components/vendor/VendorLedgerTimeline';
import { PaymentModal } from '../components/forms/PaymentModal';
import { formatINR } from '../core/math';

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
  const {
    financialSummary,
    auditTimeline,
    recordPayment,
    deletePayment,
    deleteBill,
  } = useVendorLedger(vendorId, vendorName);

  const [paymentModalOpen, setPaymentModalOpen] = useState(false);

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        {/* Header with Back Button */}
        <View style={styles.header}>
          <Pressable onPress={onBack} hitSlop={12} style={styles.backButton}>
            <Text style={styles.backText}>‹ Back</Text>
          </Pressable>
          <View style={styles.titleCol}>
            <Text style={styles.vendorName}>{vendorName}</Text>
            <Text style={styles.subtitle}>Continuous Lifetime Audit (No Month Filter)</Text>
          </View>
        </View>

        {/* Financial Overview Card */}
        <Card style={styles.overviewCard}>
          <View style={styles.statusRow}>
            <Text style={styles.cardHeaderTitle}>Ledger Summary</Text>
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

          <Button
            title="💳 Record Payment"
            variant="primary"
            onPress={() => setPaymentModalOpen(true)}
            style={styles.payBtn}
          />
        </Card>

        {/* Audit Timeline Section */}
        <View style={styles.timelineHeader}>
          <Text style={styles.timelineTitle}>
            Chronological Audit History ({auditTimeline.length})
          </Text>
        </View>

        <VendorLedgerTimeline
          timeline={auditTimeline}
          onDeleteBill={deleteBill}
          onDeletePayment={deletePayment}
        />
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
    backgroundColor: '#020617',
  },
  container: {
    flex: 1,
    padding: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    gap: 12,
  },
  backButton: {
    paddingVertical: 6,
    paddingHorizontal: 10,
    backgroundColor: '#0f172a',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#1e293b',
  },
  backText: {
    color: '#38bdf8',
    fontSize: 14,
    fontWeight: '700',
  },
  titleCol: {
    flex: 1,
  },
  vendorName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  subtitle: {
    fontSize: 11,
    color: '#94a3b8',
    marginTop: 2,
  },
  overviewCard: {
    marginBottom: 16,
  },
  statusRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  cardHeaderTitle: {
    fontSize: 13,
    color: '#94a3b8',
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  statsGrid: {
    flexDirection: 'row',
    backgroundColor: '#020617',
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
    gap: 8,
  },
  statItem: {
    flex: 1,
  },
  statLabel: {
    fontSize: 10,
    color: '#94a3b8',
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  statValue: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#ffffff',
    marginTop: 2,
    fontFamily: 'monospace',
  },
  statValueGreen: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#34d399',
    marginTop: 2,
    fontFamily: 'monospace',
  },
  statValueDue: {
    fontSize: 14,
    fontWeight: '900',
    color: '#fb7185',
    marginTop: 2,
    fontFamily: 'monospace',
  },
  statValueSettled: {
    color: '#34d399',
  },
  payBtn: {
    marginTop: 4,
  },
  timelineHeader: {
    marginBottom: 10,
  },
  timelineTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#ffffff',
  },
});
