import React, { useState, useCallback } from 'react';
import { View, Text, Modal, StyleSheet, Pressable } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { Input } from '../common/Input';
import { Button } from '../common/Button';
import { PaymentMode } from '../../core/types';
import { isValidMoneyAmount, formatINR } from '../../core/math';
import { colors } from '../../core/theme';

interface PaymentModalProps {
  visible: boolean;
  vendorName: string;
  currentDue: number;
  onClose: () => void;
  onSavePayment: (payment: {
    amount: number;
    date: string;
    paymentMode: PaymentMode;
    referenceNote?: string;
  }) => void;
}

const PAYMENT_MODES: PaymentMode[] = ['Cash', 'UPI', 'Bank Transfer', 'Cheque'];

export const PaymentModal = React.memo(function PaymentModal({
  visible,
  vendorName,
  currentDue,
  onClose,
  onSavePayment,
}: PaymentModalProps) {
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState(() => new Date().toISOString().substring(0, 10));
  const [mode, setMode] = useState<PaymentMode>('Cash');
  const [note, setNote] = useState('');
  const [error, setError] = useState('');

  const handleSave = useCallback(() => {
    setError('');
    if (!isValidMoneyAmount(amount)) {
      setError('Please enter a valid positive payment amount.');
      return;
    }

    onSavePayment({
      amount: parseFloat(amount),
      date,
      paymentMode: mode,
      referenceNote: note.trim() || undefined,
    });

    setAmount('');
    setNote('');
    onClose();
  }, [amount, date, mode, note, onSavePayment, onClose]);

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.modalCard}>
          <View style={styles.modalHeader}>
            <View>
              <Text style={styles.title}>Record Vendor Payment</Text>
              <Text style={styles.subtitle}>Pay due balance to {vendorName}</Text>
            </View>
            <Pressable onPress={onClose} hitSlop={12} style={styles.closeBtnBox}>
              <Feather name="x" size={18} color={colors.textSecondary} />
            </Pressable>
          </View>

          {/* Current Due Snapshot */}
          <View style={styles.dueBox}>
            <Text style={styles.dueLabel}>Current Outstanding Due:</Text>
            <Text style={styles.dueValue}>{formatINR(currentDue)}</Text>
          </View>

          <Input
            label="Payment Amount (₹) *"
            placeholder="e.g. 10000"
            keyboardType="numeric"
            value={amount}
            onChangeText={setAmount}
            error={error}
          />

          <Input
            label="Payment Date"
            placeholder="YYYY-MM-DD"
            value={date}
            onChangeText={setDate}
          />

          {/* Mode Selector */}
          <Text style={styles.modeLabel}>Payment Mode</Text>
          <View style={styles.modeGrid}>
            {PAYMENT_MODES.map((m) => (
              <Pressable
                key={m}
                onPress={() => setMode(m)}
                style={[styles.modeButton, mode === m && styles.modeButtonActive]}
              >
                <Text style={[styles.modeText, mode === m && styles.modeTextActive]}>
                  {m}
                </Text>
              </Pressable>
            ))}
          </View>

          <Input
            label="Reference Note (Optional)"
            placeholder="e.g. GPay ref #12345 or Partial advance"
            value={note}
            onChangeText={setNote}
          />

          <View style={styles.actions}>
            <Button
              title="Cancel"
              variant="secondary"
              onPress={onClose}
              style={styles.cancelBtn}
            />
            <Button
              title="Save Payment"
              variant="primary"
              icon={<Feather name="check" size={14} color={colors.textPrimary} />}
              onPress={handleSave}
              style={styles.saveBtn}
            />
          </View>
        </View>
      </View>
    </Modal>
  );
});

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(7, 22, 41, 0.88)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  modalCard: {
    width: '100%',
    maxWidth: 440,
    backgroundColor: colors.surface,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 20,
    shadowColor: '#000000',
    shadowOpacity: 0.35,
    shadowRadius: 16,
    elevation: 8,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 14,
  },
  title: {
    fontSize: 17,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  subtitle: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 2,
  },
  closeBtnBox: {
    padding: 4,
  },
  dueBox: {
    backgroundColor: colors.appBackground,
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 14,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  dueLabel: {
    fontSize: 12,
    color: colors.textSecondary,
    fontWeight: '500',
  },
  dueValue: {
    fontSize: 15,
    fontWeight: '800',
    color: colors.danger,
    fontFamily: 'monospace',
  },
  modeLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: 6,
  },
  modeGrid: {
    flexDirection: 'row',
    gap: 6,
    marginBottom: 14,
  },
  modeButton: {
    flex: 1,
    backgroundColor: colors.appBackground,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    paddingVertical: 8,
    alignItems: 'center',
  },
  modeButtonActive: {
    borderColor: colors.information,
    backgroundColor: 'rgba(57, 124, 194, 0.18)',
  },
  modeText: {
    fontSize: 11,
    color: colors.textSecondary,
    fontWeight: '600',
  },
  modeTextActive: {
    color: colors.textPrimary,
    fontWeight: '700',
  },
  actions: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 18,
  },
  cancelBtn: {
    flex: 1,
  },
  saveBtn: {
    flex: 1.4,
  },
});
