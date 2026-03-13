import React from 'react';
import {Modal, Text, TouchableOpacity, View} from 'react-native';
import {useTranslation} from 'react-i18next';
import {Input} from './Input';
import {styles} from '../styles/createGameModalStyles';
import type {WalletResponse} from '../types/wallet';
import {useCreateGameModal} from '../hooks/useCreateGameModal';

interface Props {
  visible: boolean;
  wallet: WalletResponse | null;
  creating?: boolean;
  onConfirm: (betAmountSats: number) => void;
  onClose: () => void;
}

export function CreateGameModal({visible, wallet, creating, onConfirm, onClose}: Props) {
  const {t} = useTranslation();
  const {
    mode, setMode,
    betText, setBetText,
    error, available, canCreate,
    handleCreate,
  } = useCreateGameModal(visible, wallet, onConfirm, onClose);

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <TouchableOpacity style={styles.overlay} activeOpacity={1} onPress={onClose}>
        <TouchableOpacity style={styles.sheet} activeOpacity={1} onPress={() => {}}>
          <View style={styles.handle} />
          <Text style={styles.title}>{t('createGame.title')}</Text>

          <View style={styles.optionsRow}>
            <TouchableOpacity
              style={[styles.option, mode === 'friendly' && styles.optionActive]}
              onPress={() => setMode('friendly')}
              testID="mode-friendly">
              <Text style={styles.optionEmoji}>🤝</Text>
              <Text style={styles.optionLabel}>{t('createGame.friendlyLabel')}</Text>
              <Text style={styles.optionDesc}>{t('createGame.friendlyDesc')}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.option, mode === 'bet' && styles.optionActive]}
              onPress={() => setMode('bet')}
              testID="mode-bet">
              <Text style={styles.optionEmoji}>⚡</Text>
              <Text style={styles.optionLabel}>{t('createGame.betLabel')}</Text>
              <Text style={styles.optionDesc}>{t('createGame.betDesc')}</Text>
            </TouchableOpacity>
          </View>

          {mode === 'bet' && (
            <>
              <Input
                label={t('createGame.betAmountLabel')}
                placeholder={t('createGame.betAmountPlaceholder')}
                value={betText}
                onChangeText={setBetText}
                keyboardType="number-pad"
                testID="bet-amount-input"
              />
              <Text style={styles.availableText}>
                {t('createGame.betAvailable', {amount: available.toLocaleString()})}
              </Text>
            </>
          )}

          {error ? <Text style={styles.errorText}>{error}</Text> : null}

          <TouchableOpacity
            style={[styles.createBtn, (!canCreate || creating) && styles.createBtnDisabled]}
            onPress={handleCreate}
            disabled={!canCreate || creating}
            testID="create-game-btn">
            <Text style={[styles.createBtnText, (!canCreate || creating) && styles.createBtnTextDisabled]}>
              {t('createGame.createButton')}
            </Text>
          </TouchableOpacity>
        </TouchableOpacity>
      </TouchableOpacity>
    </Modal>
  );
}
