import React, {useEffect, useRef, useState} from 'react';
import {
  ActivityIndicator,
  Alert,
  Animated,
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import {ScreenHeader} from '../components/ScreenHeader';
import {colors} from '../theme/colors';
import type {GameResponse} from '../types/game';
import AnimatedLoader from '../components/AnimatedLoader';

interface Props {
  game: GameResponse;
  onBack: () => void;
  onCancelGame: () => Promise<void>;
}

export function WaitingRoomScreen({game, onBack, onCancelGame}: Props) {
  const [cancelling, setCancelling] = useState(false);

  const shortCode = game.id.slice(0, 8).toUpperCase();

  const handleCancelGame = async () => {
    setCancelling(true);
    try {
      await onCancelGame();
    } catch {
      Alert.alert(
        'Erro ao cancelar',
        'Não foi possível cancelar a partida. Tente novamente.',
      );
    } finally {
      setCancelling(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScreenHeader title="Aguardando oponente" onBack={onBack} />
      <View style={styles.content}>
        {/* Pulsing ring */}
        <AnimatedLoader />

        <Text style={styles.subtitle}>
          Sua partida está pronta. Aguardando outro jogador entrar...
        </Text>

        {/* Game code card */}
        <View style={styles.codeCard}>
          <Text style={styles.codeLabel}>Código da partida</Text>
          <Text style={styles.codeValue} testID="waiting-room-code">{shortCode}</Text>
          <Text style={styles.codeHint}>
            O jogo começa automaticamente quando alguém entrar
          </Text>
        </View>
      </View>

      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.cancelBtn, cancelling && styles.cancelBtnDisabled]}
          onPress={handleCancelGame}
          disabled={cancelling}
          testID="waiting-room-cancel">
          {cancelling ? (
            <ActivityIndicator color={colors.error} size="small" />
          ) : (
            <Text style={styles.cancelText}>Cancelar partida</Text>
          )}
        </TouchableOpacity>
        <Text style={styles.footerHint}>
          Você será notificado quando alguém entrar na partida
        </Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {flex: 1, backgroundColor: colors.bg},
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
    gap: 24,
  },

  title: {
    color: colors.text,
    fontSize: 22,
    fontWeight: '700',
    letterSpacing: -0.3,
    textAlign: 'center',
  },
  subtitle: {
    color: colors.textSecondary,
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },

  codeCard: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    paddingVertical: 20,
    paddingHorizontal: 28,
    alignItems: 'center',
    width: '100%',
    gap: 6,
  },
  codeLabel: {
    color: colors.textSecondary,
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 0.6,
    textTransform: 'uppercase',
  },
  codeValue: {
    color: colors.text,
    fontSize: 28,
    fontWeight: '700',
    letterSpacing: 4,
    fontVariant: ['tabular-nums'],
  },
  codeHint: {
    color: colors.textMuted,
    fontSize: 12,
    textAlign: 'center',
    marginTop: 4,
    lineHeight: 16,
  },

  footer: {
    alignItems: 'center',
    paddingHorizontal: 32,
    paddingBottom: 32,
    gap: 12,
  },
  cancelBtn: {
    borderWidth: 1,
    borderColor: colors.error,
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 40,
    minWidth: 180,
    alignItems: 'center',
  },
  cancelBtnDisabled: {opacity: 0.5},
  cancelText: {color: colors.error, fontSize: 15, fontWeight: '600'},
  footerHint: {
    color: colors.textMuted,
    fontSize: 12,
    textAlign: 'center',
    lineHeight: 18,
  },
});
