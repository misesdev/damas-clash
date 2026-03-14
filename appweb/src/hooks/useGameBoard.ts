'use client';

import {
  HubConnectionBuilder,
  HttpTransportType,
} from '@microsoft/signalr';
import type { HubConnection } from '@microsoft/signalr';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { makeMove, resign, skipTurn } from '../api/games';
import { BASE_URL } from '../api/client';
import { showMessage } from '../components/MessageBox';
import type { Piece, PieceColor } from '../game/checkers';
import { BOARD_SIZE, findAt } from '../game/checkers';
import { GameEngine } from '../game/GameEngine';
import { boardStateToEngine, getMyColor, isSpectator, parseApiColor } from '../utils/boardStateUtils';
import type { LoginResponse } from '../types/auth';
import type { GameResponse } from '../types/game';
import '../i18n';

export interface PiecePos {
  row: number;
  col: number;
  opacity: number;
}

const TURN_TIMEOUT_SEC = 60;

export function useGameBoard(initialGame: GameResponse, session: LoginResponse) {
  const { t } = useTranslation();

  const boardSize = Math.min(
    typeof window !== 'undefined' ? Math.min(window.innerWidth - 48, window.innerHeight - 280) : 400,
    560,
  );
  const cellSize = boardSize / BOARD_SIZE;

  const initialEngine = boardStateToEngine(initialGame.boardState, initialGame.currentTurn);

  const [game, setGame] = useState(initialGame);
  const [engine, setEngine] = useState(initialEngine);
  const [animating, setAnimating] = useState(false);
  const [watchersCount, setWatchersCount] = useState(1);
  const [sendingMove, setSendingMove] = useState(false);
  const [error, setError] = useState('');
  const [timeLeft, setTimeLeft] = useState(TURN_TIMEOUT_SEC);

  const [piecePositions, setPiecePositions] = useState<Map<string, PiecePos>>(() => {
    const m = new Map<string, PiecePos>();
    initialEngine.pieces.forEach(p => {
      m.set(p.id, { row: p.row, col: p.col, opacity: 1 });
    });
    return m;
  });

  const engineRef = useRef(engine);
  const pendingMovesRef = useRef(0);
  const gameRef = useRef(game);
  const runMoveAnimationRef = useRef<((movingPiece: Piece, captureId: string | undefined, nextEngine: GameEngine) => void) | null>(null);

  useEffect(() => { engineRef.current = engine; }, [engine]);
  useEffect(() => { gameRef.current = game; }, [game]);

  const myColor: PieceColor = getMyColor(initialGame, session.playerId);
  const spectator = isSpectator(initialGame, session.playerId);
  const isFlipped = !spectator && myColor === 'dark';

  const syncPositionsFromEngine = useCallback((eng: GameEngine) => {
    setPiecePositions(prev => {
      const next = new Map<string, PiecePos>();
      eng.pieces.forEach(p => {
        next.set(p.id, { row: p.row, col: p.col, opacity: 1 });
      });
      prev.forEach((pos, id) => {
        if (!next.has(id) && pos.opacity > 0) {
          next.set(id, { ...pos, opacity: 0 });
        }
      });
      return next;
    });
  }, []);

  // ── SignalR ─────────────────────────────────────────────────────────────────

  useEffect(() => {
    let hub: HubConnection;
    let active = true;

    (async () => {
      try {
        hub = new HubConnectionBuilder()
          .withUrl(`${BASE_URL}/hubs/game`, {
            transport: HttpTransportType.WebSockets,
            skipNegotiation: true,
          })
          .withAutomaticReconnect()
          .build();

        hub.on('MoveMade', (updatedGame: GameResponse) => {
          if (!active) return;
          setGame(updatedGame);

          if (pendingMovesRef.current > 0) {
            pendingMovesRef.current--;
          } else {
            const newEngine = boardStateToEngine(
              updatedGame.boardState,
              updatedGame.currentTurn,
            );

            // Detect the piece that moved and any captured piece
            const currentPieces = engineRef.current.pieces;
            const movedPiece = newEngine.pieces.find(np => {
              const old = currentPieces.find(op => op.id === np.id);
              return old && (old.row !== np.row || old.col !== np.col);
            });
            const capturedId = currentPieces.find(op =>
              !newEngine.pieces.some(np => np.id === op.id),
            )?.id;

            if (movedPiece && runMoveAnimationRef.current) {
              runMoveAnimationRef.current(movedPiece, capturedId, newEngine);
            } else {
              syncPositionsFromEngine(newEngine);
              setEngine(newEngine);
            }
          }
        });

        hub.on('WatchersUpdated', (count: number) => {
          if (!active) return;
          setWatchersCount(count);
        });

        await hub.start();
        if (!active) { hub.stop(); return; }
        await hub.invoke('JoinGameRoom', initialGame.id);
      } catch {
        // Silently ignore
      }
    })();

    return () => {
      active = false;
      hub?.stop();
    };
  }, [initialGame.id, session.token, syncPositionsFromEngine]);

  // ── Move animation ──────────────────────────────────────────────────────────

  const ANIM_MS = 260;

  const runMoveAnimation = useCallback(
    (movingPiece: Piece, captureId: string | undefined, nextEngine: GameEngine) => {
      // Step 1: enable CSS transitions (animating=true), keep positions unchanged
      setAnimating(true);

      // Step 2: next frame — update positions so CSS transition fires from old → new
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          setPiecePositions(prev => {
            const next = new Map(prev);
            const updated = nextEngine.pieces.find(p => p.id === movingPiece.id);
            if (updated) {
              next.set(movingPiece.id, { row: updated.row, col: updated.col, opacity: 1 });
            }
            if (captureId) {
              const cap = next.get(captureId);
              if (cap) next.set(captureId, { ...cap, opacity: 0 });
            }
            return next;
          });
        });
      });

      // Step 3: after animation completes — commit engine state and disable transitions
      setTimeout(() => {
        setEngine(nextEngine);
        setPiecePositions(prev => {
          const next = new Map(prev);
          if (captureId) next.delete(captureId);
          return next;
        });
        setAnimating(false);
      }, ANIM_MS + 60);
    },
    [],
  );

  runMoveAnimationRef.current = runMoveAnimation;

  // ── Cell press ──────────────────────────────────────────────────────────────

  const handleCellPress = useCallback(
    (row: number, col: number) => {
      const current = engineRef.current;
      const currentGame = gameRef.current;
      const isMyTurn = !spectator && parseApiColor(currentGame.currentTurn) === myColor;

      if (
        currentGame.status === 'Completed' ||
        animating ||
        sendingMove ||
        pendingMovesRef.current > 0 ||
        !isMyTurn
      ) {
        return;
      }

      if (current.pendingCaptureId) {
        const result = current.applyMoveAt(row, col);
        if (!result) return;
        runMoveAnimation(result.movingPiece, result.move.captureId, result.nextEngine);
        sendMoveToApi(result.movingPiece.row, result.movingPiece.col, result.move.row, result.move.col);
        return;
      }

      if (current.selectedId && current.validMoveMap.has(`${row}-${col}`)) {
        const result = current.applyMoveAt(row, col);
        if (!result) return;
        runMoveAnimation(result.movingPiece, result.move.captureId, result.nextEngine);
        sendMoveToApi(result.movingPiece.row, result.movingPiece.col, result.move.row, result.move.col);
        return;
      }

      const piece = findAt(current.pieces, row, col);
      if (piece && piece.color === myColor) {
        setEngine(prev => prev.selectPiece(row, col));
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [animating, sendingMove, myColor, runMoveAnimation],
  );

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const sendMoveToApi = useCallback(
    async (fromRow: number, fromCol: number, toRow: number, toCol: number) => {
      pendingMovesRef.current++;
      setSendingMove(true);
      const engineBefore = engineRef.current;
      try {
        const updated = await makeMove(session.token, initialGame.id, {
          fromRow, fromCol, toRow, toCol,
        });
        setGame(updated);
        setError('');
      } catch {
        pendingMovesRef.current = Math.max(0, pendingMovesRef.current - 1);
        syncPositionsFromEngine(engineBefore);
        setEngine(engineBefore);
        setError(t('board_invalidMove'));
      } finally {
        setSendingMove(false);
      }
    },
    [session.token, initialGame.id, syncPositionsFromEngine, t],
  );

  // ── Skip turn API ───────────────────────────────────────────────────────────

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const skipTurnToApi = useCallback(async () => {
    try {
      const updated = await skipTurn(session.token, initialGame.id);
      setGame(updated);
    } catch {
      // ignore — SignalR will propagate opponent move
    }
  }, [session.token, initialGame.id]);

  // ── Turn timer ──────────────────────────────────────────────────────────────

  const isMyTurnDerived = !spectator && parseApiColor(game.currentTurn) === myColor;

  useEffect(() => {
    if (game.status === 'Completed') {
      setTimeLeft(TURN_TIMEOUT_SEC);
      return;
    }
    setTimeLeft(TURN_TIMEOUT_SEC);
    const tick = setInterval(() => {
      setTimeLeft(prev => (prev > 1 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(tick);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [game.currentTurn, game.status]);

  useEffect(() => {
    if (timeLeft === 0 && isMyTurnDerived && game.status === 'InProgress') {
      skipTurnToApi();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [timeLeft]);

  // ── Resign ──────────────────────────────────────────────────────────────────

  const handleResign = useCallback(async () => {
    setSendingMove(true);
    try {
      const updated = await resign(session.token, initialGame.id);
      setGame(updated);
      setError('');
    } catch {
      setError(t('board_resignError'));
    } finally {
      setSendingMove(false);
    }
  }, [session.token, initialGame.id, t]);

  const confirmResign = useCallback(() => {
    showMessage({
      title: t('board_resignTitle'),
      message: t('board_resignMessage'),
      type: 'confirm',
      actions: [
        { label: t('board_resignCancel') },
        { label: t('board_resignConfirm'), danger: true, onPress: handleResign },
      ],
    });
  }, [handleResign, t]);

  // ── Derived ─────────────────────────────────────────────────────────────────

  const isMyTurn = isMyTurnDerived;
  const opponentColor: PieceColor = myColor === 'dark' ? 'light' : 'dark';

  const winner: PieceColor | null = game.winnerId
    ? game.winnerId === game.playerBlackId ? 'dark' : 'light'
    : null;

  const myUsername = myColor === 'dark' ? game.playerBlackUsername : game.playerWhiteUsername;
  const opponentUsername = myColor === 'dark' ? game.playerWhiteUsername : game.playerBlackUsername;
  const myAvatarUrl = myColor === 'dark' ? game.playerBlackAvatarUrl : game.playerWhiteAvatarUrl;
  const opponentAvatarUrl = myColor === 'dark' ? game.playerWhiteAvatarUrl : game.playerBlackAvatarUrl;

  const darkCount = engine.pieces.filter(p => p.color === 'dark').length;
  const lightCount = engine.pieces.filter(p => p.color === 'light').length;
  const myCount = myColor === 'dark' ? darkCount : lightCount;
  const oppCount = myColor === 'dark' ? lightCount : darkCount;

  const isTimerActive = game.status === 'InProgress' && !winner;
  const isUrgent = isTimerActive && timeLeft <= 10;

  return {
    game,
    engine,
    myColor,
    opponentColor,
    isFlipped,
    myUsername,
    opponentUsername,
    myAvatarUrl,
    opponentAvatarUrl,
    isMyTurn,
    spectator,
    timeLeft,
    isTimerActive,
    isUrgent,
    winner,
    watchersCount,
    sendingMove,
    error,
    boardSize,
    cellSize,
    animating,
    piecePositions,
    darkCount,
    lightCount,
    myCount,
    oppCount,
    handleCellPress,
    confirmResign,
  };
}
