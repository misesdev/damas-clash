import {useCallback, useEffect, useMemo, useRef, useState} from 'react';
import {FlatList, Keyboard, TextInput} from 'react-native';
import {HubConnectionBuilder, HttpTransportType} from '@microsoft/signalr';
import type {HubConnection} from '@microsoft/signalr';
import {BASE_URL} from '../api/client';
import type {LoginResponse} from '../types/auth';
import type {GameResponse} from '../types/game';
import type {OnlinePlayerInfo} from '../types/player';
import type {ChatMessage} from './useChatScreen';

export type {ChatMessage};

export function useGameChat(session: LoginResponse, game: GameResponse) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [text, setText] = useState('');
  const [connected, setConnected] = useState(false);
  const [showMentions, setShowMentions] = useState(false);
  const [mentionQuery, setMentionQuery] = useState('');
  const hubRef = useRef<HubConnection | null>(null);
  const inputRef = useRef<TextInput>(null);
  const listRef = useRef<FlatList<ChatMessage>>(null);

  // Game participants for @mentions (excluding self)
  const participants: OnlinePlayerInfo[] = useMemo(() => [
    {
      playerId: game.playerBlackId ?? '',
      username: game.playerBlackUsername ?? '',
      status: 'InGame' as const,
      gameId: game.id,
    },
    {
      playerId: game.playerWhiteId ?? '',
      username: game.playerWhiteUsername ?? '',
      status: 'InGame' as const,
      gameId: game.id,
    },
  ].filter(p => p.playerId !== session.playerId && p.username.length > 0),
  [game.playerBlackId, game.playerBlackUsername, game.playerWhiteId, game.playerWhiteUsername, game.id, session.playerId]);

  // Always-current token ref: the hub's accessTokenFactory reads from here so
  // a refreshed token is used on reconnect without recreating the connection.
  const sessionTokenRef = useRef(session.token);
  sessionTokenRef.current = session.token;

  useEffect(() => {
    let hub: HubConnection;
    let active = true;

    (async () => {
      try {
        hub = new HubConnectionBuilder()
          .withUrl(`${BASE_URL}/hubs/game`, {
            transport: HttpTransportType.WebSockets,
            skipNegotiation: true,
            accessTokenFactory: () => sessionTokenRef.current,
          })
          .withAutomaticReconnect({
            nextRetryDelayInMilliseconds: ctx => {
              const delays = [0, 2000, 5000, 10000, 30000];
              return delays[Math.min(ctx.previousRetryCount, delays.length - 1)];
            },
          })
          .build();

        hub.on('GameMessage', (msg: ChatMessage) => {
          if (!active) {return;}
          setMessages(prev => [...prev, msg]);
        });

        hub.on('GameChatHistory', (history: ChatMessage[]) => {
          if (!active) {return;}
          setMessages(history);
        });

        hub.onreconnected(async () => {
          if (!active) {return;}
          try {
            await hub.invoke('JoinGameRoom', game.id);
            setConnected(true);
          } catch { /* silently ignore */ }
        });

        hub.onreconnecting(() => {
          if (!active) {return;}
          setConnected(false);
        });

        hub.onclose(() => {
          if (!active) {return;}
          setConnected(false);
        });

        await hub.start();
        if (!active) {hub.stop(); return;}
        await hub.invoke('JoinGameRoom', game.id);
        hubRef.current = hub;
        setConnected(true);
      } catch {
        // Connection failed silently
      }
    })();

    return () => {
      active = false;
      hub?.stop();
      hubRef.current = null;
    };
    // game.id triggers reconnect when switching games; session.token is read
    // from sessionTokenRef so it doesn't need to be a dependency.
  }, [game.id]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleSend = useCallback(() => {
    const trimmed = text.trim();
    if (!trimmed || !hubRef.current || !connected) {return;}
    hubRef.current.invoke('SendGameMessage', trimmed).catch(() => {});
    setText('');
    setShowMentions(false);
    inputRef.current?.blur();
    Keyboard.dismiss();
  }, [text, connected]);

  const handleTextChange = useCallback((val: string) => {
    setText(val);
    const lastWord = val.split(/\s/).pop() ?? '';
    if (lastWord.startsWith('@') && lastWord.length > 1) {
      setMentionQuery(lastWord.slice(1).toLowerCase());
      setShowMentions(true);
    } else {
      setShowMentions(false);
      setMentionQuery('');
    }
  }, []);

  const insertMention = useCallback(
    (username: string) => {
      const words = text.split(/(\s+)/);
      words[words.length - 1] = `@${username} `;
      setText(words.join(''));
      setShowMentions(false);
      setMentionQuery('');
      inputRef.current?.focus();
    },
    [text],
  );

  const filteredPlayers = participants
    .filter(p => p.username.toLowerCase().startsWith(mentionQuery))
    .slice(0, 5);

  const canSend = text.trim().length > 0 && connected;

  const reversedMessages = useMemo(() => [...messages].reverse(), [messages]);

  return {
    messages,
    reversedMessages,
    text,
    connected,
    showMentions,
    filteredPlayers,
    canSend,
    inputRef,
    listRef,
    handleSend,
    handleTextChange,
    insertMention,
  };
}
