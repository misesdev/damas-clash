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
        {/* Back */}
        <button
          onClick={onNavigateToLogin}
          style={{
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            fontSize: 13,
            color: 'var(--text-muted)',
            padding: 0,
            marginBottom: 28,
            display: 'flex',
            alignItems: 'center',
            gap: 6,
          }}
        >
          <span style={{ fontSize: 16 }}>←</span> Voltar
        </button>

        {/* Heading */}
        <div style={{ marginBottom: 32 }}>
          <h1 style={{ fontSize: 22, fontWeight: 800, color: 'var(--text)', marginBottom: 4 }}>
            Criar conta
          </h1>
          <p style={{ fontSize: 14, color: 'var(--text-muted)' }}>
            Preencha seus dados para começar.
          </p>
        </div>

        {/* Form */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
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
              {errors.general}
            </div>
          )}

          <Button label="Criar conta" onClick={handleRegister} loading={loading} />
        </div>

        {/* Divider + switch */}
        <div style={{ marginTop: 28, display: 'flex', flexDirection: 'column', gap: 16, alignItems: 'center' }}>
          <div style={{ width: '100%', height: 1, background: 'var(--border)' }} />
          <button
            onClick={onNavigateToLogin}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              fontSize: 14,
              color: 'var(--text-muted)',
            }}
          >
            Já tem conta?{' '}
            <span style={{ fontWeight: 700, color: 'var(--text)' }}>Entrar</span>
          </button>
        </div>
      </div>
    </div>
  );
}
