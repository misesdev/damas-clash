import React, {useCallback, useEffect, useRef, useState} from 'react';
import {
  FlatList,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {
  HubConnectionBuilder,
  HttpTransportType,
} from '@microsoft/signalr';
import type {HubConnection} from '@microsoft/signalr';
import {useTranslation} from 'react-i18next';
import {ScreenHeader} from '../components/ScreenHeader';
import {BASE_URL} from '../api/client';
import {colors} from '../theme/colors';
import type {LoginResponse} from '../types/auth';
import type {OnlinePlayerInfo} from '../types/player';

interface ChatMessage {
  id: string;
  playerId: string;
  username: string;
  avatarUrl?: string | null;
  text: string;
  sentAt: string;
}

interface Props {
  session: LoginResponse;
  onlinePlayers: OnlinePlayerInfo[];
  onBack: () => void;
}

// ─── Mention-aware text renderer ─────────────────────────────────────────────

function MentionText({
  text,
  myUsername,
  baseStyle,
}: {
  text: string;
  myUsername: string;
  baseStyle?: object;
}) {
  const parts = text.split(/(@\w+)/g);
  return (
    <Text style={[styles.msgText, baseStyle]}>
      {parts.map((part, i) => {
        if (part.startsWith('@')) {
          const mentioned = part.slice(1);
          const isMe = mentioned.toLowerCase() === myUsername.toLowerCase();
          return (
            <Text
              key={i}
              style={[styles.mention, isMe && styles.mentionMe]}>
              {part}
            </Text>
          );
        }
        return <Text key={i}>{part}</Text>;
      })}
    </Text>
  );
}

// ─── Avatar ───────────────────────────────────────────────────────────────────

function Avatar({
  username,
  size = 32,
}: {
  username: string;
  avatarUrl?: string | null;
  size?: number;
}) {
  const initial = username ? username[0].toUpperCase() : '?';
  return (
    <View style={[styles.avatar, {width: size, height: size, borderRadius: size / 2}]}>
      <Text style={[styles.avatarText, {fontSize: size * 0.44}]}>{initial}</Text>
    </View>
  );
}

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString([], {hour: '2-digit', minute: '2-digit'});
}

// ─── Main component ───────────────────────────────────────────────────────────

