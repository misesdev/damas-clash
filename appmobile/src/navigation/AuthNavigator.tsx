import React from 'react';
import {View, StyleSheet} from 'react-native';
import {useTranslation} from 'react-i18next';
import {login, resendConfirmation, verifyLogin} from '../api/auth';
import {ConfirmEmailScreen} from '../screens/ConfirmEmailScreen';
import {LoginScreen} from '../screens/LoginScreen';
import {NostrLoginScreen} from '../screens/NostrLoginScreen';
import {RegisterScreen} from '../screens/RegisterScreen';
import {colors} from '../theme/colors';
import {useAppContext} from '../context/AppContext';

export function AuthNavigator() {
  const {screen, setScreen, pendingEmail, setPendingEmail, handleLogin} =
    useAppContext();
  const {t} = useTranslation();

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
        onGoogleLogin={handleLogin}
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
        onGoogleLogin={handleLogin}
        onNostrLogin={() => setScreen('nostrLogin')}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {flex: 1, backgroundColor: colors.bg},
});
