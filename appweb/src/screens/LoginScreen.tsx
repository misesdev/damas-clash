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
    <div
      style={{
        minHeight: '100%',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '40px 20px',
        background: 'var(--bg)',
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: 400,
          background: 'var(--surface)',
          border: '1px solid var(--border)',
          borderRadius: 20,
          padding: '40px 36px',
          boxShadow: '0 24px 80px rgba(0,0,0,0.5)',
        }}
      >
        {/* Logo */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10, marginBottom: 36 }}>
          <BoardMark size={40} />
          <span style={{ fontSize: 13, fontWeight: 800, letterSpacing: 4, color: 'var(--text)' }}>
           DAMAS CLASH 
          </span>
        </div>

        {/* Heading */}
        <div style={{ marginBottom: 28 }}>
          <h1 style={{ fontSize: 22, fontWeight: 800, color: 'var(--text)', marginBottom: 4 }}>
            Entrar
          </h1>
          <p style={{ fontSize: 14, color: 'var(--text-muted)' }}>
            Use seu usuário ou e-mail para continuar.
          </p>
        </div>

        {/* Form */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <Input
            label="Usuário ou e-mail"
            value={identifier}
            onChange={setIdentifier}
            placeholder="seu_usuario ou seu@email.com"
            autoComplete="email"
          />

          {error && (
            <div
              style={{
                padding: '11px 14px',
                borderRadius: 12,
                background: 'rgba(255,69,58,0.08)',
                border: '1px solid rgba(255,69,58,0.3)',
                color: 'var(--danger)',
                fontSize: 13,
              }}
            >
              {error}
            </div>
          )}

          <Button
            label="Continuar"
            onClick={handleLogin}
            loading={loading}
            disabled={!identifier.trim()}
          />
        </div>

        {/* Divider + switch */}
        <div style={{ marginTop: 28, display: 'flex', flexDirection: 'column', gap: 16, alignItems: 'center' }}>
          <div style={{ width: '100%', height: 1, background: 'var(--border)' }} />
          <button
            onClick={onNavigateToRegister}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              fontSize: 14,
              color: 'var(--text-muted)',
            }}
          >
            Não tem conta?{' '}
            <span style={{ fontWeight: 700, color: 'var(--text)' }}>Criar conta</span>
          </button>
        </div>
      </div>
    </div>
  );
}
