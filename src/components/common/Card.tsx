import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { colors } from '../../core/theme';

interface CardProps {
  children: React.ReactNode;
  style?: ViewStyle;
}

export const Card = React.memo(function Card({ children, style }: CardProps) {
  return <View style={[styles.card, style]}>{children}</View>;
});

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 16,
  },
});
