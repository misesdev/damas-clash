import React from 'react';
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  TouchableOpacity,
  type TouchableOpacityProps,
} from 'react-native';
import {colors} from '../theme/colors';

interface ButtonProps extends TouchableOpacityProps {
  label: string;
  loading?: boolean;
  variant?: 'primary' | 'ghost';
}

export function Button({
  label,
  loading = false,
  variant = 'primary',
  style,
  disabled,
  ...props
}: ButtonProps) {
  const isPrimary = variant === 'primary';

  return (
    <TouchableOpacity
      style={[
        styles.base,
        isPrimary ? styles.primary : styles.ghost,
        (disabled || loading) && styles.disabled,
        style,
      ]}
      disabled={disabled || loading}
      activeOpacity={0.75}
      accessibilityRole="button"
      accessibilityLabel={label}
      {...props}>
      {loading ? (
        <ActivityIndicator color={isPrimary ? colors.primaryText : colors.text} />
      ) : (
        <Text style={[styles.label, isPrimary ? styles.labelPrimary : styles.labelGhost]}>
          {label}
        </Text>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  base: {
    paddingVertical: 17,
    paddingHorizontal: 24,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 56,
  },
  primary: {backgroundColor: colors.primary},
  ghost: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: colors.border,
  },
  disabled: {opacity: 0.35},
  label: {fontSize: 15, fontWeight: '600', letterSpacing: 0.4},
  labelPrimary: {color: colors.primaryText},
  labelGhost: {color: colors.text},
});
