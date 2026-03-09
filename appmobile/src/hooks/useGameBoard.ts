import {
  HubConnectionBuilder,
  HttpTransportType,
} from '@microsoft/signalr';
import type {HubConnection} from '@microsoft/signalr';
import {useCallback, useEffect, useRef, useState} from 'react';
import {useTranslation} from 'react-i18next';
import {Animated, BackHandler, useWindowDimensions} from 'react-native';
import {makeMove, resign, skipTurn} from '../api/games';
import {BASE_URL} from '../api/client';
import type {Piece, Move, PieceColor} from '../game/checkers';
import {BOARD_SIZE, findAt} from '../game/checkers';
import {GameEngine} from '../game/GameEngine';
import {boardStateToEngine, getMyColor, isSpectator, parseApiColor} from '../utils/boardStateUtils';
import type {LoginResponse} from '../types/auth';
import type {GameResponse} from '../types/game';

export interface PieceAnim {
  pos: Animated.ValueXY;
  opacity: Animated.Value;
}

const MOVE_MS = 220;
const FADE_MS = 200;

const cellPos = (row: number, col: number, size: number) => ({
  x: col * size,
  y: row * size,
});

function initAnimsFromEngine(
  engine: GameEngine,
  size: number,
): Map<string, PieceAnim> {
  const map = new Map<string, PieceAnim>();
  engine.pieces.forEach(p => {
    map.set(p.id, {
      pos: new Animated.ValueXY(cellPos(p.row, p.col, size)),
      opacity: new Animated.Value(1),
    });
  });
  return map;
}

