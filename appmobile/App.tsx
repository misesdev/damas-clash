import React, {useEffect, useState} from 'react';
import {ActivityIndicator, StatusBar, StyleSheet, View} from 'react-native';
import {SafeAreaProvider} from 'react-native-safe-area-context';
import {login, resendConfirmation, verifyLogin} from './src/api/auth';
import {HomeScreen} from './src/screens/HomeScreen';
import {ConfirmEmailScreen} from './src/screens/ConfirmEmailScreen';
import {LoginScreen} from './src/screens/LoginScreen';
import {RegisterScreen} from './src/screens/RegisterScreen';
import {clearSession, loadSession, saveSession} from './src/storage/auth';
import type {LoginResponse} from './src/types/auth';
import {colors} from './src/theme/colors';

type Screen = 'login' | 'register' | 'confirmEmail' | 'verifyLogin';

export default function App() {
  const [screen, setScreen] = useState<Screen>('login');
  const [pendingEmail, setPendingEmail] = useState('');
  const [session, setSession] = useState<LoginResponse | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadSession()
      .then(saved => { if (saved) setSession(saved); })
      .finally(() => setLoading(false));
  }, []);

  const handleLogin = (data: LoginResponse) => {
    saveSession(data);
    setSession(data);
  };

  const handleLogout = () => {
    clearSession();
    setSession(null);
    setScreen('login');
  };

  if (loading) {
    return (
      <View style={styles.splash}>
        <ActivityIndicator color={colors.text} />
      </View>
    );
  }

  if (session) {
    return (
      <>
        <StatusBar barStyle="light-content" backgroundColor={colors.bg} />
        <HomeScreen user={session} onLogout={handleLogout} />
      </>
    );
  }

  return (
    <SafeAreaProvider style={styles.root}>
      <StatusBar barStyle="light-content" backgroundColor={colors.bg} />

      {screen === 'login' && (
        <LoginScreen
          onCodeSent={email => {
            setPendingEmail(email);
            setScreen('verifyLogin');
          }}
          onNavigateToRegister={() => setScreen('register')}
        />
      )}

      {screen === 'register' && (
        <RegisterScreen
          onRegistered={email => {
            setPendingEmail(email);
            setScreen('confirmEmail');
          }}
          onNavigateToLogin={() => setScreen('login')}
        />
      )}

      {screen === 'confirmEmail' && (
        <ConfirmEmailScreen
          email={pendingEmail}
          onConfirmed={() => setScreen('login')}
          onNavigateToLogin={() => setScreen('login')}
          onResendCode={() => resendConfirmation({email: pendingEmail})}
        />
      )}

      {screen === 'verifyLogin' && (
        <ConfirmEmailScreen
          email={pendingEmail}
          heading={'Confirme\nseu acesso'}
          onConfirmed={() => setScreen('login')}
          onNavigateToLogin={() => setScreen('login')}
          onResendCode={async () => { await login({identifier: pendingEmail}); }}
          onSubmitCode={async code => {
            const data = await verifyLogin({email: pendingEmail, code});
            handleLogin(data);
          }}
        />
      )}
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  root: {backgroundColor: colors.bg},
  splash: {
    flex: 1,
    backgroundColor: colors.bg,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
