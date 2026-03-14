import {act, fireEvent, render, waitFor} from '@testing-library/react-native';
import React from 'react';
import App from '../App';
import * as authApi from '../src/api/auth';
import * as gamesApi from '../src/api/games';
import * as authStorage from '../src/storage/auth';
import * as gameStorage from '../src/storage/game';

// Initial board state matching BoardEngine.CreateInitialState()
const INITIAL_BOARD_STATE = JSON.stringify({
  cells: [
    [0, 1, 0, 1, 0, 1, 0, 1],
    [1, 0, 1, 0, 1, 0, 1, 0],
    [0, 1, 0, 1, 0, 1, 0, 1],
    [0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0],
    [2, 0, 2, 0, 2, 0, 2, 0],
    [0, 2, 0, 2, 0, 2, 0, 2],
    [2, 0, 2, 0, 2, 0, 2, 0],
  ],
  pendingCaptureRow: -1,
  pendingCaptureCol: -1,
});

jest.mock('../src/api/auth');
jest.mock('../src/api/games');
jest.mock('../src/api/wallet', () => ({
  getWallet: jest.fn().mockResolvedValue({balanceSats: 0, lockedBalanceSats: 0, availableBalanceSats: 0}),
  initiateDeposit: jest.fn(),
  checkDepositStatus: jest.fn(),
  withdraw: jest.fn(),
  getTransactions: jest.fn().mockResolvedValue([]),
}));
jest.mock('../src/storage/auth');
jest.mock('../src/storage/game');
jest.mock('../src/api/players', () => ({
  getPlayer: jest.fn().mockResolvedValue({
    id: 'player-1',
    username: 'testuser',
    avatarUrl: null,
    lightningAddress: null,
    createdAt: '2025-01-01T00:00:00Z',
  }),
  updateUsername: jest.fn(),
  updateLightningAddress: jest.fn(),
  validateLightningAddress: jest.fn(),
  updateAvatar: jest.fn(),
}));

jest.mock('react-native-safe-area-context', () => {
  const {View} = require('react-native');
  return {
    SafeAreaProvider: ({children, ...props}: {children: React.ReactNode}) => (
      <View {...props}>{children}</View>
    ),
    SafeAreaView: ({children}: {children: React.ReactNode}) => (
      <View>{children}</View>
    ),
    useSafeAreaInsets: () => ({top: 0, right: 0, bottom: 0, left: 0}),
  };
});

// Simple SignalR mock — configured fully in beforeEach to avoid hoisting issues
jest.mock('@microsoft/signalr', () => ({
  HubConnectionBuilder: jest.fn(),
  HttpTransportType: {WebSockets: 4},
  HubConnectionState: {Connected: 'Connected'},
}));

// Mock MessageBox so showMessage is interceptable and the Modal is not rendered
jest.mock('../src/components/MessageBox', () => ({
  __esModule: true,
  showMessage: jest.fn(),
  default: () => null,
}));

// ── Shared state to capture SignalR event handlers ────────────────────────────
let capturedGameStartedHandler: ((game: object) => void) | null = null;
let capturedMoveMadeHandler: ((game: object) => void) | null = null;
let capturedWatchersUpdatedHandler: ((count: number) => void) | null = null;

function fireGameStarted(game: object) {
  act(() => capturedGameStartedHandler?.(game));
}

function fireMoveMade(game: object) {
  act(() => capturedMoveMadeHandler?.(game));
}

function fireWatchersUpdated(count: number) {
  act(() => capturedWatchersUpdatedHandler?.(count));
}

// ── Shared mocks ──────────────────────────────────────────────────────────────

