import {useCallback, useEffect, useMemo, useRef, useState} from 'react';
import {FlatList, TextInput} from 'react-native';
import {
  HubConnectionBuilder,
  HttpTransportType,
} from '@microsoft/signalr';
import type {HubConnection} from '@microsoft/signalr';
import {useTranslation} from 'react-i18next';
import {BASE_URL} from '../api/client';
import type {LoginResponse} from '../types/auth';
import type {OnlinePlayerInfo} from '../types/player';

export interface ChatMessage {
  id: string;
  playerId: string;
  username: string;
  avatarUrl?: string | null;
  text: string;
  sentAt: string;
}

export function useChatScreen(
  session: LoginResponse,
  onlinePlayers: OnlinePlayerInfo[],
) {
  const {t} = useTranslation();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [text, setText] = useState('');
  const [connected, setConnected] = useState(false);
  const [error, setError] = useState('');
  const [showMentions, setShowMentions] = useState(false);
  const [mentionQuery, setMentionQuery] = useState('');

  const hubRef = useRef<HubConnection | null>(null);
  const listRef = useRef<FlatList<ChatMessage>>(null);
  const inputRef = useRef<TextInput>(null);

  useEffect(() => {
    let hub: HubConnection;
    let active = true;

    (async () => {
      try {
        hub = new HubConnectionBuilder()
          .withUrl(`${BASE_URL}/hubs/chat`, {
            transport: HttpTransportType.WebSockets,
            skipNegotiation: true,
            accessTokenFactory: () => session.token,
          })
          .withAutomaticReconnect()
          .build();

        hub.on('ChatHistory', (history: ChatMessage[]) => {
          if (!active) {return;}
          setMessages(history);
        });

        hub.on('NewMessage', (msg: ChatMessage) => {
          if (!active) {return;}
          setMessages(prev => [...prev, msg]);
        });

        await hub.start();
        if (!active) {hub.stop(); return;}
        hubRef.current = hub;
        setConnected(true);
      } catch {
        if (active) {setError(t('chat.error'));}
      }
    })();

    return () => {
      active = false;
      hub?.stop();
      hubRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session.token]);

  const handleSend = useCallback(() => {
    const trimmed = text.trim();
    if (!trimmed || !hubRef.current || !connected) {return;}
    hubRef.current.invoke('SendMessage', trimmed).catch(() => {});
    setText('');
    setShowMentions(false);
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

  const filteredPlayers = onlinePlayers
    .filter(
      p =>
        p.playerId !== session.playerId &&
        p.username.toLowerCase().startsWith(mentionQuery),
    )
    .slice(0, 5);

  const canSend = text.trim().length > 0 && connected;

  // FlatList with `inverted` renders index-0 at the bottom, so newest messages
  // always appear at the bottom without any manual scrollToEnd calls.
  const reversedMessages = useMemo(() => [...messages].reverse(), [messages]);

  return {
    messages,
    reversedMessages,
    text,
    connected,
    error,
    showMentions,
    filteredPlayers,
    canSend,
    hubRef,
    listRef,
    inputRef,
    handleSend,
    handleTextChange,
    insertMention,
  };
}
