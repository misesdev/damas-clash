import React, {useState} from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import {GoogleSignin, statusCodes} from '@react-native-google-signin/google-signin';
import {googleAuth} from '../api/auth';
import {Button} from '../components/Button';
import {GoogleButton} from '../components/GoogleButton';
import {Input} from '../components/Input';
import {useRegister} from '../hooks/useRegister';
import {styles} from '../styles/registerStyles';
import { BoardMark } from '../components/BoardMark';
import { Icon } from '../components/Icon';
import type {LoginResponse} from '../types/auth';

interface RegisterScreenProps {
  onRegistered: (email: string) => void;
  onNavigateToLogin: () => void;
  onGoogleLogin: (data: LoginResponse) => void;
}

export function RegisterScreen({onRegistered, onNavigateToLogin, onGoogleLogin}: RegisterScreenProps) {
  const {username, setUsername, email, setEmail, errors, loading, handleRegister} =
    useRegister(onRegistered);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [googleError, setGoogleError] = useState('');

  const handleGoogleSignIn = async () => {
    setGoogleLoading(true);
    setGoogleError('');
    try {
      await GoogleSignin.hasPlayServices();
      const response = await GoogleSignin.signIn();
      const idToken = response.data?.idToken;
      if (!idToken) throw new Error('no_id_token');
      const data = await googleAuth(idToken);
      onGoogleLogin(data);
    } catch (e: any) {
      if (e.code === statusCodes.SIGN_IN_CANCELLED) {
        // user cancelled — do nothing
      } else {
        setGoogleError('Erro ao entrar com Google. Tente novamente.');
      }
    } finally {
      setGoogleLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView
        contentContainerStyle={styles.container}
        keyboardShouldPersistTaps="handled">
        <TouchableOpacity
          onPress={onNavigateToLogin}
          style={styles.back}
          testID="back-button">
            <Icon name='chevron-back' size={20}/>
        </TouchableOpacity>

        <View style={{alignItems: 'center', marginBottom: 56}}>
          <BoardMark size={85} />
          <Text style={styles.title}>Criar conta</Text>
          <Text style={styles.subtitle}>Preencha seus dados para começar</Text>
        </View>
        {/* <View style={styles.header}> */}
        {/*   <Text style={styles.title}>Criar conta</Text> */}
        {/*   <Text style={styles.subtitle}>Preencha seus dados para começar</Text> */}
        {/* </View> */}

        <View style={styles.form}>
          <Input
            label="Nome de usuário"
            value={username}
            onChangeText={setUsername}
            autoCapitalize="none"
            autoComplete="username"
            placeholder="seu_usuario"
            error={errors.username}
            testID="username-input"
          />
          <Input
            label="E-mail"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            autoComplete="email"
            placeholder="seu@email.com"
            error={errors.email}
            testID="email-input"
          />

          {errors.general ? (
            <View style={styles.errorBox}>
              <Text style={styles.errorText} testID="general-error">
                {errors.general}
              </Text>
            </View>
          ) : null}

          <Button
            label="Criar conta"
            onPress={handleRegister}
            loading={loading}
            style={styles.submitButton}
            testID="register-button"
          />
        </View>

        <View style={styles.googleSection}>
          <View style={styles.divider} />
          <GoogleButton
            onPress={handleGoogleSignIn}
            loading={googleLoading}
          />
          {googleError ? (
            <Text style={styles.googleError}>{googleError}</Text>
          ) : null}
        </View>

        <View style={styles.footer}>
          <View style={styles.divider} />
          <TouchableOpacity onPress={onNavigateToLogin} testID="login-link">
            <Text style={styles.footerText}>
              Já tem conta? <Text style={styles.footerLink}>Entrar</Text>
            </Text>
          </TouchableOpacity>
        </View>

      </ScrollView>
    </KeyboardAvoidingView>
  );
}
