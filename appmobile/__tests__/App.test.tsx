import {Alert} from 'react-native';
import {act, fireEvent, render, waitFor} from '@testing-library/react-native';
import React from 'react';
import App from '../App';
import * as authApi from '../src/api/auth';
import * as gamesApi from '../src/api/games';
import * as authStorage from '../src/storage/auth';

jest.mock('../src/api/auth');
jest.mock('../src/api/games');
jest.mock('../src/storage/auth');

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
}));

// ── Shared state to capture SignalR event handler ─────────────────────────────
let capturedGameStartedHandler: ((game: object) => void) | null = null;

function fireGameStarted(game: object) {
  act(() => capturedGameStartedHandler?.(game));
}

// ── Shared mocks ──────────────────────────────────────────────────────────────

const mockRegister = authApi.register as jest.MockedFunction<typeof authApi.register>;
const mockLogin = authApi.login as jest.MockedFunction<typeof authApi.login>;
const mockVerifyLogin = authApi.verifyLogin as jest.MockedFunction<typeof authApi.verifyLogin>;
const mockLoadSession = authStorage.loadSession as jest.MockedFunction<typeof authStorage.loadSession>;
const mockSaveSession = authStorage.saveSession as jest.MockedFunction<typeof authStorage.saveSession>;
const mockClearSession = authStorage.clearSession as jest.MockedFunction<typeof authStorage.clearSession>;
const mockListGames = gamesApi.listGames as jest.MockedFunction<typeof gamesApi.listGames>;
const mockCreateGame = gamesApi.createGame as jest.MockedFunction<typeof gamesApi.createGame>;

const fakeSession = {
  token: 'tok',
  playerId: 'pid',
  username: 'testuser',
  email: 'test@test.com',
};

const fakeGame = {
  id: 'aaaaaaaa-0000-0000-0000-000000000000',
  playerBlackId: 'pid',
  playerBlackUsername: 'testuser',
  playerWhiteId: null,
  playerWhiteUsername: null,
  winnerId: null,
  status: 'WaitingForPlayers' as const,
  boardState: '',
  currentTurn: 'Black' as const,
  createdAt: '',
  updatedAt: '',
};

const fakeGameStarted = {
  ...fakeGame,
  playerWhiteId: 'opponent-id',
  playerWhiteUsername: 'opponent',
  status: 'InProgress' as const,
};

beforeEach(() => {
  capturedGameStartedHandler = null;
  jest.clearAllMocks();

  // Re-configure HubConnectionBuilder after clearAllMocks
  const {HubConnectionBuilder} = require('@microsoft/signalr') as {
    HubConnectionBuilder: jest.Mock;
  };

  const mockHub = {
    on: jest.fn((event: string, handler: (game: object) => void) => {
      if (event === 'GameStarted') {
        capturedGameStartedHandler = handler;
      }
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
  mockListGames.mockResolvedValue([]);
  mockCreateGame.mockResolvedValue(fakeGame);
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
    jest.spyOn(Alert, 'alert').mockImplementationOnce((_title, _msg, buttons) => {
      const btn = (buttons as any[])?.find(b => b.style === 'destructive');
      btn?.onPress?.();
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

    await waitFor(() => expect(getByTestId('waiting-room-code')).toBeTruthy());
    expect(mockCreateGame).toHaveBeenCalledWith(fakeSession.token);
  });

  it('can cancel from waiting room and return to home', async () => {
    mockLoadSession.mockResolvedValue(fakeSession);

    const {getByTestId} = render(<App />);
    await waitFor(() => expect(getByTestId('new-game-button')).toBeTruthy());
    fireEvent.press(getByTestId('new-game-button'));

    await waitFor(() => expect(getByTestId('waiting-room-cancel')).toBeTruthy());
    fireEvent.press(getByTestId('waiting-room-cancel'));

    await waitFor(() => expect(getByTestId('new-game-button')).toBeTruthy());
  });

  it('navigates to checkers board when opponent joins from waiting room', async () => {
    mockLoadSession.mockResolvedValue(fakeSession);

    const {getByTestId, queryAllByTestId} = render(<App />);
    await waitFor(() => expect(getByTestId('new-game-button')).toBeTruthy());
    fireEvent.press(getByTestId('new-game-button'));

    // Wait for WaitingRoomScreen and SignalR handler registration
    await waitFor(() => expect(getByTestId('waiting-room-code')).toBeTruthy());
    await waitFor(() => expect(capturedGameStartedHandler).not.toBeNull());

    // Simulate SignalR GameStarted event
    fireGameStarted(fakeGameStarted);

    await waitFor(() => expect(getByTestId('checkers-board')).toBeTruthy());
    expect(queryAllByTestId('piece-dark')).toHaveLength(12);
    expect(queryAllByTestId('piece-light')).toHaveLength(12);
  });

  it('shows alert when opponent joins after user left waiting room', async () => {
    mockLoadSession.mockResolvedValue(fakeSession);
    const alertSpy = jest.spyOn(Alert, 'alert').mockImplementation(() => {});

    const {getByTestId} = render(<App />);
    await waitFor(() => expect(getByTestId('new-game-button')).toBeTruthy());
    fireEvent.press(getByTestId('new-game-button'));

    // Wait for WaitingRoomScreen and SignalR handler registration
    await waitFor(() => expect(getByTestId('waiting-room-cancel')).toBeTruthy());
    await waitFor(() => expect(capturedGameStartedHandler).not.toBeNull());

    // User cancels — goes back to home
    fireEvent.press(getByTestId('waiting-room-cancel'));
    await waitFor(() => expect(getByTestId('new-game-button')).toBeTruthy());

    // Opponent joins — should show alert (not auto-navigate)
    fireGameStarted(fakeGameStarted);

    await waitFor(() =>
      expect(alertSpy).toHaveBeenCalledWith(
        'Oponente encontrado!',
        expect.any(String),
        expect.any(Array),
      ),
    );
  });
});
