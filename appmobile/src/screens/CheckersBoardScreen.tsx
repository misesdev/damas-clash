import React from 'react';
import {Animated, Image, Pressable, StyleSheet, Text, View} from 'react-native';
import {useTranslation} from 'react-i18next';
import {showMessage} from '../components/MessageBox';
import {Button} from '../components/Button';
import {BOARD_SIZE, findAt, isDarkSquare} from '../game/checkers';
import {useGameBoard} from '../hooks/useGameBoard';
import {styles} from '../styles/checkersBoardStyles';
import type {LoginResponse} from '../types/auth';
import type {GameResponse} from '../types/game';

function PlayerAvatar({
  avatarUrl,
  username,
  size = 30,
}: {
  avatarUrl?: string | null;
  username?: string | null;
  size?: number;
}) {
  const radius = size / 2;
  if (avatarUrl) {
    return (
      <Image
        source={{uri: avatarUrl}}
        style={{width: size, height: size, borderRadius: radius}}
      />
    );
  }
  const initial = username ? username[0].toUpperCase() : '?';
  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: radius,
        backgroundColor: '#232323',
        alignItems: 'center',
        justifyContent: 'center',
      }}>
      <Text style={{color: '#FFFFFF', fontSize: size * 0.44, fontWeight: '600'}}>
        {initial}
      </Text>
    </View>
  );
}

export interface CheckersBoardScreenProps {
  game: GameResponse;
  session: LoginResponse;
  onBack: () => void;
}


