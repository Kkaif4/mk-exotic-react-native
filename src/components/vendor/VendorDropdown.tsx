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
      {/* Inline Compact Dropdown Trigger */}
      <Pressable
        onPress={() => setIsOpen((prev) => !prev)}
        style={[styles.triggerBtn, isOpen && styles.triggerBtnOpen]}
      >
        <Feather name="truck" size={13} color={colors.information} />
        <Text style={styles.vendorLabel}>Vendor:</Text>
        <Text style={styles.selectedVendorText} numberOfLines={1}>
          {selectedVendor ? selectedVendor.vendorName : 'All Vendors'}
        </Text>

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
          size={14}
          color={colors.textSecondary}
        />
      </Pressable>

      {/* Dropdown Menu & Search Input (Floats right below) */}
      {isOpen && (
        <View style={styles.dropdownMenu}>
          {/* Search Input Box */}
          <View style={styles.searchBox}>
            <Feather
              name="search"
              size={13}
              color={colors.textSecondary}
              style={styles.searchIcon}
            />
            <TextInput
              style={styles.searchInput}
              placeholder="Search vendor..."
              placeholderTextColor={colors.textMuted}
              value={searchQuery}
              onChangeText={setSearchQuery}
              autoFocus
            />
            {searchQuery ? (
              <Pressable onPress={() => setSearchQuery('')} hitSlop={6}>
                <Feather name="x" size={12} color={colors.textSecondary} />
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
                <Feather name="check" size={12} color={colors.brandHighlight} />
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
                          size={12}
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
  vendorLabel: {
    fontSize: 11,
    color: colors.textSecondary,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  selectedVendorText: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.textPrimary,
    maxWidth: 130,
  },
  dueBadgePill: {
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 5,
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
    fontSize: 10,
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
    position: 'absolute',
    top: 42,
    left: 0,
    minWidth: 280,
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
  optionDueText: {
    fontSize: 11,
    fontWeight: '600',
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
