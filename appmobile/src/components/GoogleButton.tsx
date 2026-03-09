import React from 'react';
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import FontAwesome5 from 'react-native-vector-icons/FontAwesome5';
import {colors} from '../theme/colors';

interface GoogleButtonProps {
  onPress: () => void;
  loading?: boolean;
  disabled?: boolean;
}

export function GoogleButton({onPress, loading = false, disabled = false}: GoogleButtonProps) {
  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.75}
      accessibilityRole="button"
      accessibilityLabel="Continuar com Google"
      style={[styles.button, (disabled || loading) && styles.disabled]}>
      {loading ? (
        <ActivityIndicator size="small" color={colors.text} />
      ) : (
        <View style={styles.inner}>
          <FontAwesome5 name="google" brand size={17} color="#fff" />
          <Text style={styles.label}>Continuar com Google</Text>
        </View>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 56,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    paddingVertical: 17,
    paddingHorizontal: 24,
  },
  inner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  label: {
    fontSize: 15,
    fontWeight: '600',
    letterSpacing: 0.4,
    color: colors.text,
  },
  disabled: {opacity: 0.35},
});
