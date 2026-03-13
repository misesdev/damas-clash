'use client';

import { useTranslation } from 'react-i18next';
import { Button } from '../components/Button';
import { Input } from '../components/Input';
import { ScreenHeader } from '../components/ScreenHeader';
import { useNostrLogin } from '../hooks/useNostrLogin';
import type { LoginResponse } from '../types/auth';
import '../i18n';

interface Props {
  onLogin: (data: LoginResponse) => void;
  onBack: () => void;
}

export function NostrLoginScreen({ onLogin, onBack }: Props) {
  const { t } = useTranslation();
  const { nsec, setNsec, status, error, handleLogin, canSubmit } = useNostrLogin(onLogin);
  const loading = status === 'loading';

  return (
    <div style={{ minHeight: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '40px 20px', background: 'var(--bg)' }}>
      <div style={{ width: '100%', maxWidth: 400, background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 20, overflow: 'hidden', boxShadow: '0 24px 80px rgba(0,0,0,0.5)' }}>
        <ScreenHeader title={t('nostrLogin_title')} onBack={onBack} />
        <div style={{ padding: '24px 32px 32px', display: 'flex', flexDirection: 'column', gap: 20 }}>
          {/* Brand row */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ fontSize: 32 }}>⚡</span>
            <div>
              <p style={{ fontSize: 20, fontWeight: 800, color: 'var(--text)', letterSpacing: 2 }}>Nostr</p>
              <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>{t('nostrLogin_subtitle')}</p>
            </div>
          </div>

          <Input
            label={t('nostrLogin_nsecLabel')}
            value={nsec}
            onChange={setNsec}
            placeholder="nsec1..."
            type="password"
            autoComplete="off"
          />

          {error && (
            <div style={{ padding: '11px 14px', borderRadius: 12, background: 'rgba(255,69,58,0.08)', border: '1px solid rgba(255,69,58,0.3)', color: 'var(--danger)', fontSize: 13 }}>
              {error}
            </div>
          )}

          <Button
            label={loading ? t('nostrLogin_signing') : t('nostrLogin_loginButton')}
            onClick={handleLogin}
            loading={loading}
            disabled={!canSubmit}
          />
        </div>
      </div>
    </div>
  );
}
