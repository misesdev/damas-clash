import React, {useRef} from 'react';
import {Pressable, StyleSheet, Text, TextInput, View} from 'react-native';
import {colors} from '../theme/colors';

interface OtpInputProps {
  value: string;
  onChange: (value: string) => void;
  error?: boolean;
  testID?: string;
}

export function OtpInput({value, onChange, error, testID}: OtpInputProps) {
  const inputRef = useRef<TextInput>(null);

  return (
    <Pressable style={styles.row} onPress={() => inputRef.current?.focus()}>
      {/* Hidden input captures keyboard input */}
      <TextInput
        ref={inputRef}
        value={value}
        onChangeText={t => onChange(t.replace(/\D/g, '').slice(0, 6))}
        keyboardType="number-pad"
        maxLength={6}
        caretHidden
        style={styles.hidden}
        testID={testID}
      />
      {Array.from({length: 6}, (_, i) => {
        const isCurrent = value.length === i;
        const isFilled = value.length > i;
        return (
          <View
            key={i}
            style={[
              styles.box,
              isCurrent && styles.boxCursor,
              isFilled && styles.boxFilled,
              !!error && styles.boxError,
            ]}>
            <Text style={[styles.digit, !value[i] && styles.digitEmpty]}>
              {value[i] ?? '·'}
            </Text>
          </View>
        );
      })}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {flexDirection: 'row', gap: 8},
  hidden: {
    position: 'absolute',
    opacity: 0,
    width: '100%',
    height: '100%',
    zIndex: 1,
  },
  box: {
    flex: 1,
    height: 62,
    backgroundColor: '#181818',
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  boxCursor: {
    backgroundColor: '#1E1E1E',
  },
  boxFilled: {
    backgroundColor: '#1E1E1E',
  },
  boxError: {
    backgroundColor: 'rgba(255, 69, 58, 0.07)',
  },
  digit: {
    color: colors.text,
    fontSize: 22,
    fontWeight: '500',
  },
  digitEmpty: {
    color: colors.textMuted,
    fontSize: 14,
  },
});
