import React, {useState} from 'react';
import {StatusBar} from 'react-native';
import {SafeAreaProvider} from 'react-native-safe-area-context';
import {ConfirmEmailScreen} from './src/screens/ConfirmEmailScreen';
import {LoginScreen} from './src/screens/LoginScreen';
import {RegisterScreen} from './src/screens/RegisterScreen';
import type {LoginResponse} from './src/types/auth';

type Screen = 'login' | 'register' | 'confirmEmail';

export default function App() {
  const [screen, setScreen] = useState<Screen>('login');
  const [pendingEmail, setPendingEmail] = useState('');
  const [loggedInUser, setLoggedInUser] = useState<LoginResponse | null>(null);

  if (loggedInUser) {
    // TODO: substituir pela tela principal do jogo
    return null;
  }

  return (
    <SafeAreaProvider>
      <StatusBar barStyle="light-content" backgroundColor="#000000" />
      {screen === 'login' && (
        <LoginScreen
          onLoginSuccess={setLoggedInUser}
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
        />
      )}
    </SafeAreaProvider>
  );
}
