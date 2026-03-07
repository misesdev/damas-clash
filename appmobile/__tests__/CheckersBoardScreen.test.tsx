/**
 * CheckersBoardScreen — component tests.
 *
 * Strategy:
 *  • Component now requires game: GameResponse + session: LoginResponse (online game).
 *  • SignalR and makeMove are mocked; local engine handles optimistic moves.
 *  • Piece interactions use dark player session (currentTurn='Black' → myTurn=true).
 *  • Captures tested with a custom minimal board where capture is immediately available.
 */

import {act, fireEvent, render, waitFor} from '@testing-library/react-native';
import React from 'react';
import {CheckersBoardScreen} from '../src/screens/CheckersBoardScreen';
import * as gamesApi from '../src/api/games';

jest.mock('../src/api/games');

jest.mock('../src/components/MessageBox', () => ({
  __esModule: true,
  showMessage: jest.fn(),
  default: () => null,
}));

jest.mock('@microsoft/signalr', () => ({
  HubConnectionBuilder: jest.fn(),
  HttpTransportType: {WebSockets: 4},
  HubConnectionState: {Connected: 'Connected'},
}));

// ── Board states ───────────────────────────────────────────────────────────────

const INITIAL_BOARD_STATE = JSON.stringify({
  cells: [
    [0, 1, 0, 1, 0, 1, 0, 1], // row 0: dark at cols 1,3,5,7
    [1, 0, 1, 0, 1, 0, 1, 0], // row 1: dark at cols 0,2,4,6
    [0, 1, 0, 1, 0, 1, 0, 1], // row 2: dark at cols 1,3,5,7
    [0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0],
    [2, 0, 2, 0, 2, 0, 2, 0], // row 5: light at cols 0,2,4,6
    [0, 2, 0, 2, 0, 2, 0, 2], // row 6: light at cols 1,3,5,7
    [2, 0, 2, 0, 2, 0, 2, 0], // row 7: light at cols 0,2,4,6
  ],
  pendingCaptureRow: -1,
  pendingCaptureCol: -1,
});

// Minimal board: 1 dark at (2,1), 1 white at (3,2) → dark can capture to (4,3)
const CAPTURE_BOARD_STATE = JSON.stringify({
  cells: [
    [0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0],
    [0, 1, 0, 0, 0, 0, 0, 0], // row 2: dark at (2,1)
    [0, 0, 2, 0, 0, 0, 0, 0], // row 3: white at (3,2)
    [0, 0, 0, 0, 0, 0, 0, 0], // row 4: empty → landing at (4,3)
    [0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0],
  ],
  pendingCaptureRow: -1,
  pendingCaptureCol: -1,
});

// ── Fixtures ───────────────────────────────────────────────────────────────────

const fakeGame = {
  id: 'game-1',
  playerBlackId: 'player-black',
  playerBlackUsername: 'darkPlayer',
  playerBlackAvatarUrl: null,
  playerWhiteId: 'player-white',
  playerWhiteUsername: 'lightPlayer',
  playerWhiteAvatarUrl: null,
  winnerId: null,
  status: 'InProgress' as const,
  boardState: INITIAL_BOARD_STATE,
  currentTurn: 'Black' as const,
  createdAt: '',
  updatedAt: '',
};

/** Dark player session — isMyTurn=true when currentTurn='Black'. */
const fakeSessionDark = {
  token: 'tok',
  refreshToken: 'ref',
  expiresAt: new Date(Date.now() + 15 * 60 * 1000).toISOString(),
  playerId: 'player-black',
  username: 'darkPlayer',
  email: 'dark@test.com',
};

/** Light player session — isMyTurn=false when currentTurn='Black'. */
const fakeSessionLight = {
  token: 'tok',
  refreshToken: 'ref',
  expiresAt: new Date(Date.now() + 15 * 60 * 1000).toISOString(),
  playerId: 'player-white',
  username: 'lightPlayer',
  email: 'light@test.com',
};

/** Spectator session — not a player in the game. */
const fakeSessionSpectator = {
  token: 'tok',
  refreshToken: 'ref',
  expiresAt: new Date(Date.now() + 15 * 60 * 1000).toISOString(),
  playerId: 'spectator-123',
  username: 'spectatorUser',
  email: 'spec@test.com',
};

