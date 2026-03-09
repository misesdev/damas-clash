import React, {useEffect, useState} from 'react';
import {
  ActivityIndicator,
  FlatList,
  Image,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import {getPlayerGames} from '../api/games';
import type {LoginResponse} from '../types/auth';
import type {GameResponse} from '../types/game';
import { ScreenHeader } from '../components/ScreenHeader';
import {SafeAreaView} from 'react-native-safe-area-context';

interface Props {
  user: LoginResponse;
  onReplay: (game: GameResponse) => void;
  onBack: () => void;
}

function Avatar({username, avatarUrl, size = 36}: {username: string | null; avatarUrl: string | null; size?: number}) {
  if (avatarUrl) {
    return <Image source={{uri: avatarUrl}} style={{width: size, height: size, borderRadius: size / 2}} />;
  }
  return (
    <View style={{width: size, height: size, borderRadius: size / 2, backgroundColor: '#1a1a1a', borderWidth: 1, borderColor: '#232323', alignItems: 'center', justifyContent: 'center'}}>
      <Text style={{color: '#888', fontSize: size * 0.38, fontWeight: '700'}}>
        {(username ?? '?')[0].toUpperCase()}
      </Text>
    </View>
  );
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('pt-BR', {day: '2-digit', month: 'short', year: 'numeric'});
}

export function GameHistoryScreen({user, onReplay, onBack}: Props) {
  const [games, setGames] = useState<GameResponse[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getPlayerGames(user.token, user.playerId)
      .then(setGames)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [user.token, user.playerId]);

  const wins = games.filter(g => g.winnerId === user.playerId).length;
  const losses = games.filter(g => g.winnerId !== null && g.winnerId !== user.playerId).length;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#0c0c0c' }}>
      <FlatList
        data={games}
        keyExtractor={item => item.id}
        contentContainerStyle={{padding: 20, paddingTop: 5, paddingBottom: 40}}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={
          <View>
            <ScreenHeader title="Voltar ao Perfil" onBack={onBack}/>

            {/* Heading */}
            <Text style={{color: '#fff', fontSize: 22, fontWeight: '800', marginBottom: 4}}>Partidas jogadas</Text>
            <Text style={{color: '#888', fontSize: 14, marginBottom: 24}}>Seu histórico de partidas concluídas.</Text>

            {/* Stats */}
            {!loading && games.length > 0 && (
              <View style={{flexDirection: 'row', gap: 10, marginBottom: 24}}>
                {[
                  {label: 'Partidas', value: games.length},
                  {label: 'Vitórias', value: wins},
                  {label: 'Derrotas', value: losses},
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
                <Text style={{color: '#4e4e4e', fontSize: 14}}>Nenhuma partida finalizada ainda.</Text>
              </View>
            )}
          </View>
        }
        renderItem={({item: game}) => {
          const isBlack = game.playerBlackId === user.playerId;
          const opponent = isBlack
            ? {username: game.playerWhiteUsername, avatarUrl: game.playerWhiteAvatarUrl}
            : {username: game.playerBlackUsername, avatarUrl: game.playerBlackAvatarUrl};
          const won = game.winnerId === user.playerId;
          const drew = game.winnerId === null;

          return (
            <View style={{backgroundColor: '#131313', borderRadius: 16, borderWidth: 1, borderColor: '#232323', padding: 14, flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 10}}>
              {/* Badge */}
              <View style={{
                width: 36, height: 36, borderRadius: 10,
                backgroundColor: drew ? '#1a1a1a' : won ? 'rgba(46,204,113,0.12)' : 'rgba(255,69,58,0.1)',
                borderWidth: 1,
                borderColor: drew ? '#232323' : won ? 'rgba(46,204,113,0.35)' : 'rgba(255,69,58,0.3)',
                alignItems: 'center', justifyContent: 'center',
              }}>
                <Text style={{fontSize: 15, color: drew ? '#888' : won ? '#2ecc71' : '#ff453a'}}>
                  {drew ? '—' : won ? '✓' : '✗'}
                </Text>
              </View>

              <Avatar username={opponent.username} avatarUrl={opponent.avatarUrl} size={34} />

              <View style={{flex: 1}}>
                <Text style={{color: '#fff', fontSize: 13, fontWeight: '600'}} numberOfLines={1}>{opponent.username ?? 'Desconhecido'}</Text>
                <Text style={{color: '#888', fontSize: 11, marginTop: 2}}>{formatDate(game.updatedAt)}</Text>
              </View>

              <Text style={{fontSize: 12, fontWeight: '700', color: drew ? '#888' : won ? '#2ecc71' : '#ff453a', marginRight: 6}}>
                {drew ? 'Empate' : won ? 'Vitória' : 'Derrota'}
              </Text>

              <TouchableOpacity
                onPress={() => onReplay(game)}
                activeOpacity={0.75}
                style={{backgroundColor: '#1a1a1a', borderRadius: 8, borderWidth: 1, borderColor: '#232323', paddingHorizontal: 12, paddingVertical: 7}}
              >
                <Text style={{color: '#fff', fontSize: 12, fontWeight: '600'}}>▶ Rever</Text>
              </TouchableOpacity>
            </View>
          );
        }}
      />
    </SafeAreaView>
  );
}
