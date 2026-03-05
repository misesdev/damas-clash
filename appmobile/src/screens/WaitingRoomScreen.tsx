import React, {useEffect, useRef} from 'react';
import {
  Animated,
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import {colors} from '../theme/colors';
import type {GameResponse} from '../types/game';

interface Props {
  game: GameResponse;
  onCancel: () => void;
}

export function WaitingRoomScreen({game, onCancel}: Props) {
  const pulse = useRef(new Animated.Value(1)).current;
  const opacity = useRef(new Animated.Value(0.4)).current;

  useEffect(() => {
    Animated.loop(
      Animated.parallel([
        Animated.sequence([
          Animated.timing(pulse, {
            toValue: 1.2,
            duration: 1000,
            useNativeDriver: true,
          }),
          Animated.timing(pulse, {
            toValue: 1,
            duration: 1000,
            useNativeDriver: true,
          }),
        ]),
        Animated.sequence([
          Animated.timing(opacity, {
            toValue: 1,
            duration: 1000,
            useNativeDriver: true,
          }),
          Animated.timing(opacity, {
            toValue: 0.4,
            duration: 1000,
            useNativeDriver: true,
          }),
        ]),
      ]),
    ).start();
  }, [pulse, opacity]);

  const shortCode = game.id.slice(0, 8).toUpperCase();

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        {/* Pulsing ring */}
        <View style={styles.ringWrapper}>
          <Animated.View
            style={[
              styles.ringOuter,
              {transform: [{scale: pulse}], opacity},
            ]}
          />
          <View style={styles.ringInner}>
            <View style={styles.boardIcon}>
              <View style={styles.boardRow}>
                <View style={[styles.boardCell, {backgroundColor: colors.text}]} />
                <View style={[styles.boardCell, {backgroundColor: 'transparent'}]} />
              </View>
              <View style={styles.boardRow}>
                <View style={[styles.boardCell, {backgroundColor: 'transparent'}]} />
                <View style={[styles.boardCell, {backgroundColor: colors.text}]} />
              </View>
            </View>
          </View>
        </View>

        <Text style={styles.title}>Aguardando oponente</Text>
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
          style={styles.cancelBtn}
          onPress={onCancel}
          testID="waiting-room-cancel">
          <Text style={styles.cancelText}>Cancelar</Text>
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

  ringWrapper: {
    width: 140,
    height: 140,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ringOuter: {
    position: 'absolute',
    width: 140,
    height: 140,
    borderRadius: 70,
    borderWidth: 2,
    borderColor: colors.text,
  },
  ringInner: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: colors.surfaceRaised,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  boardIcon: {gap: 4},
  boardRow: {flexDirection: 'row', gap: 4},
  boardCell: {
    width: 14,
    height: 14,
    borderRadius: 2,
    borderWidth: 1,
    borderColor: colors.border,
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
    borderColor: colors.border,
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 40,
  },
  cancelText: {color: colors.textSecondary, fontSize: 15, fontWeight: '500'},
  footerHint: {
    color: colors.textMuted,
    fontSize: 12,
    textAlign: 'center',
    lineHeight: 18,
  },
});
