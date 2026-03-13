'use client';

import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import '../i18n';

interface Props {
  walletBalance: number | null;
  creating: boolean;
  onConfirm: (betAmountSats: number) => void;
  onClose: () => void;
}

type GameType = 'friendly' | 'bet';

export function NewGameModal({ walletBalance, creating, onConfirm, onClose }: Props) {
  const { t } = useTranslation();
  const [gameType, setGameType] = useState<GameType>('friendly');
  const [betAmount, setBetAmount] = useState('');
  const [error, setError] = useState('');

  const handleConfirm = () => {
    if (gameType === 'friendly') {
      onConfirm(0);
      return;
    }
    const amount = parseInt(betAmount, 10);
    if (!amount || amount <= 0) {
      setError(t('newGame_betAmountLabel') + ': valor inválido');
      return;
    }
    if (walletBalance !== null && amount > walletBalance) {
      setError(t('newGame_insufficientBalance'));
      return;
    }
    onConfirm(amount);
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 1000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '0 16px',
      }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      {/* Backdrop */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: 'rgba(0,0,0,0.7)',
          backdropFilter: 'blur(4px)',
        }}
      />

      {/* Card */}
      <div
        style={{
          position: 'relative',
          width: '100%',
          maxWidth: 400,
          background: 'var(--surface)',
          border: '1px solid var(--border)',
          borderRadius: 24,
          padding: '28px 24px',
          display: 'flex',
          flexDirection: 'column',
          gap: 20,
        }}
      >
        <h2 style={{ margin: 0, fontSize: 18, fontWeight: 800, color: 'var(--text)' }}>
          {t('newGame_title')}
        </h2>

        {/* Type selector */}
        <div style={{ display: 'flex', gap: 10 }}>
          <GameTypeCard
            selected={gameType === 'friendly'}
            title={t('newGame_friendly')}
            desc={t('newGame_friendlyDesc')}
            icon="🤝"
            onClick={() => { setGameType('friendly'); setError(''); }}
          />
          <GameTypeCard
            selected={gameType === 'bet'}
            title={t('newGame_bet')}
            desc={t('newGame_betDesc')}
            icon="⚡"
            onClick={() => { setGameType('bet'); setError(''); }}
          />
        </div>

        {/* Bet amount input */}
        {gameType === 'bet' && (
          <div>
            <p
              style={{
                fontSize: 11,
                fontWeight: 700,
                color: 'var(--text-faint)',
                textTransform: 'uppercase',
                letterSpacing: '0.08em',
                margin: '0 0 8px',
              }}
            >
              {t('newGame_betAmountLabel')}
            </p>
            <input
              type="number"
              value={betAmount}
              onChange={e => { setBetAmount(e.target.value); setError(''); }}
              placeholder={t('newGame_betAmountPlaceholder')}
              min={1}
              max={walletBalance ?? undefined}
              autoFocus
              style={{
                width: '100%',
                boxSizing: 'border-box',
                padding: '11px 14px',
                borderRadius: 12,
                border: '1px solid var(--border)',
                background: 'var(--surface2)',
                color: 'var(--text)',
                fontSize: 15,
                fontWeight: 600,
                outline: 'none',
              }}
            />
            {walletBalance !== null && (
              <p style={{ fontSize: 12, color: 'var(--text-faint)', margin: '6px 0 0' }}>
                ⚡ {walletBalance.toLocaleString()} sats disponíveis
              </p>
            )}
          </div>
        )}

        {error && (
          <p style={{ fontSize: 13, color: 'var(--danger)', margin: 0 }}>{error}</p>
        )}

        {/* Actions */}
        <div style={{ display: 'flex', gap: 10 }}>
          <button
            onClick={onClose}
            disabled={creating}
            style={{
              flex: 1,
              padding: '13px 0',
              borderRadius: 12,
              border: '1px solid var(--border)',
              background: 'var(--surface2)',
              color: 'var(--text-muted)',
              fontSize: 14,
              fontWeight: 600,
              cursor: 'pointer',
              opacity: creating ? 0.5 : 1,
            }}
          >
            {t('newGame_cancel')}
          </button>
          <button
            onClick={handleConfirm}
            disabled={creating}
            style={{
              flex: 2,
              padding: '13px 0',
              borderRadius: 12,
              border: 'none',
              background: 'var(--text)',
              color: 'var(--bg)',
              fontSize: 14,
              fontWeight: 700,
              cursor: creating ? 'not-allowed' : 'pointer',
              opacity: creating ? 0.5 : 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
            }}
          >
            {creating ? (
              <>
                <span
                  style={{
                    display: 'inline-block',
                    width: 14,
                    height: 14,
                    borderRadius: '50%',
                    border: '2px solid var(--bg)',
                    borderTopColor: 'transparent',
                    animation: 'spin 0.7s linear infinite',
                  }}
                />
                {t('newGame_creating')}
              </>
            ) : t('newGame_create')}
          </button>
        </div>
      </div>
    </div>
  );
}

function GameTypeCard({
  selected,
  title,
  desc,
  icon,
  onClick,
}: {
  selected: boolean;
  title: string;
  desc: string;
  icon: string;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      style={{
        flex: 1,
        padding: '16px 12px',
        borderRadius: 16,
        border: selected ? '2px solid var(--text)' : '2px solid var(--border)',
        background: selected ? 'var(--surface2)' : 'transparent',
        cursor: 'pointer',
        textAlign: 'left',
        transition: 'border-color 0.15s, background 0.15s',
        display: 'flex',
        flexDirection: 'column',
        gap: 6,
      }}
    >
      <span style={{ fontSize: 24 }}>{icon}</span>
      <p style={{ margin: 0, fontSize: 14, fontWeight: 700, color: 'var(--text)' }}>{title}</p>
      <p style={{ margin: 0, fontSize: 12, color: 'var(--text-muted)', lineHeight: 1.4 }}>{desc}</p>
    </button>
  );
}
