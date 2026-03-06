'use client';

import { createContext, useCallback, useContext, useState } from 'react';

interface Action {
  label: string;
  primary?: boolean;
  danger?: boolean;
  onPress?: () => void;
}

interface MessageOptions {
  title: string;
  message: string;
  type: 'info' | 'error' | 'confirm';
  actions?: Action[];
}

interface MessageBoxContextValue {
  show: (opts: MessageOptions) => void;
}

const MessageBoxContext = createContext<MessageBoxContextValue>({
  show: () => {},
});

export function useMessageBox() {
  return useContext(MessageBoxContext);
}

// Singleton reference for imperative usage (like mobile's showMessage)
let _show: ((opts: MessageOptions) => void) | null = null;

export function showMessage(opts: MessageOptions) {
  _show?.(opts);
}

const TYPE_ICON: Record<MessageOptions['type'], string> = {
  info:    '◆',
  error:   '✕',
  confirm: '◇',
};

const TYPE_ICON_COLOR: Record<MessageOptions['type'], string> = {
  info:    'var(--text-muted)',
  error:   'var(--danger)',
  confirm: 'var(--text-muted)',
};

export function MessageBoxProvider({ children }: { children: React.ReactNode }) {
  const [current, setCurrent] = useState<MessageOptions | null>(null);

  const show = useCallback((opts: MessageOptions) => {
    setCurrent(opts);
  }, []);

  _show = show;

  const dismiss = () => setCurrent(null);

  const handleAction = (action: Action) => {
    dismiss();
    action.onPress?.();
  };

  const actions = current?.actions ?? [{ label: 'OK', primary: true }];

  return (
    <MessageBoxContext.Provider value={{ show }}>
      {children}
      {current && (
        <div
          className="modal-backdrop fixed inset-0 z-50 flex items-end justify-center p-4 md:items-center"
          style={{ background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(6px)' }}
          onClick={dismiss}
        >
          <div
            className="modal-panel w-full"
            style={{ maxWidth: 400 }}
            onClick={e => e.stopPropagation()}
          >
            {/* Card */}
            <div
              style={{
                background: 'var(--surface)',
                border: '1px solid var(--border)',
                borderRadius: 24,
                overflow: 'hidden',
              }}
            >
              {/* Body */}
              <div style={{ padding: '28px 28px 24px' }}>
                {/* Icon + title row */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                  <span style={{ fontSize: 13, color: TYPE_ICON_COLOR[current.type], fontWeight: 700 }}>
                    {TYPE_ICON[current.type]}
                  </span>
                  <h3 style={{ fontSize: 16, fontWeight: 700, color: 'var(--text)', margin: 0 }}>
                    {current.title}
                  </h3>
                </div>
                <p style={{ fontSize: 14, color: 'var(--text-muted)', lineHeight: 1.5, margin: 0 }}>
                  {current.message}
                </p>
              </div>

              {/* Divider */}
              <div style={{ height: 1, background: 'var(--border)' }} />

              {/* Actions */}
              <div
                style={{
                  display: 'flex',
                  flexDirection: actions.length > 2 ? 'column' : 'row',
                  gap: 0,
                }}
              >
                {actions.map((action, i) => {
                  const isLast = i === actions.length - 1;
                  return (
                    <button
                      key={i}
                      onClick={() => handleAction(action)}
                      style={{
                        flex: 1,
                        padding: '15px 20px',
                        fontSize: 14,
                        fontWeight: action.primary ? 700 : 500,
                        cursor: 'pointer',
                        background: 'transparent',
                        border: 'none',
                        borderRight: (!isLast && actions.length <= 2) ? '1px solid var(--border)' : 'none',
                        borderTop: (actions.length > 2 && i > 0) ? '1px solid var(--border)' : 'none',
                        color: action.danger
                          ? 'var(--danger)'
                          : action.primary
                          ? 'var(--text)'
                          : 'var(--text-muted)',
                        transition: 'background 0.12s',
                      }}
                      onMouseEnter={e => {
                        (e.currentTarget as HTMLButtonElement).style.background = 'var(--surface2)';
                      }}
                      onMouseLeave={e => {
                        (e.currentTarget as HTMLButtonElement).style.background = 'transparent';
                      }}
                    >
                      {action.label}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}
    </MessageBoxContext.Provider>
  );
}
