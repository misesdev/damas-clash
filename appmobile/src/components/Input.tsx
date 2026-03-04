import React, {useState} from 'react';
import {
    StyleSheet,
    Text,
    TextInput,
    type TextInputProps,
    View,
} from 'react-native';
import {colors} from '../theme/colors';

interface InputProps extends TextInputProps {
    label: string;
    error?: string;
}

export function Input({label, error, style, ...props}: InputProps) {
    const [focused, setFocused] = useState(false);

    return (
        <View style={styles.container}>
            <Text style={styles.label}>{label}</Text>
            <TextInput
                style={[
                    styles.input,
                    focused && styles.inputFocused,
                    !!error && styles.inputError,
                    style,
                ]}
                placeholderTextColor={colors.textPlaceholder}
                onFocus={() => setFocused(true)}
                onBlur={() => setFocused(false)}
                {...props}
            />
            {error ? <Text style={styles.error}>{error}</Text> : null}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {marginBottom: 16},
    label: {
        color: colors.textMuted,
        fontSize: 12,
        letterSpacing: 1,
        textTransform: 'uppercase',
        marginBottom: 8,
    },
    input: {
        backgroundColor: colors.surface,
        borderWidth: 1,
        borderColor: colors.border,
        color: colors.text,
        fontSize: 16,
        paddingHorizontal: 16,
        paddingVertical: 14,
        borderRadius: 4,
    },
    inputFocused: {borderColor: colors.borderFocus},
    inputError: {borderColor: colors.error},
    error: {
        color: colors.error,
        fontSize: 12,
        marginTop: 6,
    },
});
