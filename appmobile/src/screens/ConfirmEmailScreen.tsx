import React, {useState} from 'react';
import {
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import {confirmEmail} from '../api/auth';
import {ApiError} from '../api/client';
import {Button} from '../components/Button';
import {Input} from '../components/Input';
import {colors} from '../theme/colors';

interface ConfirmEmailScreenProps {
    email: string;
    onConfirmed: () => void;
    onNavigateToLogin: () => void;
}

export function ConfirmEmailScreen({
    email,
    onConfirmed,
    onNavigateToLogin,
}: ConfirmEmailScreenProps) {
    const [code, setCode] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleCodeChange = (text: string) => {
        setCode(text.replace(/\D/g, '').slice(0, 6));
    };

    const handleConfirm = async () => {
        setError('');
        if (code.length !== 6) {
            setError('O código deve ter 6 dígitos.');
            return;
        }
        setLoading(true);
        try {
            await confirmEmail({email, code});
            onConfirmed();
        } catch (e) {
            if (e instanceof ApiError) {
                setError('Código inválido ou expirado. Tente novamente.');
            } else {
                setError('Erro de conexão. Tente novamente.');
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <KeyboardAvoidingView
            style={styles.flex}
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
            <ScrollView
                contentContainerStyle={styles.container}
                keyboardShouldPersistTaps="handled">
                <View style={styles.header}>
                    <Text style={styles.title}>Confirme{'\n'}seu e-mail</Text>
                    <Text style={styles.subtitle}>
                        Enviamos um código de 6 dígitos para
                    </Text>
                    <Text style={styles.email} testID="email-display">
                        {email}
                    </Text>
                </View>

                <View style={styles.form}>
                    <Input
                        label="Código de confirmação"
                        value={code}
                        onChangeText={handleCodeChange}
                        keyboardType="number-pad"
                        maxLength={6}
                        placeholder="000000"
                        error={error}
                        testID="code-input"
                    />
                    <Button
                        label="Confirmar"
                        onPress={handleConfirm}
                        loading={loading}
                        style={styles.submitButton}
                        testID="confirm-button"
                    />
                </View>

                <TouchableOpacity
                    onPress={onNavigateToLogin}
                    style={styles.link}
                    testID="login-link">
                    <Text style={styles.linkText}>
                        Voltar para o <Text style={styles.linkBold}>Login</Text>
                    </Text>
                </TouchableOpacity>
            </ScrollView>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    flex: {flex: 1, backgroundColor: colors.bg},
    container: {flexGrow: 1, padding: 32, justifyContent: 'center'},
    header: {marginBottom: 40},
    title: {
        color: colors.text,
        fontSize: 32,
        fontWeight: '700',
        letterSpacing: -0.5,
        marginBottom: 12,
    },
    subtitle: {color: colors.textMuted, fontSize: 16, lineHeight: 24},
    email: {color: colors.text, fontSize: 16, fontWeight: '600'},
    form: {marginBottom: 32},
    submitButton: {marginTop: 8},
    link: {alignItems: 'center'},
    linkText: {color: colors.textMuted, fontSize: 14},
    linkBold: {color: colors.text, fontWeight: '600'},
});
