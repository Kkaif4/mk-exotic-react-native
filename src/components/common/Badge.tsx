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
    backgroundColor: 'rgba(244, 63, 94, 0.1)',
    borderColor: 'rgba(244, 63, 94, 0.35)',
  },
  settled: {
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    borderColor: 'rgba(16, 185, 129, 0.35)',
  },
  advance: {
    backgroundColor: 'rgba(99, 102, 241, 0.1)',
    borderColor: 'rgba(99, 102, 241, 0.35)',
  },
  neutral: {
    backgroundColor: '#1e293b',
    borderColor: '#334155',
  },
  text: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.4,
  },
});

const dotStyles = StyleSheet.create({
  due: { backgroundColor: '#f43f5e' },
  settled: { backgroundColor: '#10b981' },
  advance: { backgroundColor: '#6366f1' },
  neutral: { backgroundColor: '#94a3b8' },
});

const textStyles = StyleSheet.create({
  due: { color: '#fb7185' },
  settled: { color: '#34d399' },
  advance: { color: '#818cf8' },
  neutral: { color: '#94a3b8' },
});
