import React, {useEffect, useRef, useState} from 'react';
import {
  ActivityIndicator,
  Animated,
  Image,
  Text,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {useTranslation} from 'react-i18next';
import {getGameMoves} from '../api/games';
import {BOARD_SIZE, createInitialPieces, isDarkSquare} from '../game/checkers';
import {GameEngine} from '../game/GameEngine';
import type {Piece} from '../game/checkers';
import type {LoginResponse} from '../types/auth';
import type {GameResponse, MoveResponse} from '../types/game';
import {ScreenHeader} from '../components/ScreenHeader';

// ─── Constants ────────────────────────────────────────────────────────────────

const MOVE_MS = 280;
const FADE_MS = 240;

// ─── Types ────────────────────────────────────────────────────────────────────

interface PieceAnim {
  pos: Animated.ValueXY;
  opacity: Animated.Value;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function PlayerAvatar({
  username,
  avatarUrl,
  size = 36,
}: {
  username?: string | null;
  avatarUrl?: string | null;
  size?: number;
}) {
  if (avatarUrl) {
    return (
      <Image
        source={{uri: avatarUrl}}
        style={{width: size, height: size, borderRadius: size / 2}}
      />
    );
  }
  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: size / 2,
        backgroundColor: '#1a1a1a',
        borderWidth: 1,
        borderColor: '#232323',
        alignItems: 'center',
        justifyContent: 'center',
      }}>
      <Text style={{color: '#fff', fontSize: size * 0.38, fontWeight: '700'}}>
        {(username ?? '?')[0].toUpperCase()}
      </Text>
    </View>
  );
}

// ─── Props ────────────────────────────────────────────────────────────────────

interface Props {
  game: GameResponse;
  session: LoginResponse;
  onBack: () => void;
}

// ─── Screen ───────────────────────────────────────────────────────────────────

