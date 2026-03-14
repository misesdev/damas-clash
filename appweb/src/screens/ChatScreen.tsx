'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import {
  HubConnectionBuilder,
  HttpTransportType,
} from '@microsoft/signalr';
import type { HubConnection } from '@microsoft/signalr';
import { useTranslation } from 'react-i18next';
import { BASE_URL } from '../api/client';
import type { LoginResponse } from '../types/auth';
import type { OnlinePlayerInfo } from '../types/player';
import '../i18n';

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
  onClose: () => void;
}

// ─── Avatar ───────────────────────────────────────────────────────────────────

function Avatar({ username, avatarUrl, size = 28 }: { username: string; avatarUrl?: string | null; size?: number }) {
  const initial = username ? username[0].toUpperCase() : '?';
  if (avatarUrl) {
    return (
      <img
        src={avatarUrl}
        alt={username}
        style={{ width: size, height: size, borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }}
      />
    );
  }
  return (
    <div style={{
      width: size, height: size, borderRadius: '50%',
      background: 'var(--surface2)',
      border: '1px solid var(--border)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontSize: size * 0.38, fontWeight: 700, color: 'var(--text-muted)', flexShrink: 0,
    }}>
      {initial}
    </div>
  );
}

// ─── Mention-aware text renderer ─────────────────────────────────────────────

function MentionText({ text, myUsername, style }: { text: string; myUsername: string; style?: React.CSSProperties }) {
  const parts = text.split(/(@\w+)/g);
  return (
    <span style={style}>
      {parts.map((part, i) => {
        if (part.startsWith('@')) {
          const isMe = part.slice(1).toLowerCase() === myUsername.toLowerCase();
          return <span key={i} style={{ color: isMe ? '#FFD700' : '#60A5FA', fontWeight: 600 }}>{part}</span>;
        }
        return <span key={i}>{part}</span>;
      })}
    </span>
  );
}

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

// ─── Main component ───────────────────────────────────────────────────────────

