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
}
