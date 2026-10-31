import React, { useState, useMemo, useCallback } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { Card } from '../common/Card';
import { Input } from '../common/Input';
import { Button } from '../common/Button';
import { BillType, Vendor } from '../../core/types';
import { isValidMoneyAmount } from '../../core/math';

interface BillFormProps {
  existingNames: { customers: string[]; vendors: string[] };
  registeredVendors: Vendor[];
  onAddBill: (bill: {
    type: BillType;
    entityName: string;
    billNumber: string;
    date: string;
    amount: number;
    vendorId?: string;
  }) => void;
}

export const BillForm = React.memo(function BillForm({
  existingNames,
  registeredVendors,
  onAddBill,
}: BillFormProps) {
  const [type, setType] = useState<BillType>('sale');
  const [entityName, setEntityName] = useState('');
  const [billNumber, setBillNumber] = useState('');
  const [date, setDate] = useState(() => new Date().toISOString().substring(0, 10));
  const [amount, setAmount] = useState('');
  const [error, setError] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);

  const suggestions = useMemo(() => {
    const list = type === 'sale' ? existingNames.customers : existingNames.vendors;
    if (!entityName.trim()) return [];
    return list.filter((n) => n.toLowerCase().includes(entityName.toLowerCase()));
  }, [type, existingNames, entityName]);

  const handleSubmit = useCallback(() => {
    setError('');
    const cleanName = entityName.trim();
    if (!cleanName) {
      setError('Please enter a customer or vendor name.');
      return;
    }
    if (!isValidMoneyAmount(amount)) {
      setError('Please enter a valid positive bill amount.');
      return;
    }

    let vendorId: string | undefined;
    if (type === 'purchase') {
      const match = registeredVendors.find(
        (v) => v.name.toLowerCase() === cleanName.toLowerCase()
      );
      if (match) vendorId = match.id;
    }

    onAddBill({
      type,
      entityName: cleanName,
      billNumber: billNumber.trim(),
      date,
      amount: parseFloat(amount),
      vendorId,
    });

    setEntityName('');
    setBillNumber('');
    setAmount('');
    setShowDropdown(false);
  }, [type, entityName, billNumber, date, amount, registeredVendors, onAddBill]);

  return (
    <Card style={styles.card}>
      <View style={styles.header}>
        <Text style={styles.title}>Log New Bill</Text>
        <Text style={styles.subtext}>3-Field Fast Entry</Text>
      </View>

      {/* Bill Type Selector */}
      <View style={styles.typeSelector}>
        <Pressable
          onPress={() => {
            setType('sale');
            setEntityName('');
          }}
          style={[styles.typeButton, type === 'sale' && styles.saleActive]}
        >
          <Text style={[styles.typeText, type === 'sale' && styles.typeTextActive]}>
            🛒 Customer Sale
          </Text>
        </Pressable>
        <Pressable
          onPress={() => {
            setType('purchase');
            setEntityName('');
          }}
          style={[styles.typeButton, type === 'purchase' && styles.purchaseActive]}
        >
          <Text style={[styles.typeText, type === 'purchase' && styles.typeTextActive]}>
            📦 Vendor Purchase
          </Text>
        </Pressable>
      </View>

      {/* Name Input with Autocomplete */}
      <View style={styles.inputContainer}>
        <Input
          label={type === 'sale' ? 'Customer Name' : 'Vendor Name'}
          placeholder={type === 'sale' ? 'e.g. John Doe, Fresh Mart' : 'e.g. Exotic Imports Co.'}
          value={entityName}
          onChangeText={(txt) => {
            setEntityName(txt);
            setShowDropdown(true);
          }}
          onFocus={() => setShowDropdown(true)}
        />
        {showDropdown && suggestions.length > 0 && (
          <View style={styles.dropdown}>
            {suggestions.slice(0, 4).map((sugg) => (
              <Pressable
                key={sugg}
                onPress={() => {
                  setEntityName(sugg);
                  setShowDropdown(false);
                }}
                style={styles.dropdownItem}
              >
                <Text style={styles.dropdownText}>{sugg}</Text>
              </Pressable>
            ))}
          </View>
        )}
      </View>

      <Input
        label="Bill Number (Optional)"
        placeholder="e.g. 1042"
        value={billNumber}
        onChangeText={setBillNumber}
      />

      <Input
        label="Date"
        placeholder="YYYY-MM-DD"
        value={date}
        onChangeText={setDate}
      />

      <Input
        label="Bill Amount (₹)"
        placeholder="e.g. 20000"
        keyboardType="numeric"
        value={amount}
        onChangeText={setAmount}
        error={error}
      />

      <Button
        title={`Save ${type === 'sale' ? 'Customer Bill' : 'Vendor Purchase'}`}
        variant={type === 'sale' ? 'success' : 'primary'}
        onPress={handleSubmit}
        style={styles.submitBtn}
      />
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
    marginBottom: 16,
  },
  title: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  subtext: {
    fontSize: 12,
    color: '#94a3b8',
  },
  typeSelector: {
    flexDirection: 'row',
    backgroundColor: '#020617',
    borderRadius: 12,
    padding: 4,
    marginBottom: 14,
    gap: 6,
  },
  typeButton: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 8,
  },
  saleActive: {
    backgroundColor: '#059669',
  },
  purchaseActive: {
    backgroundColor: '#4f46e5',
  },
  typeText: {
    color: '#94a3b8',
    fontSize: 13,
    fontWeight: '600',
  },
  typeTextActive: {
    color: '#ffffff',
    fontWeight: '700',
  },
  inputContainer: {
    position: 'relative',
    zIndex: 10,
  },
  dropdown: {
    position: 'absolute',
    top: 64,
    left: 0,
    right: 0,
    backgroundColor: '#0f172a',
    borderWidth: 1,
    borderColor: '#334155',
    borderRadius: 8,
    zIndex: 20,
    shadowColor: '#000',
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 6,
  },
  dropdownItem: {
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#1e293b',
  },
  dropdownText: {
    color: '#e2e8f0',
    fontSize: 13,
  },
  submitBtn: {
    marginTop: 6,
  },
});
