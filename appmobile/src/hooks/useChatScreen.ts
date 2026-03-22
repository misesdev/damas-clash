import {useCallback, useEffect, useMemo, useRef, useState} from 'react';
import {FlatList, Keyboard, TextInput} from 'react-native';
import {
  HubConnectionBuilder,
  HttpTransportType,
} from '@microsoft/signalr';
import type {HubConnection} from '@microsoft/signalr';
import {useTranslation} from 'react-i18next';
import {BASE_URL} from '../api/client';
import {listPlayers} from '../api/players';
import {loadCachedMessages, saveCachedMessages} from '../storage/chatCache';
import {useAppContext} from '../context/AppContext';
import type {LoginResponse} from '../types/auth';

export interface MentionCandidate {
  playerId: string;
  username: string;
}

export interface ChatMessageReply {
  id: string;
  username: string;
  text: string;
}

export interface ChatMessage {
  id: string;
  playerId: string;
  username: string;
  avatarUrl?: string | null;
  text: string;
  sentAt: string;
  editedAt?: string | null;
  isDeleted?: boolean;
  replyTo?: ChatMessageReply | null;
}

export function useChatScreen(session: LoginResponse) {
  const {t} = useTranslation();
  const {handleNewChatMessage} = useAppContext();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [text, setText] = useState('');
  const [connected, setConnected] = useState(false);
  const [error, setError] = useState('');
  const [showMentions, setShowMentions] = useState(false);
  const [mentionQuery, setMentionQuery] = useState('');
  const [editingMessage, setEditingMessage] = useState<ChatMessage | null>(null);
  const [replyingTo, setReplyingTo] = useState<ChatMessage | null>(null);
  const [allPlayers, setAllPlayers] = useState<MentionCandidate[]>([]);

  const hubRef = useRef<HubConnection | null>(null);
  const listRef = useRef<FlatList<ChatMessage>>(null);
  const inputRef = useRef<TextInput>(null);

  // Always-current token ref: lets the hub use the refreshed token on
  // reconnect without recreating the connection.
  const sessionTokenRef = useRef(session.token);
  sessionTokenRef.current = session.token;

  // Load cached messages immediately so the UI is populated before the hub connects
  useEffect(() => {
    loadCachedMessages()
      .then(cached => {
        if (cached.length > 0) {setMessages(cached);}
      })
      .catch(() => {});
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Persist messages to cache whenever they change
  useEffect(() => {
    if (messages.length > 0) {
      saveCachedMessages(messages);
    }
  }, [messages]);

  // Fetch all players once for the mention autocomplete
  useEffect(() => {
    listPlayers(session.token)
      .then(players =>
        setAllPlayers(players.map(p => ({playerId: p.id, username: p.username}))),
      )
      .catch(() => {});
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    let hub: HubConnection;
    let active = true;

    (async () => {
      try {
        hub = new HubConnectionBuilder()
          .withUrl(`${BASE_URL}/hubs/chat`, {
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

        hub.on('ChatHistory', (history: ChatMessage[]) => {
          if (!active) {return;}
          setMessages(history);
          saveCachedMessages(history);
        });

        hub.on('NewMessage', (msg: ChatMessage) => {
          if (!active) {return;}
          setMessages(prev => [...prev, msg]);
          handleNewChatMessage();
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

        hub.onreconnected(() => {
          if (!active) {return;}
          setConnected(true);
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
    // The hub is created once per mount. The accessTokenFactory reads from
    // sessionTokenRef so a refreshed token is used automatically on reconnect.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSend = useCallback(() => {
    const trimmed = text.trim();
    if (!trimmed || !hubRef.current || !connected) {return;}

    if (editingMessage) {
      hubRef.current
        .invoke('EditMessage', editingMessage.id, trimmed)
        .catch(() => {});
      setEditingMessage(null);
    } else {
      hubRef.current
        .invoke('SendMessage', trimmed, replyingTo?.id ?? null)
        .catch(() => {});
      setReplyingTo(null);
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

  const handleStartReply = useCallback((msg: ChatMessage) => {
    setReplyingTo(msg);
    setTimeout(() => inputRef.current?.focus(), 50);
  }, []);

  const handleCancelReply = useCallback(() => {
    setReplyingTo(null);
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

    // Walk backward to find the last @ that is NOT inside a completed @[...] mention
    let anchorIdx = -1;
    for (let i = val.length - 1; i >= 0; i--) {
      if (val[i] !== '@') {continue;}
      const after = val.slice(i + 1);
      // If this @ opens a completed bracket mention (e.g. @[Name]) skip it
      if (after.startsWith('[') && after.includes(']')) {break;}
      anchorIdx = i;
      break;
    }

    if (anchorIdx === -1) {
      setShowMentions(false);
      setMentionQuery('');
      return;
    }

    const query = val.slice(anchorIdx + 1);
    if (query.length > 0) {
      setMentionQuery(query.toLowerCase());
      setShowMentions(true);
    } else {
      setShowMentions(false);
      setMentionQuery('');
    }
  }, []);

  const insertMention = useCallback(
    (username: string) => {
      const lastAt = text.lastIndexOf('@');
      const before = text.slice(0, lastAt);
      // Use bracket notation for usernames that contain spaces
      const mention = username.includes(' ') ? `@[${username}]` : `@${username}`;
      setText(`${before}${mention} `);
      setShowMentions(false);
      setMentionQuery('');
      inputRef.current?.focus();
    },
    [text],
  );

  const filteredPlayers = useMemo(
    () =>
      allPlayers
        .filter(
          p =>
            p.playerId !== session.playerId &&
            p.username.toLowerCase().includes(mentionQuery),
        )
        .slice(0, 5),
    [allPlayers, mentionQuery, session.playerId],
  );

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
    replyingTo,
    hubRef,
    listRef,
    inputRef,
    handleSend,
    handleStartEdit,
    handleCancelEdit,
    handleStartReply,
    handleCancelReply,
    handleDelete,
    handleTextChange,
    insertMention,
  };
}
