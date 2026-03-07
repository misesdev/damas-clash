export interface OnlinePlayerInfo {
  playerId: string;
  username: string;
  avatarUrl?: string | null;
  status: 'Online' | 'InGame';
  gameId?: string | null;
}
