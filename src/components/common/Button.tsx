import React from 'react';
import { Pressable, Text, StyleSheet, ViewStyle, View } from 'react-native';

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'danger' | 'success' | 'outline';
  disabled?: boolean;
  style?: ViewStyle;
  icon?: React.ReactNode;
}

export const Button = React.memo(function Button({
  title,
  onPress,
  variant = 'primary',
  disabled = false,
  style,
  icon,
}: ButtonProps) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [
        styles.button,
        styles[variant],
        pressed && styles.pressed,
        disabled && styles.disabled,
        style,
      ]}
    >
      <View style={styles.contentRow}>
        {icon && <View style={styles.iconWrapper}>{icon}</View>}
        <Text style={[styles.text, textStyles[variant]]}>{title}</Text>
      </View>
    </Pressable>
  );
});

const styles = StyleSheet.create({
  button: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  contentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconWrapper: {
    marginRight: 8,
  },
  primary: {
    backgroundColor: '#4f46e5', // Modern Indigo
    borderWidth: 1,
    borderColor: '#6366f1',
  },
  secondary: {
    backgroundColor: '#1e293b', // Slate 800
    borderWidth: 1,
    borderColor: '#334155',
  },
  danger: {
    backgroundColor: '#e11d48',
    borderWidth: 1,
    borderColor: '#f43f5e',
  },
  success: {
    backgroundColor: '#059669', // Emerald
    borderWidth: 1,
    borderColor: '#10b981',
  },
  outline: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#475569',
  },
  pressed: {
    opacity: 0.82,
    transform: [{ scale: 0.985 }],
  },
  disabled: {
    opacity: 0.5,
  },
  text: {
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
});

const textStyles = StyleSheet.create({
  primary: { color: '#ffffff' },
  secondary: { color: '#e2e8f0' },
  danger: { color: '#ffffff' },
  success: { color: '#ffffff' },
  outline: { color: '#cbd5e1' },
});
