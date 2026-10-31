import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors } from '../../core/theme';

interface BadgeProps {
  label: string;
  variant?: 'due' | 'settled' | 'advance' | 'neutral';
}

export const Badge = React.memo(function Badge({
  label,
  variant = 'neutral',
}: BadgeProps) {
  return (
    <View style={[styles.badge, styles[variant]]}>
      <View style={[styles.dot, dotStyles[variant]]} />
      <Text style={[styles.text, textStyles[variant]]}>{label}</Text>
    </View>
  );
});

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 9,
    paddingVertical: 3.5,
    borderRadius: 999,
    borderWidth: 1,
    alignSelf: 'flex-start',
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 6,
  },
  due: {
    backgroundColor: 'rgba(217, 74, 80, 0.14)',
    borderColor: 'rgba(217, 74, 80, 0.4)',
  },
  settled: {
    backgroundColor: 'rgba(38, 148, 91, 0.14)',
    borderColor: 'rgba(38, 148, 91, 0.4)',
  },
  advance: {
    backgroundColor: 'rgba(57, 124, 194, 0.14)',
    borderColor: 'rgba(57, 124, 194, 0.4)',
  },
  neutral: {
    backgroundColor: colors.elevatedSurface,
    borderColor: colors.border,
  },
  text: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.4,
  },
});

const dotStyles = StyleSheet.create({
  due: { backgroundColor: colors.danger },
  settled: { backgroundColor: colors.success },
  advance: { backgroundColor: colors.information },
  neutral: { backgroundColor: colors.textSecondary },
});

const textStyles = StyleSheet.create({
  due: { color: colors.danger },
  settled: { color: colors.brandHighlight },
  advance: { color: colors.information },
  neutral: { color: colors.textSecondary },
});