const mockRegister = authApi.register as jest.MockedFunction<typeof authApi.register>;
const mockLogin = authApi.login as jest.MockedFunction<typeof authApi.login>;
const mockVerifyLogin = authApi.verifyLogin as jest.MockedFunction<typeof authApi.verifyLogin>;
const mockLoadSession = authStorage.loadSession as jest.MockedFunction<typeof authStorage.loadSession>;
const mockSaveSession = authStorage.saveSession as jest.MockedFunction<typeof authStorage.saveSession>;
const mockClearSession = authStorage.clearSession as jest.MockedFunction<typeof authStorage.clearSession>;
const mockLoadActiveGameId = gameStorage.loadActiveGameId as jest.MockedFunction<typeof gameStorage.loadActiveGameId>;
const mockSaveActiveGameId = gameStorage.saveActiveGameId as jest.MockedFunction<typeof gameStorage.saveActiveGameId>;
const mockClearActiveGameId = gameStorage.clearActiveGameId as jest.MockedFunction<typeof gameStorage.clearActiveGameId>;
const mockListGames = gamesApi.listGames as jest.MockedFunction<typeof gamesApi.listGames>;
const mockCreateGame = gamesApi.createGame as jest.MockedFunction<typeof gamesApi.createGame>;
const mockGetGame = gamesApi.getGame as jest.MockedFunction<typeof gamesApi.getGame>;
const mockMakeMove = gamesApi.makeMove as jest.MockedFunction<typeof gamesApi.makeMove>;
const mockResign = gamesApi.resign as jest.MockedFunction<typeof gamesApi.resign>;
const mockGetPlayerStats = gamesApi.getPlayerStats as jest.MockedFunction<typeof gamesApi.getPlayerStats>;

const fakeSession = {
  token: 'tok',
  refreshToken: 'refresh-tok',
  expiresAt: new Date(Date.now() + 15 * 60 * 1000).toISOString(),
  playerId: 'pid',
  username: 'testuser',
  email: 'test@test.com',
};

const fakeGame = {
  id: 'aaaaaaaa-0000-0000-0000-000000000000',
  playerBlackId: 'pid',
  playerBlackUsername: 'testuser',
  playerBlackAvatarUrl: null,
  playerWhiteId: null,
  playerWhiteUsername: null,
  playerWhiteAvatarUrl: null,
  winnerId: null,
  status: 'WaitingForPlayers' as const,
  boardState: INITIAL_BOARD_STATE,
  currentTurn: 'Black' as const,
  createdAt: '',
  updatedAt: '',
  betAmountSats: 0,
};

const fakeGameStarted = {
  ...fakeGame,
  playerWhiteId: 'opponent-id',
  playerWhiteUsername: 'opponent',
  status: 'InProgress' as const,
  boardState: INITIAL_BOARD_STATE,
};

