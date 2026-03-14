import React, {useEffect, useRef, useState} from 'react';
import {
  Animated,
  StyleSheet,
  Text,
  TextInput,
  type TextInputProps,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from 'react-native';
import {Icon} from './Icon';
import {QRScannerModal} from './QRScannerModal';
import {colors} from '../theme/colors';

// ─── Props ────────────────────────────────────────────────────────────────────

interface Props extends Omit<TextInputProps, 'value' | 'onChangeText'> {
  label: string;
  value: string;
  onChangeText: (text: string) => void;
  error?: string;
  /** Called with the raw QR string before it's set. Use to transform/validate. */
  onQRScanned?: (raw: string) => string;
  /** Title shown in the scanner modal. Defaults to i18n 'qrScanner.title'. */
  scannerTitle?: string;
  testID?: string;
}

// ─── Component ────────────────────────────────────────────────────────────────

export function QRScannerInput({
  label,
  value,
  onChangeText,
  error,
  onQRScanned,
  scannerTitle,
  style,
  onFocus,
  onBlur,
  testID,
  ...textInputProps
}: Props) {
  const [focused, setFocused] = useState(false);
  const [scannerVisible, setScannerVisible] = useState(false);
  const inputRef = useRef<TextInput>(null);

  // Floating label animation
  const floated = focused || value.length > 0;
  const anim = useRef(new Animated.Value(floated ? 1 : 0)).current;

  useEffect(() => {
    Animated.timing(anim, {
      toValue: floated ? 1 : 0,
      duration: 160,
      useNativeDriver: false,
    }).start();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [floated]);

  const labelTop = anim.interpolate({inputRange: [0, 1], outputRange: [20, 9]});
  const labelSize = anim.interpolate({inputRange: [0, 1], outputRange: [16, 11]});

  const handleQRScan = (raw: string) => {
    const processed = onQRScanned ? onQRScanned(raw) : raw;
    onChangeText(processed);
  };

  return (
    <View style={styles.wrapper}>
      <TouchableWithoutFeedback onPress={() => inputRef.current?.focus()}>
        <View
          style={[
            styles.container,
            focused && styles.containerFocused,
            !!error && styles.containerError,
          ]}>
          {/* Floating label */}
          <Animated.Text
            style={[
              styles.label,
              {top: labelTop, fontSize: labelSize},
              focused && !error && styles.labelFocused,
              !!error && styles.labelError,
            ]}
            numberOfLines={1}>
            {label}
          </Animated.Text>

          {/* Text input + QR button row */}
          <View style={styles.inputRow}>
            <TextInput
              ref={inputRef}
              style={[styles.input, style]}
              value={value}
              onChangeText={onChangeText}
              placeholderTextColor="transparent"
              onFocus={e => {
                setFocused(true);
                onFocus?.(e);
              }}
              onBlur={e => {
                setFocused(false);
                onBlur?.(e);
              }}
              testID={testID}
              {...textInputProps}
            />

            {/* QR scan button */}
            <TouchableOpacity
              style={styles.qrBtn}
              onPress={() => setScannerVisible(true)}
              hitSlop={{top: 8, bottom: 8, left: 8, right: 8}}
              activeOpacity={0.6}
              testID={testID ? `${testID}-qr-btn` : 'qr-scan-btn'}>
              <Icon
                name="qr-code-outline"
                size={20}
                color={focused ? colors.textSecondary : colors.textMuted}
              />
            </TouchableOpacity>
          </View>
        </View>
      </TouchableWithoutFeedback>

      {/* Error message */}
      {error ? <Text style={styles.error}>{error}</Text> : null}

      {/* QR Scanner Modal */}
      <QRScannerModal
        visible={scannerVisible}
        title={scannerTitle}
        onScan={handleQRScan}
        onClose={() => setScannerVisible(false)}
      />
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  wrapper: {
    marginBottom: 12,
  },
  container: {
    backgroundColor: '#181818',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingRight: 12,
    height: 64,
    justifyContent: 'flex-end',
    overflow: 'hidden',
    borderWidth: 1.5,
    borderColor: 'transparent',
  },
  containerFocused: {
    backgroundColor: '#1E1E1E',
    borderColor: colors.border,
  },
  containerError: {
    backgroundColor: 'rgba(255, 69, 58, 0.07)',
    borderColor: colors.error,
  },
  label: {
    position: 'absolute',
    left: 16,
    right: 52,
    color: colors.textMuted,
    fontWeight: '400',
  },
  labelFocused: {color: colors.textSecondary},
  labelError: {color: colors.error},
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingBottom: 11,
  },
  input: {
    flex: 1,
    color: colors.text,
    fontSize: 16,
    fontWeight: '400',
    height: 36,
    padding: 0,
  },
  qrBtn: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 4,
    borderRadius: 8,
  },
  error: {
    color: colors.error,
    fontSize: 12,
    marginTop: 6,
    marginLeft: 4,
    lineHeight: 16,
  },
});
