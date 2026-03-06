import {useCallback, useEffect, useRef, useState} from 'react';
import {Animated, useWindowDimensions} from 'react-native';
import type {Move, Piece} from '../game/checkers';
import {BOARD_SIZE} from '../game/checkers';
import {GameEngine} from '../game/GameEngine';

const MOVE_MS = 220;
const FADE_MS = 200;

export interface PieceAnim {
  pos: Animated.ValueXY;
  opacity: Animated.Value;
}

const cellPos = (row: number, col: number, size: number) => ({
  x: col * size,
  y: row * size,
});

export function useCheckersBoard(
  onMove?: (fromRow: number, fromCol: number, toRow: number, toCol: number) => void,
) {
  const {width: windowWidth} = useWindowDimensions();
  // Container padding (16×2) + board frame padding (10×2) + frame border (2×2)
  const boardSize = Math.min(windowWidth - 32 - 24, 360);
  const cellSize = boardSize / BOARD_SIZE;

  const [engine, setEngine] = useState(() => GameEngine.initial());
  const [animating, setAnimating] = useState(false);
  const animsRef = useRef(new Map<string, PieceAnim>());

  const getAnim = useCallback(
    (piece: Piece): PieceAnim => {
      if (!animsRef.current.has(piece.id)) {
        animsRef.current.set(piece.id, {
          pos: new Animated.ValueXY(cellPos(piece.row, piece.col, cellSize)),
          opacity: new Animated.Value(1),
        });
      }
      return animsRef.current.get(piece.id)!;
    },
    [cellSize],
  );

  // Sync animation positions when cellSize changes (window resize / orientation)
  useEffect(() => {
    engine.pieces.forEach(p => {
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

  const runMoveAnimation = useCallback(
    (movingPiece: Piece, move: Move, nextEngine: GameEngine) => {
      setAnimating(true);
      const movingAnim = getAnim(movingPiece);
      const capturedAnim = move.captureId ? animsRef.current.get(move.captureId) : undefined;

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
        setEngine(nextEngine);
        setAnimating(false);
      });
    },
    [cellSize, getAnim],
  );

  const handleCellPress = useCallback(
    (row: number, col: number) => {
      if (engine.winner || animating) {return;}

      // Multi-capture in progress — only capture moves valid
      if (engine.pendingCaptureId) {
        const result = engine.applyMoveAt(row, col);
        if (result) {
          runMoveAnimation(result.movingPiece, result.move, result.nextEngine);
          onMove?.(result.movingPiece.row, result.movingPiece.col, result.move.row, result.move.col);
        }
        return;
      }

      // Piece selected and tapping a valid destination
      if (engine.selectedId && engine.validMoveMap.has(`${row}-${col}`)) {
        const result = engine.applyMoveAt(row, col);
        if (result) {
          runMoveAnimation(result.movingPiece, result.move, result.nextEngine);
          onMove?.(result.movingPiece.row, result.movingPiece.col, result.move.row, result.move.col);
        }
        return;
      }

      // Select / deselect piece
      setEngine(prev => prev.selectPiece(row, col));
    },
    [engine, animating, runMoveAnimation, onMove],
  );

  const handleReset = useCallback(() => {
    animsRef.current.clear();
    const newEngine = GameEngine.initial();
    newEngine.pieces.forEach(p => {
      animsRef.current.set(p.id, {
        pos: new Animated.ValueXY(cellPos(p.row, p.col, cellSize)),
        opacity: new Animated.Value(1),
      });
    });
    setEngine(newEngine);
  }, [cellSize]);

  return {
    engine,
    boardSize,
    cellSize,
    animating,
    animsRef,
    getAnim,
    handleCellPress,
    handleReset,
  };
}
