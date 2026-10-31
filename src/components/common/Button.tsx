import React from 'react';
import { Pressable, Text, StyleSheet, ViewStyle, View } from 'react-native';
import { colors } from '../../core/theme';

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
    backgroundColor: colors.primaryButton, // #1D7548
    borderWidth: 1,
    borderColor: colors.buttonHover,      // #258A56
  },
  secondary: {
    backgroundColor: colors.elevatedSurface, // #172D44
    borderWidth: 1,
    borderColor: colors.border,              // #243B51
  },
  danger: {
    backgroundColor: colors.brandAccent, // #C92D32
    borderWidth: 1,
    borderColor: colors.danger,          // #D94A50
  },
  success: {
    backgroundColor: colors.success,       // #26945B
    borderWidth: 1,
    borderColor: colors.brandHighlight, // #75B83D
  },
  outline: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: colors.border,
  },
  pressed: {
    opacity: 0.85,
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
  primary: { color: colors.textPrimary },
  secondary: { color: colors.textPrimary },
  danger: { color: colors.textPrimary },
  success: { color: colors.textPrimary },
  outline: { color: colors.textSecondary },
});
