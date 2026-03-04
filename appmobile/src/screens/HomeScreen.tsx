import React from 'react';
import {StyleSheet, Text, View} from 'react-native';
import {Button} from '../components/Button';
import {BoardMark} from '../components/BoardMark';
import {colors} from '../theme/colors';
import type {LoginResponse} from '../types/auth';

interface HomeScreenProps {
  user: LoginResponse;
  onLogout: () => void;
}

export function HomeScreen({user, onLogout}: HomeScreenProps) {
  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <BoardMark size={48} />

        <View style={styles.greeting}>
          <Text style={styles.welcome}>Bem-vindo,</Text>
          <Text style={styles.username}>{user.username}</Text>
        </View>

        <Text style={styles.hint}>
          Em breve você poderá jogar partidas de damas aqui.
        </Text>
      </View>

      <View style={styles.footer}>
        <Button
          label="Sair"
          variant="ghost"
          onPress={onLogout}
          testID="logout-button"
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
    paddingHorizontal: 28,
    paddingTop: 80,
    paddingBottom: 48,
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 24,
  },
  greeting: {alignItems: 'center', gap: 6},
  welcome: {
    color: colors.textMuted,
    fontSize: 16,
    fontWeight: '400',
  },
  username: {
    color: colors.text,
    fontSize: 32,
    fontWeight: '700',
    letterSpacing: -0.5,
  },
  hint: {
    color: colors.textMuted,
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 22,
    marginTop: 8,
  },
  footer: {},
});
