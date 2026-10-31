import React from 'react';
import { View, Text, StyleSheet, FlatList, Pressable } from 'react-native';
import { VendorAuditItem } from '../../core/types';
import { formatINR } from '../../core/math';

interface VendorLedgerTimelineProps {
  timeline: VendorAuditItem[];
  onDeleteBill?: (id: string) => void;
  onDeletePayment?: (id: string) => void;
}

export const VendorLedgerTimeline = React.memo(function VendorLedgerTimeline({
  timeline,
  onDeleteBill,
  onDeletePayment,
}: VendorLedgerTimelineProps) {
  if (timeline.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyText}>No transactions recorded for this vendor.</Text>
      </View>
    );
  }

  const renderItem = ({ item }: { item: VendorAuditItem }) => {
    const isBill = item.type === 'bill';
    return (
      <View style={styles.itemRow}>
        <View style={styles.leftCol}>
          <Text style={styles.dateText}>{item.date}</Text>
          <Text style={styles.descText}>{item.description}</Text>
          <Text style={styles.balanceText}>
            Balance: <Text style={styles.balanceVal}>{formatINR(item.runningBalance)}</Text>
          </Text>
        </View>

        <View style={styles.rightCol}>
          <Text style={isBill ? styles.debitText : styles.creditText}>
            {isBill ? `+ ${formatINR(item.debit)}` : `- ${formatINR(item.credit)}`}
          </Text>
          <Pressable
            onPress={() => {
              if (isBill && onDeleteBill) onDeleteBill(item.id);
              if (!isBill && onDeletePayment) onDeletePayment(item.id);
            }}
            hitSlop={10}
            style={styles.deleteButton}
          >
            <Text style={styles.deleteText}>Delete ✕</Text>
          </Pressable>
        </View>
      </View>
    );
  };

  return (
    <FlatList
      data={timeline}
      keyExtractor={(item) => item.id}
      renderItem={renderItem}
      contentContainerStyle={styles.list}
      initialNumToRender={10}
      maxToRenderPerBatch={10}
    />
  );
});

const styles = StyleSheet.create({
  emptyContainer: {
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    color: '#64748b',
    fontSize: 13,
    fontStyle: 'italic',
  },
  list: {
    paddingBottom: 20,
  },
  itemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#0f172a',
    borderWidth: 1,
    borderColor: '#1e293b',
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
  },
  leftCol: {
    flex: 1,
    paddingRight: 10,
  },
  dateText: {
    fontSize: 11,
    color: '#94a3b8',
    marginBottom: 2,
    fontFamily: 'monospace',
  },
  descText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#ffffff',
    marginBottom: 2,
  },
  balanceText: {
    fontSize: 11,
    color: '#64748b',
  },
  balanceVal: {
    color: '#cbd5e1',
    fontWeight: '600',
    fontFamily: 'monospace',
  },
  rightCol: {
    alignItems: 'flex-end',
  },
  debitText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#fb7185',
    fontFamily: 'monospace',
  },
  creditText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#34d399',
    fontFamily: 'monospace',
  },
  deleteButton: {
    marginTop: 4,
  },
  deleteText: {
    fontSize: 11,
    color: '#64748b',
  },
});
