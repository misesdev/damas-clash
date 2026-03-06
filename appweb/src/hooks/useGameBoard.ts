'use client';

import {
  HubConnectionBuilder,
  HttpTransportType,
  HubConnectionState,
} from '@microsoft/signalr';
import type { HubConnection } from '@microsoft/signalr';
import { useCallback, useEffect, useRef, useState } from 'react';
import { makeMove } from '../api/games';
import { BASE_URL } from '../api/client';
import type { Piece, PieceColor } from '../game/checkers';
import { BOARD_SIZE, findAt } from '../game/checkers';
import { GameEngine } from '../game/GameEngine';
import { boardStateToEngine, getMyColor, parseApiColor } from '../utils/boardStateUtils';
import type { LoginResponse } from '../types/auth';
import type { GameResponse } from '../types/game';

// Piece position state for CSS transitions
export interface PiecePos {
  row: number;
  col: number;
  opacity: number;
}

export function useGameBoard(initialGame: GameResponse, session: LoginResponse) {
  const boardSize = Math.min(typeof window !== 'undefined' ? window.innerWidth - 48 : 360, 480);
  const cellSize = boardSize / BOARD_SIZE;

  const initialEngine = boardStateToEngine(initialGame.boardState, initialGame.currentTurn);

  const [game, setGame] = useState(initialGame);
  const [engine, setEngine] = useState(initialEngine);
  const [animating, setAnimating] = useState(false);
  const [watchersCount, setWatchersCount] = useState(1);
  const [sendingMove, setSendingMove] = useState(false);
  const [error, setError] = useState('');

  // Track piece positions for CSS transitions
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

  useEffect(() => { engineRef.current = engine; }, [engine]);
  useEffect(() => { gameRef.current = game; }, [game]);

  const syncPositionsFromEngine = useCallback((eng: GameEngine) => {
    setPiecePositions(prev => {
      const next = new Map<string, PiecePos>();
      eng.pieces.forEach(p => {
        next.set(p.id, { row: p.row, col: p.col, opacity: 1 });
      });
      // Keep captured pieces that are fading out
      prev.forEach((pos, id) => {
        if (!next.has(id) && pos.opacity > 0) {
          next.set(id, { ...pos, opacity: 0 });
        }
      });
      return next;
    });
  }, []);

  // ── SignalR connection ──────────────────────────────────────────────────────

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
            syncPositionsFromEngine(newEngine);
            setEngine(newEngine);
          }
        });

        hub.on('WatchersUpdated', (count: number) => {
          if (!active) return;
          setWatchersCount(count);
        });

        await hub.start();
        if (!active) { hub.stop(); return; }
        await hub.invoke('WatchGame', initialGame.id);
      } catch {
        // Silently ignore
      }
    })();

    return () => {
      active = false;
      hub?.stop();
    };
  }, [initialGame.id, session.token, syncPositionsFromEngine]);

  // ── Move animation (CSS transition) ────────────────────────────────────────

  const runMoveAnimation = useCallback(
    (movingPiece: Piece, captureId: string | undefined, nextEngine: GameEngine) => {
      setAnimating(true);

      // Start transition: update positions of moving + captured pieces
      setPiecePositions(prev => {
        const next = new Map(prev);
        const movingPos = next.get(movingPiece.id);
        const updated = nextEngine.pieces.find(p => p.id === movingPiece.id);
        if (movingPos && updated) {
          next.set(movingPiece.id, { row: updated.row, col: updated.col, opacity: 1 });
        }
        if (captureId) {
          const cap = next.get(captureId);
          if (cap) next.set(captureId, { ...cap, opacity: 0 });
        }
        return next;
      });

      // After animation duration, commit engine state and clean up
      setTimeout(() => {
        setEngine(nextEngine);
        setPiecePositions(prev => {
          const next = new Map(prev);
          if (captureId) next.delete(captureId);
          return next;
        });
        setAnimating(false);
      }, 220);
    },
    [],
  );

  // ── Cell press ─────────────────────────────────────────────────────────────

  const myColor: PieceColor = getMyColor(initialGame, session.playerId);

  const handleCellPress = useCallback(
    (row: number, col: number) => {
      const current = engineRef.current;
      const currentGame = gameRef.current;
      const isMyTurn = parseApiColor(currentGame.currentTurn) === myColor;

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
        setError('Movimento inválido.');
      } finally {
        setSendingMove(false);
      }
    },
    [session.token, initialGame.id, syncPositionsFromEngine],
  );

  const isMyTurn = parseApiColor(game.currentTurn) === myColor;
  const opponentColor: PieceColor = myColor === 'dark' ? 'light' : 'dark';

  const winner: PieceColor | null = game.winnerId
    ? game.winnerId === game.playerBlackId
      ? 'dark'
      : 'light'
    : null;

  const myUsername = myColor === 'dark' ? game.playerBlackUsername : game.playerWhiteUsername;
  const opponentUsername = myColor === 'dark' ? game.playerWhiteUsername : game.playerBlackUsername;

  const darkCount = engine.pieces.filter(p => p.color === 'dark').length;
  const lightCount = engine.pieces.filter(p => p.color === 'light').length;

  return {
    game,
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
    piecePositions,
    darkCount,
    lightCount,
    handleCellPress,
  };
}
