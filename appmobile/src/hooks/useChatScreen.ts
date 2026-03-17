import {useCallback, useEffect, useMemo, useRef, useState} from 'react';
import {FlatList, Keyboard, TextInput} from 'react-native';
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
  editedAt?: string | null;
  isDeleted?: boolean;
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
  const [editingMessage, setEditingMessage] = useState<ChatMessage | null>(null);

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

        hub.on('MessageEdited', (updated: ChatMessage) => {
          if (!active) {return;}
          setMessages(prev =>
            prev.map(m => (m.id === updated.id ? updated : m)),
          );
        });

        hub.on('MessageDeleted', (messageId: string) => {
          if (!active) {return;}
          setMessages(prev =>
            prev.map(m =>
              m.id === messageId ? {...m, isDeleted: true, text: ''} : m,
            ),
          );
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

    if (editingMessage) {
      hubRef.current
        .invoke('EditMessage', editingMessage.id, trimmed)
        .catch(() => {});
      setEditingMessage(null);
    } else {
      hubRef.current.invoke('SendMessage', trimmed).catch(() => {});
    }

    setText('');
    setShowMentions(false);
  }, [text, connected, editingMessage]);

  const handleStartEdit = useCallback((msg: ChatMessage) => {
    setEditingMessage(msg);
    setText(msg.text);
    setTimeout(() => inputRef.current?.focus(), 50);
  }, []);

  const handleCancelEdit = useCallback(() => {
    setEditingMessage(null);
    setText('');
    Keyboard.dismiss();
  }, []);

  const handleDelete = useCallback(
    (messageId: string) => {
      if (!hubRef.current || !connected) {return;}
      hubRef.current.invoke('DeleteMessage', messageId).catch(() => {});
    },
    [connected],
  );

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
    editingMessage,
    hubRef,
    listRef,
    inputRef,
    handleSend,
    handleStartEdit,
    handleCancelEdit,
    handleDelete,
    handleTextChange,
    insertMention,
  };
}
