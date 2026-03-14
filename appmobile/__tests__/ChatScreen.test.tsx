/**
 * ChatScreen — component tests.
 *
 * Tests cover:
 *  - Renders empty state before messages arrive
 *  - Shows "connecting" status, transitions to "online" after connection
 *  - Renders chat history received from hub
 *  - Renders new messages pushed in real-time
 *  - Own messages vs others layout distinction
 *  - Send button disabled when input empty or not connected
 *  - Send button enabled and invokes hub after connection
 *  - Pressing send clears the input
 *  - @mention suggestions appear when typing @query
 *  - Clicking a mention suggestion inserts it into the input
 *  - Mention suggestions exclude self
 *  - Mention suggestions filtered by query
 *  - Error banner shown on connection failure
 */

import React from 'react';
import {act, fireEvent, render, screen, waitFor} from '@testing-library/react-native';
import {ChatScreen} from '../src/screens/ChatScreen';
import type {LoginResponse} from '../src/types/auth';
import type {OnlinePlayerInfo} from '../src/types/player';
import type {ChatMessage} from '../src/hooks/useChatScreen';

// ─── SignalR mock ─────────────────────────────────────────────────────────────

jest.mock('@microsoft/signalr', () => ({
  HubConnectionBuilder: jest.fn(),
  HttpTransportType: {WebSockets: 4},
}));

// ─── safe-area-context mock ───────────────────────────────────────────────────

jest.mock('react-native-safe-area-context', () => {
  const {View} = require('react-native');
  return {
    SafeAreaView: ({children, ...props}: any) => <View {...props}>{children}</View>,
    useSafeAreaInsets: () => ({top: 0, bottom: 0, left: 0, right: 0}),
  };
});

// ─── Test fixtures ────────────────────────────────────────────────────────────

const fakeSession: LoginResponse = {
  token: 'test-token',
  refreshToken: 'refresh-tok',
  expiresAt: new Date(Date.now() + 15 * 60 * 1000).toISOString(),
  playerId: 'player-self',
  username: 'myuser',
  email: 'me@test.com',
  avatarUrl: null,
};

const ALICE: OnlinePlayerInfo = {
  playerId: 'player-alice',
  username: 'alice',
  avatarUrl: null,
  status: 'Online',
  gameId: null,
};

const BOB: OnlinePlayerInfo = {
  playerId: 'player-bob',
  username: 'bob',
  avatarUrl: null,
  status: 'Online',
  gameId: null,
};

const SELF_PLAYER: OnlinePlayerInfo = {
  playerId: 'player-self',
  username: 'myuser',
  avatarUrl: null,
  status: 'Online',
  gameId: null,
};

const MSG_FROM_ALICE: ChatMessage = {
  id: 'msg-1',
  playerId: 'player-alice',
  username: 'alice',
  avatarUrl: null,
  text: 'Hello everyone!',
  sentAt: new Date().toISOString(),
};

const MSG_FROM_SELF: ChatMessage = {
  id: 'msg-2',
  playerId: 'player-self',
  username: 'myuser',
  avatarUrl: null,
  text: 'Hey @alice!',
  sentAt: new Date().toISOString(),
};

// ─── Hub mock factory helpers ─────────────────────────────────────────────────

let capturedHandlers: Record<string, Function> = {};
let mockHub: {
  on: jest.Mock;
  start: jest.Mock;
  stop: jest.Mock;
  invoke: jest.Mock;
};

function setupMockHub(startResolves = true) {
  capturedHandlers = {};
  mockHub = {
    on: jest.fn((event: string, handler: Function) => {
      capturedHandlers[event] = handler;
    }),
    start: startResolves
      ? jest.fn().mockResolvedValue(undefined)
      : jest.fn().mockRejectedValue(new Error('Connection failed')),
    stop: jest.fn().mockResolvedValue(undefined),
    invoke: jest.fn().mockResolvedValue(undefined),
  };

  const signalr = require('@microsoft/signalr');
  signalr.HubConnectionBuilder.mockReturnValue({
    withUrl: jest.fn().mockReturnThis(),
    withAutomaticReconnect: jest.fn().mockReturnThis(),
    build: jest.fn().mockReturnValue(mockHub),
  });
}

