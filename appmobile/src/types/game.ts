export type GameStatus = 'WaitingForPlayers' | 'InProgress' | 'Completed';
export type PieceColorApi = 'Black' | 'White';

export interface GameResponse {
  id: string;
  playerBlackId: string | null;
  playerBlackUsername: string | null;
  playerBlackAvatarUrl: string | null;
  playerWhiteId: string | null;
  playerWhiteUsername: string | null;
  playerWhiteAvatarUrl: string | null;
  winnerId: string | null;
  status: GameStatus;
  boardState: string;
  currentTurn: PieceColorApi;
  createdAt: string;
  updatedAt: string;
  betAmountSats: number;
}

export interface MoveResponse {
  id: string;
  playerId: string | null;
  fromRow: number;
  fromCol: number;
  toRow: number;
  toCol: number;
  createdAt: string;
}

export interface PlayerStats {
  wins: number;
  losses: number;
  total: number;
}