export function CheckersBoardScreen({game, session, onBack}: CheckersBoardScreenProps) {
  const {t} = useTranslation();
  const {
    game: liveGame,
    engine,
    myColor,
    isFlipped,
    myUsername,
    opponentUsername,
    myAvatarUrl,
    opponentAvatarUrl,
    isMyTurn,
    spectator,
    timeLeft,
    winner,
    watchersCount,
    sendingMove,
    error,
    boardSize,
    cellSize,
    animating,
    getAnim,
    darkCount,
    lightCount,
    handleCellPress,
    handleResign,
  } = useGameBoard(game, session);

  const {
    pieces,
    mustCapture,
    pendingCaptureId,
    activeId,
    selectedPiece,
    validMoveMap,
    capturingPieceIds,
  } = engine;

  const capturingSet = new Set(capturingPieceIds);

  const pieceSize = Math.round(cellSize * 0.78);
  const pieceOffset = (cellSize - pieceSize) / 2;

  const myCount = myColor === 'dark' ? darkCount : lightCount;
  const oppCount = myColor === 'dark' ? lightCount : darkCount;

  // When isFlipped, dark pieces render as light and vice versa (player always sees self as white)
  const displayColor = (gameColor: 'dark' | 'light') =>
    isFlipped ? (gameColor === 'dark' ? 'light' : 'dark') : gameColor;

  // Spectator: show black player on left, white on right with turn-based highlighting
  // Participant: show "me" on left, "opponent" on right
  const isDarkTurn = liveGame.currentTurn === 'Black';
  const leftUsername = spectator ? liveGame.playerBlackUsername : myUsername;
  const rightUsername = spectator ? liveGame.playerWhiteUsername : opponentUsername;
  const leftAvatarUrl = spectator ? liveGame.playerBlackAvatarUrl : myAvatarUrl;
  const rightAvatarUrl = spectator ? liveGame.playerWhiteAvatarUrl : opponentAvatarUrl;
  const leftLabel = spectator ? t('checkersBoard.playerBlack') : t('checkersBoard.you');
  const rightLabel = spectator ? t('checkersBoard.playerWhite') : t('checkersBoard.opponent');
  const leftCount = spectator ? darkCount : myCount;
  const rightCount = spectator ? lightCount : oppCount;
  const leftActive = spectator ? (isDarkTurn && !winner) : (isMyTurn && !winner);
  const rightActive = spectator ? (!isDarkTurn && !winner) : (!isMyTurn && !winner);

  const statusText = () => {
    if (spectator) {
      if (winner) {
        const winnerName = liveGame.winnerId === liveGame.playerBlackId
          ? liveGame.playerBlackUsername
          : liveGame.playerWhiteUsername;
        return t('checkersBoard.spectatorWinner', {winner: winnerName ?? 'Jogador'});
      }
      const turnName = isDarkTurn ? liveGame.playerBlackUsername : liveGame.playerWhiteUsername;
      return t('checkersBoard.spectatorTurn', {name: turnName ?? 'jogador'});
    }
    if (winner) {
      return winner === myColor ? t('checkersBoard.youWon') : t('checkersBoard.youLost');
    }
    if (sendingMove) {return t('checkersBoard.sendingMove');}
    if (pendingCaptureId) {return t('checkersBoard.multiCapture');}
    if (mustCapture) {return t('checkersBoard.mandatoryCapture');}
    return isMyTurn ? t('checkersBoard.yourTurn') : t('checkersBoard.opponentTurn', {name: opponentUsername ?? 'oponente'});
  };

  const isTimerActive = isMyTurn && !winner && liveGame.status !== 'Completed';
  const isUrgent = isTimerActive && timeLeft <= 10;

  const confirmResign = () => {
    showMessage({
      title: t('checkersBoard.resignConfirm.title'),
      message: t('checkersBoard.resignConfirm.message'),
      type: 'confirm',
      actions: [
        {label: t('checkersBoard.resignConfirm.cancel')},
        {label: t('checkersBoard.resignConfirm.resign'), danger: true, onPress: handleResign},
      ],
    });
  };

  return (
    <View style={styles.container} testID="game-screen">
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>{t('checkersBoard.title')}</Text>
        <Text style={styles.watchers} testID="watchers-count">
          {t(watchersCount === 1 ? 'checkersBoard.watchers_one' : 'checkersBoard.watchers_other', {count: watchersCount})}
        </Text>
      </View>

      {/* Player chips */}
      <View style={styles.scoreRow}>
        <View style={[styles.playerChip, leftActive && styles.activeChip]}>
          <PlayerAvatar avatarUrl={leftAvatarUrl} username={leftUsername} />
          <View style={styles.chipInfo}>
            <Text style={styles.chipLabel}>{leftLabel}</Text>
            <Text style={styles.chipName} numberOfLines={1}>{leftUsername}</Text>
          </View>
          <Text style={styles.chipCount}>{leftCount}</Text>
        </View>

        <Text style={styles.vs}>×</Text>

        <View style={[styles.playerChip, rightActive && styles.activeChip]}>
          <PlayerAvatar avatarUrl={rightAvatarUrl} username={rightUsername} />
          <View style={styles.chipInfo}>
            <Text style={styles.chipLabel}>{rightLabel}</Text>
            <Text style={styles.chipName} numberOfLines={1}>{rightUsername}</Text>
          </View>
          <Text style={styles.chipCount}>{rightCount}</Text>
        </View>
      </View>

      {error ? <Text style={styles.errorText}>{error}</Text> : null}

      {/* Board frame */}
      <View style={[styles.boardFrame, {width: boardSize + 24, height: boardSize + 24}]}>
        <View
          style={[
            styles.board,
            {width: boardSize, height: boardSize},
            isFlipped && styles.boardFlipped,
          ]}
          testID="checkers-board">

          {/* Layer 1: Cell grid */}
          <View style={[StyleSheet.absoluteFillObject, styles.cellGrid]}>
            {Array.from({length: BOARD_SIZE}, (_, row) =>
              Array.from({length: BOARD_SIZE}, (_, col) => {
                const dark = isDarkSquare(row, col);
                const isTarget = validMoveMap.has(`${row}-${col}`);
                const hasPiece = !!findAt(pieces, row, col);
                const isSelectedCell =
                  selectedPiece?.row === row && selectedPiece?.col === col;

                return (
                  <Pressable
                    key={`${row}-${col}`}
                    testID={`cell-${row}-${col}`}
                    style={[
                      {width: cellSize, height: cellSize},
                      dark ? styles.darkCell : styles.lightCell,
                      isSelectedCell && styles.selectedCell,
                    ]}
                    onPress={() => handleCellPress(row, col)}>
                    {isTarget && !hasPiece && <View style={styles.targetDot} />}
                    {isTarget && hasPiece && <View style={styles.captureRing} />}
                  </Pressable>
                );
              }),
            )}
          </View>

          {/* Layer 2: Animated pieces */}
          <View
            style={[
              StyleSheet.absoluteFillObject,
              // eslint-disable-next-line react-native/no-inline-styles
              {pointerEvents: 'none'},
            ]}>
            {pieces.map(piece => {
              const anim = getAnim(piece);
              const isSelected = piece.id === activeId;
              const isMandatory = !isSelected && capturingSet.has(piece.id);
              const visColor = displayColor(piece.color);
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
                      // Counter-rotate piece contents so crown stays readable
                      ...(isFlipped ? [{rotate: '180deg'}] : []),
                    ],
                    opacity: anim.opacity,
                  }}>
                  <View
                    testID={piece.color === 'dark' ? 'piece-dark' : 'piece-light'}
                    style={[
                      styles.piece,
                      {width: pieceSize, height: pieceSize, borderRadius: pieceSize / 2},
                      visColor === 'dark' ? styles.darkPiece : styles.lightPiece,
                      isSelected && styles.selectedPiece,
                    ]}>
                    <View
                      style={[
                        styles.pieceShine,
                        visColor === 'dark' ? styles.darkShine : styles.lightShine,
                      ]}
                    />
                    {piece.isKing && (
                      <Text
                        style={[
                          styles.crown,
                          visColor === 'dark' ? styles.darkCrown : styles.lightCrown,
                        ]}>
                        ♛
                      </Text>
                    )}
                  </View>
                  {isSelected && (
                    <View
                      style={[
                        styles.selectionRing,
                        {
                          width: pieceSize + 8,
                          height: pieceSize + 8,
                          borderRadius: (pieceSize + 8) / 2,
                          top: pieceOffset - 4,
                          left: pieceOffset - 4,
                        },
                      ]}
                    />
                  )}
                  {isMandatory && (
                    <View
                      style={[
                        styles.mandatoryRing,
                        {
                          width: pieceSize + 8,
                          height: pieceSize + 8,
                          borderRadius: (pieceSize + 8) / 2,
                          top: pieceOffset - 4,
                          left: pieceOffset - 4,
                        },
                      ]}
                    />
                  )}
                </Animated.View>
              );
            })}
          </View>
        </View>
      </View>

      {/* Status + timer (below board) */}
      <View style={styles.statusRow}>
        <Text style={[styles.statusLabel, isUrgent && styles.statusUrgent]} testID="status-text">
          {statusText()}
        </Text>
        {isTimerActive && (
          <Text style={[styles.timerText, isUrgent && styles.timerUrgent]} testID="turn-timer">
            {timeLeft}s
          </Text>
        )}
      </View>

      {/* Resign button — only during active game for participants */}
      {liveGame.status === 'InProgress' && !winner && !spectator && (
        <Button
          label={t('checkersBoard.resignButton')}
          variant="ghost"
          onPress={confirmResign}
          testID="resign-button"
        />
      )}

      {/* Leave button — spectators can exit anytime */}
      {spectator && liveGame.status === 'InProgress' && (
        <Button
          label={t('checkersBoard.leaveButton')}
          variant="ghost"
          onPress={onBack}
          testID="leave-button"
        />
      )}

      {/* Win / loss overlay */}
      {winner && (
        <View style={styles.overlay}>
          <View style={styles.overlayContent}>
            {spectator ? (
              <>
                <Text style={styles.overlayEmoji}>🏆</Text>
                <Text style={[styles.overlayHeading, styles.winColor]}>{t('checkersBoard.spectatorEnd.title')}</Text>
                <Text style={styles.overlaySubtitle}>
                  {t('checkersBoard.spectatorEnd.message', {winner: (liveGame.winnerId === liveGame.playerBlackId
                    ? liveGame.playerBlackUsername
                    : liveGame.playerWhiteUsername) ?? 'Jogador'})}
                </Text>
              </>
            ) : (
              <>
                <Text style={styles.overlayEmoji}>
                  {winner === myColor ? '🏆' : '💔'}
                </Text>
                <Text style={[styles.overlayHeading, winner === myColor ? styles.winColor : styles.lossColor]}>
                  {winner === myColor ? t('checkersBoard.participantEnd.winTitle') : t('checkersBoard.participantEnd.lossTitle')}
                </Text>
                <Text style={styles.overlaySubtitle}>
                  {winner === myColor
                    ? t('checkersBoard.participantEnd.winMessage')
                    : t('checkersBoard.participantEnd.lossMessage', {opponent: opponentUsername ?? 'Adversário'})}
                </Text>
              </>
            )}
            <View style={styles.overlayActions}>
              <Button label={t('checkersBoard.backToHome')} onPress={onBack} testID="overlay-back-button" />
            </View>
          </View>
        </View>
      )}
    </View>
  );
}