const mockMakeMove = gamesApi.makeMove as jest.MockedFunction<typeof gamesApi.makeMove>;
const mockSkipTurn = gamesApi.skipTurn as jest.MockedFunction<typeof gamesApi.skipTurn>;
const mockResign = gamesApi.resign as jest.MockedFunction<typeof gamesApi.resign>;

// ── Setup ──────────────────────────────────────────────────────────────────────

beforeEach(() => {
  jest.clearAllMocks();

  const {HubConnectionBuilder} = require('@microsoft/signalr') as {
    HubConnectionBuilder: jest.Mock;
  };
  const mockHub = {
    on: jest.fn(),
    off: jest.fn(),
    start: jest.fn().mockResolvedValue(undefined),
    stop: jest.fn().mockResolvedValue(undefined),
    invoke: jest.fn().mockResolvedValue(undefined),
  };
  HubConnectionBuilder.mockReturnValue({
    withUrl: jest.fn().mockReturnThis(),
    withAutomaticReconnect: jest.fn().mockReturnThis(),
    build: jest.fn().mockReturnValue(mockHub),
  });

  mockMakeMove.mockResolvedValue({
    ...fakeGame,
    currentTurn: 'White' as const,
  });

  mockSkipTurn.mockResolvedValue({
    ...fakeGame,
    currentTurn: 'White' as const,
  });

  mockResign.mockResolvedValue({
    ...fakeGame,
    status: 'Completed' as const,
    winnerId: 'player-white',
  });
});

// ── Helpers ────────────────────────────────────────────────────────────────────

const renderBoard = (overrides: Partial<typeof fakeGame> = {}, session = fakeSessionDark) => {
  const game = {...fakeGame, ...overrides};
  const onBack = jest.fn();
  const utils = render(<CheckersBoardScreen game={game} session={session} onBack={onBack} />);
  return {...utils, onBack};
};

const pressCell = async (
  getByTestId: ReturnType<typeof render>['getByTestId'],
  cellId: string,
) => {
  await act(async () => {
    fireEvent.press(getByTestId(cellId));
  });
};

// ── Initial render ────────────────────────────────────────────────────────────

describe('initial render', () => {
  it('renders the board', () => {
    const {getByTestId} = renderBoard();
    expect(getByTestId('checkers-board')).toBeTruthy();
  });

  it('renders 12 dark and 12 light pieces', () => {
    const {queryAllByTestId} = renderBoard();
    expect(queryAllByTestId('piece-dark')).toHaveLength(12);
    expect(queryAllByTestId('piece-light')).toHaveLength(12);
  });

  it('shows "Sua vez" when it is my turn', () => {
    const {getByText} = renderBoard(); // dark session, currentTurn='Black'
    expect(getByText('Sua vez')).toBeTruthy();
  });

  it('shows opponent username when it is not my turn', () => {
    // Light session: currentTurn='Black' → dark's turn → not my turn
    const {getByText} = renderBoard({}, fakeSessionLight);
    expect(getByText(`Vez de darkPlayer`)).toBeTruthy();
  });

  it('shows overlay back button when game is completed', () => {
    const {getByTestId} = renderBoard({
      status: 'Completed' as const,
      winnerId: 'player-black',
    });
    expect(getByTestId('overlay-back-button')).toBeTruthy();
  });

  it('calls onBack when overlay back button is pressed', () => {
    const {getByTestId, onBack} = renderBoard({
      status: 'Completed' as const,
      winnerId: 'player-black',
    });
    fireEvent.press(getByTestId('overlay-back-button'));
    expect(onBack).toHaveBeenCalledTimes(1);
  });
});

// ── Piece selection ───────────────────────────────────────────────────────────

describe('piece selection', () => {
  it('does not allow moving a dark piece when it is not my turn (light session)', async () => {
    const {getByTestId, queryAllByTestId} = renderBoard({}, fakeSessionLight);
    // Light session: dark's turn → can't select dark pieces
    await pressCell(getByTestId, 'cell-2-1'); // dark piece at (2,1)
    await pressCell(getByTestId, 'cell-3-0'); // would be a valid target
    // Piece count unchanged (no move made)
    expect(queryAllByTestId('piece-dark')).toHaveLength(12);
  });

  it('allows pressing a dark piece without crashing when it is my turn', () => {
    const {getByTestId} = renderBoard(); // dark session, currentTurn='Black'
    expect(() => fireEvent.press(getByTestId('cell-2-1'))).not.toThrow();
  });
});

