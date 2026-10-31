import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { Card } from '../common/Card';
import { Badge } from '../common/Badge';
import { Button } from '../common/Button';
import { CustomerMonthSummary } from '../../core/types';
import { formatINR } from '../../core/math';
import { generateCustomerMonthlyPDF } from '../../core/pdf';

interface CustomerLedgerCardProps {
  summary: CustomerMonthSummary;
  onToggleSettlement: (customerName: string, monthStr: string) => void;
  onDeleteBill: (id: string) => void;
}

export const CustomerLedgerCard = React.memo(function CustomerLedgerCard({
  summary,
  onToggleSettlement,
  onDeleteBill,
}: CustomerLedgerCardProps) {
  const isPaid = summary.status === 'PAID';

  const handleDownloadPDF = async () => {
    try {
      await generateCustomerMonthlyPDF(
        summary.customerName,
        summary.monthStr,
        summary.bills,
        summary.status
      );
    } catch (err) {
      console.error('Failed to generate customer PDF:', err);
    }
  };

  return (
    <Card style={styles.card}>
      <View style={styles.header}>
        <View>
          <Text style={styles.name}>{summary.customerName}</Text>
          <Text style={styles.monthLabel}>Billing Month: {summary.monthStr}</Text>
        </View>
        <Badge
          label={isPaid ? 'PAID' : 'UNPAID'}
          variant={isPaid ? 'settled' : 'due'}
        />
      </View>

      {/* Bills List for this month */}
      <View style={styles.billsList}>
        {summary.bills.length === 0 ? (
          <Text style={styles.emptyText}>No sales bills logged for this month.</Text>
        ) : (
          summary.bills.map((bill) => (
            <View key={bill.id} style={styles.billRow}>
              <View style={styles.billMeta}>
                <Text style={styles.billDate}>{bill.date}</Text>
                {bill.billNumber ? (
                  <Text style={styles.billNumber}>#{bill.billNumber}</Text>
                ) : null}
              </View>
              <View style={styles.billRight}>
                <Text style={styles.billAmount}>{formatINR(bill.amount)}</Text>
                <Pressable
                  onPress={() => onDeleteBill(bill.id)}
                  hitSlop={8}
                  style={styles.deleteButton}
                >
                  <Feather name="trash-2" size={13} color="#f43f5e" />
                </Pressable>
              </View>
            </View>
          ))
        )}
      </View>

      {/* Footer Dues & Settlement / PDF Actions */}
      <View style={styles.footer}>
        <View>
          <Text style={styles.dueLabel}>Total Monthly Due</Text>
          <Text style={[styles.dueAmount, isPaid && styles.settledDueAmount]}>
            {formatINR(summary.totalDue)}
          </Text>
        </View>

        <View style={styles.actionsRow}>
          <Button
            title="PDF"
            variant="secondary"
            icon={<Feather name="file-text" size={13} color="#e2e8f0" />}
            onPress={handleDownloadPDF}
            style={styles.pdfBtn}
          />
          <Button
            title={isPaid ? 'Mark Unpaid' : 'Mark as Paid'}
            variant={isPaid ? 'secondary' : 'success'}
            icon={
              isPaid ? (
                <Feather name="rotate-ccw" size={13} color="#e2e8f0" />
              ) : (
                <Feather name="check" size={13} color="#ffffff" />
              )
            }
            onPress={() => onToggleSettlement(summary.customerName, summary.monthStr)}
            style={styles.settleBtn}
          />
        </View>
      </View>
    </Card>
  );
});

const styles = StyleSheet.create({
  card: {
    marginBottom: 14,
    backgroundColor: '#0b1329',
    borderColor: '#1e293b',
    borderWidth: 1,
    borderRadius: 14,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#1e293b',
    paddingBottom: 10,
    marginBottom: 10,
  },
  name: {
    fontSize: 16,
    fontWeight: '700',
    color: '#ffffff',
  },
  monthLabel: {
    fontSize: 12,
    color: '#94a3b8',
    marginTop: 2,
  },
  billsList: {
    gap: 6,
    marginBottom: 12,
  },
  emptyText: {
    color: '#64748b',
    fontSize: 12,
    fontStyle: 'italic',
    paddingVertical: 6,
  },
  billRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#020617',
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#0f172a',
  },
  billMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  billDate: {
    fontSize: 12,
    color: '#94a3b8',
  },
  billNumber: {
    fontSize: 11,
    color: '#64748b',
    backgroundColor: '#1e293b',
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 4,
    fontFamily: 'monospace',
  },
  billRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  billAmount: {
    fontSize: 13,
    fontWeight: '700',
    color: '#ffffff',
    fontFamily: 'monospace',
  },
  deleteButton: {
    padding: 3,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#1e293b',
    paddingTop: 10,
  },
  dueLabel: {
    fontSize: 11,
    color: '#94a3b8',
    textTransform: 'uppercase',
    fontWeight: '600',
  },
  dueAmount: {
    fontSize: 17,
    fontWeight: '800',
    color: '#fb7185',
    fontFamily: 'monospace',
    marginTop: 2,
  },
  settledDueAmount: {
    color: '#34d399',
  },
  actionsRow: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
  },
  pdfBtn: {
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  settleBtn: {
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
});
