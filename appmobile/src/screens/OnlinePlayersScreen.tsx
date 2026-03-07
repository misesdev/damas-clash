import React from 'react';
import {
  FlatList,
  Image,
  Modal,
  Pressable,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import {useOnlinePlayers} from '../hooks/useOnlinePlayers';
import {styles} from '../styles/onlinePlayersStyles';
import type {OnlinePlayerInfo} from '../types/player';

interface Props {
  visible: boolean;
  onClose: () => void;
  players: OnlinePlayerInfo[];
  currentPlayerId: string;
  pendingChallengeId: string | null;
  onChallenge: (playerId: string) => void;
  onCancelChallenge: (playerId: string) => void;
  onWatch: (gameId: string) => void;
}

function PlayerAvatar({username, avatarUrl}: {username: string; avatarUrl?: string | null}) {
  if (avatarUrl) {
    return <Image source={{uri: avatarUrl}} style={styles.avatarImg} />;
  }
  return (
    <View style={styles.avatar}>
      <Text style={styles.avatarInitials}>{username[0]?.toUpperCase() ?? '?'}</Text>
    </View>
  );
}

function PlayerRow({
  player,
  isPending,
  onChallenge,
  onCancelChallenge,
  onWatch,
}: {
  player: OnlinePlayerInfo;
  isPending: boolean;
  onChallenge: () => void;
  onCancelChallenge: () => void;
  onWatch: () => void;
}) {
  const isInGame = player.status === 'InGame';

  const actionBtn = isInGame ? (
    <TouchableOpacity style={[styles.actionBtn, styles.watchBtn]} onPress={onWatch}>
      <Text style={styles.watchBtnText}>Assistir</Text>
    </TouchableOpacity>
  ) : isPending ? (
    <TouchableOpacity style={[styles.actionBtn, styles.waitingBtn]} onPress={onCancelChallenge}>
      <Text style={styles.waitingBtnText}>Aguardando...</Text>
    </TouchableOpacity>
  ) : (
    <TouchableOpacity style={[styles.actionBtn, styles.challengeBtn]} onPress={onChallenge}>
      <Text style={styles.challengeBtnText}>Desafiar</Text>
    </TouchableOpacity>
  );

  return (
    <View style={styles.row} testID={`player-row-${player.playerId}`}>
      <PlayerAvatar username={player.username} avatarUrl={player.avatarUrl} />
      <View style={styles.info}>
        <Text style={styles.username} numberOfLines={1}>{player.username}</Text>
        <View style={styles.statusRow}>
          <View style={[styles.statusDot, isInGame ? styles.statusDotInGame : styles.statusDotOnline]} />
          <Text style={[styles.statusText, isInGame ? styles.statusInGame : styles.statusOnline]}>
            {isInGame ? 'Em partida' : 'Online'}
          </Text>
        </View>
      </View>
      {actionBtn}
    </View>
  );
}

export function OnlinePlayersScreen({
  visible,
  onClose,
  players,
  currentPlayerId,
  pendingChallengeId,
  onChallenge,
  onCancelChallenge,
  onWatch,
}: Props) {
  const {searchQuery, setSearchQuery, filtered} = useOnlinePlayers(players, currentPlayerId);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
      testID="online-players-modal">
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Pressable style={styles.sheet} onPress={e => e.stopPropagation()}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <Text style={styles.title}>Jogadores Online</Text>
              <Text style={styles.subtitle}>
                {players.filter(p => p.playerId !== currentPlayerId).length} jogadores
              </Text>
            </View>
            <TouchableOpacity style={styles.closeBtn} onPress={onClose} testID="close-online-players">
              <Text style={styles.closeBtnText}>✕</Text>
            </TouchableOpacity>
          </View>

          {/* Search */}
          <View style={styles.searchWrapper}>
            <Text style={styles.searchIcon}>⌕</Text>
            <TextInput
              style={styles.searchInput}
              placeholder="Buscar jogador..."
              placeholderTextColor="#4E4E4E"
              value={searchQuery}
              onChangeText={setSearchQuery}
              autoCapitalize="none"
              autoCorrect={false}
              testID="search-online-input"
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => setSearchQuery('')} testID="search-online-clear">
                <Text style={styles.searchClear}>✕</Text>
              </TouchableOpacity>
            )}
          </View>

          {/* List */}
          <FlatList
            data={filtered}
            keyExtractor={item => item.playerId}
            contentContainerStyle={styles.list}
            keyboardShouldPersistTaps="handled"
            ListEmptyComponent={
              <Text style={styles.empty}>
                {searchQuery.trim()
                  ? 'Nenhum jogador encontrado.'
                  : 'Nenhum outro jogador online no momento.'}
              </Text>
            }
            renderItem={({item}) => (
              <PlayerRow
                player={item}
                isPending={pendingChallengeId === item.playerId}
                onChallenge={() => onChallenge(item.playerId)}
                onCancelChallenge={() => onCancelChallenge(item.playerId)}
                onWatch={() => item.gameId && onWatch(item.gameId)}
              />
            )}
          />
        </Pressable>
      </Pressable>
    </Modal>
  );
}
