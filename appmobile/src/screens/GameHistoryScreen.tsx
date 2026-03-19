import React, {useEffect, useState} from 'react';
import {
  ActivityIndicator,
  FlatList,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import {useTranslation} from 'react-i18next';
import {getPlayerGames} from '../api/games';
import {PlayerVs} from '../components/PlayerVs';
import type {LoginResponse} from '../types/auth';
import type {GameResponse} from '../types/game';
import { ScreenHeader } from '../components/ScreenHeader';
import {SafeAreaView} from 'react-native-safe-area-context';

interface Props {
  user: LoginResponse;
  onReplay: (game: GameResponse) => void;
  onBack: () => void;
}

export function GameHistoryScreen({user, onReplay, onBack}: Props) {
  const {t} = useTranslation();
  const [games, setGames] = useState<GameResponse[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getPlayerGames(user.token, user.playerId)
      .then(setGames)
      .catch((ex) => {console.log(ex)})
      .finally(() => setLoading(false));
  }, [user.token, user.playerId]);

  const wins = games.filter(g => g.winnerId === user.playerId).length;
  const losses = games.filter(g => g.winnerId !== null && g.winnerId !== user.playerId).length;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#0c0c0c' }}>
      <ScreenHeader title={t('gameHistory.heading')} onBack={onBack}/>
      <FlatList
        data={games}
        keyExtractor={item => item.id}
        contentContainerStyle={{padding: 20, paddingTop: 5, paddingBottom: 40}}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={
          <View>
            {/* Heading */}
            <Text style={{color: '#fff', fontSize: 22, fontWeight: '800', marginBottom: 4}}>{t('gameHistory.heading')}</Text>
            <Text style={{color: '#888', fontSize: 14, marginBottom: 24}}>{t('gameHistory.subtitle')}</Text>

            {/* Stats */}
            {!loading && games.length > 0 && (
              <View style={{flexDirection: 'row', gap: 10, marginBottom: 24}}>
                {[
                  {label: t('gameHistory.stats.games'), value: games.length},
                  {label: t('gameHistory.stats.wins'), value: wins},
                  {label: t('gameHistory.stats.losses'), value: losses},
                ].map(s => (
                  <View key={s.label} style={{flex: 1, backgroundColor: '#131313', borderRadius: 14, borderWidth: 1, borderColor: '#232323', paddingVertical: 14, alignItems: 'center'}}>
                    <Text style={{color: '#fff', fontSize: 22, fontWeight: '800'}}>{s.value}</Text>
                    <Text style={{color: '#4e4e4e', fontSize: 10, fontWeight: '600', marginTop: 4, textTransform: 'uppercase', letterSpacing: 0.5}}>{s.label}</Text>
                  </View>
                ))}
              </View>
            )}

            {loading && (
              <View style={{paddingVertical: 60, alignItems: 'center'}}>
                <ActivityIndicator color="#fff" />
              </View>
            )}

            {!loading && games.length === 0 && (
              <View style={{paddingVertical: 60, alignItems: 'center', gap: 12}}>
                <Text style={{fontSize: 40, opacity: 0.4}}>♟</Text>
                <Text style={{color: '#4e4e4e', fontSize: 14}}>{t('gameHistory.empty')}</Text>
              </View>
            )}
          </View>
        }
        renderItem={({item: game}) => {
          const isBlack = game.playerBlackId === user.playerId;
          const won = game.winnerId === user.playerId;
          const drew = game.winnerId === null;
          const resultColor = drew ? '#888' : won ? '#2ecc71' : '#ff453a';
          const betLabel = game.betAmountSats > 0
            ? `⚡ ${game.betAmountSats.toLocaleString()} sats`
            : t('gameHistory.friendly');

          return (
            <View style={{backgroundColor: '#131313', borderRadius: 16, borderWidth: 1, borderColor: '#232323', padding: 14, flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 10}}>
              {/* Result badge */}
              <View style={{
                width: 36, height: 36, borderRadius: 10,
                backgroundColor: drew ? '#1a1a1a' : won ? 'rgba(46,204,113,0.12)' : 'rgba(255,69,58,0.1)',
                borderWidth: 1,
                borderColor: drew ? '#232323' : won ? 'rgba(46,204,113,0.35)' : 'rgba(255,69,58,0.3)',
                alignItems: 'center', justifyContent: 'center',
                flexShrink: 0,
              }}>
                <Text style={{fontSize: 15, color: resultColor}}>
                  {drew ? '—' : won ? '✓' : '✗'}
                </Text>
              </View>

              {/* Players */}
              <PlayerVs
                left={{
                  username: isBlack ? game.playerBlackUsername : game.playerWhiteUsername,
                  avatarUrl: isBlack ? game.playerBlackAvatarUrl : game.playerWhiteAvatarUrl,
                }}
                right={{
                  username: isBlack ? game.playerWhiteUsername : game.playerBlackUsername,
                  avatarUrl: isBlack ? game.playerWhiteAvatarUrl : game.playerBlackAvatarUrl,
                }}
                detail={betLabel}
                winnerSide={drew ? 'draw' : won ? 'left' : 'right'}
              />

              {/* Result + Replay */}
              <View style={{alignItems: 'flex-end', gap: 6, flexShrink: 0}}>
                <Text style={{fontSize: 12, fontWeight: '700', color: resultColor}}>
                  {drew ? t('gameHistory.results.draw') : won ? t('gameHistory.results.win') : t('gameHistory.results.loss')}
                </Text>
                <TouchableOpacity
                  onPress={() => onReplay(game)}
                  activeOpacity={0.75}
                  style={{backgroundColor: '#1a1a1a', borderRadius: 8, borderWidth: 1, borderColor: '#232323', paddingHorizontal: 10, paddingVertical: 5}}
                >
                  <Text style={{color: '#fff', fontSize: 11, fontWeight: '600'}}>{t('gameHistory.replayButton')}</Text>
                </TouchableOpacity>
              </View>
            </View>
          );
        }}
      />
    </SafeAreaView>
  );
}
