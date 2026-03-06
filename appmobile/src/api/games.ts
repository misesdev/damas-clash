import {request} from './client';
import type {GameResponse} from '../types/game';

export interface MakeMoveRequest {
  fromRow: number;
  fromCol: number;
  toRow: number;
  toCol: number;
}

const auth = (token: string) => ({Authorization: `Bearer ${token}`});

export const listGames = (token: string) =>
  request<GameResponse[]>('/api/games', {headers: auth(token)});

export const createGame = (token: string) =>
  request<GameResponse>('/api/games', {method: 'POST', headers: auth(token)});

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
    headers: {...auth(token), 'Content-Type': 'application/json'},
    body: JSON.stringify(move),
  });
