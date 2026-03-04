import React, {useEffect, useRef, useState} from 'react';
import {
  Animated,
  StyleSheet,
  Text,
  TextInput,
  type TextInputProps,
  TouchableWithoutFeedback,
  View,
} from 'react-native';
import {colors} from '../theme/colors';

interface InputProps extends TextInputProps {
  label: string;
  error?: string;
}

export function Input({label, error, style, value, onFocus, onBlur, ...props}: InputProps) {
  const [focused, setFocused] = useState(false);
  const inputRef = useRef<TextInput>(null);
  const floated = focused || !!value;
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

  return (
    <View style={styles.wrapper}>
      <TouchableWithoutFeedback onPress={() => inputRef.current?.focus()}>
        <View
          style={[
            styles.container,
            focused && styles.containerFocused,
            !!error && styles.containerError,
          ]}>
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
          <TextInput
            ref={inputRef}
            style={[styles.input, style]}
            value={value}
            placeholderTextColor="transparent"
            onFocus={e => {
              setFocused(true);
              onFocus?.(e);
            }}
            onBlur={e => {
              setFocused(false);
              onBlur?.(e);
            }}
            {...props}
          />
        </View>
      </TouchableWithoutFeedback>
      {error ? <Text style={styles.error}>{error}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    marginBottom: 12,
  },
  container: {
    backgroundColor: '#181818',
    borderRadius: 14,
    paddingHorizontal: 16,
    height: 62,
    justifyContent: 'flex-end',
    overflow: 'hidden',
  },
  containerFocused: {
    backgroundColor: '#1E1E1E',
  },
  containerError: {
    backgroundColor: 'rgba(255, 69, 58, 0.07)',
  },
  label: {
    position: 'absolute',
    left: 16,
    right: 16,
    color: colors.textMuted,
    fontWeight: '400',
  },
  labelFocused: {
    color: colors.textSecondary,
  },
  labelError: {
    color: colors.error,
  },
  input: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '400',
    paddingBottom: 11,
    height: 36,
    padding: 0,
  },
  error: {
    color: colors.error,
    fontSize: 12,
    marginTop: 6,
    marginLeft: 4,
    lineHeight: 16,
  },
});
