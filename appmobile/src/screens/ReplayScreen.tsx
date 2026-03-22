/**
 * ReplayScreen — step-by-step replay of a completed game.
 *
 * This screen is intentionally thin: all logic lives in useReplayControls,
 * all styles in replayStyles.  The PlayerMatchup component handles the player
 * header so the same UI is shared with CheckersBoardScreen.
 */

import React from 'react';
import {
  ActivityIndicator,
  Animated,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {useTranslation} from 'react-i18next';
import {BOARD_SIZE, isDarkSquare} from '../game/checkers';
import {useReplayControls} from '../hooks/useReplayControls';
import {PlayerMatchup} from '../components/PlayerMatchup';
import {ScreenHeader} from '../components/ScreenHeader';
import {replayStyles as s} from '../styles/replayStyles';
import type {LoginResponse} from '../types/auth';
import type {GameResponse} from '../types/game';

// ─── Props ────────────────────────────────────────────────────────────────────

interface Props {
  game: GameResponse;
  session: LoginResponse;
  onBack: () => void;
}

// ─── Screen ───────────────────────────────────────────────────────────────────

export function ReplayScreen({game, session, onBack}: Props) {
  const {t} = useTranslation();

  const {
    loading,
    moves,
    step,
    playing,
    isAtStart,
    isAtEnd,
    boardSize,
    cellSize,
    pieceSize,
    displayPieces,
    isDarkTurn,
    darkCount,
    lightCount,
    getAnim,
    togglePlay,
    goToStart,
    goToEnd,
    stepBack,
    stepForward,
  } = useReplayControls(game, session);

  const winner =
    game.winnerId === game.playerBlackId
      ? game.playerBlackUsername
      : game.winnerId === game.playerWhiteId
      ? game.playerWhiteUsername
      : null;

  const resignedName =
    game.resignedByPlayerId === game.playerBlackId
      ? game.playerBlackUsername
      : game.resignedByPlayerId === game.playerWhiteId
      ? game.playerWhiteUsername
      : null;

  const controls = [
    {label: '|◀', action: goToStart, disabled: isAtStart, primary: false},
    {label: '◀', action: stepBack, disabled: isAtStart, primary: false},
    {
      label: playing ? '⏸' : isAtEnd ? '↺' : '▶',
      action: togglePlay,
      disabled: false,
      primary: true,
    },
    {label: '▶', action: stepForward, disabled: isAtEnd, primary: false},
    {label: '▶|', action: goToEnd, disabled: isAtEnd, primary: false},
  ];

  return (
    <SafeAreaView style={s.safeArea}>
      <View style={s.wrapper}>
        <ScreenHeader title="Replay" onBack={onBack} />

        {/* Player matchup header */}
        <PlayerMatchup
          left={{
            username: game.playerBlackUsername,
            avatarUrl: game.playerBlackAvatarUrl,
            label: t('replay.playerBlack'),
            count: darkCount,
            isActive: isDarkTurn && !loading,
            pieceColor: 'dark',
          }}
          right={{
            username: game.playerWhiteUsername,
            avatarUrl: game.playerWhiteAvatarUrl,
            label: t('replay.playerWhite'),
            count: lightCount,
            isActive: !isDarkTurn && !loading,
            pieceColor: 'light',
          }}
        />

        {/* Move counter */}
        <Text style={s.moveCounter}>
          {loading
            ? t('replay.loading')
            : t('replay.moveCounter', {step, total: moves.length})}
        </Text>

        {/* Winner / resigned banner */}
        {isAtEnd && (resignedName || winner) && (
          <View style={s.winnerBanner}>
            <Text style={s.winnerText}>
              {resignedName
                ? t('replay.resigned', {name: resignedName})
                : t('replay.winner', {name: winner})}
            </Text>
          </View>
        )}

        {/* Board */}
        {loading ? (
          <View style={s.loadingContainer}>
            <ActivityIndicator color="#fff" size="large" />
          </View>
        ) : (
          <View style={s.boardFrame}>
            <View
              style={[s.boardInner, {width: boardSize, height: boardSize}]}>

              {/* Cell grid */}
              {Array.from({length: BOARD_SIZE}, (_, row) =>
                Array.from({length: BOARD_SIZE}, (_, col) => (
                  <View
                    key={`${row}-${col}`}
                    style={{
                      position: 'absolute',
                      width: cellSize,
                      height: cellSize,
                      left: col * cellSize,
                      top: row * cellSize,
                      backgroundColor: isDarkSquare(row, col) ? '#b58863' : '#f0d9b5',
                    }}
                  />
                )),
              )}

              {/* Animated pieces */}
              {displayPieces.map(piece => {
                const anim = getAnim(piece);
                return (
                  <Animated.View
                    key={piece.id}
                    style={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      width: cellSize,
                      height: cellSize,
                      alignItems: 'center',
                      justifyContent: 'center',
                      transform: [
                        {translateX: anim.pos.x},
                        {translateY: anim.pos.y},
                      ],
                      opacity: anim.opacity,
                    }}>
                    <View
                      style={[
                        s.pieceView,
                        {
                          width: pieceSize,
                          height: pieceSize,
                          borderRadius: pieceSize / 2,
                        },
                        piece.color === 'dark' ? s.pieceDark : s.pieceLight,
                      ]}>
                      {piece.isKing && (
                        <Text
                          style={{
                            fontSize: pieceSize * 0.38,
                            color: piece.color === 'dark' ? '#ffd700' : '#333',
                            lineHeight: pieceSize * 0.5,
                          }}>
                          ♛
                        </Text>
                      )}
                    </View>
                  </Animated.View>
                );
              })}
            </View>
          </View>
        )}

        {/* Playback controls */}
        {!loading && (
          <View style={s.controlsRow}>
            {controls.map((btn, i) => (
              <TouchableOpacity
                key={i}
                onPress={btn.action}
                disabled={btn.disabled}
                activeOpacity={0.75}
                style={[
                  btn.primary ? s.controlBtnPrimary : s.controlBtn,
                  btn.disabled && s.controlBtnDisabled,
                ]}>
                <Text style={btn.primary ? s.controlBtnPrimaryText : s.controlBtnText}>
                  {btn.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* Progress bar */}
        {!loading && moves.length > 0 && (
          <View style={[s.progressTrack, {width: boardSize + 16}]}>
            <View
              style={[
                s.progressFill,
                {width: `${(step / moves.length) * 100}%`},
              ]}
            />
          </View>
        )}
      </View>
    </SafeAreaView>
  );
}