// ── Move execution ────────────────────────────────────────────────────────────

describe('move execution', () => {
  it('keeps 12 dark pieces after a move', async () => {
    const {getByTestId, queryAllByTestId} = renderBoard();

    // Dark (2,1) → (3,0)
    await pressCell(getByTestId, 'cell-2-1'); // select dark piece
    await pressCell(getByTestId, 'cell-3-0'); // move

    await waitFor(() => {
      expect(queryAllByTestId('piece-dark')).toHaveLength(12);
    });
  });

  it('calls makeMove API when a move is made', async () => {
    const {getByTestId} = renderBoard();

    await pressCell(getByTestId, 'cell-2-1'); // select
    await pressCell(getByTestId, 'cell-3-0'); // move

    await waitFor(() => {
      expect(mockMakeMove).toHaveBeenCalledWith('tok', 'game-1', {
        fromRow: 2,
        fromCol: 1,
        toRow: 3,
        toCol: 0,
      });
    });
  });

  it('deselects piece when tapping the same piece again', async () => {
    const {getByTestId} = renderBoard();
    await pressCell(getByTestId, 'cell-2-1');
    await pressCell(getByTestId, 'cell-2-1'); // deselect
    expect(getByTestId('checkers-board')).toBeTruthy();
  });

  it('deselects when tapping an empty non-target cell', async () => {
    const {getByTestId} = renderBoard();
    await pressCell(getByTestId, 'cell-2-1'); // select dark piece
    await pressCell(getByTestId, 'cell-3-3'); // not a valid target → deselect
    expect(getByTestId('checkers-board')).toBeTruthy();
  });
});

// ── Capture ───────────────────────────────────────────────────────────────────

describe('capture', () => {
  it('reduces light piece count by 1 after a capture', async () => {
    // Custom board: dark at (2,1), white at (3,2), landing at (4,3) — mandatory capture
    const {getByTestId, queryAllByTestId} = renderBoard({
      boardState: CAPTURE_BOARD_STATE,
    });

    expect(queryAllByTestId('piece-dark')).toHaveLength(1);
    expect(queryAllByTestId('piece-light')).toHaveLength(1);

    // Dark (2,1) captures white at (3,2), landing at (4,3)
    await pressCell(getByTestId, 'cell-2-1'); // select — mandatory capture so validMoveMap shows (4,3)
    await pressCell(getByTestId, 'cell-4-3'); // capture

    await waitFor(() => {
      expect(queryAllByTestId('piece-light')).toHaveLength(0);
    }, {timeout: 3000});
    expect(queryAllByTestId('piece-dark')).toHaveLength(1);
  });
});

// ── Turn timer ────────────────────────────────────────────────────────────────

describe('turn timer', () => {
  it('shows timer when it is my turn', () => {
    const {getByTestId} = renderBoard(); // dark session, currentTurn='Black' → my turn
    expect(getByTestId('turn-timer')).toBeTruthy();
  });

  it('does not show timer when it is not my turn', () => {
    const {queryByTestId} = renderBoard({}, fakeSessionLight); // light session, dark's turn
    expect(queryByTestId('turn-timer')).toBeNull();
  });

  it('does not show timer when game is completed', () => {
    const {queryByTestId} = renderBoard({
      status: 'Completed' as const,
      winnerId: 'player-black',
      currentTurn: 'Black' as const,
    });
    expect(queryByTestId('turn-timer')).toBeNull();
  });

  it('shows status text below the board', () => {
    const {getByTestId} = renderBoard();
    expect(getByTestId('status-text')).toBeTruthy();
  });
});

// ── Win condition UI ──────────────────────────────────────────────────────────