export function ChatScreen({session, onlinePlayers, onBack}: Props) {
  const {t} = useTranslation();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [text, setText] = useState('');
  const [connected, setConnected] = useState(false);
  const [error, setError] = useState('');
  const [showMentions, setShowMentions] = useState(false);
  const [mentionQuery, setMentionQuery] = useState('');
  const [inputHeight, setInputHeight] = useState(40);

  const hubRef = useRef<HubConnection | null>(null);
  const listRef = useRef<FlatList>(null);
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
        if (active) {setError(t('chat_error'));}
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
    setInputHeight(40);
  }, [text, connected]);

  const handleTextChange = (val: string) => {
    setText(val);
    const lastWord = val.split(/\s/).pop() ?? '';
    if (lastWord.startsWith('@') && lastWord.length > 1) {
      setMentionQuery(lastWord.slice(1).toLowerCase());
      setShowMentions(true);
    } else {
      setShowMentions(false);
      setMentionQuery('');
    }
  };

  const insertMention = (username: string) => {
    const words = text.split(/(\s+)/);
    const lastIdx = words.length - 1;
    words[lastIdx] = `@${username} `;
    setText(words.join(''));
    setShowMentions(false);
    setMentionQuery('');
    inputRef.current?.focus();
  };

  const filteredPlayers = onlinePlayers.filter(
    p =>
      p.playerId !== session.playerId &&
      p.username.toLowerCase().startsWith(mentionQuery),
  );

  const renderMessage = ({item}: {item: ChatMessage}) => {
    const isMe = item.playerId === session.playerId;
    return (
      <View style={[styles.msgRow, isMe && styles.msgRowMe]}>
        {!isMe && <Avatar username={item.username} avatarUrl={item.avatarUrl} />}
        <View style={[styles.msgBubble, isMe && styles.msgBubbleMe]}>
          {!isMe && <Text style={styles.msgUsername}>{item.username}</Text>}
          <MentionText text={item.text} myUsername={session.username} />
          <Text style={styles.msgTime}>{formatTime(item.sentAt)}</Text>
        </View>
        {isMe && <Avatar username={item.username} avatarUrl={item.avatarUrl} />}
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header with online count */}
      <View style={styles.header}>
        {/* <TouchableOpacity onPress={onBack} style={styles.backBtn} hitSlop={{top: 8, bottom: 8, left: 8, right: 8}}> */}
        {/*   <Text style={styles.backBtnText}>←</Text> */}
        {/* </TouchableOpacity> */}
        <Text style={styles.headerTitle}>{t('chat.title')}</Text>
        <View style={styles.headerRight}>
          {onlinePlayers.length > 0 && (
            <View style={styles.onlineBadge}>
              <View style={styles.onlineDot} />
              <Text style={styles.onlineCount}>{onlinePlayers.length}</Text>
            </View>
          )}
          <Text style={[styles.connStatus, connected && styles.connStatusOn]}>
            {connected ? 'online' : t('chat.connecting')}
          </Text>
        </View>
      </View>

      {error ? (
        <View style={styles.errorBanner}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      ) : null}

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        {messages.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>{t('chat_empty')}</Text>
          </View>
        ) : (
          <FlatList
            ref={listRef}
            data={messages}
            keyExtractor={item => item.id}
            renderItem={renderMessage}
            contentContainerStyle={styles.list}
            onContentSizeChange={() => listRef.current?.scrollToEnd({animated: false})}
            onLayout={() => listRef.current?.scrollToEnd({animated: false})}
            showsVerticalScrollIndicator={false}
          />
        )}

        {/* @mention suggestions */}
        {showMentions && filteredPlayers.length > 0 && (
          <View style={styles.mentionDropdown}>
            {filteredPlayers.slice(0, 5).map(p => (
              <TouchableOpacity
                key={p.playerId}
                style={styles.mentionItem}
                onPress={() => insertMention(p.username)}>
                <Text style={styles.mentionItemUsername}>@{p.username}</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* Input bar */}
        <View style={styles.inputBar}>
          {/* Styled overlay + transparent TextInput */}
          <View style={[styles.inputWrapper, {height: Math.max(40, Math.min(120, inputHeight))}]}>
            {/* Preview: MentionText renders behind */}
            <View style={[StyleSheet.absoluteFillObject, styles.inputPreviewContainer]} pointerEvents="none">
              {text ? (
                <MentionText
                  text={text}
                  myUsername={session.username}
                  baseStyle={styles.inputPreviewText}
                />
              ) : (
                <Text style={styles.inputPlaceholder}>{t('chat_inputPlaceholder')}</Text>
              )}
            </View>
            {/* Transparent TextInput on top — handles editing & cursor */}
            <TextInput
              ref={inputRef}
              style={styles.inputTransparent}
              value={text}
              onChangeText={handleTextChange}
              multiline
              maxLength={500}
              returnKeyType="send"
              blurOnSubmit
              onSubmitEditing={handleSend}
              selectionColor={colors.text}
              onContentSizeChange={e => {
                setInputHeight(e.nativeEvent.contentSize.height + 20);
              }}
            />
          </View>
          <TouchableOpacity
            style={[styles.sendBtn, (!text.trim() || !connected) && styles.sendBtnDisabled]}
            onPress={handleSend}
            disabled={!text.trim() || !connected}>
            <Text style={styles.sendBtnText}>↑</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {flex: 1, backgroundColor: colors.bg},
  flex: {flex: 1},

  // ─── Header ─────────────────────────────────────────────────────────────────
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    //borderBottomColor: colors.border,
    backgroundColor: colors.bg,
    gap: 12,
  },
  backBtn: {padding: 4},
  backBtnText: {fontSize: 20, color: colors.text},
  headerTitle: {flex: 1, fontSize: 15, fontWeight: '700', color: colors.text, letterSpacing: 0.3},
  headerRight: {flexDirection: 'row', alignItems: 'center', gap: 8},
  onlineBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  onlineDot: {width: 6, height: 6, borderRadius: 3, backgroundColor: '#4CAF50'},
  onlineCount: {fontSize: 12, fontWeight: '700', color: colors.textSecondary},
  connStatus: {fontSize: 11, color: colors.textMuted, fontWeight: '600'},
  connStatusOn: {color: '#4CAF50'},

  // ─── Error ──────────────────────────────────────────────────────────────────
  errorBanner: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  errorText: {color: colors.error, fontSize: 13, textAlign: 'center'},

  // ─── Empty ──────────────────────────────────────────────────────────────────
  emptyContainer: {flex: 1, alignItems: 'center', justifyContent: 'center'},
  emptyText: {color: colors.textMuted, fontSize: 14},

  // ─── Messages ───────────────────────────────────────────────────────────────
  list: {paddingHorizontal: 12, paddingVertical: 12, gap: 12},
  msgRow: {flexDirection: 'row', alignItems: 'flex-end', gap: 8},
  msgRowMe: {justifyContent: 'flex-end'},
  msgBubble: {
    maxWidth: '75%',
    backgroundColor: colors.surfaceRaised,
    borderRadius: 16,
    borderBottomLeftRadius: 4,
    paddingHorizontal: 12,
    paddingVertical: 8,
    gap: 2,
  },
  msgBubbleMe: {
    backgroundColor: colors.surface,
    borderBottomLeftRadius: 16,
    borderBottomRightRadius: 4,
  },
  msgUsername: {
    color: colors.textSecondary,
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.2,
    marginBottom: 2,
  },
  msgText: {color: colors.text, fontSize: 14, lineHeight: 20},
  msgTime: {color: colors.textMuted, fontSize: 10, alignSelf: 'flex-end', marginTop: 2},
  mention: {color: '#4A9EFF', fontWeight: '700'},
  mentionMe: {color: '#FFD700', fontWeight: '700'},
  avatar: {
    backgroundColor: colors.surfaceRaised,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {color: colors.text, fontWeight: '700'},

  // ─── @mention dropdown ───────────────────────────────────────────────────────
  mentionDropdown: {
    marginHorizontal: 12,
    marginBottom: 4,
    backgroundColor: colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
  },
  mentionItem: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  mentionItemUsername: {color: '#4A9EFF', fontSize: 14, fontWeight: '700'},

  // ─── Input ──────────────────────────────────────────────────────────────────
  inputBar: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
    backgroundColor: colors.bg,
  },
  inputWrapper: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
    position: 'relative',
  },
  inputPreviewContainer: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    justifyContent: 'flex-start',
  },
  inputPreviewText: {
    fontSize: 14,
    lineHeight: 20,
    color: colors.text,
  },
  inputPlaceholder: {
    fontSize: 14,
    lineHeight: 20,
    color: colors.textMuted,
  },
  inputTransparent: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 14,
    lineHeight: 20,
    color: 'transparent',
    // On Android, cursorColor keeps cursor visible even with transparent text.
    // On iOS, selectionColor affects the cursor tint.
  },
  sendBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.text,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendBtnDisabled: {opacity: 0.35},
  sendBtnText: {color: colors.bg, fontSize: 18, fontWeight: '700'},
});
