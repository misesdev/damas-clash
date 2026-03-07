import {useMemo, useState} from 'react';
import type {OnlinePlayerInfo} from '../types/player';

export function useOnlinePlayers(
  players: OnlinePlayerInfo[],
  currentPlayerId: string,
) {
  const [searchQuery, setSearchQuery] = useState('');

  const filtered = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return players
      .filter(p => p.playerId !== currentPlayerId)
      .filter(p => !q || p.username.toLowerCase().includes(q));
  }, [players, currentPlayerId, searchQuery]);

  return {searchQuery, setSearchQuery, filtered};
}
