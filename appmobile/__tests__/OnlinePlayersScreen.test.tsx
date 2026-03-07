/**
 * OnlinePlayersScreen — component tests.
 *
 * Tests cover:
 *  - Render with empty list
 *  - Render with mixed Online / InGame players (excluding self)
 *  - Search filtering
 *  - Challenge button press → onChallenge called
 *  - Pending state → "Aguardando..." rendered
 *  - Cancel pending challenge
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
  pendingChallengeId: string | null = null,
  overrides: Partial<{
    onClose: jest.Mock;
    onChallenge: jest.Mock;
    onCancelChallenge: jest.Mock;
    onWatch: jest.Mock;
  }> = {},
) {
  const props = {
    visible: true,
    onClose: overrides.onClose ?? jest.fn(),
    players,
    currentPlayerId: SELF_ID,
    pendingChallengeId,
    onChallenge: overrides.onChallenge ?? jest.fn(),
    onCancelChallenge: overrides.onCancelChallenge ?? jest.fn(),
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

  it('shows "Desafiar" button for Online players', () => {
    renderScreen([ONLINE_PLAYER]);
    expect(screen.getByText('Desafiar')).toBeTruthy();
  });

  it('shows "Assistir" button for InGame players', () => {
    renderScreen([INGAME_PLAYER]);
    expect(screen.getByText('Assistir')).toBeTruthy();
  });

  it('shows "Em partida" status for InGame players', () => {
    renderScreen([INGAME_PLAYER]);
    expect(screen.getByText('Em partida')).toBeTruthy();
  });

  it('calls onChallenge with correct playerId when Desafiar pressed', () => {
    const onChallenge = jest.fn();
    renderScreen([ONLINE_PLAYER], null, {onChallenge});
    fireEvent.press(screen.getByText('Desafiar'));
    expect(onChallenge).toHaveBeenCalledWith('player-1');
  });

  it('shows "Aguardando..." when pendingChallengeId matches player', () => {
    renderScreen([ONLINE_PLAYER], 'player-1');
    expect(screen.getByText('Aguardando...')).toBeTruthy();
  });

  it('calls onCancelChallenge when "Aguardando..." pressed', () => {
    const onCancelChallenge = jest.fn();
    renderScreen([ONLINE_PLAYER], 'player-1', {onCancelChallenge});
    fireEvent.press(screen.getByText('Aguardando...'));
    expect(onCancelChallenge).toHaveBeenCalledWith('player-1');
  });

  it('calls onWatch with gameId when Assistir pressed', () => {
    const onWatch = jest.fn();
    renderScreen([INGAME_PLAYER], null, {onWatch});
    fireEvent.press(screen.getByText('Assistir'));
    expect(onWatch).toHaveBeenCalledWith('game-abc');
  });

  it('calls onClose when close button pressed', () => {
    const onClose = jest.fn();
    renderScreen([], null, {onClose});
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
    // 2 others (ONLINE_PLAYER + INGAME_PLAYER), SELF excluded
    expect(screen.getByText(/2 jogadores/i)).toBeTruthy();
  });

  it('renders multiple players correctly', () => {
    renderScreen([ONLINE_PLAYER, INGAME_PLAYER]);
    expect(screen.getByText('alice')).toBeTruthy();
    expect(screen.getByText('bob')).toBeTruthy();
    expect(screen.getByText('Desafiar')).toBeTruthy();
    expect(screen.getByText('Assistir')).toBeTruthy();
  });
});