// ─── Render helpers ───────────────────────────────────────────────────────────

function renderScreen(
  onlinePlayers: OnlinePlayerInfo[] = [],
  session: LoginResponse = fakeSession,
) {
  return render(
    <ChatScreen
      session={session}
      onlinePlayers={onlinePlayers}
      onBack={jest.fn()}
    />,
  );
}

async function renderConnected(onlinePlayers: OnlinePlayerInfo[] = []) {
  const result = renderScreen(onlinePlayers);
  await act(async () => {}); // flush hub.start() + setConnected(true)
  return result;
}

// ─── Tests ───────────────────────────────────────────────────────────────────

beforeEach(() => {
  setupMockHub();
});

describe('ChatScreen — initial state', () => {
  it('shows connecting status before hub connects', () => {
    renderScreen();
    expect(screen.getByTestId('chat-conn-status').props.children).toBe(
      'Conectando...',
    );
  });

  it('shows empty state when no messages received', async () => {
    await renderConnected();
    expect(screen.getByTestId('chat-empty')).toBeTruthy();
  });

  it('shows "online" status after hub connects', async () => {
    await renderConnected();
    expect(screen.getByTestId('chat-conn-status').props.children).toBe(
      'online',
    );
  });
});

describe('ChatScreen — error state', () => {
  it('shows error banner when connection fails', async () => {
    setupMockHub(false);
    renderScreen();
    await act(async () => {});
    expect(screen.getByTestId('chat-error-banner')).toBeTruthy();
    expect(screen.getByText('Erro ao conectar ao chat.')).toBeTruthy();
  });
});

describe('ChatScreen — messages', () => {
  it('renders history messages after ChatHistory event', async () => {
    await renderConnected();
    act(() => {
      capturedHandlers['ChatHistory']([MSG_FROM_ALICE, MSG_FROM_SELF]);
    });
    await waitFor(() => {
      expect(screen.getByTestId('chat-message-list')).toBeTruthy();
      expect(screen.getByText('Hello everyone!')).toBeTruthy();
      expect(screen.getByText(/Hey/)).toBeTruthy();
    });
  });

  it('appends new messages via NewMessage event', async () => {
    await renderConnected();
    act(() => {
      capturedHandlers['ChatHistory']([MSG_FROM_ALICE]);
    });
    act(() => {
      capturedHandlers['NewMessage'](MSG_FROM_SELF);
    });
    await waitFor(() => {
      expect(screen.getByText('Hello everyone!')).toBeTruthy();
      expect(screen.getByText(/Hey/)).toBeTruthy();
    });
  });

  it('renders message sender username for others', async () => {
    await renderConnected();
    act(() => {
      capturedHandlers['ChatHistory']([MSG_FROM_ALICE]);
    });
    await waitFor(() => {
      expect(screen.getByText('alice')).toBeTruthy();
    });
  });

  it('does not render own username in bubble', async () => {
    await renderConnected();
    act(() => {
      capturedHandlers['ChatHistory']([MSG_FROM_SELF]);
    });
    await waitFor(() => {
      expect(screen.queryByText('myuser')).toBeNull();
    });
  });
});

