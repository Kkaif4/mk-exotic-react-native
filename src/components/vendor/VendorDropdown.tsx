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
import { VendorFinancialSummary } from '../../core/types';
import { formatINR } from '../../core/math';
import { colors } from '../../core/theme';

interface VendorDropdownProps {
  vendorSummaries: VendorFinancialSummary[];
  selectedVendorId: string; // 'ALL' or specific vendorId
  onSelectVendor: (vendorId: string, vendorName: string) => void;
}

export const VendorDropdown = React.memo(function VendorDropdown({
  vendorSummaries,
  selectedVendorId,
  onSelectVendor,
}: VendorDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Find currently selected vendor summary
  const selectedVendor = useMemo(() => {
    if (selectedVendorId === 'ALL') return null;
    return (
      vendorSummaries.find(
        (v) =>
          v.vendorId === selectedVendorId ||
          v.vendorName.toLowerCase() === selectedVendorId.toLowerCase()
      ) || null
    );
  }, [vendorSummaries, selectedVendorId]);

  // Filter vendors based on search query
  const filteredVendors = useMemo(() => {
    if (!searchQuery.trim()) return vendorSummaries;
    const q = searchQuery.toLowerCase().trim();
    return vendorSummaries.filter((v) =>
      v.vendorName.toLowerCase().includes(q)
    );
  }, [vendorSummaries, searchQuery]);

  return (
    <View style={styles.container}>
      {/* Label indicating vendor selection */}
      <View style={styles.labelRow}>
        <Text style={styles.label}>
          Vendor Filter <Text style={styles.mandatoryAsterisk}>* (Default: First Vendor)</Text>
        </Text>
        {selectedVendor ? (
          <Text style={styles.labelCountBadge}>
            {selectedVendor.billCount} bills · {selectedVendor.paymentCount} payments
          </Text>
        ) : (
          <Text style={styles.labelCountBadge}>
            All {vendorSummaries.length} vendors
          </Text>
        )}
      </View>

      {/* Dropdown Trigger Button */}
      <Pressable
        onPress={() => setIsOpen((prev) => !prev)}
        style={[styles.triggerBtn, isOpen && styles.triggerBtnOpen]}
      >
        <View style={styles.triggerLeft}>
          <Feather name="truck" size={14} color={colors.information} />
          {selectedVendor ? (
            <Text style={styles.selectedVendorText} numberOfLines={1}>
              {selectedVendor.vendorName}
            </Text>
          ) : selectedVendorId === 'ALL' ? (
            <Text style={styles.selectedVendorText}>All Vendors (Overview)</Text>
          ) : (
            <Text style={styles.placeholderText}>Select a vendor...</Text>
          )}
        </View>

        <View style={styles.triggerRight}>
          {selectedVendor ? (
            <View
              style={[
                styles.dueBadgePill,
                selectedVendor.remainingDue > 0
                  ? styles.dueBadgeDanger
                  : styles.dueBadgeSettled,
              ]}
            >
              <Text
                style={[
                  styles.dueBadgePillText,
                  selectedVendor.remainingDue > 0
                    ? styles.dueTextDanger
                    : styles.dueTextSettled,
                ]}
              >
                {selectedVendor.remainingDue > 0
                  ? `Due: ${formatINR(selectedVendor.remainingDue)}`
                  : 'Settled'}
              </Text>
            </View>
          ) : null}
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
            <Feather
              name="search"
              size={14}
              color={colors.textSecondary}
              style={styles.searchIcon}
            />
            <TextInput
              style={styles.searchInput}
              placeholder="Search vendor name..."
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

          {/* Vendor Options List */}
          <ScrollView
            style={styles.optionsList}
            nestedScrollEnabled
            keyboardShouldPersistTaps="handled"
          >
            {/* Option to show All Vendors */}
            <Pressable
              onPress={() => {
                onSelectVendor('ALL', 'All Vendors');
                setIsOpen(false);
                setSearchQuery('');
              }}
              style={({ pressed }) => [
                styles.optionItem,
                selectedVendorId === 'ALL' && styles.optionItemSelected,
                pressed && styles.optionItemPressed,
              ]}
            >
              <View style={styles.optionLeft}>
                <Feather name="grid" size={12} color={colors.information} />
                <Text
                  style={[
                    styles.optionText,
                    selectedVendorId === 'ALL' && styles.optionTextSelected,
                  ]}
                >
                  All Vendors ({vendorSummaries.length})
                </Text>
              </View>
              {selectedVendorId === 'ALL' && (
                <Feather name="check" size={13} color={colors.brandHighlight} />
              )}
            </Pressable>

            {filteredVendors.length === 0 ? (
              <View style={styles.emptyOption}>
                <Text style={styles.emptyOptionText}>
                  {searchQuery
                    ? `No vendor matching "${searchQuery}"`
                    : 'No vendors registered'}
                </Text>
              </View>
            ) : (
              filteredVendors.map((v) => {
                const isSelected =
                  v.vendorId === selectedVendorId ||
                  v.vendorName.toLowerCase() === selectedVendorId.toLowerCase();
                return (
                  <Pressable
                    key={v.vendorId || v.vendorName}
                    onPress={() => {
                      onSelectVendor(v.vendorId, v.vendorName);
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
                      <View
                        style={[
                          styles.optionDot,
                          v.status === 'DUE'
                            ? styles.dotDanger
                            : v.status === 'SETTLED'
                            ? styles.dotSettled
                            : styles.dotAdvance,
                        ]}
                      />
                      <Text
                        style={[
                          styles.optionText,
                          isSelected && styles.optionTextSelected,
                        ]}
                      >
                        {v.vendorName}
                      </Text>
                    </View>

                    <View style={styles.optionRight}>
                      <Text
                        style={[
                          styles.optionDueText,
                          v.remainingDue > 0
                            ? styles.dueTextDanger
                            : styles.dueTextSettled,
                        ]}
                      >
                        {v.remainingDue > 0
                          ? `Due: ${formatINR(v.remainingDue)}`
                          : 'Settled'}
                      </Text>
                      {isSelected && (
                        <Feather
                          name="check"
                          size={13}
                          color={colors.brandHighlight}
                        />
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
    zIndex: 25,
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
    color: colors.brandHighlight,
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
  selectedVendorText: {
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
  dueBadgePill: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    borderWidth: 1,
  },
  dueBadgeDanger: {
    backgroundColor: 'rgba(217, 74, 80, 0.15)',
    borderColor: 'rgba(217, 74, 80, 0.3)',
  },
  dueBadgeSettled: {
    backgroundColor: 'rgba(38, 148, 91, 0.15)',
    borderColor: 'rgba(38, 148, 91, 0.3)',
  },
  dueBadgePillText: {
    fontSize: 11,
    fontWeight: '700',
    fontFamily: 'monospace',
  },
  dueTextDanger: {
    color: colors.danger,
  },
  dueTextSettled: {
    color: colors.brandHighlight,
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
  },
  dotDanger: {
    backgroundColor: colors.danger,
  },
  dotSettled: {
    backgroundColor: colors.brandHighlight,
  },
  dotAdvance: {
    backgroundColor: colors.information,
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
  optionDueText: {
    fontSize: 11,
    fontWeight: '600',
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