export function useGameBoard(initialGame: GameResponse, session: LoginResponse) {
  const {t} = useTranslation();
  const {width} = useWindowDimensions();
  const boardSize = Math.min(width - 32 - 24, 360);
  const cellSize = boardSize / BOARD_SIZE;
  const cellSizeRef = useRef(cellSize);
  useEffect(() => {
    cellSizeRef.current = cellSize;
  }, [cellSize]);

  const initialEngine = boardStateToEngine(initialGame.boardState, initialGame.currentTurn);
  const [game, setGame] = useState(initialGame);
  const [engine, setEngine] = useState(initialEngine);
  const [animating, setAnimating] = useState(false);
  const [watchersCount, setWatchersCount] = useState(1);
  const [sendingMove, setSendingMove] = useState(false);
  const [error, setError] = useState('');

  const animsRef = useRef(initAnimsFromEngine(initialEngine, cellSize));
  const engineRef = useRef(engine);
  const pendingMovesRef = useRef(0);

  useEffect(() => {
    engineRef.current = engine;
  }, [engine]);

  // Recalibrate anim positions on orientation change
  useEffect(() => {
    engineRef.current.pieces.forEach(p => {
      const anim = animsRef.current.get(p.id);
      if (anim) {
        anim.pos.setValue(cellPos(p.row, p.col, cellSizeRef.current));
      }
    });
  }, [cellSize]);

  const getAnim = useCallback(
    (piece: Piece): PieceAnim => {
      if (!animsRef.current.has(piece.id)) {
        animsRef.current.set(piece.id, {
          pos: new Animated.ValueXY(cellPos(piece.row, piece.col, cellSizeRef.current)),
          opacity: new Animated.Value(1),
        });
      }
      return animsRef.current.get(piece.id)!;
    },
    [],
  );

  // ── SignalR connection for this game ──────────────────────────────────────

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
          if (!active) {return;}
          setGame(updatedGame);

          if (pendingMovesRef.current > 0) {
            // Own move confirmed — engine already applied locally
            pendingMovesRef.current--;
          } else {
            // Opponent's move — sync engine from API board state
            const newEngine = boardStateToEngine(
              updatedGame.boardState,
              updatedGame.currentTurn,
            );
            animsRef.current = initAnimsFromEngine(newEngine, cellSizeRef.current);
            setEngine(newEngine);
          }
        });

        hub.on('WatchersUpdated', (count: number) => {
          if (!active) {return;}
          setWatchersCount(count);
        });

        await hub.start();
        if (!active) {hub.stop(); return;}

        await hub.invoke('JoinGameRoom', initialGame.id);
      } catch {
        // Connection failed — silently ignore
      }
    })();

    return () => {
      active = false;
      hub?.stop();
    };
  }, [initialGame.id, session.token]);

  // ── Move animation ────────────────────────────────────────────────────────

  const runMoveAnimation = useCallback(
    (movingPiece: Piece, move: Move, nextEngine: GameEngine) => {
      setAnimating(true);
      const movingAnim = getAnim(movingPiece);
      const capturedAnim = move.captureId
        ? animsRef.current.get(move.captureId)
        : undefined;

      const anims: Animated.CompositeAnimation[] = [
        Animated.timing(movingAnim.pos, {
          toValue: cellPos(move.row, move.col, cellSizeRef.current),
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
    [getAnim],
  );

  // ── Cell press handler ────────────────────────────────────────────────────

  const myColor: PieceColor = getMyColor(initialGame, session.playerId);
  const spectator = isSpectator(initialGame, session.playerId);

  const handleCellPress = useCallback(
    (row: number, col: number) => {
      const current = engineRef.current;
      const isMyTurn = !spectator && parseApiColor(game.currentTurn) === myColor;

      if (
        game.status === 'Completed' ||
        animating ||
        sendingMove ||
        pendingMovesRef.current > 0 ||
        !isMyTurn
      ) {
        return;
      }

      // Multi-capture continuation
      if (current.pendingCaptureId) {
        const result = current.applyMoveAt(row, col);
        if (!result) {return;}
        runMoveAnimation(result.movingPiece, result.move, result.nextEngine);
        sendMoveToApi(
          result.movingPiece.row,
          result.movingPiece.col,
          result.move.row,
          result.move.col,
        );
        return;
      }

      // Piece selected — tap valid destination
      if (current.selectedId && current.validMoveMap.has(`${row}-${col}`)) {
        const result = current.applyMoveAt(row, col);
        if (!result) {return;}
        runMoveAnimation(result.movingPiece, result.move, result.nextEngine);
        sendMoveToApi(
          result.movingPiece.row,
          result.movingPiece.col,
          result.move.row,
          result.move.col,
        );
        return;
      }

      // Select / deselect
      const piece = findAt(current.pieces, row, col);
      if (piece && piece.color === myColor) {
        setEngine(prev => prev.selectPiece(row, col));
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [game.status, game.currentTurn, animating, sendingMove, myColor, runMoveAnimation, spectator],
  );

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const sendMoveToApi = useCallback(
    async (fromRow: number, fromCol: number, toRow: number, toCol: number) => {
      pendingMovesRef.current++;
      setSendingMove(true);
      const engineBefore = engineRef.current;
      try {
        const updated = await makeMove(session.token, initialGame.id, {
          fromRow,
          fromCol,
          toRow,
          toCol,
        });
        setGame(updated);
        setError('');
      } catch {
        // Revert on error
        pendingMovesRef.current = Math.max(0, pendingMovesRef.current - 1);
        animsRef.current = initAnimsFromEngine(engineBefore, cellSizeRef.current);
        setEngine(engineBefore);
        setError(t('checkersBoard.errors.invalidMove'));
      } finally {
        setSendingMove(false);
      }
    },
    [session.token, initialGame.id],
  );

  // ── Derived: winner (needed before BackHandler) ───────────────────────────

  const winner: PieceColor | null = game.winnerId
    ? game.winnerId === game.playerBlackId
      ? 'dark'
      : 'light'
    : null;

  // ── Block hardware back during active game ────────────────────────────────

  useEffect(() => {
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      // Allow back only after game ends, or always for spectators
      return !winner && !spectator;
    });
    return () => sub.remove();
  }, [winner, spectator]);

  // ── Turn timer ────────────────────────────────────────────────────────────

  const TURN_TIMEOUT_SEC = 60;
  const [timeLeft, setTimeLeft] = useState(TURN_TIMEOUT_SEC);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const skipTurnToApi = useCallback(async () => {
    try {
      const updated = await skipTurn(session.token, initialGame.id);
      setGame(updated);
    } catch {
      // ignore — opponent's turn will propagate via SignalR anyway
    }
  }, [session.token, initialGame.id]);

  const isMyTurnDerived = !spectator && parseApiColor(game.currentTurn) === myColor;

  useEffect(() => {
    if (!isMyTurnDerived || game.status === 'Completed') {
      setTimeLeft(TURN_TIMEOUT_SEC);
      return;
    }
    setTimeLeft(TURN_TIMEOUT_SEC);
    const tick = setInterval(() => {
      setTimeLeft(prev => (prev > 1 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(tick);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isMyTurnDerived, game.status]);

  useEffect(() => {
    if (timeLeft === 0 && isMyTurnDerived && game.status === 'InProgress') {
      skipTurnToApi();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [timeLeft]);

  // ── Derived ───────────────────────────────────────────────────────────────

  const isMyTurn = isMyTurnDerived;
  const opponentColor: PieceColor = myColor === 'dark' ? 'light' : 'dark';
  const isFlipped = myColor === 'dark';

  const myUsername =
    myColor === 'dark' ? game.playerBlackUsername : game.playerWhiteUsername;
  const opponentUsername =
    myColor === 'dark' ? game.playerWhiteUsername : game.playerBlackUsername;

  const myAvatarUrl =
    myColor === 'dark' ? game.playerBlackAvatarUrl : game.playerWhiteAvatarUrl;
  const opponentAvatarUrl =
    myColor === 'dark' ? game.playerWhiteAvatarUrl : game.playerBlackAvatarUrl;

  const darkCount = engine.pieces.filter(p => p.color === 'dark').length;
  const lightCount = engine.pieces.filter(p => p.color === 'light').length;

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const handleResign = useCallback(async () => {
    setSendingMove(true);
    try {
      const updated = await resign(session.token, initialGame.id);
      setGame(updated);
      setError('');
    } catch {
      setError(t('checkersBoard.errors.resignFailed'));
    } finally {
      setSendingMove(false);
    }
  }, [session.token, initialGame.id]);

  return {
    game,
    engine,
    myColor,
    opponentColor,
    isFlipped,
    myUsername,
    opponentUsername,
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
    animsRef,
    getAnim,
    darkCount,
    lightCount,
    myAvatarUrl,
    opponentAvatarUrl,
    handleCellPress,
    handleResign,
  };
}
