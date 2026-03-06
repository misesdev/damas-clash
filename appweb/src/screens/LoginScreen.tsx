'use client';

import { BoardMark } from '../components/BoardMark';
import { Button } from '../components/Button';
import { Input } from '../components/Input';
import { useLogin } from '../hooks/useLogin';

interface LoginScreenProps {
  onCodeSent: (email: string) => void;
  onNavigateToRegister: () => void;
}

export function LoginScreen({ onCodeSent, onNavigateToRegister }: LoginScreenProps) {
  const { identifier, setIdentifier, error, loading, handleLogin } = useLogin(onCodeSent);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && identifier.trim()) handleLogin();
  };

  return (
    <div className="flex min-h-full flex-col items-center justify-center px-6 py-12">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="mb-10 flex flex-col items-center gap-3">
          <BoardMark size={48} />
          <h1 className="text-2xl font-bold tracking-widest text-white">DAMAS</h1>
        </div>

        {/* Form */}
        <div className="flex flex-col gap-4">
          <Input
            label="Usuário ou e-mail"
            value={identifier}
            onChange={setIdentifier}
            placeholder="seu_usuario ou seu@email.com"
            autoComplete="email"
          />

          {error && (
            <p className="rounded-xl px-4 py-3 text-sm text-red-400"
              style={{ background: 'rgba(231,76,60,0.1)', border: '1px solid rgba(231,76,60,0.3)' }}>
              {error}
            </p>
          )}

          <Button
            label="Continuar"
            onClick={handleLogin}
            loading={loading}
            disabled={!identifier.trim()}
          />
        </div>

        {/* Footer */}
        <div className="mt-8 flex flex-col items-center gap-4">
          <div className="h-px w-full" style={{ background: 'var(--border)' }} />
          <button
            onClick={onNavigateToRegister}
            className="text-sm transition-opacity hover:opacity-80"
            style={{ color: 'var(--text-muted)' }}
          >
            Não tem conta?{' '}
            <span className="font-semibold text-white">Criar conta</span>
          </button>
        </div>
      </div>
    </div>
  );
}
