import React from 'react';
import {Animated, Pressable, StyleSheet, Text, View} from 'react-native';
import {Button} from '../components/Button';
import {BOARD_SIZE, findAt, isDarkSquare} from '../game/checkers';
import {useGameBoard} from '../hooks/useGameBoard';
import {styles} from '../styles/checkersBoardStyles';
import type {LoginResponse} from '../types/auth';
import type {GameResponse} from '../types/game';

export interface CheckersBoardScreenProps {
  game: GameResponse;
  session: LoginResponse;
  onBack: () => void;
}

const colorLabel = (color: 'dark' | 'light') => (color === 'dark' ? 'Escuras' : 'Claras');

export function CheckersBoardScreen({game, session, onBack}: CheckersBoardScreenProps) {
  const {
    game: liveGame,
    engine,
    myColor,
    opponentColor,
    myUsername,
    opponentUsername,
    isMyTurn,
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

  const statusText = () => {
    if (winner) {
      return winner === myColor ? 'Você venceu! 🏆' : 'Você perdeu.';
    }
    if (sendingMove) {return 'Enviando movimento...';}
    if (pendingCaptureId) {return 'Captura múltipla!';}
    if (mustCapture) {return 'Captura obrigatória';}
    return isMyTurn ? 'Sua vez' : `Vez de ${opponentUsername ?? 'oponente'}`;
  };

  return (
    <View style={styles.container} testID="game-screen">
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Damas</Text>
        <Text style={styles.subtitle}>{statusText()}</Text>
        <Text style={styles.watchers} testID="watchers-count">
          {watchersCount} {watchersCount === 1 ? 'assistindo' : 'assistindo'}
        </Text>
      </View>

      {/* Player chips */}
      <View style={styles.scoreRow}>
        <View
          style={[
            styles.playerChip,
            myColor === 'light' && isMyTurn && !winner && styles.activeChip,
          ]}>
          <View style={[styles.chipDot, styles.lightDot]} />
          <View>
            <Text style={styles.chipLabel}>Você</Text>
            <Text style={styles.chipName} numberOfLines={1}>
              {myColor === 'light' ? myUsername : opponentUsername}
            </Text>
          </View>
          <Text style={styles.chipCount}>{lightCount}</Text>
        </View>

        <Text style={styles.vs}>×</Text>

        <View
          style={[
            styles.playerChip,
            myColor === 'dark' && !isMyTurn && !winner && styles.activeChip,
          ]}>
          <View style={[styles.chipDot, styles.darkDot]} />
          <View>
            <Text style={styles.chipLabel}>Adversário</Text>
            <Text style={styles.chipName} numberOfLines={1}>
              {myColor === 'dark' ? opponentUsername : myUsername}
            </Text>
          </View>
          <Text style={styles.chipCount}>{darkCount}</Text>
        </View>
      </View>

      {error ? <Text style={styles.errorText}>{error}</Text> : null}

      {/* Board frame */}
      <View style={[styles.boardFrame, {width: boardSize + 24, height: boardSize + 24}]}>
        <View
          style={[styles.board, {width: boardSize, height: boardSize}]}
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
                    transform: [{translateX: anim.pos.x}, {translateY: anim.pos.y}],
                    opacity: anim.opacity,
                  }}>
                  <View
                    testID={piece.color === 'dark' ? 'piece-dark' : 'piece-light'}
                    style={[
                      styles.piece,
                      {width: pieceSize, height: pieceSize, borderRadius: pieceSize / 2},
                      piece.color === 'dark' ? styles.darkPiece : styles.lightPiece,
                      isSelected && styles.selectedPiece,
                    ]}>
                    <View
                      style={[
                        styles.pieceShine,
                        piece.color === 'dark' ? styles.darkShine : styles.lightShine,
                      ]}
                    />
                    {piece.isKing && (
                      <Text
                        style={[
                          styles.crown,
                          piece.color === 'dark' ? styles.darkCrown : styles.lightCrown,
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

      {/* Actions */}
      <View style={styles.actions}>
        {winner && (
          <Text style={styles.winnerText}>
            {winner === myColor
              ? `Você venceu com as ${colorLabel(myColor)}!`
              : `${opponentUsername} venceu.`}
          </Text>
        )}
        <Button
          label="Voltar"
          variant="ghost"
          onPress={onBack}
          testID="back-home-button"
        />
      </View>
    </View>
  );
}
