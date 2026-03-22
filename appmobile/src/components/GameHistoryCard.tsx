/**
 * GameHistoryCard — reusable card for a completed game entry.
 *
 * Renders a tappable card with:
 *  - Result badge (win ✓ / loss ✗ / draw —) with colour coding
 *  - PlayerVs showing the two sides and an optional bet label
 *  - Result label + replay hint in the trailing column
 *
 * Used in GameHistoryScreen (own history) and PlayerProfileScreen (other
 * player's history) so both screens share identical layout and interaction.
 */

import React from 'react';
import {Pressable, StyleSheet, Text, View} from 'react-native';
import {useTranslation} from 'react-i18next';
import {PlayerVs} from './PlayerVs';
import {colors} from '../theme/colors';
import type {GameResponse} from '../types/game';

// ─── Props ────────────────────────────────────────────────────────────────────

interface Props {
  game: GameResponse;
  /** The player whose perspective determines left/right and win/loss colouring. */
  playerId: string;
  onReplay: (game: GameResponse) => void;
}

// ─── Component ────────────────────────────────────────────────────────────────

export function GameHistoryCard({game, playerId, onReplay}: Props) {
  const {t} = useTranslation();

  const isBlack = game.playerBlackId === playerId;
  const myName = isBlack ? game.playerBlackUsername : game.playerWhiteUsername;
  const myAvatar = isBlack ? game.playerBlackAvatarUrl : game.playerWhiteAvatarUrl;
  const oppName = isBlack ? game.playerWhiteUsername : game.playerBlackUsername;
  const oppAvatar = isBlack ? game.playerWhiteAvatarUrl : game.playerBlackAvatarUrl;

  const won = game.winnerId === playerId;
  const drew = game.winnerId === null;
  const resultColor = drew ? colors.textSecondary : won ? '#2ecc71' : colors.error;

  const betLabel =
    game.betAmountSats > 0
      ? `⚡ ${game.betAmountSats.toLocaleString()} sats`
      : t('gameHistory.friendly');

  return (
    <Pressable
      style={({pressed}) => [styles.card, pressed && styles.cardPressed]}
      onPress={() => onReplay(game)}
      testID={`game-history-card-${game.id}`}>

      {/* Result badge */}
      <View
        style={[
          styles.badge,
          drew ? styles.badgeDraw : won ? styles.badgeWin : styles.badgeLoss,
        ]}>
        <Text style={[styles.badgeSymbol, {color: resultColor}]}>
          {drew ? '—' : won ? '✓' : '✗'}
        </Text>
      </View>

      {/* Players */}
      <PlayerVs
        left={{username: myName, avatarUrl: myAvatar}}
        right={{username: oppName, avatarUrl: oppAvatar}}
        detail={betLabel}
        winnerSide={drew ? 'draw' : won ? 'left' : 'right'}
      />

      {/* Result + replay hint */}
      <View style={styles.trailing}>
        <Text style={[styles.resultLabel, {color: resultColor}]}>
          {drew
            ? t('gameHistory.results.draw')
            : won
            ? t('gameHistory.results.win')
            : t('gameHistory.results.loss')}
        </Text>
        <Text style={styles.replayHint}>{t('gameHistory.replayButton')}</Text>
      </View>
    </Pressable>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  cardPressed: {
    backgroundColor: colors.surfaceRaised,
  },

  // ── Result badge ──────────────────────────────────────────────────────────
  badge: {
    width: 36,
    height: 36,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  badgeDraw: {
    backgroundColor: colors.surfaceRaised,
    borderColor: colors.border,
  },
  badgeWin: {
    backgroundColor: 'rgba(46,204,113,0.12)',
    borderColor: 'rgba(46,204,113,0.35)',
  },
  badgeLoss: {
    backgroundColor: 'rgba(255,69,58,0.10)',
    borderColor: 'rgba(255,69,58,0.30)',
  },
  badgeSymbol: {
    fontSize: 15,
    fontWeight: '700',
  },

  // ── Trailing column ───────────────────────────────────────────────────────
  trailing: {
    alignItems: 'flex-end',
    gap: 4,
    flexShrink: 0,
  },
  resultLabel: {
    fontSize: 12,
    fontWeight: '700',
  },
  replayHint: {
    color: colors.textMuted,
    fontSize: 10,
    fontWeight: '600',
    letterSpacing: 0.4,
  },
});
