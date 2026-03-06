'use client';

import { Button } from '../components/Button';
import { Input } from '../components/Input';
import { useRegister } from '../hooks/useRegister';

interface RegisterScreenProps {
  onRegistered: (email: string) => void;
  onNavigateToLogin: () => void;
}

export function RegisterScreen({ onRegistered, onNavigateToLogin }: RegisterScreenProps) {
  const { username, setUsername, email, setEmail, errors, loading, handleRegister } =
    useRegister(onRegistered);

  return (
    <div className="flex min-h-full flex-col px-6 py-12">
      <div className="w-full max-w-sm mx-auto">
        <button
          onClick={onNavigateToLogin}
          className="mb-8 text-sm transition-opacity hover:opacity-80"
          style={{ color: 'var(--text-muted)' }}
        >
          ← Voltar
        </button>

        <div className="mb-8">
          <h2 className="text-2xl font-bold text-white">Criar conta</h2>
          <p className="mt-1 text-sm" style={{ color: 'var(--text-muted)' }}>
            Preencha seus dados para começar
          </p>
        </div>

        <div className="flex flex-col gap-4">
          <Input
            label="Nome de usuário"
            value={username}
            onChange={setUsername}
            placeholder="seu_usuario"
            autoComplete="username"
            error={errors.username}
          />
          <Input
            label="E-mail"
            value={email}
            onChange={setEmail}
            type="email"
            placeholder="seu@email.com"
            autoComplete="email"
            error={errors.email}
          />

          {errors.general && (
            <p className="rounded-xl px-4 py-3 text-sm text-red-400"
              style={{ background: 'rgba(231,76,60,0.1)', border: '1px solid rgba(231,76,60,0.3)' }}>
              {errors.general}
            </p>
          )}

          <Button label="Criar conta" onClick={handleRegister} loading={loading} />
        </div>

        <div className="mt-8 flex flex-col items-center gap-4">
          <div className="h-px w-full" style={{ background: 'var(--border)' }} />
          <button
            onClick={onNavigateToLogin}
            className="text-sm transition-opacity hover:opacity-80"
            style={{ color: 'var(--text-muted)' }}
          >
            Já tem conta? <span className="font-semibold text-white">Entrar</span>
          </button>
        </div>
      </div>
    </div>
  );
}
