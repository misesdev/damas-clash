'use client';

import { GoogleLogin } from '@react-oauth/google';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { googleAuth } from '../api/auth';
import { Button } from '../components/Button';
import { Input } from '../components/Input';
import { useRegister } from '../hooks/useRegister';
import type { LoginResponse } from '../types/auth';
import '../i18n';

interface RegisterScreenProps {
  onRegistered: (email: string) => void;
  onNavigateToLogin: () => void;
  onGoogleLogin: (data: LoginResponse) => void;
}

export function RegisterScreen({ onRegistered, onNavigateToLogin, onGoogleLogin }: RegisterScreenProps) {
  const { t, i18n } = useTranslation();
  const { username, setUsername, email, setEmail, errors, loading, handleRegister } =
    useRegister(onRegistered);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [googleError, setGoogleError] = useState('');

  const handleGoogleSuccess = async (credential: string) => {
    setGoogleLoading(true);
    setGoogleError('');
    try {
      const data = await googleAuth(credential);
      onGoogleLogin(data);
    } catch {
      setGoogleError(t('register_googleError'));
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
          <span style={{ fontSize: 16 }}>←</span> {t('register_back')}
        </button>

        {/* Heading */}
        <div style={{ marginBottom: 32 }}>
          <h1 style={{ fontSize: 22, fontWeight: 800, color: 'var(--text)', marginBottom: 4 }}>
            {t('register_title')}
          </h1>
          <p style={{ fontSize: 14, color: 'var(--text-muted)' }}>
            {t('register_subtitle')}
          </p>
        </div>

        {/* Form */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <Input
            label={t('register_username')}
            value={username}
            onChange={setUsername}
            placeholder="seu_usuario"
            autoComplete="username"
            error={errors.username}
          />
          <Input
            label={t('register_email')}
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

          <Button label={t('register_submit')} onClick={handleRegister} loading={loading} />
        </div>

        {/* Google login */}
        <div style={{ marginTop: 20, display: 'flex', flexDirection: 'column', gap: 10, alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, width: '100%' }}>
            <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
            <span style={{ fontSize: 12, color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>{t('register_or')}</span>
            <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
          </div>
          <div style={{ opacity: googleLoading ? 0.6 : 1, pointerEvents: googleLoading ? 'none' : 'auto' }}>
            <GoogleLogin
              onSuccess={credentialResponse => {
                if (credentialResponse.credential) handleGoogleSuccess(credentialResponse.credential);
              }}
              onError={() => setGoogleError(t('register_googleError'))}
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
            onClick={onNavigateToLogin}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              fontSize: 14,
              color: 'var(--text-muted)',
            }}
          >
            {t('register_hasAccount')}{' '}
            <span style={{ fontWeight: 700, color: 'var(--text)' }}>{t('register_signIn')}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
