import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { Card } from '../common/Card';
import { Badge } from '../common/Badge';
import { Button } from '../common/Button';
import { CustomerMonthSummary, Bill } from '../../core/types';
import { formatINR } from '../../core/math';

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

  return (
    <Card style={styles.card}>
      <View style={styles.header}>
        <View>
          <Text style={styles.name}>{summary.customerName}</Text>
          <Text style={styles.monthLabel}>Month: {summary.monthStr}</Text>
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
              <View>
                <Text style={styles.billDate}>{bill.date}</Text>
                {bill.billNumber ? (
                  <Text style={styles.billNumber}>#{bill.billNumber}</Text>
                ) : null}
              </View>
              <View style={styles.billRight}>
                <Text style={styles.billAmount}>{formatINR(bill.amount)}</Text>
                <Pressable onPress={() => onDeleteBill(bill.id)} hitSlop={8}>
                  <Text style={styles.deleteCross}>✕</Text>
                </Pressable>
              </View>
            </View>
          ))
        )}
      </View>

      {/* Footer Dues & Settlement Button */}
      <View style={styles.footer}>
        <View>
          <Text style={styles.dueLabel}>Total Monthly Due</Text>
          <Text style={styles.dueAmount}>{formatINR(summary.totalDue)}</Text>
        </View>

        <Button
          title={isPaid ? 'Mark UNPAID' : 'MARK AS PAID'}
          variant={isPaid ? 'secondary' : 'success'}
          onPress={() => onToggleSettlement(summary.customerName, summary.monthStr)}
          style={styles.settleBtn}
        />
      </View>
    </Card>
  );
});

const styles = StyleSheet.create({
  card: {
    marginBottom: 16,
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
    fontWeight: 'bold',
    color: '#ffffff',
  },
  monthLabel: {
    fontSize: 12,
    color: '#94a3b8',
    marginTop: 2,
  },
  billsList: {
    marginBottom: 12,
  },
  emptyText: {
    color: '#64748b',
    fontSize: 13,
    fontStyle: 'italic',
    paddingVertical: 12,
    textAlign: 'center',
  },
  billRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#020617',
    borderRadius: 8,
    padding: 10,
    marginBottom: 6,
  },
  billDate: {
    fontSize: 12,
    color: '#94a3b8',
    fontFamily: 'monospace',
  },
  billNumber: {
    fontSize: 11,
    color: '#64748b',
  },
  billRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  billAmount: {
    fontSize: 13,
    fontWeight: '700',
    color: '#ffffff',
    fontFamily: 'monospace',
  },
  deleteCross: {
    color: '#64748b',
    fontSize: 14,
    paddingHorizontal: 4,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#1e293b',
    paddingTop: 12,
  },
  dueLabel: {
    fontSize: 11,
    color: '#94a3b8',
    textTransform: 'uppercase',
  },
  dueAmount: {
    fontSize: 18,
    fontWeight: '900',
    color: '#ffffff',
    fontFamily: 'monospace',
    marginTop: 2,
  },
  settleBtn: {
    minWidth: 130,
  },
});
