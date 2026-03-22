import React, {useEffect, useState} from 'react';
import {
  ActivityIndicator,
  FlatList,
  Text,
  View,
} from 'react-native';
import {useTranslation} from 'react-i18next';
import {getPlayerGames} from '../api/games';
import {GameHistoryCard} from '../components/GameHistoryCard';
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
        renderItem={({item: game}) => (
          <GameHistoryCard
            game={game}
            playerId={user.playerId}
            onReplay={onReplay}
          />
        )}
        ItemSeparatorComponent={() => <View style={{height: 10}} />}
      />
    </SafeAreaView>
  );
}
