import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  TextInput,
  ScrollView,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { Bill } from '../../core/types';
import { colors } from '../../core/theme';

interface CustomerDropdownProps {
  customers: string[];
  selectedCustomer: string;
  onSelectCustomer: (customerName: string) => void;
  bills: Bill[];
  selectedMonth: string;
}

export const CustomerDropdown = React.memo(function CustomerDropdown({
  customers,
  selectedCustomer,
  onSelectCustomer,
  bills,
  selectedMonth,
}: CustomerDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Count bills for each customer in the selected month
  const customerBillCounts = useMemo(() => {
    const map = new Map<string, number>();
    for (const b of bills) {
      if (b.type === 'sale' && b.date.startsWith(selectedMonth)) {
        const norm = b.entityName.trim().toLowerCase();
        map.set(norm, (map.get(norm) || 0) + 1);
      }
    }
    return map;
  }, [bills, selectedMonth]);

  // Filter customers based on search query
  const filteredCustomers = useMemo(() => {
    if (!searchQuery.trim()) return customers;
    const q = searchQuery.toLowerCase().trim();
    return customers.filter((c) => c.toLowerCase().includes(q));
  }, [customers, searchQuery]);

  const selectedCount = customerBillCounts.get(selectedCustomer.trim().toLowerCase()) || 0;

  return (
    <View style={styles.container}>
      {/* Label indicating mandatory requirement */}
      <View style={styles.labelRow}>
        <Text style={styles.label}>
          Customer Name <Text style={styles.mandatoryAsterisk}>* (Mandatory Filter)</Text>
        </Text>
        {selectedCustomer ? (
          <Text style={styles.labelCountBadge}>
            {selectedCount} {selectedCount === 1 ? 'bill' : 'bills'} in {selectedMonth}
          </Text>
        ) : null}
      </View>

      {/* Dropdown Trigger Button */}
      <Pressable
        onPress={() => setIsOpen((prev) => !prev)}
        style={[styles.triggerBtn, isOpen && styles.triggerBtnOpen]}
      >
        <View style={styles.triggerLeft}>
          <Feather name="user" size={14} color={colors.information} />
          {selectedCustomer ? (
            <Text style={styles.selectedCustomerText} numberOfLines={1}>
              {selectedCustomer}
            </Text>
          ) : (
            <Text style={styles.placeholderText}>Select a customer...</Text>
          )}
        </View>

        <View style={styles.triggerRight}>
          <View style={styles.activeBillPill}>
            <Text style={styles.activeBillPillText}>{selectedCount} bills</Text>
          </View>
          <Feather
            name={isOpen ? 'chevron-up' : 'chevron-down'}
            size={16}
            color={colors.textSecondary}
          />
        </View>
      </Pressable>

      {/* Dropdown Menu & Search Input */}
      {isOpen && (
        <View style={styles.dropdownMenu}>
          {/* Search Input Box */}
          <View style={styles.searchBox}>
            <Feather name="search" size={14} color={colors.textSecondary} style={styles.searchIcon} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search customer name..."
              placeholderTextColor={colors.textMuted}
              value={searchQuery}
              onChangeText={setSearchQuery}
              autoFocus
            />
            {searchQuery ? (
              <Pressable onPress={() => setSearchQuery('')} hitSlop={8}>
                <Feather name="x" size={13} color={colors.textSecondary} />
              </Pressable>
            ) : null}
          </View>

          {/* Customer Options List */}
          <ScrollView
            style={styles.optionsList}
            nestedScrollEnabled
            keyboardShouldPersistTaps="handled"
          >
            {filteredCustomers.length === 0 ? (
              <View style={styles.emptyOption}>
                <Text style={styles.emptyOptionText}>
                  {searchQuery ? `No customer matching "${searchQuery}"` : 'No customers found'}
                </Text>
              </View>
            ) : (
              filteredCustomers.map((c) => {
                const isSelected = c.toLowerCase() === selectedCustomer.toLowerCase();
                const count = customerBillCounts.get(c.trim().toLowerCase()) || 0;
                return (
                  <Pressable
                    key={c}
                    onPress={() => {
                      onSelectCustomer(c);
                      setIsOpen(false);
                      setSearchQuery('');
                    }}
                    style={({ pressed }) => [
                      styles.optionItem,
                      isSelected && styles.optionItemSelected,
                      pressed && styles.optionItemPressed,
                    ]}
                  >
                    <View style={styles.optionLeft}>
                      <View style={[styles.optionDot, isSelected && styles.optionDotSelected]} />
                      <Text
                        style={[
                          styles.optionText,
                          isSelected && styles.optionTextSelected,
                        ]}
                      >
                        {c}
                      </Text>
                    </View>

                    <View style={styles.optionRight}>
                      <Text style={styles.optionBillCount}>
                        {count} {count === 1 ? 'bill' : 'bills'}
                      </Text>
                      {isSelected && (
                        <Feather name="check" size={13} color={colors.brandHighlight} />
                      )}
                    </View>
                  </Pressable>
                );
              })
            )}
          </ScrollView>
        </View>
      )}
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    zIndex: 20,
    marginBottom: 10,
  },
  labelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  label: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  mandatoryAsterisk: {
    color: colors.danger,
    fontWeight: '700',
    textTransform: 'none',
  },
  labelCountBadge: {
    fontSize: 11,
    color: colors.information,
    fontWeight: '600',
    fontFamily: 'monospace',
  },
  triggerBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  triggerBtnOpen: {
    borderColor: colors.information,
    backgroundColor: colors.elevatedSurface,
  },
  triggerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  selectedCustomerText: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  placeholderText: {
    fontSize: 14,
    color: colors.textMuted,
  },
  triggerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  activeBillPill: {
    backgroundColor: 'rgba(57, 124, 194, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: 'rgba(57, 124, 194, 0.3)',
  },
  activeBillPillText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.information,
    fontFamily: 'monospace',
  },
  dropdownMenu: {
    backgroundColor: colors.elevatedSurface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    marginTop: 4,
    padding: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.appBackground,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
    marginBottom: 6,
  },
  searchIcon: {
    marginRight: 6,
  },
  searchInput: {
    flex: 1,
    color: colors.textPrimary,
    fontSize: 13,
    padding: 0,
  },
  optionsList: {
    maxHeight: 200,
  },
  optionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 6,
  },
  optionItemSelected: {
    backgroundColor: 'rgba(57, 124, 194, 0.18)',
  },
  optionItemPressed: {
    backgroundColor: colors.hoverSurface,
  },
  optionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  optionDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.textMuted,
  },
  optionDotSelected: {
    backgroundColor: colors.brandHighlight,
  },
  optionText: {
    fontSize: 13,
    color: colors.textPrimary,
    fontWeight: '500',
  },
  optionTextSelected: {
    fontWeight: '700',
    color: colors.textPrimary,
  },
  optionRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  optionBillCount: {
    fontSize: 11,
    color: colors.textSecondary,
    fontFamily: 'monospace',
  },
  emptyOption: {
    padding: 14,
    alignItems: 'center',
  },
  emptyOptionText: {
    fontSize: 12,
    color: colors.textMuted,
    fontStyle: 'italic',
  },
});