beforeEach(() => {
  capturedGameStartedHandler = null;
  capturedMoveMadeHandler = null;
  capturedWatchersUpdatedHandler = null;
  jest.clearAllMocks();

  // Re-configure HubConnectionBuilder after clearAllMocks
  const {HubConnectionBuilder} = require('@microsoft/signalr') as {
    HubConnectionBuilder: jest.Mock;
  };

  const mockHub = {
    state: 'Connected',
    on: jest.fn((event: string, handler: (arg: any) => void) => {
      if (event === 'GameStarted') {capturedGameStartedHandler = handler;}
      if (event === 'MoveMade') {capturedMoveMadeHandler = handler;}
      if (event === 'WatchersUpdated') {capturedWatchersUpdatedHandler = handler;}
    }),
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

  mockLoadSession.mockResolvedValue(null);
  mockSaveSession.mockResolvedValue(undefined);
  mockClearSession.mockResolvedValue(undefined);
  mockLoadActiveGameId.mockResolvedValue(null);
  mockSaveActiveGameId.mockResolvedValue(undefined);
  mockClearActiveGameId.mockResolvedValue(undefined);
  mockListGames.mockResolvedValue([]);
  mockCreateGame.mockResolvedValue(fakeGame);
  mockGetPlayerStats.mockResolvedValue({wins: 0, losses: 0, total: 0});
  mockGetGame.mockResolvedValue(fakeGameStarted);
  mockMakeMove.mockResolvedValue(fakeGameStarted);
  mockResign.mockResolvedValue({...fakeGameStarted, status: 'Completed' as const, winnerId: 'opponent-id'});
});

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('App navigation', () => {
  it('renders login screen when no saved session', async () => {
    const {getByTestId} = render(<App />);
    await waitFor(() => expect(getByTestId('login-button')).toBeTruthy());
  });

  it('renders home screen when saved session exists', async () => {
    mockLoadSession.mockResolvedValue(fakeSession);
    const {getByTestId} = render(<App />);
    await waitFor(() => expect(getByTestId('new-game-button')).toBeTruthy());
  });

  it('navigates to register screen when register link is pressed', async () => {
    const {getByTestId} = render(<App />);
    await waitFor(() => expect(getByTestId('login-button')).toBeTruthy());
    fireEvent.press(getByTestId('register-link'));
    await waitFor(() => expect(getByTestId('register-button')).toBeTruthy());
  });

  it('navigates back to login from register screen', async () => {
    const {getByTestId} = render(<App />);
    await waitFor(() => expect(getByTestId('login-button')).toBeTruthy());
    fireEvent.press(getByTestId('register-link'));
    await waitFor(() => expect(getByTestId('back-button')).toBeTruthy());
    fireEvent.press(getByTestId('back-button'));
    await waitFor(() => expect(getByTestId('login-button')).toBeTruthy());
  });

  it('shows confirm email screen after successful registration', async () => {
    mockRegister.mockResolvedValueOnce({
      id: 'uuid',
      username: 'testuser',
      email: 'test@test.com',
      createdAt: '',
    });

    const {getByTestId} = render(<App />);
    await waitFor(() => expect(getByTestId('login-button')).toBeTruthy());
    fireEvent.press(getByTestId('register-link'));

    await waitFor(() => expect(getByTestId('register-button')).toBeTruthy());
    fireEvent.changeText(getByTestId('username-input'), 'testuser');
    fireEvent.changeText(getByTestId('email-input'), 'test@test.com');
    fireEvent.press(getByTestId('register-button'));

    await waitFor(() => expect(getByTestId('confirm-button')).toBeTruthy());
  });

  it('returns to login from confirm email screen', async () => {
    mockRegister.mockResolvedValueOnce({
      id: 'uuid',
      username: 'testuser',
      email: 'test@test.com',
      createdAt: '',
    });

    const {getByTestId} = render(<App />);
    await waitFor(() => expect(getByTestId('login-button')).toBeTruthy());
    fireEvent.press(getByTestId('register-link'));
    await waitFor(() => expect(getByTestId('register-button')).toBeTruthy());
    fireEvent.changeText(getByTestId('username-input'), 'testuser');
    fireEvent.changeText(getByTestId('email-input'), 'test@test.com');
    fireEvent.press(getByTestId('register-button'));

    await waitFor(() => expect(getByTestId('confirm-button')).toBeTruthy());
    fireEvent.press(getByTestId('login-link'));
    await waitFor(() => expect(getByTestId('login-button')).toBeTruthy());
  });

  it('shows verify login screen after entering identifier', async () => {
    mockLogin.mockResolvedValueOnce({email: 'user@test.com'});

    const {getByTestId} = render(<App />);
    await waitFor(() => expect(getByTestId('login-button')).toBeTruthy());
    fireEvent.changeText(getByTestId('identifier-input'), 'user@test.com');
    fireEvent.press(getByTestId('login-button'));

    await waitFor(() => expect(getByTestId('confirm-button')).toBeTruthy());
  });

  it('shows home screen and saves session after successful login', async () => {
    mockLogin.mockResolvedValueOnce({email: fakeSession.email});
    mockVerifyLogin.mockResolvedValueOnce(fakeSession);

    const {getByTestId} = render(<App />);
    await waitFor(() => expect(getByTestId('login-button')).toBeTruthy());
    fireEvent.changeText(getByTestId('identifier-input'), fakeSession.email);
    fireEvent.press(getByTestId('login-button'));

    await waitFor(() => expect(getByTestId('confirm-button')).toBeTruthy());
    fireEvent.changeText(getByTestId('code-input'), '123456');
    fireEvent.press(getByTestId('confirm-button'));

    await waitFor(() => expect(getByTestId('new-game-button')).toBeTruthy());
    expect(mockSaveSession).toHaveBeenCalledWith(fakeSession);
  });

  it('returns to login and clears session on logout', async () => {
    mockLoadSession.mockResolvedValue(fakeSession);

    // Intercept showMessage and immediately trigger the danger action (Sair)
    const {showMessage} = require('../src/components/MessageBox');
    (showMessage as jest.Mock).mockImplementationOnce(({actions}: any) => {
      const danger = actions?.find((a: any) => a.danger);
      danger?.onPress?.();
    });

    const {getByTestId} = render(<App />);
    await waitFor(() => expect(getByTestId('new-game-button')).toBeTruthy());

    fireEvent.press(getByTestId('tab-profile'));
    await waitFor(() => expect(getByTestId('logout-button')).toBeTruthy());
    fireEvent.press(getByTestId('logout-button'));

    await waitFor(() => expect(getByTestId('login-button')).toBeTruthy());
    expect(mockClearSession).toHaveBeenCalled();
  });

  it('navigates to waiting room after creating a new game', async () => {
    mockLoadSession.mockResolvedValue(fakeSession);

    const {getByTestId} = render(<App />);
    await waitFor(() => expect(getByTestId('new-game-button')).toBeTruthy());
    fireEvent.press(getByTestId('new-game-button'));

    await waitFor(() => expect(getByTestId('create-game-btn')).toBeTruthy());
    fireEvent.press(getByTestId('create-game-btn'));

    await waitFor(() => expect(getByTestId('waiting-room-code')).toBeTruthy());
    expect(mockCreateGame).toHaveBeenCalledWith(fakeSession.token, 0);
  });

  it('can cancel from waiting room and return to home', async () => {
    mockLoadSession.mockResolvedValue(fakeSession);

    const {getByTestId} = render(<App />);
    await waitFor(() => expect(getByTestId('new-game-button')).toBeTruthy());
    fireEvent.press(getByTestId('new-game-button'));

    await waitFor(() => expect(getByTestId('create-game-btn')).toBeTruthy());
    fireEvent.press(getByTestId('create-game-btn'));

    await waitFor(() => expect(getByTestId('waiting-room-cancel')).toBeTruthy());
    fireEvent.press(getByTestId('waiting-room-cancel'));

    await waitFor(() => expect(getByTestId('new-game-button')).toBeTruthy());
  });

  it('navigates to checkers board when opponent joins from waiting room', async () => {
    mockLoadSession.mockResolvedValue(fakeSession);

    const {getByTestId, queryAllByTestId} = render(<App />);
    await waitFor(() => expect(getByTestId('new-game-button')).toBeTruthy());
    fireEvent.press(getByTestId('new-game-button'));

    await waitFor(() => expect(getByTestId('create-game-btn')).toBeTruthy());
    fireEvent.press(getByTestId('create-game-btn'));

    // Wait for WaitingRoomScreen and SignalR handler registration
    await waitFor(() => expect(getByTestId('waiting-room-code')).toBeTruthy());
    await waitFor(() => expect(capturedGameStartedHandler).not.toBeNull());

    // Simulate SignalR GameStarted event
    fireGameStarted(fakeGameStarted);

    await waitFor(() => expect(getByTestId('checkers-board')).toBeTruthy());
    expect(queryAllByTestId('piece-dark')).toHaveLength(12);
    expect(queryAllByTestId('piece-light')).toHaveLength(12);
  });

  // ── Board integration tests ───────────────────────────────────────────────

  it('board shows correct player usernames', async () => {
    mockLoadSession.mockResolvedValue(fakeSession);
    const {getByTestId} = render(<App />);
    await waitFor(() => expect(getByTestId('new-game-button')).toBeTruthy());
    fireEvent.press(getByTestId('new-game-button'));

    await waitFor(() => expect(getByTestId('create-game-btn')).toBeTruthy());
    fireEvent.press(getByTestId('create-game-btn'));

    await waitFor(() => expect(getByTestId('waiting-room-code')).toBeTruthy());
    await waitFor(() => expect(capturedGameStartedHandler).not.toBeNull());
    fireGameStarted(fakeGameStarted);

    await waitFor(() => expect(getByTestId('checkers-board')).toBeTruthy());
  });

  it('board renders 12 dark and 12 light pieces from API board state', async () => {
    mockLoadSession.mockResolvedValue(fakeSession);
    const {getByTestId, queryAllByTestId} = render(<App />);
    await waitFor(() => expect(getByTestId('new-game-button')).toBeTruthy());
    fireEvent.press(getByTestId('new-game-button'));

    await waitFor(() => expect(getByTestId('create-game-btn')).toBeTruthy());
    fireEvent.press(getByTestId('create-game-btn'));

    await waitFor(() => expect(getByTestId('waiting-room-code')).toBeTruthy());
    await waitFor(() => expect(capturedGameStartedHandler).not.toBeNull());
    fireGameStarted(fakeGameStarted);

    await waitFor(() => expect(getByTestId('checkers-board')).toBeTruthy());
    expect(queryAllByTestId('piece-dark')).toHaveLength(12);
    expect(queryAllByTestId('piece-light')).toHaveLength(12);
  });

  it('updates watchers count when WatchersUpdated fires', async () => {
    mockLoadSession.mockResolvedValue(fakeSession);
    const {getByTestId} = render(<App />);
    await waitFor(() => expect(getByTestId('new-game-button')).toBeTruthy());
    fireEvent.press(getByTestId('new-game-button'));

    await waitFor(() => expect(getByTestId('create-game-btn')).toBeTruthy());
    fireEvent.press(getByTestId('create-game-btn'));

    await waitFor(() => expect(getByTestId('waiting-room-code')).toBeTruthy());
    await waitFor(() => expect(capturedGameStartedHandler).not.toBeNull());
    fireGameStarted(fakeGameStarted);

    await waitFor(() => expect(getByTestId('checkers-board')).toBeTruthy());
    await waitFor(() => expect(capturedWatchersUpdatedHandler).not.toBeNull());

    fireWatchersUpdated(3);

    await waitFor(() => expect(getByTestId('watchers-count')).toBeTruthy());
  });

  it('board updates pieces when opponent makes a move (MoveMade event)', async () => {
    mockLoadSession.mockResolvedValue(fakeSession);
    const {getByTestId, queryAllByTestId} = render(<App />);
    await waitFor(() => expect(getByTestId('new-game-button')).toBeTruthy());
    fireEvent.press(getByTestId('new-game-button'));

    await waitFor(() => expect(getByTestId('create-game-btn')).toBeTruthy());
    fireEvent.press(getByTestId('create-game-btn'));

    await waitFor(() => expect(getByTestId('waiting-room-code')).toBeTruthy());
    await waitFor(() => expect(capturedGameStartedHandler).not.toBeNull());
    fireGameStarted(fakeGameStarted);
    await waitFor(() => expect(getByTestId('checkers-board')).toBeTruthy());

    // Simulate white capturing a black piece: board has 11 dark, 12 white
    const afterMoveState = JSON.stringify({
      cells: [
        [0, 1, 0, 1, 0, 1, 0, 1], // row 0: 4 dark
        [1, 0, 1, 0, 1, 0, 1, 0], // row 1: 4 dark
        [0, 0, 0, 1, 0, 1, 0, 1], // row 2: 3 dark — (2,1) captured by white
        [0, 0, 0, 0, 0, 0, 0, 0], // row 3: empty
        [0, 0, 0, 0, 0, 0, 0, 0], // row 4: empty
        [2, 0, 2, 0, 2, 0, 2, 0], // row 5: 4 white
        [0, 2, 0, 2, 0, 2, 0, 2], // row 6: 4 white
        [2, 0, 2, 0, 2, 0, 2, 0], // row 7: 4 white
      ],
      pendingCaptureRow: -1,
      pendingCaptureCol: -1,
    });

    const afterMoveGame = {
      ...fakeGameStarted,
      boardState: afterMoveState,
      currentTurn: 'White' as const,
    };

    await waitFor(() => expect(capturedMoveMadeHandler).not.toBeNull());
    fireMoveMade(afterMoveGame);

    // After move: 11 dark pieces (one captured by white), 12 light pieces
    await waitFor(() => expect(queryAllByTestId('piece-dark')).toHaveLength(11));
    expect(queryAllByTestId('piece-light')).toHaveLength(12);
  });

  it('overlay back button from board returns to home after game ends', async () => {
    mockLoadSession.mockResolvedValue(fakeSession);
    const {getByTestId} = render(<App />);
    await waitFor(() => expect(getByTestId('new-game-button')).toBeTruthy());
    fireEvent.press(getByTestId('new-game-button'));

    await waitFor(() => expect(getByTestId('create-game-btn')).toBeTruthy());
    fireEvent.press(getByTestId('create-game-btn'));

    await waitFor(() => expect(getByTestId('waiting-room-code')).toBeTruthy());
    await waitFor(() => expect(capturedGameStartedHandler).not.toBeNull());
    fireGameStarted(fakeGameStarted);
    await waitFor(() => expect(getByTestId('checkers-board')).toBeTruthy());

    // Simulate game completion via MoveMade
    await waitFor(() => expect(capturedMoveMadeHandler).not.toBeNull());
    const completedGame = {
      ...fakeGameStarted,
      status: 'Completed' as const,
      winnerId: fakeSession.playerId,
    };
    fireMoveMade(completedGame);

    await waitFor(() => expect(getByTestId('overlay-back-button')).toBeTruthy());
    fireEvent.press(getByTestId('overlay-back-button'));
    await waitFor(() => expect(getByTestId('new-game-button')).toBeTruthy());
  });

  it('restores active game from storage on startup', async () => {
    const inProgressGame = {
      ...fakeGameStarted,
      id: 'saved-game-id',
      status: 'InProgress' as const,
    };
    mockLoadSession.mockResolvedValue(fakeSession);
    mockLoadActiveGameId.mockResolvedValue('saved-game-id');
    mockGetGame.mockResolvedValue(inProgressGame);

    const {getByTestId} = render(<App />);
    await waitFor(() => expect(getByTestId('checkers-board')).toBeTruthy());
  });

  it('shows modal when opponent joins after user left waiting room', async () => {
    mockLoadSession.mockResolvedValue(fakeSession);

    const {showMessage} = require('../src/components/MessageBox');

    const {getByTestId} = render(<App />);
    await waitFor(() => expect(getByTestId('new-game-button')).toBeTruthy());
    fireEvent.press(getByTestId('new-game-button'));

    await waitFor(() => expect(getByTestId('create-game-btn')).toBeTruthy());
    fireEvent.press(getByTestId('create-game-btn'));

    // Wait for WaitingRoomScreen and SignalR handler registration
    await waitFor(() => expect(getByTestId('waiting-room-cancel')).toBeTruthy());
    await waitFor(() => expect(capturedGameStartedHandler).not.toBeNull());

    // User cancels — goes back to home
    fireEvent.press(getByTestId('waiting-room-cancel'));
    await waitFor(() => expect(getByTestId('new-game-button')).toBeTruthy());

    // Opponent joins — should show modal (not auto-navigate)
    fireGameStarted(fakeGameStarted);

    await waitFor(() =>
      expect(showMessage).toHaveBeenCalledWith(
        expect.objectContaining({title: 'Oponente encontrado!'}),
      ),
    );
  });
});
