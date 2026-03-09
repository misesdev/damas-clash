import React, {useState} from 'react';
import {ActivityIndicator, Text, TouchableOpacity, View} from 'react-native';
import {useTranslation} from 'react-i18next';
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
  const {t} = useTranslation();
  const [cancelling, setCancelling] = useState(false);

  const shortCode = game.id.slice(0, 8).toUpperCase();

  const handleCancelGame = async () => {
    setCancelling(true);
    try {
      await onCancelGame();
    } catch {
      showMessage({
        title: t('waitingRoom.errors.cancelTitle'),
        message: t('waitingRoom.errors.cancelMessage'),
        type: 'error',
      });
    } finally {
      setCancelling(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScreenHeader title={t('waitingRoom.title')} onBack={onBack} />
      <View style={styles.content}>
        <AnimatedLoader />

        <Text style={styles.subtitle}>
          {t('waitingRoom.subtitle')}
        </Text>

        <View style={styles.codeCard}>
          <Text style={styles.codeLabel}>{t('waitingRoom.gameCodeLabel')}</Text>
          <Text style={styles.codeValue} testID="waiting-room-code">{shortCode}</Text>
          <Text style={styles.codeHint}>
            {t('waitingRoom.hint')}
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
            <Text style={styles.cancelText}>{t('waitingRoom.cancelButton')}</Text>
          )}
        </TouchableOpacity>
        <Text style={styles.footerHint}>
          {t('waitingRoom.footer')}
        </Text>
      </View>
    </SafeAreaView>
  );
}
