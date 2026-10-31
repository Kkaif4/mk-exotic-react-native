import React, { useState, useMemo } from 'react';
import { View, Text, StyleSheet, Pressable, ScrollView } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { colors } from '../../core/theme';

interface MonthYearPickerProps {
  selectedMonth: string; // e.g. "2026-10"
  onChangeMonth: (newMonthStr: string) => void;
  availableYears?: string[];
}

const MONTHS = [
  { label: 'Jan', fullName: 'January', val: '01' },
  { label: 'Feb', fullName: 'February', val: '02' },
  { label: 'Mar', fullName: 'March', val: '03' },
  { label: 'Apr', fullName: 'April', val: '04' },
  { label: 'May', fullName: 'May', val: '05' },
  { label: 'Jun', fullName: 'June', val: '06' },
  { label: 'Jul', fullName: 'July', val: '07' },
  { label: 'Aug', fullName: 'August', val: '08' },
  { label: 'Sep', fullName: 'September', val: '09' },
  { label: 'Oct', fullName: 'October', val: '10' },
  { label: 'Nov', fullName: 'November', val: '11' },
  { label: 'Dec', fullName: 'December', val: '12' },
];

const START_CALENDAR_YEAR = 2020;
const END_CALENDAR_YEAR = 2035;
const BASE_YEARS = Array.from(
  { length: END_CALENDAR_YEAR - START_CALENDAR_YEAR + 1 },
  (_, i) => String(START_CALENDAR_YEAR + i)
);

export const MonthYearPicker = React.memo(function MonthYearPicker({
  selectedMonth,
  onChangeMonth,
  availableYears,
}: MonthYearPickerProps) {
  const [isMonthOpen, setIsMonthOpen] = useState(false);
  const [isYearOpen, setIsYearOpen] = useState(false);

  const parts = (selectedMonth || '').split('-');
  const selectedYear = parts[0] || String(new Date().getFullYear());
  const selectedMonthVal = parts[1] || String(new Date().getMonth() + 1).padStart(2, '0');

  const currentMonthObj = MONTHS.find((m) => m.val === selectedMonthVal) || MONTHS[0];

  // Merge full calendar range with any custom years from bills or current selection
  const allYears = useMemo(() => {
    const yearSet = new Set<string>(BASE_YEARS);
    if (selectedYear && selectedYear.length === 4) {
      yearSet.add(selectedYear);
    }
    if (availableYears) {
      availableYears.forEach((y) => {
        if (y && y.length === 4) yearSet.add(y);
      });
    }
    return Array.from(yearSet).sort();
  }, [selectedYear, availableYears]);

  const handleSelectMonth = (val: string) => {
    onChangeMonth(`${selectedYear}-${val}`);
    setIsMonthOpen(false);
  };

  const handleSelectYear = (yr: string) => {
    onChangeMonth(`${yr}-${selectedMonthVal}`);
    setIsYearOpen(false);
  };

  return (
    <View style={styles.container}>
      {/* Month Dropdown */}
      <View style={styles.dropdownWrapper}>
        <Pressable
          onPress={() => {
            setIsMonthOpen((prev) => !prev);
            setIsYearOpen(false);
          }}
          style={[styles.pickerBtn, isMonthOpen && styles.pickerBtnActive]}
        >
          <Feather name="calendar" size={12} color={colors.information} />
          <Text style={styles.pickerText}>{currentMonthObj.label}</Text>
          <Feather
            name={isMonthOpen ? 'chevron-up' : 'chevron-down'}
            size={12}
            color={colors.textSecondary}
          />
        </Pressable>

        {isMonthOpen && (
          <View style={styles.dropdownMenuMonth}>
            <ScrollView style={styles.scrollList} nestedScrollEnabled>
              {MONTHS.map((m) => {
                const isSelected = m.val === selectedMonthVal;
                return (
                  <Pressable
                    key={m.val}
                    onPress={() => handleSelectMonth(m.val)}
                    style={({ pressed }) => [
                      styles.dropdownOption,
                      isSelected && styles.dropdownOptionSelected,
                      pressed && styles.dropdownOptionPressed,
                    ]}
                  >
                    <Text
                      style={[
                        styles.dropdownOptionText,
                        isSelected && styles.dropdownOptionTextSelected,
                      ]}
                    >
                      {m.fullName}
                    </Text>
                    {isSelected && (
                      <Feather name="check" size={11} color={colors.brandHighlight} />
                    )}
                  </Pressable>
                );
              })}
            </ScrollView>
          </View>
        )}
      </View>

      {/* Year Dropdown — Full Calendar Spectrum (2020-2035+) */}
      <View style={styles.dropdownWrapper}>
        <Pressable
          onPress={() => {
            setIsYearOpen((prev) => !prev);
            setIsMonthOpen(false);
          }}
          style={[styles.pickerBtn, isYearOpen && styles.pickerBtnActive]}
        >
          <Text style={styles.pickerText}>{selectedYear}</Text>
          <Feather
            name={isYearOpen ? 'chevron-up' : 'chevron-down'}
            size={12}
            color={colors.textSecondary}
          />
        </Pressable>

        {isYearOpen && (
          <View style={styles.dropdownMenuYear}>
            <ScrollView style={styles.scrollList} nestedScrollEnabled>
              {allYears.map((yr) => {
                const isSelected = yr === selectedYear;
                return (
                  <Pressable
                    key={yr}
                    onPress={() => handleSelectYear(yr)}
                    style={({ pressed }) => [
                      styles.dropdownOption,
                      isSelected && styles.dropdownOptionSelected,
                      pressed && styles.dropdownOptionPressed,
                    ]}
                  >
                    <Text
                      style={[
                        styles.dropdownOptionText,
                        isSelected && styles.dropdownOptionTextSelected,
                      ]}
                    >
                      {yr}
                    </Text>
                    {isSelected && (
                      <Feather name="check" size={11} color={colors.brandHighlight} />
                    )}
                  </Pressable>
                );
              })}
            </ScrollView>
          </View>
        )}
      </View>
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    zIndex: 9999,
  },
  dropdownWrapper: {
    position: 'relative',
    zIndex: 9999,
  },
  pickerBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 6,
    height: 38,
  },
  pickerBtnActive: {
    borderColor: colors.information,
    backgroundColor: colors.elevatedSurface,
  },
  pickerText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  dropdownMenuMonth: {
    position: 'absolute',
    top: 42,
    left: 0,
    width: 140,
    backgroundColor: colors.elevatedSurface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    padding: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 10,
    zIndex: 9999,
  },
  dropdownMenuYear: {
    position: 'absolute',
    top: 42,
    left: 0,
    width: 95,
    backgroundColor: colors.elevatedSurface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    padding: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 10,
    zIndex: 9999,
  },
  scrollList: {
    maxHeight: 220,
  },
  dropdownOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: 6,
  },
  dropdownOptionSelected: {
    backgroundColor: 'rgba(57, 124, 194, 0.18)',
  },
  dropdownOptionPressed: {
    backgroundColor: colors.hoverSurface,
  },
  dropdownOptionText: {
    fontSize: 12,
    color: colors.textPrimary,
    fontWeight: '500',
  },
  dropdownOptionTextSelected: {
    color: colors.brandHighlight,
    fontWeight: '700',
  },
});