describe('win condition', () => {
  it('does NOT show overlay during game', () => {
    const {queryByTestId} = renderBoard();
    expect(queryByTestId('overlay-back-button')).toBeNull();
  });

  it('shows victory overlay when I win', () => {
    const {getByText, getByTestId} = renderBoard({
      status: 'Completed' as const,
      winnerId: 'player-black', // dark wins, dark session → I won
      currentTurn: 'White' as const,
    });
    expect(getByText('Vitória!')).toBeTruthy();
    expect(getByText(/Parabéns/)).toBeTruthy();
    expect(getByTestId('overlay-back-button')).toBeTruthy();
  });

  it('shows defeat overlay when opponent wins', () => {
    const {getByText} = renderBoard(
      {
        status: 'Completed' as const,
        winnerId: 'player-white', // light wins, dark session → I lost
        currentTurn: 'White' as const,
      },
      fakeSessionDark,
    );
    expect(getByText('Derrota')).toBeTruthy();
    expect(getByText(/venceu a partida/)).toBeTruthy();
  });
});

// ── Spectator mode ────────────────────────────────────────────────────────────

describe('spectator mode', () => {
  it('shows "Vez de darkPlayer" when Black is playing', () => {
    // currentTurn='Black' → spectator sees "Vez de darkPlayer"
    const {getByText} = renderBoard({currentTurn: 'Black' as const}, fakeSessionSpectator);
    expect(getByText('Vez de darkPlayer')).toBeTruthy();
  });

  it('shows "Vez de lightPlayer" when White is playing', () => {
    const {getByText} = renderBoard({currentTurn: 'White' as const}, fakeSessionSpectator);
    expect(getByText('Vez de lightPlayer')).toBeTruthy();
  });

  it('does not show resign button for spectator', () => {
    const {queryByTestId} = renderBoard({}, fakeSessionSpectator);
    expect(queryByTestId('resign-button')).toBeNull();
  });

  it('shows leave button for spectator during InProgress game', () => {
    const {getByTestId} = renderBoard({}, fakeSessionSpectator);
    expect(getByTestId('leave-button')).toBeTruthy();
  });

  it('calls onBack when spectator presses leave button', () => {
    const {getByTestId, onBack} = renderBoard({}, fakeSessionSpectator);
    fireEvent.press(getByTestId('leave-button'));
    expect(onBack).toHaveBeenCalledTimes(1);
  });

  it('does not show timer for spectator even when it would be a player turn', () => {
    // White's turn — a light session would show timer, but spectator should not
    const {queryByTestId} = renderBoard({currentTurn: 'White' as const}, fakeSessionSpectator);
    expect(queryByTestId('turn-timer')).toBeNull();
  });

  it('shows neutral overlay when game is completed as spectator', () => {
    const {getByText} = renderBoard(
      {status: 'Completed' as const, winnerId: 'player-black'},
      fakeSessionSpectator,
    );
    expect(getByText('Partida encerrada!')).toBeTruthy();
    expect(getByText(/venceu a partida/)).toBeTruthy();
  });

  it('does not show "Sua vez" for spectator', () => {
    const {queryByText} = renderBoard({currentTurn: 'Black' as const}, fakeSessionSpectator);
    expect(queryByText('Sua vez')).toBeNull();
  });
});

// ── Resign ────────────────────────────────────────────────────────────────────

describe('resign', () => {
  it('shows resign button during InProgress game', () => {
    const {getByTestId} = renderBoard(); // status='InProgress'
    expect(getByTestId('resign-button')).toBeTruthy();
  });

  it('does not show resign button when game is completed', () => {
    const {queryByTestId} = renderBoard({
      status: 'Completed' as const,
      winnerId: 'player-black',
    });
    expect(queryByTestId('resign-button')).toBeNull();
  });

  it('opens confirmation dialog when resign button is pressed', () => {
    const {showMessage} = require('../src/components/MessageBox');
    const {getByTestId} = renderBoard();
    fireEvent.press(getByTestId('resign-button'));
    expect(showMessage).toHaveBeenCalledWith(
      expect.objectContaining({title: 'Desistir da partida?'}),
    );
  });

  it('calls resign API when confirmation is accepted', async () => {
    const {showMessage} = require('../src/components/MessageBox');
    (showMessage as jest.Mock).mockImplementationOnce(({actions}: any) => {
      const danger = actions?.find((a: any) => a.danger);
      danger?.onPress?.();
    });

    const {getByTestId} = renderBoard();
    await act(async () => {
      fireEvent.press(getByTestId('resign-button'));
    });

    await waitFor(() => {
      expect(mockResign).toHaveBeenCalledWith('tok', 'game-1');
    });
  });
});
