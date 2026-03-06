'use client';

import { useState } from 'react';
import { showMessage } from '../components/MessageBox';
import AnimatedLoader from '../components/AnimatedLoader';
import { ScreenHeader } from '../components/ScreenHeader';
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
    <div className="flex h-full flex-col" style={{ background: 'var(--bg)' }}>
      <ScreenHeader title="Aguardando oponente" onBack={onBack} />

      <div className="flex flex-1 flex-col items-center justify-center gap-8 px-6">
        <AnimatedLoader />

        <p className="text-center text-sm" style={{ color: 'var(--text-muted)' }}>
          Sua partida está pronta. Aguardando outro jogador entrar...
        </p>

        {/* Code card */}
        <div
          className="w-full max-w-xs rounded-2xl p-6 text-center"
          style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
        >
          <p className="mb-2 text-xs font-medium" style={{ color: 'var(--text-muted)' }}>
            Código da partida
          </p>
          <p className="mb-2 text-2xl font-bold tracking-widest text-white">{shortCode}</p>
          <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
            O jogo começa automaticamente quando alguém entrar
          </p>
        </div>
      </div>

      <div
        className="flex flex-col items-center gap-3 px-6 pb-8"
        style={{ borderTop: '1px solid var(--border)', paddingTop: '20px' }}
      >
        <button
          onClick={handleCancelGame}
          disabled={cancelling}
          className="flex items-center justify-center rounded-xl py-3 text-sm font-medium text-red-400 transition-opacity hover:opacity-80 disabled:opacity-50"
          style={{ border: '1px solid rgba(231,76,60,0.4)', width: '100%', maxWidth: '320px' }}
        >
          {cancelling ? (
            <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-red-400 border-t-transparent" />
          ) : (
            'Cancelar partida'
          )}
        </button>
        <p className="text-xs text-center" style={{ color: 'var(--text-muted)' }}>
          Você será notificado quando alguém entrar na partida
        </p>
      </div>
    </div>
  );
}
