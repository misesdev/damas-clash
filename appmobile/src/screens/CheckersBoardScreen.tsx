import React, {useCallback, useEffect, useMemo, useRef, useState} from 'react';
import {
  Animated,
  Pressable,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import {Button} from '../components/Button';
import {
  type Move,
  type Piece,
  type PieceColor,
  BOARD_SIZE,
  applyMove,
  createInitialPieces,
  findAt,
  getCaptureMoves,
  getValidMoves,
  getWinner,
  hasMandatoryCapture,
  isDarkSquare,
} from '../game/checkers';

// ── Animation constants ───────────────────────────────────────────────────────

const MOVE_MS = 220;
const FADE_MS = 200;

// ── Types ─────────────────────────────────────────────────────────────────────

interface PieceAnim {
  pos: Animated.ValueXY;
  opacity: Animated.Value;
}

// ── Props ─────────────────────────────────────────────────────────────────────

export interface CheckersBoardScreenProps {
  onBack: () => void;
  /** Called when a move is made — hook for future API integration */
  onMove?: (fromRow: number, fromCol: number, toRow: number, toCol: number) => void;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

const cellPos = (row: number, col: number, size: number) => ({
  x: col * size,
  y: row * size,
});

// ── Component ─────────────────────────────────────────────────────────────────

export function CheckersBoardScreen({onBack, onMove}: CheckersBoardScreenProps) {
  // Board size computed from window dimensions — available immediately, no onLayout needed
  const {width: windowWidth} = useWindowDimensions();
  // Container padding (16×2) + board frame padding (10×2) + frame border (2×2)
  const boardSize = Math.min(windowWidth - 32 - 24, 360);
  const cellSize = boardSize / BOARD_SIZE;

  const [pieces, setPieces] = useState<Piece[]>(createInitialPieces);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [pendingCaptureId, setPendingCaptureId] = useState<string | null>(null);
  const [currentTurn, setCurrentTurn] = useState<PieceColor>('light');
  const [animating, setAnimating] = useState(false);

  const animsRef = useRef(new Map<string, PieceAnim>());

  // ── Animation helpers ──────────────────────────────────────────────────────

  const getAnim = useCallback((piece: Piece): PieceAnim => {
    if (!animsRef.current.has(piece.id)) {
      animsRef.current.set(piece.id, {
        pos: new Animated.ValueXY(cellPos(piece.row, piece.col, cellSize)),
        opacity: new Animated.Value(1),
      });
    }
    return animsRef.current.get(piece.id)!;
  }, [cellSize]);

  // Sync anim positions on initial mount
  useEffect(() => {
    pieces.forEach(p => {
      const anim = animsRef.current.get(p.id);
      if (anim) {
        anim.pos.setValue(cellPos(p.row, p.col, cellSize));
      } else {
        animsRef.current.set(p.id, {
          pos: new Animated.ValueXY(cellPos(p.row, p.col, cellSize)),
          opacity: new Animated.Value(1),
        });
      }
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cellSize]);

  // ── Derived state ──────────────────────────────────────────────────────────

  const activeId = pendingCaptureId ?? selectedId;

  const mustCapture = useMemo(
    () => hasMandatoryCapture(currentTurn, pieces),
    [currentTurn, pieces],
  );

  const selectedPiece = useMemo(
    () => pieces.find(p => p.id === activeId),
    [pieces, activeId],
  );

  const validMoves = useMemo<Move[]>(() => {
    if (!selectedPiece) {
      return [];
    }
    return getValidMoves(selectedPiece, pieces, mustCapture);
  }, [selectedPiece, pieces, mustCapture]);

  const validMoveMap = useMemo(() => {
    const m = new Map<string, Move>();
    validMoves.forEach(mv => m.set(`${mv.row}-${mv.col}`, mv));
    return m;
  }, [validMoves]);

  const darkCount = useMemo(
    () => pieces.filter(p => p.color === 'dark').length,
    [pieces],
  );
  const lightCount = useMemo(
    () => pieces.filter(p => p.color === 'light').length,
    [pieces],
  );
  const winner = useMemo(
    () => getWinner(pieces, currentTurn),
    [pieces, currentTurn],
  );

  // ── Move execution ─────────────────────────────────────────────────────────

  const executeMove = useCallback(
    (movingPiece: Piece, move: Move) => {
      if (animating) {
        return;
      }

      const {pieces: nextPieces, movedPiece, justPromoted} = applyMove(
        pieces,
        movingPiece.id,
        move,
      );

      const furtherCaptures =
        move.captureId && !justPromoted
          ? getCaptureMoves(movedPiece, nextPieces)
          : [];

      setAnimating(true);

      const movingAnim = getAnim(movingPiece);
      const capturedAnim = move.captureId
        ? animsRef.current.get(move.captureId)
        : undefined;

      const anims: Animated.CompositeAnimation[] = [
        Animated.timing(movingAnim.pos, {
          toValue: cellPos(move.row, move.col, cellSize),
          duration: MOVE_MS,
          useNativeDriver: false,
        }),
      ];

      if (capturedAnim) {
        anims.push(
          Animated.timing(capturedAnim.opacity, {
            toValue: 0,
            duration: FADE_MS,
            useNativeDriver: false,
          }),
        );
      }

      Animated.parallel(anims).start(() => {
        if (move.captureId) {
          animsRef.current.delete(move.captureId);
        }
        setPieces(nextPieces);

        if (furtherCaptures.length > 0) {
          setPendingCaptureId(movingPiece.id);
          setSelectedId(null);
        } else {
          setPendingCaptureId(null);
          setSelectedId(null);
          setCurrentTurn(t => (t === 'light' ? 'dark' : 'light'));
        }
        setAnimating(false);
      });

      onMove?.(movingPiece.row, movingPiece.col, move.row, move.col);
    },
    [animating, cellSize, pieces, getAnim, onMove],
  );

  // ── Cell press handler ─────────────────────────────────────────────────────

  const handleCellPress = useCallback(
    (row: number, col: number) => {
      if (winner || animating) {
        return;
      }

      if (pendingCaptureId) {
        const move = validMoveMap.get(`${row}-${col}`);
        if (move) {
          const piece = pieces.find(p => p.id === pendingCaptureId);
          if (piece) {
            executeMove(piece, move);
          }
        }
        return;
      }

      const tapped = findAt(pieces, row, col);

      if (!selectedId) {
        if (tapped?.color === currentTurn) {
          const moves = getValidMoves(tapped, pieces, mustCapture);
          if (moves.length > 0) {
            setSelectedId(tapped.id);
          }
        }
        return;
      }

      if (tapped?.color === currentTurn) {
        if (tapped.id === selectedId) {
          setSelectedId(null);
        } else {
          const moves = getValidMoves(tapped, pieces, mustCapture);
          setSelectedId(moves.length > 0 ? tapped.id : null);
        }
        return;
      }

      const move = validMoveMap.get(`${row}-${col}`);
      if (!move) {
        setSelectedId(null);
        return;
      }

      const piece = pieces.find(p => p.id === selectedId);
      if (piece) {
        executeMove(piece, move);
      }
    },
    [
      winner,
      animating,
      pendingCaptureId,
      validMoveMap,
      pieces,
      selectedId,
      currentTurn,
      mustCapture,
      executeMove,
    ],
  );

  // ── Reset ──────────────────────────────────────────────────────────────────

  const handleReset = useCallback(() => {
    animsRef.current.clear();
    const newPieces = createInitialPieces();
    newPieces.forEach(p => {
      animsRef.current.set(p.id, {
        pos: new Animated.ValueXY(cellPos(p.row, p.col, cellSize)),
        opacity: new Animated.Value(1),
      });
    });
    setPieces(newPieces);
    setSelectedId(null);
    setPendingCaptureId(null);
    setCurrentTurn('light');
  }, [cellSize]);

  // ── Render helpers ─────────────────────────────────────────────────────────

  const turnLabel = (color: PieceColor) => (color === 'light' ? 'Claras' : 'Escuras');

  const pieceSize = Math.round(cellSize * 0.78);
  const pieceOffset = (cellSize - pieceSize) / 2;

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <View style={styles.container} testID="game-screen">
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Damas</Text>
        <Text style={styles.subtitle}>
          {winner
            ? `${turnLabel(winner)} vencem!`
            : mustCapture
            ? 'Captura obrigatória'
            : pendingCaptureId
            ? 'Captura múltipla!'
            : `Turno das ${turnLabel(currentTurn)}`}
        </Text>
      </View>

      {/* Score row */}
      <View style={styles.scoreRow}>
        <View
          style={[
            styles.playerChip,
            currentTurn === 'light' && !winner && styles.activeChip,
          ]}>
          <View style={[styles.chipDot, styles.lightDot]} />
          <Text style={styles.chipLabel}>Claras</Text>
          <Text style={styles.chipCount}>{lightCount}</Text>
        </View>

        <Text style={styles.vs}>×</Text>

        <View
          style={[
            styles.playerChip,
            currentTurn === 'dark' && !winner && styles.activeChip,
          ]}>
          <View style={[styles.chipDot, styles.darkDot]} />
          <Text style={styles.chipLabel}>Escuras</Text>
          <Text style={styles.chipCount}>{darkCount}</Text>
        </View>
      </View>

      {/* Board frame */}
      <View style={[styles.boardFrame, {width: boardSize + 24, height: boardSize + 24}]}>
        {/*
         * Board: two absolute layers stacked inside a fixed-size container.
         *  Layer 1 — cell grid (flex): receives all touch events.
         *  Layer 2 — pieces (absolute overlay): visual only, touch passes through.
         */}
        <View
          style={[styles.board, {width: boardSize, height: boardSize}]}
          testID="checkers-board">

          {/* ── Layer 1: Cell grid ── */}
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
                    {/* Valid move — empty square */}
                    {isTarget && !hasPiece && (
                      <View style={styles.targetDot} />
                    )}
                    {/* Valid move — enemy piece (capture ring) */}
                    {isTarget && hasPiece && (
                      <View style={styles.captureRing} />
                    )}
                  </Pressable>
                );
              }),
            )}
          </View>

          {/* ── Layer 2: Animated pieces (touch disabled) ── */}
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
                    transform: [
                      {translateX: anim.pos.x},
                      {translateY: anim.pos.y},
                    ],
                    opacity: anim.opacity,
                  }}>
                  {/* Piece circle */}
                  <View
                    testID={piece.color === 'dark' ? 'piece-dark' : 'piece-light'}
                    style={[
                      styles.piece,
                      {width: pieceSize, height: pieceSize, borderRadius: pieceSize / 2},
                      piece.color === 'dark' ? styles.darkPiece : styles.lightPiece,
                      isSelected && styles.selectedPiece,
                    ]}>
                    {/* Shine ring */}
                    <View
                      style={[
                        styles.pieceShine,
                        piece.color === 'dark' ? styles.darkShine : styles.lightShine,
                      ]}
                    />
                    {/* King crown */}
                    {piece.isKing && (
                      <Text
                        style={[
                          styles.crown,
                          piece.color === 'dark'
                            ? styles.darkCrown
                            : styles.lightCrown,
                        ]}>
                        ♛
                      </Text>
                    )}
                  </View>
                  {/* Selection glow ring */}
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
          <Button
            label="Nova partida"
            onPress={handleReset}
            testID="new-game-button"
          />
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