describe('ChatScreen — send button', () => {
  it('send button is disabled when input is empty', async () => {
    await renderConnected();
    expect(screen.getByTestId('chat-send-button').props.accessibilityState?.disabled).toBeTruthy();
  });

  it('send button is disabled when not connected', () => {
    // Don't wait for hub to connect
    renderScreen();
    fireEvent.changeText(screen.getByTestId('chat-input'), 'hello');
    const btn = screen.getByTestId('chat-send-button');
    expect(btn.props.accessibilityState?.disabled).toBeTruthy();
  });

  it('send button is enabled when connected and input has text', async () => {
    await renderConnected();
    fireEvent.changeText(screen.getByTestId('chat-input'), 'hello');
    const btn = screen.getByTestId('chat-send-button');
    expect(btn.props.accessibilityState?.disabled).toBeFalsy();
  });

  it('pressing send invokes hub SendMessage with the text', async () => {
    await renderConnected();
    fireEvent.changeText(screen.getByTestId('chat-input'), 'hello there');
    fireEvent.press(screen.getByTestId('chat-send-button'));
    expect(mockHub.invoke).toHaveBeenCalledWith('SendMessage', 'hello there');
  });

  it('clears input after sending', async () => {
    await renderConnected();
    fireEvent.changeText(screen.getByTestId('chat-input'), 'hello');
    fireEvent.press(screen.getByTestId('chat-send-button'));
    await waitFor(() => {
      expect(screen.getByTestId('chat-input').props.value).toBe('');
    });
  });

  it('does not invoke hub when input is only whitespace', async () => {
    await renderConnected();
    fireEvent.changeText(screen.getByTestId('chat-input'), '   ');
    fireEvent.press(screen.getByTestId('chat-send-button'));
    expect(mockHub.invoke).not.toHaveBeenCalled();
  });
});

describe('ChatScreen — @mention suggestions', () => {
  it('shows mention dropdown when typing @query', async () => {
    await renderConnected([ALICE, BOB]);
    fireEvent.changeText(screen.getByTestId('chat-input'), '@ali');
    await waitFor(() => {
      expect(screen.getByTestId('chat-mention-dropdown')).toBeTruthy();
      expect(screen.getByTestId('chat-mention-alice')).toBeTruthy();
    });
  });

  it('hides mention dropdown when text does not contain @query', async () => {
    await renderConnected([ALICE]);
    fireEvent.changeText(screen.getByTestId('chat-input'), '@ali');
    await waitFor(() =>
      expect(screen.queryByTestId('chat-mention-dropdown')).toBeTruthy(),
    );
    fireEvent.changeText(screen.getByTestId('chat-input'), 'hello');
    await waitFor(() =>
      expect(screen.queryByTestId('chat-mention-dropdown')).toBeNull(),
    );
  });

  it('filters suggestions by query prefix', async () => {
    await renderConnected([ALICE, BOB]);
    fireEvent.changeText(screen.getByTestId('chat-input'), '@bo');
    await waitFor(() => {
      expect(screen.queryByTestId('chat-mention-alice')).toBeNull();
      expect(screen.getByTestId('chat-mention-bob')).toBeTruthy();
    });
  });

  it('excludes self from mention suggestions', async () => {
    await renderConnected([ALICE, SELF_PLAYER]);
    fireEvent.changeText(screen.getByTestId('chat-input'), '@');
    // only alice and self match '@' but self (myuser) should be excluded
    await waitFor(() => {
      expect(screen.queryByTestId('chat-mention-myuser')).toBeNull();
    });
  });

  it('inserts mention into input when suggestion pressed', async () => {
    await renderConnected([ALICE]);
    fireEvent.changeText(screen.getByTestId('chat-input'), 'hey @al');
    await waitFor(() =>
      expect(screen.getByTestId('chat-mention-alice')).toBeTruthy(),
    );
    fireEvent.press(screen.getByTestId('chat-mention-alice'));
    await waitFor(() => {
      const inputValue = screen.getByTestId('chat-input').props.value as string;
      expect(inputValue).toContain('@alice');
    });
  });

  it('hides dropdown after inserting mention', async () => {
    await renderConnected([ALICE]);
    fireEvent.changeText(screen.getByTestId('chat-input'), '@al');
    await waitFor(() =>
      expect(screen.getByTestId('chat-mention-alice')).toBeTruthy(),
    );
    fireEvent.press(screen.getByTestId('chat-mention-alice'));
    await waitFor(() =>
      expect(screen.queryByTestId('chat-mention-dropdown')).toBeNull(),
    );
  });
});

describe('ChatScreen — online players badge', () => {
  it('shows online player count badge when players present', async () => {
    await renderConnected([ALICE, BOB]);
    expect(screen.getByText('2')).toBeTruthy();
  });

  it('hides badge when no online players', async () => {
    await renderConnected([]);
    expect(screen.queryByText(/^\d+$/)).toBeNull();
  });
});
