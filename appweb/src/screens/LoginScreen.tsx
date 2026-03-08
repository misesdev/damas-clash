'use client';

import { GoogleLogin } from '@react-oauth/google';
import { useState } from 'react';
import { googleAuth } from '../api/auth';
import { BoardMark } from '../components/BoardMark';
import { Button } from '../components/Button';
import { Input } from '../components/Input';
import { useLogin } from '../hooks/useLogin';
import type { LoginResponse } from '../types/auth';

interface LoginScreenProps {
  onCodeSent: (email: string) => void;
  onNavigateToRegister: () => void;
  onGoogleLogin: (data: LoginResponse) => void;
}

export function LoginScreen({ onCodeSent, onNavigateToRegister, onGoogleLogin }: LoginScreenProps) {
  const { identifier, setIdentifier, error, loading, handleLogin } = useLogin(onCodeSent);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [googleError, setGoogleError] = useState('');

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && identifier.trim()) handleLogin();
  };

  const handleGoogleSuccess = async (credential: string) => {
    setGoogleLoading(true);
    setGoogleError('');
    try {
      const data = await googleAuth(credential);
      onGoogleLogin(data);
    } catch {
      setGoogleError('Erro ao autenticar com Google. Tente novamente.');
    } finally {
      setGoogleLoading(false);
    }
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

        {/* Google login */}
        <div style={{ marginTop: 20, display: 'flex', flexDirection: 'column', gap: 10, alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, width: '100%' }}>
            <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
            <span style={{ fontSize: 12, color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>ou</span>
            <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
          </div>
          <div style={{ opacity: googleLoading ? 0.6 : 1, pointerEvents: googleLoading ? 'none' : 'auto' }}>
            <GoogleLogin
              onSuccess={credentialResponse => {
                if (credentialResponse.credential) handleGoogleSuccess(credentialResponse.credential);
              }}
              onError={() => setGoogleError('Erro ao autenticar com Google. Tente novamente.')}
              theme="filled_black"
              size="large"
              text="continue_with"
              locale="pt-BR"
            />
          </div>
          {googleError && (
            <div style={{ fontSize: 12, color: 'var(--danger)', textAlign: 'center' }}>{googleError}</div>
          )}
        </div>

        {/* Divider + switch */}
        <div style={{ marginTop: 20, display: 'flex', flexDirection: 'column', gap: 16, alignItems: 'center' }}>
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
          <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
            <a href="/termos" target="_blank" rel="noopener noreferrer" style={{ fontSize: 12, color: 'var(--text-faint)', textDecoration: 'none' }}>
              Termos de Uso
            </a>
            <span style={{ fontSize: 12, color: 'var(--text-faint)' }}>·</span>
            <a href="/privacidade" target="_blank" rel="noopener noreferrer" style={{ fontSize: 12, color: 'var(--text-faint)', textDecoration: 'none' }}>
              Privacidade
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
