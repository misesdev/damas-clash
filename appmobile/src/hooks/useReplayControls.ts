/**
 * useReplayControls — all logic for the ReplayScreen.
 *
 * Responsibilities:
 *  - Fetch moves from the API and pre-compute every engine state.
 *  - Drive animated piece transitions between steps (with generation-counter
 *    bug fix: stale callbacks from aborted animations are silently discarded).
 *  - Expose playback controls (play/pause, step forward/back, jump to end).
 */

import {useEffect, useRef, useState} from 'react';
import {Animated, useWindowDimensions} from 'react-native';
import {getGameMoves} from '../api/games';
import {BOARD_SIZE, createInitialPieces} from '../game/checkers';
import {GameEngine} from '../game/GameEngine';
import type {Piece} from '../game/checkers';
import type {LoginResponse} from '../types/auth';
import type {GameResponse, MoveResponse} from '../types/game';

// ─── Constants ────────────────────────────────────────────────────────────────

const MOVE_MS = 350;   // piece slide duration
const FADE_MS = 350;   // captured piece fade duration
const PLAYBACK_MS = 900; // interval between auto-play steps

// ─── Types ────────────────────────────────────────────────────────────────────

export interface PieceAnim {
  pos: Animated.ValueXY;
  opacity: Animated.Value;
}

export interface ReplayControls {
  // Loading
  loading: boolean;

  // Playback state
  moves: MoveResponse[];
  step: number;
  playing: boolean;
  isAtStart: boolean;
  isAtEnd: boolean;

  // Board sizing
  boardSize: number;
  cellSize: number;
  pieceSize: number;

  // Pieces to render (may trail one step during animation)
  displayPieces: Piece[];

  // Current engine state
  currentEngine: GameEngine;
  isDarkTurn: boolean;
  darkCount: number;
  lightCount: number;

  // Animation accessor
  getAnim: (piece: Piece) => PieceAnim;

  // Controls
  togglePlay: () => void;
  goToStart: () => void;
  goToEnd: () => void;
  stepBack: () => void;
  stepForward: () => void;
}

// ─── Module-level helpers (no state, safe to call from effects) ───────────────

function buildAnims(pieces: Piece[], cellSize: number): Map<string, PieceAnim> {
  const map = new Map<string, PieceAnim>();
  pieces.forEach(p => {
    map.set(p.id, {
      pos: new Animated.ValueXY({x: p.col * cellSize, y: p.row * cellSize}),
      opacity: new Animated.Value(1),
    });
  });
  return map;
}

