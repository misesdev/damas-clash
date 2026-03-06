'use client';

import { useState } from 'react';
import { showMessage } from '../components/MessageBox';
import AnimatedLoader from '../components/AnimatedLoader';
import type { GameResponse } from '../types/game';

interface Props {
  game: GameResponse;
  onBack: () => void;
  onCancelGame: () => Promise<void>;
}

export function WaitingRoomScreen({ game, onBack, onCancelGame }: Props) {
  const [cancelling, setCancelling] = useState(false);

  const shortCode = game.id.slice(0, 8).toUpperCase();

  const handleCancelGame = async () => {
    setCancelling(true);
    try {
      await onCancelGame();
    } catch {
      showMessage({
        title: 'Erro ao cancelar',
        message: 'Não foi possível cancelar a partida. Tente novamente.',
        type: 'error',
      });
    } finally {
      setCancelling(false);
    }
  };

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        background: 'var(--bg)',
        overflow: 'hidden',
      }}
    >
      {/* Top bar */}
      <header
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '12px 20px',
          borderBottom: '1px solid var(--border)',
          background: 'var(--surface)',
          flexShrink: 0,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <button
            onClick={onBack}
            style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: 20, lineHeight: 1, padding: 4 }}
          >
            ←
          </button>
          <span style={{ fontSize: 16, fontWeight: 700, color: 'var(--text)', letterSpacing: 1 }}>AGUARDANDO OPONENTE</span>
        </div>
      </header>

      {/* Content — centered */}
      <div
        style={{
          flex: 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: 32,
        }}
      >
        <div
          style={{
            width: '100%',
            maxWidth: 440,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 32,
          }}
        >
          <AnimatedLoader />

          <p style={{ textAlign: 'center', fontSize: 14, color: 'var(--text-muted)' }}>
            Sua partida está pronta. Aguardando outro jogador entrar...
          </p>

          {/* Code card */}
          <div
            style={{
              width: '100%',
              borderRadius: 20,
              padding: '28px 32px',
              textAlign: 'center',
              background: 'var(--surface)',
              border: '1px solid var(--border)',
            }}
          >
            <p style={{ marginBottom: 8, fontSize: 12, fontWeight: 600, color: 'var(--text-faint)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
              Código da partida
            </p>
            <p style={{ marginBottom: 12, fontSize: 32, fontWeight: 800, letterSpacing: '0.15em', color: 'var(--text)', fontVariantNumeric: 'tabular-nums' }}>
              {shortCode}
            </p>
            <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>
              O jogo começa automaticamente quando alguém entrar
            </p>
          </div>

          {/* Cancel */}
          <button
            onClick={handleCancelGame}
            disabled={cancelling}
            style={{
              background: 'transparent',
              color: 'var(--danger)',
              border: '1px solid rgba(255,69,58,0.4)',
              borderRadius: 12,
              padding: '11px 32px',
              fontSize: 14,
              fontWeight: 600,
              cursor: cancelling ? 'not-allowed' : 'pointer',
              opacity: cancelling ? 0.5 : 1,
              display: 'flex',
              alignItems: 'center',
              gap: 8,
            }}
          >
            {cancelling ? (
              <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
            ) : 'Cancelar partida'}
          </button>
        </div>
      </div>
    </div>
  );
}
