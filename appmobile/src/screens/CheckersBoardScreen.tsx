import React from 'react';
import {Animated, Image, Pressable, StyleSheet, Text, View} from 'react-native';
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
  } = engine;

  const pieceSize = Math.round(cellSize * 0.78);
  const pieceOffset = (cellSize - pieceSize) / 2;

  const myCount = myColor === 'dark' ? darkCount : lightCount;
  const oppCount = myColor === 'dark' ? lightCount : darkCount;

  // When isFlipped, dark pieces render as light and vice versa (player always sees self as white)
  const displayColor = (gameColor: 'dark' | 'light') =>
    isFlipped ? (gameColor === 'dark' ? 'light' : 'dark') : gameColor;

  const statusText = () => {
    if (winner) {
      return winner === myColor ? 'Você venceu! 🏆' : 'Você perdeu.';
    }
    if (sendingMove) {return 'Enviando movimento...';}
    if (pendingCaptureId) {return 'Captura múltipla!';}
    if (mustCapture) {return 'Captura obrigatória';}
    return isMyTurn ? 'Sua vez' : `Vez de ${opponentUsername ?? 'oponente'}`;
  };

  const isTimerActive = isMyTurn && !winner && liveGame.status !== 'Completed';
  const isUrgent = isTimerActive && timeLeft <= 10;

  const confirmResign = () => {
    showMessage({
      title: 'Desistir da partida?',
      message: 'Você cederá a vitória ao adversário. Esta ação não pode ser desfeita.',
      type: 'confirm',
      actions: [
        {label: 'Cancelar'},
        {label: 'Desistir', danger: true, onPress: handleResign},
      ],
    });
  };

  return (
    <View style={styles.container} testID="game-screen">
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Damas</Text>
        <Text style={styles.watchers} testID="watchers-count">
          {watchersCount} {watchersCount === 1 ? 'espectador' : 'espectadores'}
        </Text>
      </View>

      {/* Player chips */}
      <View style={styles.scoreRow}>
        <View style={[styles.playerChip, isMyTurn && !winner && styles.activeChip]}>
          <PlayerAvatar avatarUrl={myAvatarUrl} username={myUsername} />
          <View style={styles.chipInfo}>
            <Text style={styles.chipLabel}>VOCÊ</Text>
            <Text style={styles.chipName} numberOfLines={1}>{myUsername}</Text>
          </View>
          <Text style={styles.chipCount}>{myCount}</Text>
        </View>

        <Text style={styles.vs}>×</Text>

        <View style={[styles.playerChip, !isMyTurn && !winner && styles.activeChip]}>
          <PlayerAvatar avatarUrl={opponentAvatarUrl} username={opponentUsername} />
          <View style={styles.chipInfo}>
            <Text style={styles.chipLabel}>ADVERSÁRIO</Text>
            <Text style={styles.chipName} numberOfLines={1}>{opponentUsername}</Text>
          </View>
          <Text style={styles.chipCount}>{oppCount}</Text>
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

      {/* Resign button — only during active game */}
      {liveGame.status === 'InProgress' && !winner && (
        <Button
          label="Desistir"
          variant="ghost"
          onPress={confirmResign}
          testID="resign-button"
        />
      )}

      {/* Win / loss overlay */}
      {winner && (
        <View style={styles.overlay}>
          <View style={styles.overlayContent}>
            <Text style={styles.overlayEmoji}>
              {winner === myColor ? '🏆' : '💔'}
            </Text>
            <Text style={[styles.overlayHeading, winner === myColor ? styles.winColor : styles.lossColor]}>
              {winner === myColor ? 'Vitória!' : 'Derrota'}
            </Text>
            <Text style={styles.overlaySubtitle}>
              {winner === myColor
                ? 'Parabéns! Você venceu a partida.'
                : `${opponentUsername ?? 'Adversário'} venceu a partida.`}
            </Text>
            <View style={styles.overlayActions}>
              <Button label="Voltar ao início" onPress={onBack} testID="overlay-back-button" />
            </View>
          </View>
        </View>
      )}
    </View>
  );
}
