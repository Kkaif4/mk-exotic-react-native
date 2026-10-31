import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

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
      <Text style={[styles.text, textStyles[variant]]}>{label}</Text>
    </View>
  );
});

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    borderWidth: 1,
    alignSelf: 'flex-start',
  },
  due: {
    backgroundColor: 'rgba(244, 63, 94, 0.1)',
    borderColor: 'rgba(244, 63, 94, 0.3)',
  },
  settled: {
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    borderColor: 'rgba(16, 185, 129, 0.3)',
  },
  advance: {
    backgroundColor: 'rgba(99, 102, 241, 0.1)',
    borderColor: 'rgba(99, 102, 241, 0.3)',
  },
  neutral: {
    backgroundColor: '#1e293b',
    borderColor: '#334155',
  },
  text: {
    fontSize: 11,
    fontWeight: '700',
  },
});

const textStyles = StyleSheet.create({
  due: { color: '#fb7185' },
  settled: { color: '#34d399' },
  advance: { color: '#818cf8' },
  neutral: { color: '#94a3b8' },
});
