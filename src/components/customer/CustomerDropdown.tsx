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

  const handleSelectTop = () => {
    if (filteredCustomers.length > 0) {
      onSelectCustomer(filteredCustomers[0]);
      setIsOpen(false);
      setSearchQuery('');
    }
  };

  return (
    <View style={styles.container}>
      {/* Inline Compact Dropdown Trigger */}
      <Pressable
        onPress={() => setIsOpen((prev) => !prev)}
        style={[styles.triggerBtn, isOpen && styles.triggerBtnOpen]}
      >
        <Feather name="user" size={13} color={colors.information} />
        <Text style={styles.customerLabel}>Customer:</Text>
        <Text style={styles.selectedCustomerText} numberOfLines={1}>
          {selectedCustomer || 'Select'}
        </Text>
        <View style={styles.activeBillPill}>
          <Text style={styles.activeBillPillText}>{selectedCount} bills</Text>
        </View>
        <Feather
          name={isOpen ? 'chevron-up' : 'chevron-down'}
          size={14}
          color={colors.textSecondary}
        />
      </Pressable>

      {/* Dropdown Menu & Search Input (Floats right below) */}
      {isOpen && (
        <View style={styles.dropdownMenu}>
          {/* Search Input Box */}
          <View style={styles.searchBox}>
            <Feather name="search" size={13} color={colors.textSecondary} style={styles.searchIcon} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search customer..."
              placeholderTextColor={colors.textMuted}
              value={searchQuery}
              onChangeText={setSearchQuery}
              returnKeyType="done"
              onSubmitEditing={handleSelectTop}
              autoFocus
            />
            {searchQuery ? (
              <Pressable onPress={() => setSearchQuery('')} hitSlop={6}>
                <Feather name="x" size={12} color={colors.textSecondary} />
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
                        <Feather name="check" size={12} color={colors.brandHighlight} />
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
    zIndex: 100,
  },
  triggerBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    paddingHorizontal: 10,
    height: 38,
    gap: 6,
  },
  triggerBtnOpen: {
    borderColor: colors.information,
    backgroundColor: colors.elevatedSurface,
  },
  customerLabel: {
    fontSize: 11,
    color: colors.textSecondary,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  selectedCustomerText: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.textPrimary,
    maxWidth: 130,
  },
  activeBillPill: {
    backgroundColor: 'rgba(57, 124, 194, 0.15)',
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 5,
    borderWidth: 1,
    borderColor: 'rgba(57, 124, 194, 0.3)',
  },
  activeBillPillText: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.information,
    fontFamily: 'monospace',
  },
  dropdownMenu: {
    position: 'absolute',
    top: 42,
    left: 0,
    minWidth: 260,
    backgroundColor: colors.elevatedSurface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    padding: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 10,
    zIndex: 9999,
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.appBackground,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 6,
    paddingHorizontal: 8,
    height: 32,
    marginBottom: 6,
  },
  searchIcon: {
    marginRight: 6,
  },
  searchInput: {
    flex: 1,
    color: colors.textPrimary,
    fontSize: 12,
    padding: 0,
    // @ts-ignore
    outlineStyle: 'none',
  },
  optionsList: {
    maxHeight: 200,
  },
  optionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 8,
    paddingVertical: 7,
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
    gap: 7,
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
    fontSize: 12,
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
    gap: 6,
  },
  optionBillCount: {
    fontSize: 11,
    color: colors.textSecondary,
    fontFamily: 'monospace',
  },
  emptyOption: {
    padding: 12,
    alignItems: 'center',
  },
  emptyOptionText: {
    fontSize: 12,
    color: colors.textMuted,
    fontStyle: 'italic',
  },
});
