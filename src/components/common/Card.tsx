import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';

interface CardProps {
  children: React.ReactNode;
  style?: ViewStyle;
}

export const Card = React.memo(function Card({ children, style }: CardProps) {
  return <View style={[styles.card, style]}>{children}</View>;
});

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#0f172a', // Slate 900
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#1e293b', // Slate 800
    padding: 16,
  },
});
