import { request } from './client';
import type { GameResponse, MoveResponse, PlayerStats } from '../types/game';

export interface MakeMoveRequest {
  fromRow: number;
  fromCol: number;
  toRow: number;
  toCol: number;
}

const auth = (token: string) => ({ Authorization: `Bearer ${token}` });

export const listGames = (token: string) =>
  request<GameResponse[]>('/api/games', { headers: auth(token) });

export const getGame = (token: string, gameId: string) =>
  request<GameResponse>(`/api/games/${gameId}`, { headers: auth(token) });

export const createGame = (token: string, betAmountSats = 0) =>
  request<GameResponse>('/api/games', {
    method: 'POST',
    headers: { ...auth(token), 'Content-Type': 'application/json' },
    body: JSON.stringify({ betAmountSats }),
  });

export const joinGame = (token: string, gameId: string) =>
  request<GameResponse>(`/api/games/${gameId}/join`, {
    method: 'POST',
    headers: auth(token),
  });

export const cancelGame = (token: string, gameId: string) =>
  request<void>(`/api/games/${gameId}`, {
    method: 'DELETE',
    headers: auth(token),
  });

export const makeMove = (token: string, gameId: string, move: MakeMoveRequest) =>
  request<GameResponse>(`/api/games/${gameId}/moves`, {
    method: 'POST',
    headers: { ...auth(token), 'Content-Type': 'application/json' },
    body: JSON.stringify(move),
  });

export const skipTurn = (token: string, gameId: string) =>
  request<GameResponse>(`/api/games/${gameId}/skip-turn`, {
    method: 'POST',
    headers: auth(token),
  });

export const resign = (token: string, gameId: string) =>
  request<GameResponse>(`/api/games/${gameId}/resign`, {
    method: 'POST',
    headers: auth(token),
  });

export const getGameMoves = (token: string, gameId: string) =>
  request<MoveResponse[]>(`/api/games/${gameId}/moves`, { headers: auth(token) });

export const getPlayerGames = (token: string, playerId: string) =>
  request<GameResponse[]>(`/api/players/${playerId}/games`, { headers: auth(token) });

export const getPlayerStats = (token: string, playerId: string) =>
  request<PlayerStats>(`/api/players/${playerId}/stats`, { headers: auth(token) });