function ensureAnims(
  pieces: Piece[],
  existing: Map<string, PieceAnim>,
  cellSize: number,
): Map<string, PieceAnim> {
  const map = new Map(existing);
  pieces.forEach(p => {
    if (!map.has(p.id)) {
      map.set(p.id, {
        pos: new Animated.ValueXY({x: p.col * cellSize, y: p.row * cellSize}),
        opacity: new Animated.Value(1),
      });
    }
  });
  return map;
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useReplayControls(
  game: GameResponse,
  session: LoginResponse,
): ReplayControls {
  const {width, height} = useWindowDimensions();
  const boardSize = Math.min(width - 32, height - 340, 380);
  const cellSize = boardSize / BOARD_SIZE;
  const pieceSize = Math.round(cellSize * 0.76);

  const [engines, setEngines] = useState<GameEngine[]>([GameEngine.initial()]);
  const [moves, setMoves] = useState<MoveResponse[]>([]);
  const [step, setStep] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [loading, setLoading] = useState(true);
  const [displayPieces, setDisplayPieces] = useState<Piece[]>([]);

  const pieceAnimsRef = useRef(new Map<string, PieceAnim>());
  const prevStepRef = useRef(0);

  // Generation counter — bumped every time we start or abort an animation.
  // The start() callback checks its captured generation against the current one;
  // if they differ the callback is stale and must be discarded.
  const animGenRef = useRef(0);
  const currentAnimRef = useRef<Animated.CompositeAnimation | null>(null);

  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // ── Data loading ─────────────────────────────────────────────────────────

  useEffect(() => {
    getGameMoves(session.token, game.id)
      .then(fetchedMoves => {
        setMoves(fetchedMoves);
        const states: GameEngine[] = [
          GameEngine.fromPieces(createInitialPieces(), 'dark', null),
        ];
        let e = GameEngine.fromPieces(createInitialPieces(), 'dark', null);
        for (const mv of fetchedMoves) {
          if (!e.pendingCaptureId) {
            e = e.selectPiece(mv.fromRow, mv.fromCol);
          }
          const result = e.applyMoveAt(mv.toRow, mv.toCol);
          if (result) {e = result.nextEngine;}
          states.push(e);
        }
        setEngines(states);
        setDisplayPieces(states[0].pieces);
        setPlaying(true);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [game.id, session.token]);

  // ── Playback interval ────────────────────────────────────────────────────

  useEffect(() => {
    if (!playing) {
      if (intervalRef.current) {clearInterval(intervalRef.current);}
      return;
    }
    intervalRef.current = setInterval(() => {
      setStep(s => {
        if (s >= engines.length - 1) {
          setPlaying(false);
          return s;
        }
        return s + 1;
      });
    }, PLAYBACK_MS);
    return () => {
      if (intervalRef.current) {clearInterval(intervalRef.current);}
    };
  }, [playing, engines.length]);

  // ── Animation on step change ─────────────────────────────────────────────

  useEffect(() => {
    if (engines.length < 2) {return;}

    const prevStep = prevStepRef.current;
    prevStepRef.current = step;

    const isForward = step === prevStep + 1 && step > 0 && step <= moves.length;

    if (!isForward) {
      // Non-sequential jump — abort any running animation and snap to target
      currentAnimRef.current?.stop();
      currentAnimRef.current = null;
      animGenRef.current++;

      const targetPieces = engines[step]?.pieces ?? [];
      pieceAnimsRef.current = buildAnims(targetPieces, cellSize);
      setDisplayPieces(targetPieces);
      return;
    }

    const prevEngine = engines[prevStep];
    const nextEngine = engines[step];
    const mv = moves[step - 1];

    const movedFrom = prevEngine.pieces.find(
      p => p.row === mv.fromRow && p.col === mv.fromCol,
    );
    const movedTo = nextEngine.pieces.find(
      p => p.row === mv.toRow && p.col === mv.toCol,
    );

    const newPosSet = new Set(nextEngine.pieces.map(p => `${p.row}-${p.col}`));
    const captured = movedFrom
      ? prevEngine.pieces.find(
          p => p.color !== movedFrom.color && !newPosSet.has(`${p.row}-${p.col}`),
        )
      : undefined;

    if (!movedFrom || !movedTo) {
      // Cannot identify moved piece — abort previous and snap
      currentAnimRef.current?.stop();
      currentAnimRef.current = null;
      animGenRef.current++;

      pieceAnimsRef.current = buildAnims(nextEngine.pieces, cellSize);
      setDisplayPieces(nextEngine.pieces);
      return;
    }

    // Abort any animation still in flight and claim a new generation slot
    currentAnimRef.current?.stop();
    currentAnimRef.current = null;
    const myGen = ++animGenRef.current;

    // Ensure every piece from the previous state has an animation entry
    const anims = ensureAnims(prevEngine.pieces, pieceAnimsRef.current, cellSize);
    pieceAnimsRef.current = anims;

    // Render the pre-move state while the animation runs
    setDisplayPieces(prevEngine.pieces);

    const movingAnim = anims.get(movedFrom.id)!;
    const capturedAnim = captured ? anims.get(captured.id) : undefined;

    const animations: Animated.CompositeAnimation[] = [
      Animated.timing(movingAnim.pos.x, {
        toValue: mv.toCol * cellSize,
        duration: MOVE_MS,
        useNativeDriver: false,
      }),
      Animated.timing(movingAnim.pos.y, {
        toValue: mv.toRow * cellSize,
        duration: MOVE_MS,
        useNativeDriver: false,
      }),
    ];

    if (capturedAnim) {
      animations.push(
        Animated.timing(capturedAnim.opacity, {
          toValue: 0,
          duration: FADE_MS,
          useNativeDriver: false,
        }),
      );
    }

    const compositeAnim = Animated.parallel(animations);
    currentAnimRef.current = compositeAnim;

    compositeAnim.start(({finished}) => {
      if (animGenRef.current !== myGen) {return;} // stale — a newer step took over
      currentAnimRef.current = null;
      if (finished) {
        pieceAnimsRef.current = buildAnims(nextEngine.pieces, cellSize);
        setDisplayPieces(nextEngine.pieces);
      }
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step]);

  // ── Derived values ────────────────────────────────────────────────────────

  const currentEngine = engines[step] ?? GameEngine.initial();
  const isAtEnd = step >= engines.length - 1;
  const isAtStart = step === 0;
  const isDarkTurn = currentEngine.currentTurn === 'dark';

  // ── Controls ─────────────────────────────────────────────────────────────

  const togglePlay = () => {
    if (isAtEnd) {setStep(0); setPlaying(true); return;}
    setPlaying(p => !p);
  };

  const goToStart = () => {setStep(0); setPlaying(false);};
  const goToEnd = () => {setStep(engines.length - 1); setPlaying(false);};
  const stepBack = () => {if (!isAtStart) {setStep(s => s - 1); setPlaying(false);}};
  const stepForward = () => {if (!isAtEnd) {setStep(s => s + 1); setPlaying(false);}};

  // ── Animation accessor ────────────────────────────────────────────────────

  const getAnim = (piece: Piece): PieceAnim => {
    const anims = pieceAnimsRef.current;
    if (!anims.has(piece.id)) {
      anims.set(piece.id, {
        pos: new Animated.ValueXY({x: piece.col * cellSize, y: piece.row * cellSize}),
        opacity: new Animated.Value(1),
      });
    }
    return anims.get(piece.id)!;
  };

  return {
    loading,
    moves,
    step,
    playing,
    isAtStart,
    isAtEnd,
    boardSize,
    cellSize,
    pieceSize,
    displayPieces: displayPieces.length > 0 ? displayPieces : currentEngine.pieces,
    currentEngine,
    isDarkTurn,
    darkCount: currentEngine.darkCount,
    lightCount: currentEngine.lightCount,
    getAnim,
    togglePlay,
    goToStart,
    goToEnd,
    stepBack,
    stepForward,
  };
}