export function ReplayScreen({game, session, onBack}: Props) {
  const {t} = useTranslation();
  const {width, height} = useWindowDimensions();
  const boardSize = Math.min(width - 32, height - 340, 380);
  const cellSize = boardSize / BOARD_SIZE;
  const pieceSize = Math.round(cellSize * 0.76);

  const [engines, setEngines] = useState<GameEngine[]>([GameEngine.initial()]);
  const [moves, setMoves] = useState<MoveResponse[]>([]);
  const [step, setStep] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [loading, setLoading] = useState(true);

  // ── Animation state ──────────────────────────────────────────────────────
  // displayPieces: what we actually render (may lag one step behind during anim)
  const [displayPieces, setDisplayPieces] = useState<Piece[]>([]);
  const pieceAnimsRef = useRef(new Map<string, PieceAnim>());
  const prevStepRef = useRef(0);
  const animatingRef = useRef(false);

  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // ── Data loading ─────────────────────────────────────────────────────────

  useEffect(() => {
    getGameMoves(session.token, game.id)
      .then(fetchedMoves => {
        setMoves(fetchedMoves);
        const states: GameEngine[] = [GameEngine.fromPieces(createInitialPieces(), 'dark', null)];
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
    }, MOVE_MS + 120);
    return () => {if (intervalRef.current) {clearInterval(intervalRef.current);}};
  }, [playing, engines.length]);

  // ── Animation on step change ─────────────────────────────────────────────

  useEffect(() => {
    if (engines.length < 2) {return;}

    const prevStep = prevStepRef.current;
    prevStepRef.current = step;

    const isForward = step === prevStep + 1 && step > 0 && step <= moves.length;

    if (!isForward) {
      // Non-sequential jump — instant reset
      animatingRef.current = false;
      const targetPieces = engines[step]?.pieces ?? [];
      pieceAnimsRef.current = buildAnims(targetPieces, cellSize);
      setDisplayPieces(targetPieces);
      return;
    }

    if (animatingRef.current) {
      // Previous animation still running — skip to current state immediately
      const targetPieces = engines[step]?.pieces ?? [];
      pieceAnimsRef.current = buildAnims(targetPieces, cellSize);
      setDisplayPieces(targetPieces);
      return;
    }

    const prevEngine = engines[prevStep];
    const nextEngine = engines[step];
    const mv = moves[step - 1];

    // Find the piece that moved and where it ended up
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
      // Can't detect move — instant
      const targetPieces = nextEngine.pieces;
      pieceAnimsRef.current = buildAnims(targetPieces, cellSize);
      setDisplayPieces(targetPieces);
      return;
    }

    // Ensure all prev-engine pieces have an anim at their current position
    const anims = ensureAnims(prevEngine.pieces, pieceAnimsRef.current, cellSize);
    pieceAnimsRef.current = anims;

    // Show old engine while animating (captured piece still visible)
    setDisplayPieces(prevEngine.pieces);
    animatingRef.current = true;

    const movingAnim = anims.get(movedFrom.id)!;
    const capturedAnim = captured ? anims.get(captured.id) : undefined;

    const parallel: Animated.CompositeAnimation[] = [
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
      parallel.push(
        Animated.timing(capturedAnim.opacity, {
          toValue: 0,
          duration: FADE_MS,
          useNativeDriver: false,
        }),
      );
    }

    Animated.parallel(parallel).start(() => {
      animatingRef.current = false;
      const finalPieces = nextEngine.pieces;
      pieceAnimsRef.current = buildAnims(finalPieces, cellSize);
      setDisplayPieces(finalPieces);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step]);

  // ── Controls ─────────────────────────────────────────────────────────────

  const engine = engines[step] ?? GameEngine.initial();
  const isAtEnd = step >= engines.length - 1;
  const isAtStart = step === 0;

  const togglePlay = () => {
    if (isAtEnd) {setStep(0); setPlaying(true); return;}
    setPlaying(p => !p);
  };

  const winner =
    game.winnerId === game.playerBlackId
      ? game.playerBlackUsername
      : game.winnerId === game.playerWhiteId
      ? game.playerWhiteUsername
      : null;

  // ── Render ────────────────────────────────────────────────────────────────

  const piecesToRender = displayPieces.length > 0 ? displayPieces : engine.pieces;

  return (
    <SafeAreaView style={{flex: 1, backgroundColor: '#0c0c0c'}}>
      <View style={{flex: 1, alignItems: 'center', padding: 16, paddingTop: 5, gap: 16}}>
        <ScreenHeader title="Replay" onBack={onBack} />

        {/* Players */}
        <View style={{flexDirection: 'row', alignItems: 'center', gap: 14}}>
          <View style={{flexDirection: 'row', alignItems: 'center', gap: 8}}>
            <PlayerAvatar
              username={game.playerBlackUsername}
              avatarUrl={game.playerBlackAvatarUrl}
            />
            <Text style={{color: '#fff', fontSize: 13, fontWeight: '600'}}>
              {game.playerBlackUsername ?? '—'}
            </Text>
          </View>
          <Text style={{color: '#4e4e4e', fontSize: 11, fontWeight: '700', letterSpacing: 1}}>
            {t('replay.versus')}
          </Text>
          <View style={{flexDirection: 'row', alignItems: 'center', gap: 8}}>
            <PlayerAvatar
              username={game.playerWhiteUsername}
              avatarUrl={game.playerWhiteAvatarUrl}
            />
            <Text style={{color: '#fff', fontSize: 13, fontWeight: '600'}}>
              {game.playerWhiteUsername ?? '—'}
            </Text>
          </View>
        </View>

        {/* Move counter */}
        <Text style={{color: '#888', fontSize: 13}}>
          {loading
            ? t('replay.loading')
            : t('replay.moveCounter', {step, total: moves.length})}
        </Text>

        {/* Winner banner */}
        {isAtEnd && winner && (
          <View
            style={{
              paddingHorizontal: 20,
              paddingVertical: 10,
              borderRadius: 12,
              backgroundColor: 'rgba(46,204,113,0.1)',
              borderWidth: 1,
              borderColor: 'rgba(46,204,113,0.3)',
            }}>
            <Text
              style={{color: '#2ecc71', fontSize: 14, fontWeight: '700', textAlign: 'center'}}>
              {t('replay.winner', {name: winner})}
            </Text>
          </View>
        )}

        {/* Board */}
        {loading ? (
          <View style={{flex: 1, justifyContent: 'center'}}>
            <ActivityIndicator color="#fff" size="large" />
          </View>
        ) : (
          <View
            style={{
              backgroundColor: '#2e1a0a',
              borderRadius: 14,
              padding: 8,
              borderWidth: 2,
              borderColor: '#5a3515',
              shadowColor: '#000',
              shadowOffset: {width: 0, height: 8},
              shadowOpacity: 0.7,
              shadowRadius: 16,
              elevation: 12,
            }}>
            <View
              style={{
                width: boardSize,
                height: boardSize,
                borderRadius: 6,
                overflow: 'hidden',
                position: 'relative',
              }}>
              {/* Cells */}
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
              {piecesToRender.map(piece => {
                const anim = getOrCreateAnim(
                  piece,
                  pieceAnimsRef.current,
                  cellSize,
                );
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
                      style={{
                        width: pieceSize,
                        height: pieceSize,
                        borderRadius: pieceSize / 2,
                        backgroundColor: piece.color === 'dark' ? '#1a1e2a' : '#e8e8e8',
                        borderWidth: 2,
                        borderColor: piece.color === 'dark' ? '#555' : '#999',
                        alignItems: 'center',
                        justifyContent: 'center',
                        shadowColor: '#000',
                        shadowOffset: {width: 0, height: 2},
                        shadowOpacity: 0.5,
                        shadowRadius: 3,
                        elevation: 3,
                      }}>
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

        {/* Controls */}
        {!loading && (
          <View style={{flexDirection: 'row', alignItems: 'center', gap: 10}}>
            {[
              {
                label: '|◀',
                action: () => {setStep(0); setPlaying(false);},
                disabled: isAtStart,
              },
              {
                label: '◀',
                action: () => {if (!isAtStart) {setStep(s => s - 1); setPlaying(false);}},
                disabled: isAtStart,
              },
              {
                label: playing ? '⏸' : isAtEnd ? '↺' : '▶',
                action: togglePlay,
                primary: true,
              },
              {
                label: '▶',
                action: () => {if (!isAtEnd) {setStep(s => s + 1); setPlaying(false);}},
                disabled: isAtEnd,
              },
              {
                label: '▶|',
                action: () => {setStep(engines.length - 1); setPlaying(false);},
                disabled: isAtEnd,
              },
            ].map((btn, i) => (
              <TouchableOpacity
                key={i}
                onPress={btn.action}
                disabled={btn.disabled}
                activeOpacity={0.75}
                style={{
                  width: btn.primary ? 52 : 40,
                  height: btn.primary ? 52 : 40,
                  borderRadius: btn.primary ? 26 : 10,
                  backgroundColor: btn.primary ? '#fff' : '#131313',
                  borderWidth: btn.primary ? 0 : 1,
                  borderColor: '#232323',
                  opacity: btn.disabled ? 0.3 : 1,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}>
                <Text
                  style={{
                    color: btn.primary ? '#000' : '#fff',
                    fontSize: btn.primary ? 18 : 14,
                  }}>
                  {btn.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* Progress bar */}
        {!loading && moves.length > 0 && (
          <View
            style={{
              width: boardSize + 16,
              height: 3,
              backgroundColor: '#1a1a1a',
              borderRadius: 2,
            }}>
            <View
              style={{
                width: `${(step / moves.length) * 100}%`,
                height: '100%',
                backgroundColor: '#fff',
                borderRadius: 2,
              }}
            />
          </View>
        )}
      </View>
    </SafeAreaView>
  );
}

// ─── Anim helpers (module-level, no state) ────────────────────────────────────

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

function getOrCreateAnim(
  piece: Piece,
  anims: Map<string, PieceAnim>,
  cellSize: number,
): PieceAnim {
  if (!anims.has(piece.id)) {
    anims.set(piece.id, {
      pos: new Animated.ValueXY({x: piece.col * cellSize, y: piece.row * cellSize}),
      opacity: new Animated.Value(1),
    });
  }
  return anims.get(piece.id)!;
}
