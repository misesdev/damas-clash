'use client';

import { GoogleLogin } from '@react-oauth/google';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { googleAuth } from '../api/auth';
import { BoardMark } from '../components/BoardMark';
import { Button } from '../components/Button';
import { Input } from '../components/Input';
import { useLogin } from '../hooks/useLogin';
import type { LoginResponse } from '../types/auth';
import '../i18n';

interface LoginScreenProps {
  onCodeSent: (email: string) => void;
  onNavigateToRegister: () => void;
  onGoogleLogin: (data: LoginResponse) => void;
  onNavigateToNostr: () => void;
}

export function LoginScreen({ onCodeSent, onNavigateToRegister, onGoogleLogin, onNavigateToNostr }: LoginScreenProps) {
  const { t, i18n } = useTranslation();
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
      setGoogleError(t('login_googleError'));
    } finally {
      setGoogleLoading(false);
    }
  };

  const googleLocale = i18n.language === 'pt' ? 'pt-BR' : 'en';

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
            {t('login_title')}
          </h1>
          <p style={{ fontSize: 14, color: 'var(--text-muted)' }}>
            {t('login_subtitle')}
          </p>
        </div>

        {/* Form */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }} onKeyDown={handleKeyDown}>
          <Input
            label={t('login_label')}
            value={identifier}
            onChange={setIdentifier}
            placeholder={t('login_placeholder')}
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
            label={t('login_continue')}
            onClick={handleLogin}
            loading={loading}
            disabled={!identifier.trim()}
          />
        </div>

        {/* Google login */}
        <div style={{ marginTop: 20, display: 'flex', flexDirection: 'column', gap: 10, alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, width: '100%' }}>
            <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
            <span style={{ fontSize: 12, color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>{t('login_or')}</span>
            <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
          </div>

          {/* Nostr login */}
          <div style={{ marginTop: 8, display: 'flex', flexDirection: 'column', gap: 18 }}>
            <button
              onClick={onNavigateToNostr}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
                width: '100%',
                padding: '10px 40px',
                borderRadius: 10,
                border: '1px solid var(--border)',
                background: 'var(--surface2)',
                color: 'var(--text)',
                fontSize: 14,
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'border-color 0.15s',
              }}
              onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.borderColor = 'var(--text-muted)'; }}
              onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.borderColor = 'var(--border)'; }}
            >
              <span style={{ fontSize: 18 }}>⚡</span>
              {t('nostrLogin_button')}
            </button>
          </div>

          <div style={{ opacity: googleLoading ? 0.6 : 1, pointerEvents: googleLoading ? 'none' : 'auto' }}>
            <GoogleLogin
              onSuccess={credentialResponse => {
                if (credentialResponse.credential) handleGoogleSuccess(credentialResponse.credential);
              }}
              onError={() => setGoogleError(t('login_googleError'))}
              theme="filled_black"
              size="large"
              text="continue_with"
              locale={googleLocale}
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
            {t('login_noAccount')}{' '}
            <span style={{ fontWeight: 700, color: 'var(--text)' }}>{t('login_createAccount')}</span>
          </button>
          <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
            <a href="/termos" target="_blank" rel="noopener noreferrer" style={{ fontSize: 12, color: 'var(--text-faint)', textDecoration: 'none' }}>
              {t('login_terms')}
            </a>
            <span style={{ fontSize: 12, color: 'var(--text-faint)' }}>·</span>
            <a href="/privacidade" target="_blank" rel="noopener noreferrer" style={{ fontSize: 12, color: 'var(--text-faint)', textDecoration: 'none' }}>
              {t('login_privacy')}
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