// ── Styles ────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0D0F14',
    paddingHorizontal: 16,
    paddingTop: 56,
    paddingBottom: 32,
    alignItems: 'center',
    gap: 16,
  },

  // Header
  header: {
    alignItems: 'center',
    gap: 4,
  },
  title: {
    color: '#F0EDE6',
    fontSize: 28,
    fontWeight: '800',
    letterSpacing: 1,
  },
  subtitle: {
    color: '#8A90A0',
    fontSize: 13,
    fontWeight: '500',
    letterSpacing: 0.3,
  },

  // Score row
  scoreRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  playerChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#181C26',
    borderWidth: 1,
    borderColor: '#2A3042',
    borderRadius: 20,
    paddingVertical: 8,
    paddingHorizontal: 14,
    minWidth: 110,
    justifyContent: 'center',
  },
  activeChip: {
    borderColor: '#C9A84C',
    backgroundColor: '#1E1F15',
  },
  chipDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  lightDot: {
    backgroundColor: '#E8E0D0',
    borderWidth: 1,
    borderColor: '#B8AD9D',
  },
  darkDot: {
    backgroundColor: '#2A2F3C',
    borderWidth: 1,
    borderColor: '#1A1E28',
  },
  chipLabel: {
    color: '#9AA0B2',
    fontSize: 13,
    fontWeight: '600',
  },
  chipCount: {
    color: '#E0DCD4',
    fontSize: 15,
    fontWeight: '800',
  },
  vs: {
    color: '#3A4058',
    fontSize: 16,
    fontWeight: '700',
  },

  // Board frame (wooden border effect)
  boardFrame: {
    borderRadius: 14,
    padding: 10,
    backgroundColor: '#2E1A0A',
    borderWidth: 2,
    borderColor: '#5A3515',
    shadowColor: '#000',
    shadowOpacity: 0.6,
    shadowOffset: {width: 0, height: 8},
    shadowRadius: 16,
    elevation: 12,
  },
  board: {
    borderRadius: 6,
    overflow: 'hidden',
  },

  // Cell grid layer
  cellGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },

  // Individual cells
  lightCell: {
    backgroundColor: '#F0D9B5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  darkCell: {
    backgroundColor: '#B58863',
    alignItems: 'center',
    justifyContent: 'center',
  },
  selectedCell: {
    backgroundColor: '#CDD16F',
  },

  // Move indicators
  targetDot: {
    width: '30%',
    aspectRatio: 1,
    borderRadius: 999,
    backgroundColor: 'rgba(0,0,0,0.22)',
  },
  captureRing: {
    position: 'absolute',
    top: 3,
    left: 3,
    right: 3,
    bottom: 3,
    borderRadius: 999,
    borderWidth: 3,
    borderColor: 'rgba(220, 50, 50, 0.7)',
  },

  // Piece
  piece: {
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    shadowOpacity: 0.45,
    shadowOffset: {width: 0, height: 3},
    shadowRadius: 4,
    elevation: 5,
  },
  darkPiece: {
    backgroundColor: '#1E2230',
    borderColor: '#0D0F18',
    shadowColor: '#000',
  },
  lightPiece: {
    backgroundColor: '#F4EEE2',
    borderColor: '#C8BCA8',
    shadowColor: '#555',
  },
  selectedPiece: {
    borderColor: '#D4A843',
    shadowColor: '#D4A843',
    shadowOpacity: 0.9,
    shadowRadius: 8,
    elevation: 10,
  },

  // Shine ring inside piece
  pieceShine: {
    position: 'absolute',
    top: '12%',
    left: '12%',
    width: '58%',
    aspectRatio: 1,
    borderRadius: 999,
    borderWidth: 1,
  },
  darkShine: {
    backgroundColor: '#2E364E',
    borderColor: '#3D4760',
  },
  lightShine: {
    backgroundColor: '#FFFFFF',
    borderColor: '#E0D8CC',
  },

  // Crown text
  crown: {
    fontSize: 13,
    lineHeight: 15,
    fontWeight: '700',
    marginTop: 2,
  },
  darkCrown: {
    color: '#C9A84C',
  },
  lightCrown: {
    color: '#7A5A18',
  },

  // Selection glow ring (rendered in pieces layer, position: absolute)
  selectionRing: {
    position: 'absolute',
    borderWidth: 2.5,
    borderColor: '#D4A843',
  },

  // Actions
  actions: {
    width: '100%',
    gap: 10,
    alignItems: 'stretch',
  },
});
