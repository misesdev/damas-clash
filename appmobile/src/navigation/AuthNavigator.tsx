import React from 'react';
import {StyleSheet, View} from 'react-native';
import {useTranslation} from 'react-i18next';
import {login, resendConfirmation, verifyLogin} from '../api/auth';
import {ConfirmEmailScreen} from '../screens/ConfirmEmailScreen';
import {LoginScreen} from '../screens/LoginScreen';
import {NostrLoginScreen} from '../screens/NostrLoginScreen';
import {RegisterScreen} from '../screens/RegisterScreen';
import {colors} from '../theme/colors';
import {useAppContext} from '../context/AppContext';
import {useAndroidBack} from './useAndroidBack';
import type {Screen} from '../hooks/useApp';

// Back destinations for each auth screen.
// 'login' is absent — back on login lets Android handle it (exits app).
const AUTH_BACK: Partial<Record<Screen, Screen>> = {
  register: 'login',
  confirmEmail: 'login',
  verifyLogin: 'login',
  nostrLogin: 'login',
};

export function AuthNavigator() {
  const {screen, setScreen, pendingEmail, setPendingEmail, handleLogin} =
    useAppContext();
  const {t} = useTranslation();

  // Android back: navigate to parent screen or let system handle (login → exit).
  useAndroidBack(() => {
    const target = AUTH_BACK[screen];
    if (target) {
      setScreen(target);
      return true; // consumed
    }
    return false; // login screen: let Android exit the app
  });

  if (screen === 'confirmEmail') {
    return (
      <ConfirmEmailScreen
        email={pendingEmail}
        onConfirmed={data => {
          if (data) {
            handleLogin(data);
          } else {
            setScreen('login');
          }
        }}
        onNavigateToLogin={() => setScreen('login')}
        onResendCode={() => resendConfirmation({email: pendingEmail})}
      />
    );
  }

  if (screen === 'verifyLogin') {
    return (
      <ConfirmEmailScreen
        email={pendingEmail}
        heading={t('verifyLogin.heading')}
        onConfirmed={() => setScreen('login')}
        onNavigateToLogin={() => setScreen('login')}
        onResendCode={async () => {
          await login({identifier: pendingEmail});
        }}
        onSubmitCode={async code => {
          const data = await verifyLogin({email: pendingEmail, code});
          handleLogin(data);
        }}
      />
    );
  }

  if (screen === 'nostrLogin') {
    return (
      <NostrLoginScreen
        onLogin={handleLogin}
        onBack={() => setScreen('login')}
      />
    );
  }

  if (screen === 'register') {
    return (
      <RegisterScreen
        onRegistered={email => {
          setPendingEmail(email);
          setScreen('confirmEmail');
        }}
        onNavigateToLogin={() => setScreen('login')}
      />
    );
  }

  return (
    <View style={styles.root}>
      <LoginScreen
        onCodeSent={email => {
          setPendingEmail(email);
          setScreen('verifyLogin');
        }}
        onNavigateToRegister={() => setScreen('register')}
        onNostrLogin={() => setScreen('nostrLogin')}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {flex: 1, backgroundColor: colors.bg},
});
