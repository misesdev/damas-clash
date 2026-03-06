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

  return (
    <MessageBoxContext.Provider value={{ show }}>
      {children}
      {current && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
          <div
            className="w-full max-w-sm rounded-2xl p-6"
            style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
          >
            <h3 className="mb-2 text-lg font-semibold text-white">{current.title}</h3>
            <p className="mb-6 text-sm" style={{ color: 'var(--text-muted)' }}>
              {current.message}
            </p>
            <div className="flex gap-3">
              {(current.actions ?? [{ label: 'OK' }]).map((action, i) => (
                <button
                  key={i}
                  onClick={() => handleAction(action)}
                  className="flex-1 rounded-xl py-3 text-sm font-medium transition-opacity hover:opacity-80"
                  style={{
                    background: action.primary
                      ? 'var(--text)'
                      : action.danger
                      ? 'transparent'
                      : 'var(--surface2)',
                    color: action.primary
                      ? 'var(--bg)'
                      : action.danger
                      ? 'var(--danger)'
                      : 'var(--text)',
                    border: action.danger ? '1px solid var(--danger)' : 'none',
                  }}
                >
                  {action.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </MessageBoxContext.Provider>
  );
}
