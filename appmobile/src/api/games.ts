import {request} from './client';
import type {GameResponse} from '../types/game';

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
