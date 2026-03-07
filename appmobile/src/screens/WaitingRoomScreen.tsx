import React, {useState} from 'react';
import {ActivityIndicator, Text, TouchableOpacity, View} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {showMessage} from '../components/MessageBox';
import AnimatedLoader from '../components/AnimatedLoader';
import {ScreenHeader} from '../components/ScreenHeader';
import {styles} from '../styles/waitingRoomStyles';
import type {GameResponse} from '../types/game';

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
      showMessage({
        title: 'Erro ao cancelar',
        message: 'Não foi possível cancelar a partida. Tente novamente.',
        type: 'error',
      });
    } finally {
      setCancelling(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScreenHeader title="Aguardando oponente" onBack={onBack} />
      <View style={styles.content}>
        <AnimatedLoader />

        <Text style={styles.subtitle}>
          Sua partida está pronta. Aguardando outro jogador entrar...
        </Text>

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
            <ActivityIndicator color="#E74C3C" size="small" />
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
