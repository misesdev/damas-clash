import React, {useEffect, useRef, useState} from 'react';
import {
  ActivityIndicator,
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
import type {LoginResponse} from '../types/auth';
import type {GameResponse, MoveResponse} from '../types/game';
import { ScreenHeader } from '../components/ScreenHeader';

interface Props {
  game: GameResponse;
  session: LoginResponse;
  onBack: () => void;
}

function PlayerAvatar({username, avatarUrl, size = 36}: {username?: string | null; avatarUrl?: string | null; size?: number}) {
  if (avatarUrl) {
    return <Image source={{uri: avatarUrl}} style={{width: size, height: size, borderRadius: size / 2}} />;
  }
  return (
    <View style={{width: size, height: size, borderRadius: size / 2, backgroundColor: '#1a1a1a', borderWidth: 1, borderColor: '#232323', alignItems: 'center', justifyContent: 'center'}}>
      <Text style={{color: '#fff', fontSize: size * 0.38, fontWeight: '700'}}>
        {(username ?? '?')[0].toUpperCase()}
      </Text>
    </View>
  );
}

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
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

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
        setPlaying(true);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [game.id, session.token]);

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
    }, 1000);
    return () => {if (intervalRef.current) {clearInterval(intervalRef.current);}};
  }, [playing, engines.length]);

  const engine = engines[step] ?? GameEngine.initial();
  const isAtEnd = step >= engines.length - 1;
  const isAtStart = step === 0;

  const togglePlay = () => {
    if (isAtEnd) {setStep(0); setPlaying(true); return;}
    setPlaying(p => !p);
  };

  const winner = game.winnerId === game.playerBlackId
    ? game.playerBlackUsername
    : game.winnerId === game.playerWhiteId
    ? game.playerWhiteUsername
    : null;

  return (
    <SafeAreaView style={{flex: 1, backgroundColor: '#0c0c0c'}}>
      <View style={{flex: 1, alignItems: 'center', padding: 16, paddingTop: 5, gap: 16}}>
        {/* Back */}
        <ScreenHeader title={t('replay.backButton')} onBack={onBack}/>
        {/* Players */}
        <View style={{flexDirection: 'row', alignItems: 'center', gap: 14}}>
          <View style={{flexDirection: 'row', alignItems: 'center', gap: 8}}>
            <PlayerAvatar username={game.playerBlackUsername} avatarUrl={game.playerBlackAvatarUrl} />
            <Text style={{color: '#fff', fontSize: 13, fontWeight: '600'}}>{game.playerBlackUsername ?? '—'}</Text>
          </View>
          <Text style={{color: '#4e4e4e', fontSize: 11, fontWeight: '700', letterSpacing: 1}}>{t('replay.versus')}</Text>
          <View style={{flexDirection: 'row', alignItems: 'center', gap: 8}}>
            <PlayerAvatar username={game.playerWhiteUsername} avatarUrl={game.playerWhiteAvatarUrl} />
            <Text style={{color: '#fff', fontSize: 13, fontWeight: '600'}}>{game.playerWhiteUsername ?? '—'}</Text>
          </View>
        </View>

        {/* Move counter */}
        <Text style={{color: '#888', fontSize: 13}}>
          {loading ? t('replay.loading') : t('replay.moveCounter', {step, total: moves.length})}
        </Text>

        {/* Winner */}
        {isAtEnd && winner && (
          <View style={{paddingHorizontal: 20, paddingVertical: 10, borderRadius: 12, backgroundColor: 'rgba(46,204,113,0.1)', borderWidth: 1, borderColor: 'rgba(46,204,113,0.3)'}}>
            <Text style={{color: '#2ecc71', fontSize: 14, fontWeight: '700', textAlign: 'center'}}>
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
          <View style={{backgroundColor: '#2e1a0a', borderRadius: 14, padding: 8, borderWidth: 2, borderColor: '#5a3515', shadowColor: '#000', shadowOffset: {width: 0, height: 8}, shadowOpacity: 0.7, shadowRadius: 16, elevation: 12}}>
            <View style={{width: boardSize, height: boardSize, borderRadius: 6, overflow: 'hidden', position: 'relative'}}>
              {/* Cells */}
              {Array.from({length: BOARD_SIZE}, (_, row) =>
                Array.from({length: BOARD_SIZE}, (_, col) => (
                  <View
                    key={`${row}-${col}`}
                    style={{
                      position: 'absolute', width: cellSize, height: cellSize,
                      left: col * cellSize, top: row * cellSize,
                      backgroundColor: isDarkSquare(row, col) ? '#b58863' : '#f0d9b5',
                    }}
                  />
                ))
              )}

              {/* Pieces */}
              {engine.pieces.map(piece => (
                <View
                  key={piece.id}
                  style={{
                    position: 'absolute',
                    width: cellSize, height: cellSize,
                    left: piece.col * cellSize, top: piece.row * cellSize,
                    alignItems: 'center', justifyContent: 'center',
                  }}
                >
                  <View style={{
                    width: pieceSize, height: pieceSize, borderRadius: pieceSize / 2,
                    backgroundColor: piece.color === 'dark' ? '#1a1e2a' : '#e8e8e8',
                    borderWidth: 2, borderColor: piece.color === 'dark' ? '#555' : '#999',
                    alignItems: 'center', justifyContent: 'center',
                    shadowColor: '#000', shadowOffset: {width: 0, height: 2}, shadowOpacity: 0.5, shadowRadius: 3, elevation: 3,
                  }}>
                    {piece.isKing && (
                      <Text style={{fontSize: pieceSize * 0.38, color: piece.color === 'dark' ? '#ffd700' : '#333', lineHeight: pieceSize * 0.5}}>♛</Text>
                    )}
                  </View>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Controls */}
        {!loading && (
          <View style={{flexDirection: 'row', alignItems: 'center', gap: 10}}>
            {[
              {label: '|◀', action: () => {setStep(0); setPlaying(false);}, disabled: isAtStart},
              {label: '◀', action: () => {if (!isAtStart) {setStep(s => s - 1); setPlaying(false);}}, disabled: isAtStart},
              {label: playing ? '⏸' : isAtEnd ? '↺' : '▶', action: togglePlay, primary: true},
              {label: '▶', action: () => {if (!isAtEnd) {setStep(s => s + 1); setPlaying(false);}}, disabled: isAtEnd},
              {label: '▶|', action: () => {setStep(engines.length - 1); setPlaying(false);}, disabled: isAtEnd},
            ].map((btn, i) => (
              <TouchableOpacity
                key={i}
                onPress={btn.action}
                disabled={btn.disabled}
                activeOpacity={0.75}
                style={{
                  width: btn.primary ? 52 : 40, height: btn.primary ? 52 : 40,
                  borderRadius: btn.primary ? 26 : 10,
                  backgroundColor: btn.primary ? '#fff' : '#131313',
                  borderWidth: btn.primary ? 0 : 1, borderColor: '#232323',
                  opacity: btn.disabled ? 0.3 : 1,
                  alignItems: 'center', justifyContent: 'center',
                }}
              >
                <Text style={{color: btn.primary ? '#000' : '#fff', fontSize: btn.primary ? 18 : 14}}>{btn.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* Progress bar */}
        {!loading && moves.length > 0 && (
          <View style={{width: boardSize + 16, height: 3, backgroundColor: '#1a1a1a', borderRadius: 2}}>
            <View style={{width: `${(step / moves.length) * 100}%`, height: '100%', backgroundColor: '#fff', borderRadius: 2}} />
          </View>
        )}
      </View>
    </SafeAreaView>
  );
}
