/**
 * OnlinePlayersScreen — component tests.
 *
 * Tests cover:
 *  - Render with empty list
 *  - Render with mixed Online / InGame players (excluding self)
 *  - Search filtering
 *  - "Ver Perfil" button for Online players
 *  - Watch button for InGame players
 *  - Close button
 */

import {fireEvent, render, screen} from '@testing-library/react-native';
import React from 'react';
import {OnlinePlayersScreen} from '../src/screens/OnlinePlayersScreen';
import type {OnlinePlayerInfo} from '../src/types/player';

const SELF_ID = 'self-player-id';

const ONLINE_PLAYER: OnlinePlayerInfo = {
  playerId: 'player-1',
  username: 'alice',
  avatarUrl: null,
  status: 'Online',
  gameId: null,
};

const INGAME_PLAYER: OnlinePlayerInfo = {
  playerId: 'player-2',
  username: 'bob',
  avatarUrl: null,
  status: 'InGame',
  gameId: 'game-abc',
};

const SELF_PLAYER: OnlinePlayerInfo = {
  playerId: SELF_ID,
  username: 'me',
  avatarUrl: null,
  status: 'Online',
  gameId: null,
};

function renderScreen(
  players: OnlinePlayerInfo[] = [],
  overrides: Partial<{
    onClose: jest.Mock;
    onViewProfile: jest.Mock;
    onWatch: jest.Mock;
  }> = {},
) {
  const props = {
    visible: true,
    onClose: overrides.onClose ?? jest.fn(),
    players,
    currentPlayerId: SELF_ID,
    onViewProfile: overrides.onViewProfile ?? jest.fn(),
    onWatch: overrides.onWatch ?? jest.fn(),
  };
  return {props, ...render(<OnlinePlayersScreen {...props} />)};
}

describe('OnlinePlayersScreen', () => {
  it('renders the modal when visible=true', () => {
    renderScreen();
    expect(screen.getByTestId('online-players-modal')).toBeTruthy();
  });

  it('shows empty message when no other players', () => {
    renderScreen([SELF_PLAYER]);
    expect(screen.getByText(/Nenhum outro jogador online/i)).toBeTruthy();
  });

  it('excludes self from the list', () => {
    renderScreen([SELF_PLAYER, ONLINE_PLAYER]);
    expect(screen.queryByText('me')).toBeNull();
    expect(screen.getByText('alice')).toBeTruthy();
  });

  it('shows "Ver Perfil" button for Online players', () => {
    renderScreen([ONLINE_PLAYER]);
    expect(screen.getByText('Ver Perfil')).toBeTruthy();
  });

  it('shows "Assistir" button for InGame players', () => {
    renderScreen([INGAME_PLAYER]);
    expect(screen.getByText('Assistir')).toBeTruthy();
  });

  it('shows "Em partida" status for InGame players', () => {
    renderScreen([INGAME_PLAYER]);
    expect(screen.getByText('Em partida')).toBeTruthy();
  });

  it('calls onViewProfile with correct data when "Ver Perfil" pressed', () => {
    const onViewProfile = jest.fn();
    renderScreen([ONLINE_PLAYER], {onViewProfile});
    fireEvent.press(screen.getByText('Ver Perfil'));
    expect(onViewProfile).toHaveBeenCalledWith('player-1', 'alice', null);
  });

  it('calls onWatch with gameId when Assistir pressed', () => {
    const onWatch = jest.fn();
    renderScreen([INGAME_PLAYER], {onWatch});
    fireEvent.press(screen.getByText('Assistir'));
    expect(onWatch).toHaveBeenCalledWith('game-abc');
  });

  it('calls onClose when close button pressed', () => {
    const onClose = jest.fn();
    renderScreen([], {onClose});
    fireEvent.press(screen.getByTestId('close-online-players'));
    expect(onClose).toHaveBeenCalled();
  });

  it('filters players by search query', () => {
    renderScreen([ONLINE_PLAYER, INGAME_PLAYER]);
    fireEvent.changeText(screen.getByTestId('search-online-input'), 'ali');
    expect(screen.getByText('alice')).toBeTruthy();
    expect(screen.queryByText('bob')).toBeNull();
  });

  it('clears search when clear button pressed', () => {
    renderScreen([ONLINE_PLAYER, INGAME_PLAYER]);
    fireEvent.changeText(screen.getByTestId('search-online-input'), 'ali');
    fireEvent.press(screen.getByTestId('search-online-clear'));
    expect(screen.getByText('alice')).toBeTruthy();
    expect(screen.getByText('bob')).toBeTruthy();
  });

  it('shows empty search message when query has no results', () => {
    renderScreen([ONLINE_PLAYER]);
    fireEvent.changeText(screen.getByTestId('search-online-input'), 'zzz');
    expect(screen.getByText(/Nenhum jogador encontrado/i)).toBeTruthy();
  });

  it('shows correct player count in subtitle', () => {
    renderScreen([ONLINE_PLAYER, INGAME_PLAYER, SELF_PLAYER]);
    expect(screen.getByText(/2 jogadores/i)).toBeTruthy();
  });

  it('renders multiple players correctly', () => {
    renderScreen([ONLINE_PLAYER, INGAME_PLAYER]);
    expect(screen.getByText('alice')).toBeTruthy();
    expect(screen.getByText('bob')).toBeTruthy();
    expect(screen.getByText('Ver Perfil')).toBeTruthy();
    expect(screen.getByText('Assistir')).toBeTruthy();
  });
});
