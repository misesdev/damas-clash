import React from 'react';
import {Pressable, Text, View} from 'react-native';
import {useTranslation} from 'react-i18next';
import {chatStyles as styles} from '../../styles/chatStyles';
import type {OnlinePlayerInfo} from '../../types/player';
import type {ChatMessage} from '../../hooks/useChatScreen';
import Ionicons from "react-native-vector-icons/Ionicons"
import { colors } from '../../theme/colors';

interface Props {
  connected: boolean;
  onlinePlayers: OnlinePlayerInfo[];
  selectedMessage: ChatMessage | null;
  onClearSelection: () => void;
  onEditSelected: () => void;
  onDeleteSelected: () => void;
}

export function ChatHeader({
  connected,
  onlinePlayers,
  selectedMessage,
  onClearSelection,
  onEditSelected,
  onDeleteSelected,
}: Props) {
  const {t} = useTranslation();

  if (selectedMessage) {
    return (
      <View style={styles.actionHeader}>
        <Pressable
          style={styles.actionHeaderClose}
          onPress={onClearSelection}
          testID="action-bar-close">
          <Text style={styles.actionHeaderCloseText}>✕</Text>
        </Pressable>

        <Text style={styles.actionHeaderLabel}>1 {t('chat.messageOptionsTitle')}</Text>

        <Pressable
          style={styles.actionHeaderBtn}
          onPress={onEditSelected}
          testID="action-bar-edit">
          <Ionicons name='create' size={24} color={colors.text}/>
        </Pressable> 

        <Pressable
          style={styles.actionHeaderBtn}
          onPress={onDeleteSelected}
          testID="action-bar-delete">
          <Ionicons name='trash' size={24} color={colors.text}/>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={styles.header}>
      <View style={styles.headerLeft}>
        <View style={[styles.headerDot, connected ? styles.headerDotOn : styles.headerDotOff]} />
        <View>
          <Text style={styles.headerTitle}>{t('chat.title')}</Text>
          <Text style={styles.headerSub} testID="chat-conn-status">
            {connected ? 'online' : t('chat.connecting')}
          </Text>
        </View>
      </View>
      {onlinePlayers.length > 0 && (
        <View style={styles.onlineBadge}>
          <View style={styles.onlineDot} />
          <Text style={styles.onlineCount}>{onlinePlayers.length}</Text>
        </View>
      )}
    </View>
  );
}
