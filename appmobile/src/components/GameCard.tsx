import React from 'react';
import {ActivityIndicator, Image, StyleSheet, Text, TouchableOpacity, View} from 'react-native';
import {colors} from '../theme/colors';
import type {GameResponse} from '../types/game';

interface Props {
  game: GameResponse;
  currentPlayerId: string;
  onPress: () => void;
  onCancel?: () => void;
  loading?: boolean;
  cancelling?: boolean;
}

function PlayerAvatar({username, avatarUrl, size = 44}: {username: string | null; avatarUrl: string | null; size?: number}) {
  const initials = (username ?? '?').slice(0, 2).toUpperCase();
  const radius = size / 2;
  if (avatarUrl) {
    return (
      <Image
        source={{uri: avatarUrl}}
        style={[styles.avatar, {width: size, height: size, borderRadius: radius}]}
      />
    );
  }
  return (
    <View style={[styles.avatar, styles.avatarFallback, {width: size, height: size, borderRadius: radius}]}>
      <Text style={[styles.avatarText, {fontSize: size * 0.34}]}>{initials}</Text>
    </View>
  );
}

export function GameCard({game, currentPlayerId, onPress, onCancel, loading, cancelling}: Props) {
  const isCreator = game.playerBlackId === currentPlayerId;
  const isParticipant =
    isCreator || game.playerWhiteId === currentPlayerId;

  const creatorName = game.playerBlackUsername ?? 'Desconhecido';

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

  const isOwnPending = game.status === 'WaitingForPlayers' && isCreator;

  let actionLabel: string | null = null;
  if (game.status === 'WaitingForPlayers' && !isParticipant) {
    actionLabel = 'Jogar';
  } else if (game.status === 'InProgress' && isParticipant) {
    actionLabel = 'Jogar';
  } else if (game.status === 'InProgress' && !isParticipant) {
    actionLabel = 'Assistir';
  }

  return (
    <View style={styles.card}>
      <PlayerAvatar username={game.playerBlackUsername} avatarUrl={game.playerBlackAvatarUrl} />

      <View style={styles.info}>
        <Text style={styles.creator} numberOfLines={1}>{creatorName}</Text>
        <View style={styles.statusRow}>
          <View style={[styles.statusDot, {backgroundColor: statusColor}]} />
          <Text style={[styles.status, {color: statusColor}]}>{statusLabel}</Text>
        </View>
      </View>

      {isOwnPending && (
        <TouchableOpacity
          style={styles.cancelBtn}
          onPress={onCancel}
          disabled={cancelling}
          testID={`cancel-game-${game.id}`}>
          {cancelling ? (
            <ActivityIndicator color={colors.error} size="small" />
          ) : (
            <Text style={styles.cancelText}>Cancelar</Text>
          )}
        </TouchableOpacity>
      )}

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
    padding: 14,
    marginBottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    gap: 12,
  },
  avatar: {
    borderWidth: 1,
    borderColor: colors.border,
  },
  avatarFallback: {
    backgroundColor: colors.surfaceRaised,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {color: colors.text, fontWeight: '700'},
  info: {flex: 1},
  creator: {color: colors.text, fontSize: 15, fontWeight: '600', marginBottom: 4},
  statusRow: {flexDirection: 'row', alignItems: 'center', gap: 6},
  statusDot: {width: 6, height: 6, borderRadius: 3},
  status: {fontSize: 13},
  cancelBtn: {
    borderWidth: 1,
    borderColor: colors.error,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 9,
    minWidth: 80,
    alignItems: 'center',
  },
  cancelText: {color: colors.error, fontWeight: '600', fontSize: 13},
  action: {
    backgroundColor: colors.primary,
    paddingHorizontal: 16,
    paddingVertical: 9,
    borderRadius: 10,
    minWidth: 80,
    alignItems: 'center',
  },
  actionText: {color: colors.primaryText, fontWeight: '600', fontSize: 13},
});
