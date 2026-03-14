import React, {useEffect, useRef} from 'react';
import {
  Animated,
  StyleSheet,
  Text,
  TextInput,
  TouchableWithoutFeedback,
  View,
} from 'react-native';
import {useTranslation} from 'react-i18next';
import {colors} from '../theme/colors';
import { formatSats, Locale } from '../utils/utils';

interface Props {
  value: string;
  available?: number;
  onChange: (v: string) => void;
  testID?: string;
}

export function SatsInput({value, available, onChange, testID}: Props) {
  const inputRef = useRef<TextInput>(null);
  const cursor = useRef(new Animated.Value(1)).current;
  const {t} = useTranslation()

  // Blink cursor
  useEffect(() => {
    const anim = Animated.loop(
      Animated.sequence([
        Animated.timing(cursor, {toValue: 0, duration: 500, useNativeDriver: true}),
        Animated.timing(cursor, {toValue: 1, duration: 500, useNativeDriver: true}),
      ]),
    );
    anim.start();
    return () => anim.stop();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Auto focus on mount
  useEffect(() => {
    const t = setTimeout(() => inputRef.current?.focus(), 100);
    return () => clearTimeout(t);
  }, []);

  const locale = t("common.back").includes("Voltar") ? "pt" : "en"; 
  const display = value === '' ? '0' : formatSats(parseInt(value), locale);
  const fontSize = display.length > 9 ? 36 : display.length > 6 ? 44 : 56;

  return (
    <TouchableWithoutFeedback onPress={() => inputRef.current?.focus()}>
      <View style={styles.container}>
        <View style={styles.amountRow}>
          <Text style={[styles.amount, {fontSize}]} testID={testID ?? 'sats-display'}>
            {display}
          </Text>
          <Animated.View style={[styles.cursor, {opacity: cursor}]} />
        </View>

        <Text style={styles.unit}>sats</Text>
        {available &&
          <Text style={styles.available}>{t('withdraw.availableLabel', {amount: available.toLocaleString()})}</Text>
        }

        {/* Hidden input to capture keystrokes */}
        <TextInput
          ref={inputRef}
          value={value}
          onChangeText={raw => {
            const digits = raw.replace(/\D/g, '');
            // Strip leading zeros, max 10 digits (~21M BTC in sats)
            const cleaned = digits.replace(/^0+/, '').slice(0, 10);
            onChange(cleaned);
          }}
          keyboardType="number-pad"
          style={styles.hiddenInput}
          caretHidden
          testID="deposit-amount-input"
        />
      </View>
    </TouchableWithoutFeedback>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    color: colors.textSecondary,
    fontSize: 13,
    fontWeight: '500',
    letterSpacing: 0.3,
    marginBottom: 24,
    textTransform: 'uppercase',
  },
  amountRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  amount: {
    color: colors.text,
    fontWeight: '700',
    letterSpacing: -2,
  },
  cursor: {
    width: 3,
    height: 48,
    backgroundColor: colors.text,
    borderRadius: 2,
    marginLeft: 4,
    marginTop: 4,
  },
  unit: {
    color: colors.textSecondary,
    fontSize: 18,
    fontWeight: '500',
    marginTop: 10,
    letterSpacing: 1,
  },
  available: {
    color: colors.textSecondary,
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 0.7,
    marginVertical: 8
  },
  hiddenInput: {
    position: 'absolute',
    opacity: 0,
    width: 1,
    height: 1,
  },
});
