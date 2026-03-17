import React from 'react';
import {Text, View} from 'react-native';
import {useTranslation} from 'react-i18next';
import {chatStyles as styles} from '../../styles/chatStyles';
import type {OnlinePlayerInfo} from '../../types/player';

interface Props {
  connected: boolean;
  onlinePlayers: OnlinePlayerInfo[];
}

export function ChatHeader({connected, onlinePlayers}: Props) {
  const {t} = useTranslation();
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
