import React, {useState} from 'react';
import {Modal, Pressable, Text, View} from 'react-native';
import {useTranslation} from 'react-i18next';
import {chatStyles as styles} from '../../styles/chatStyles';
import type {ChatMessage} from '../../hooks/useChatScreen';

interface Props {
  message: ChatMessage;
  onEdit: () => void;
  onDelete: () => void;
  onDismiss: () => void;
}

export function MessageActionSheet({message, onEdit, onDelete, onDismiss}: Props) {
  const {t} = useTranslation();
  const [confirming, setConfirming] = useState(false);

  return (
    <Modal transparent animationType="slide" onRequestClose={onDismiss} testID="chat-action-sheet-modal">
      <Pressable style={styles.actionSheetBackdrop} onPress={onDismiss}>
        <Pressable style={styles.actionSheet} onPress={e => e.stopPropagation()}>
          <View style={styles.actionSheetHandle} />

          {confirming ? (
            // ── Delete confirmation step ──────────────────────────────────
            <>
              <View style={styles.actionSheetConfirmHeader}>
                <View style={styles.actionSheetConfirmIcon}>
                  <Text style={styles.actionSheetConfirmIconText}>🗑️</Text>
                </View>
                <Text style={styles.actionSheetConfirmTitle}>
                  {t('chat.deleteConfirmTitle')}
                </Text>
                <Text style={styles.actionSheetConfirmBody}>
                  {t('chat.deleteConfirmMessage')}
                </Text>
              </View>

              <Pressable
                style={styles.actionSheetDeleteButton}
                onPress={onDelete}
                testID="action-sheet-delete-confirm">
                <Text style={styles.actionSheetDeleteButtonText}>
                  {t('chat.deleteConfirmYes')}
                </Text>
              </Pressable>

              <Pressable
                style={styles.actionSheetCancelButton}
                onPress={() => setConfirming(false)}
                testID="action-sheet-delete-back">
                <Text style={styles.actionSheetCancelButtonText}>{t('chat.actionCancel')}</Text>
              </Pressable>
            </>
          ) : (
            // ── Options step ──────────────────────────────────────────────
            <>
              <View style={styles.actionSheetPreviewWrap}>
                <Text style={styles.actionSheetPreview} numberOfLines={2}>
                  {message.text}
                </Text>
              </View>

              <Pressable
                style={styles.actionSheetItem}
                onPress={onEdit}
                testID="action-sheet-edit">
                <View style={styles.actionSheetIconWrap}>
                  <Text style={styles.actionSheetIcon}>✏️</Text>
                </View>
                <Text style={styles.actionSheetItemText}>{t('chat.actionEdit')}</Text>
              </Pressable>

              <View style={styles.actionSheetDivider} />

              <Pressable
                style={styles.actionSheetItem}
                onPress={() => setConfirming(true)}
                testID="action-sheet-delete">
                <View style={[styles.actionSheetIconWrap, styles.actionSheetIconDanger]}>
                  <Text style={styles.actionSheetIcon}>🗑️</Text>
                </View>
                <Text style={[styles.actionSheetItemText, styles.actionSheetDanger]}>
                  {t('chat.actionDelete')}
                </Text>
              </Pressable>

              <View style={styles.actionSheetDivider} />

              <Pressable
                style={styles.actionSheetCancelButton}
                onPress={onDismiss}
                testID="action-sheet-cancel">
                <Text style={styles.actionSheetCancelButtonText}>{t('chat.actionCancel')}</Text>
              </Pressable>
            </>
          )}
        </Pressable>
      </Pressable>
    </Modal>
  );
}
