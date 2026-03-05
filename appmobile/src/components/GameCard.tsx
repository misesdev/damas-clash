import React from 'react';
import {ActivityIndicator, StyleSheet, Text, TouchableOpacity, View} from 'react-native';
import {colors} from '../theme/colors';
import type {GameResponse} from '../types/game';

interface Props {
  game: GameResponse;
  currentPlayerId: string;
  onPress: () => void;
  loading?: boolean;
}

export function GameCard({game, currentPlayerId, onPress, loading}: Props) {
  const isParticipant =
    game.playerBlackId === currentPlayerId ||
    game.playerWhiteId === currentPlayerId;

  const opponentUsername =
    game.playerBlackId === currentPlayerId
      ? game.playerWhiteUsername
      : game.playerBlackUsername;

  const statusLabel = {
    WaitingForPlayers: 'Aguardando oponente',
    InProgress: 'Em andamento',
    Completed: 'Encerrada',
  }[game.status];

  const statusColor = {
    WaitingForPlayers: colors.textSecondary,
    InProgress: '#4CAF50',
    Completed: colors.textMuted,
  }[game.status];

  const actionLabel =
    game.status === 'WaitingForPlayers' && !isParticipant
      ? 'Entrar'
      : game.status === 'InProgress' && isParticipant
        ? 'Jogar'
        : game.status === 'InProgress'
          ? 'Assistir'
          : null;

  return (
    <View style={styles.card}>
      <View style={styles.info}>
        <Text style={styles.opponent}>
          {opponentUsername ? `vs. ${opponentUsername}` : 'Aguardando oponente...'}
        </Text>
        <View style={styles.statusRow}>
          <View style={[styles.statusDot, {backgroundColor: statusColor}]} />
          <Text style={[styles.status, {color: statusColor}]}>{statusLabel}</Text>
        </View>
      </View>

      {actionLabel && (
        <TouchableOpacity style={styles.action} onPress={onPress} disabled={loading}>
          {loading ? (
            <ActivityIndicator color={colors.primaryText} size="small" />
          ) : (
            <Text style={styles.actionText}>{actionLabel}</Text>
          )}
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: 14,
    padding: 16,
    marginBottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  info: {flex: 1},
  opponent: {color: colors.text, fontSize: 15, fontWeight: '600', marginBottom: 5},
  statusRow: {flexDirection: 'row', alignItems: 'center', gap: 6},
  statusDot: {width: 6, height: 6, borderRadius: 3},
  status: {fontSize: 13},
  action: {
    backgroundColor: colors.primary,
    paddingHorizontal: 16,
    paddingVertical: 9,
    borderRadius: 10,
    minWidth: 76,
    alignItems: 'center',
  },
  actionText: {color: colors.primaryText, fontWeight: '600', fontSize: 13},
});