export function ChatScreen({ session, onlinePlayers, onClose }: Props) {
  const { t } = useTranslation();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [text, setText] = useState('');
  const [connected, setConnected] = useState(false);
  const [error, setError] = useState('');
  const [showMentions, setShowMentions] = useState(false);
  const [mentionQuery, setMentionQuery] = useState('');

  const hubRef = useRef<HubConnection | null>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const previewRef = useRef<HTMLDivElement>(null);

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
        hub.on('ChatHistory', (h: ChatMessage[]) => { if (active) setMessages(h); });
        hub.on('NewMessage', (m: ChatMessage) => { if (active) setMessages(p => [...p, m]); });
        await hub.start();
        if (!active) { hub.stop(); return; }
        hubRef.current = hub;
        setConnected(true);
      } catch {
        if (active) setError(t('chat_error'));
      }
    })();
    return () => { active = false; hub?.stop(); hubRef.current = null; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session.token]);

  useEffect(() => {
    if (listRef.current) listRef.current.scrollTop = listRef.current.scrollHeight;
  }, [messages]);

  const resetInput = useCallback(() => {
    setText('');
    setShowMentions(false);
    if (textareaRef.current) {
      const p = textareaRef.current.parentElement!;
      p.style.height = '36px';
      textareaRef.current.style.height = '36px';
    }
    textareaRef.current?.focus();
  }, []);

  const handleSend = useCallback(() => {
    const trimmed = text.trim();
    if (!trimmed || !hubRef.current || !connected) return;
    hubRef.current.invoke('SendMessage', trimmed).catch(() => { });
    resetInput();
  }, [text, connected, resetInput]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); }
  };

  const handleTextChange = (val: string) => {
    setText(val);
    const last = val.split(/\s/).pop() ?? '';
    if (last.startsWith('@') && last.length > 1) {
      setMentionQuery(last.slice(1).toLowerCase());
      setShowMentions(true);
    } else {
      setShowMentions(false);
      setMentionQuery('');
    }
  };

  const insertMention = (username: string) => {
    const words = text.split(/(\s+)/);
    words[words.length - 1] = `@${username} `;
    setText(words.join(''));
    setShowMentions(false);
    setMentionQuery('');
    textareaRef.current?.focus();
  };

  const filteredPlayers = onlinePlayers.filter(
    p => p.playerId !== session.playerId && p.username.toLowerCase().startsWith(mentionQuery),
  );

  const handleInput = (e: React.FormEvent<HTMLTextAreaElement>) => {
    const el = e.currentTarget;
    el.style.height = 'auto';
    el.style.height = Math.min(el.scrollHeight, 100) + 'px';
    const p = el.parentElement!;
    p.style.height = el.style.height;
    if (previewRef.current) previewRef.current.style.height = el.style.height;
  };

  const inputPad: React.CSSProperties = { padding: '8px 14px', fontSize: 13.5, lineHeight: '19px', fontFamily: 'inherit' };

  return (
    <>
      {/* Slide-in animation */}
      <style>{`
        @keyframes chatSlideIn {
          from { transform: translateX(100%); opacity: 0; }
          to   { transform: translateX(0);    opacity: 1; }
        }
        .chat-panel { animation: chatSlideIn 0.22s cubic-bezier(.25,.8,.25,1) both; }
        .chat-msg-bubble:hover .chat-msg-time { opacity: 1; }
      `}</style>

      <div
        className="chat-panel"
        style={{
          display: 'flex',
          flexDirection: 'column',
          height: '100%',
          background: 'var(--bg)',
          overflow: 'hidden',
        }}
      >
        {/* ── Header ── */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          padding: '0 20px',
          height: 52,
          borderBottom: '1px solid var(--border)',
          flexShrink: 0,
          gap: 10,
        }}>
          <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--text)', letterSpacing: 0.3, flex: 1 }}>
            {t('chat_title')}
          </span>

          {onlinePlayers.length > 0 && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
              <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#4ade80', display: 'inline-block' }} />
              <span style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 600 }}>
                {onlinePlayers.length}
              </span>
            </div>
          )}

          {!error && (
            <span style={{ fontSize: 11, color: connected ? '#4ade80' : 'var(--text-faint)', fontWeight: 500 }}>
              {connected ? t('chat_connected') : t('chat_connecting')}
            </span>
          )}

          <button
            onClick={onClose}
            title="Fechar"
            style={{
              background: 'none', border: 'none',
              color: 'var(--text-muted)', cursor: 'pointer',
              fontSize: 18, lineHeight: 1, padding: 4, borderRadius: 6,
              transition: 'color 0.15s',
            }}
            onMouseOver={e => (e.currentTarget.style.color = 'var(--text)')}
            onMouseOut={e => (e.currentTarget.style.color = 'var(--text-muted)')}
          >
            ✕
          </button>
        </div>

        {error && (
          <div style={{ padding: '6px 16px', background: 'var(--danger-bg)', color: 'var(--danger)', fontSize: 12, flexShrink: 0 }}>
            {error}
          </div>
        )}

        {/* ── Messages ── */}
        <div
          ref={listRef}
          style={{
            flex: 1,
            overflowY: 'auto',
            padding: '16px 14px',
            display: 'flex',
            flexDirection: 'column',
            gap: 2,
          }}
        >
          {messages.length === 0 ? (
            <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', paddingBottom: 40 }}>
              <p style={{ color: 'var(--text-faint)', fontSize: 13 }}>{t('chat_empty')}</p>
            </div>
          ) : (
            messages.map((msg, idx) => {
              const isMe = msg.playerId === session.playerId;
              const prevMsg = idx > 0 ? messages[idx - 1] : null;
              const isFirstInGroup = !prevMsg || prevMsg.playerId !== msg.playerId;
              const isLastInGroup = idx === messages.length - 1 || messages[idx + 1].playerId !== msg.playerId;

              return (
                <div
                  key={msg.id}
                  style={{
                    display: 'flex',
                    flexDirection: isMe ? 'row-reverse' : 'row',
                    alignItems: 'flex-end',
                    gap: 8,
                    marginTop: isFirstInGroup ? 10 : 2,
                  }}
                >
                  {/* Avatar — only on last message in group */}
                  {!isMe && (
                    <div style={{ width: 28, flexShrink: 0 }}>
                      {isLastInGroup && <Avatar username={msg.username} avatarUrl={msg.avatarUrl} size={28} />}
                    </div>
                  )}

                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: isMe ? 'flex-end' : 'flex-start', maxWidth: '76%', gap: 1 }}>
                    {/* Username — only on first message in group, for others */}
                    {!isMe && isFirstInGroup && (
                      <span style={{ fontSize: 10.5, fontWeight: 700, color: 'var(--text-muted)', paddingLeft: 12, letterSpacing: 0.2 }}>
                        {msg.username}
                      </span>
                    )}

                    <div
                      className="chat-msg-bubble"
                      style={{
                        position: 'relative',
                        padding: '7px 12px',
                        borderRadius: 18,
                        ...(isMe ? {
                          background: 'var(--text)',
                          color: 'var(--bg)',
                          borderBottomRightRadius: isLastInGroup ? 5 : 18,
                        } : {
                          background: 'var(--surface)',
                          color: 'var(--text)',
                          borderBottomLeftRadius: isLastInGroup ? 5 : 18,
                        }),
                      }}
                    >
                      <span style={{ fontSize: 13.5, lineHeight: 1.45, wordBreak: 'break-word', display: 'block' }}>
                        <MentionText text={msg.text} myUsername={session.username} />
                      </span>
                    </div>

                    {/* Timestamp — only on last in group */}
                    {isLastInGroup && (
                      <span style={{ fontSize: 10, color: 'var(--text-faint)', paddingInline: 4, marginTop: 1 }}>
                        {formatTime(msg.sentAt)}
                      </span>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* ── @mention suggestions ── */}
        {showMentions && filteredPlayers.length > 0 && (
          <div style={{
            marginInline: 12,
            marginBottom: 6,
            background: 'var(--surface)',
            border: '1px solid var(--border)',
            borderRadius: 10,
            overflow: 'hidden',
            flexShrink: 0,
          }}>
            {filteredPlayers.slice(0, 5).map(p => (
              <button
                key={p.playerId}
                onMouseDown={e => { e.preventDefault(); insertMention(p.username); }}
                style={{
                  display: 'flex', alignItems: 'center', gap: 8,
                  width: '100%', padding: '7px 14px',
                  background: 'none', border: 'none',
                  borderBottom: '1px solid var(--border)',
                  cursor: 'pointer', textAlign: 'left',
                }}
                onMouseOver={e => (e.currentTarget.style.background = 'var(--surface2)')}
                onMouseOut={e => (e.currentTarget.style.background = 'none')}
              >
                <span style={{ fontSize: 13, fontWeight: 700, color: '#60A5FA' }}>@{p.username}</span>
              </button>
            ))}
          </div>
        )}

        {/* ── Input bar ── */}
        <div style={{
          display: 'flex',
          alignItems: 'flex-end',
          gap: 8,
          padding: '10px 12px 12px',
          borderTop: '1px solid var(--border)',
          flexShrink: 0,
        }}>
          {/* Input wrapper: preview layer + transparent textarea */}
          <div style={{
            flex: 1,
            position: 'relative',
            height: 36,
            maxHeight: 100,
            background: 'var(--surface)',
            border: '1px solid var(--border)',
            borderRadius: 18,
            overflow: 'hidden',
            transition: 'border-color 0.15s',
          }}
            onFocusCapture={e => (e.currentTarget.style.borderColor = 'var(--text-muted)')}
            onBlurCapture={e => (e.currentTarget.style.borderColor = 'var(--border)')}
          >
            {/* Preview renders styled @mentions, sits behind the textarea */}
            <div
              ref={previewRef}
              aria-hidden="true"
              style={{
                ...inputPad,
                position: 'absolute',
                inset: 0,
                height: 36,
                whiteSpace: 'pre-wrap',
                wordBreak: 'break-word',
                color: 'var(--text)',
                overflow: 'hidden',
                pointerEvents: 'none',
                boxSizing: 'border-box',
              }}
            >
              {text
                ? <MentionText text={text} myUsername={session.username} />
                : <span style={{ color: 'var(--text-faint)' }}>{t('chat_inputPlaceholder')}</span>
              }
              {'\u200b'}
            </div>

            {/* Transparent textarea — handles editing, cursor stays visible via caretColor */}
            <textarea
              ref={textareaRef}
              value={text}
              onChange={e => handleTextChange(e.target.value)}
              onKeyDown={handleKeyDown}
              onInput={handleInput}
              onScroll={e => { if (previewRef.current) previewRef.current.scrollTop = e.currentTarget.scrollTop; }}
              maxLength={500}
              rows={1}
              style={{
                ...inputPad,
                display: 'block',
                width: '100%',
                height: 36,
                maxHeight: 100,
                background: 'transparent',
                border: 'none',
                color: 'transparent',
                caretColor: 'var(--text)',
                outline: 'none',
                resize: 'none',
                overflowY: 'auto',
                position: 'relative',
                zIndex: 1,
                boxSizing: 'border-box',
              }}
            />
          </div>

          <button
            onClick={handleSend}
            disabled={!text.trim() || !connected}
            style={{
              width: 36, height: 36, borderRadius: '50%',
              background: text.trim() && connected ? 'var(--text)' : 'var(--surface)',
              color: text.trim() && connected ? 'var(--bg)' : 'var(--text-faint)',
              border: '1px solid var(--border)',
              fontSize: 15, fontWeight: 700,
              cursor: text.trim() && connected ? 'pointer' : 'default',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              flexShrink: 0,
              transition: 'background 0.15s, color 0.15s',
            }}
          >
            ↑
          </button>
        </div>
      </div>
    </>
  );
}
