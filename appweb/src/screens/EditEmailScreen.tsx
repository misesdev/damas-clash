'use client';

import { useTranslation } from 'react-i18next';
import { Button } from '../components/Button';
import { Input } from '../components/Input';
import { OtpInput } from '../components/OtpInput';
import { useEditEmail } from '../hooks/useEditEmail';
import type { LoginResponse } from '../types/auth';
import '../i18n';

interface Props {
  user: LoginResponse;
  onSaved: (newEmail: string) => void;
  onBack: () => void;
}

export function EditEmailScreen({ user, onSaved, onBack }: Props) {
  const { t } = useTranslation();
  const {
    phase,
    newEmail,
    setNewEmail,
    code,
    setCode,
    loading,
    error,
    emailValid,
    handleRequestChange,
    handleConfirmChange,
    handleBack,
  } = useEditEmail(user, onSaved, onBack);

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100%',
        width: "100%",
        padding: '40px 20px',
        background: 'var(--bg)',
        overflowY: 'auto',
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: 400,
          background: 'var(--surface)',
          border: '1px solid var(--border)',
          borderRadius: 20,
          padding: '36px 36px',
          boxShadow: '0 24px 80px rgba(0,0,0,0.5)',
        }}
      >
        {/* Back */}
        <button
          onClick={handleBack}
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
          <span style={{ fontSize: 16 }}>←</span> {t('editEmail_back')}
        </button>

        {phase === 'input' ? (
          <>
            <div style={{ marginBottom: 32 }}>
              <h1 style={{ fontSize: 22, fontWeight: 800, color: 'var(--text)', marginBottom: 4 }}>
                {t('editEmail_title')}
              </h1>
              <p style={{ fontSize: 14, color: 'var(--text-muted)' }}>
                {t('editEmail_subtitle')}
              </p>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              <Input
                label={t('editEmail_label')}
                value={newEmail}
                onChange={setNewEmail}
                type="email"
                placeholder={t('editEmail_placeholder')}
                autoComplete="email"
                error={error}
              />
              <p style={{ fontSize: 12, color: 'var(--text-faint)', marginTop: -8 }}>
                {t('editEmail_hint')}
              </p>
              <Button
                label={t('editEmail_send')}
                onClick={handleRequestChange}
                loading={loading}
                disabled={!emailValid}
              />
            </div>
          </>
        ) : (
          <>
            <div style={{ marginBottom: 32 }}>
              <h1 style={{ fontSize: 22, fontWeight: 800, color: 'var(--text)', marginBottom: 4 }}>
                {t('editEmail_verifyTitle')}
              </h1>
              <p style={{ fontSize: 14, color: 'var(--text-muted)', lineHeight: 1.55 }}>
                {t('editEmail_sentTo')}{' '}
                <span style={{ fontWeight: 600, color: 'var(--text)' }}>{newEmail}</span>
              </p>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              <OtpInput value={code} onChange={setCode} error={!!error} />

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
                label={t('editEmail_confirm')}
                onClick={handleConfirmChange}
                loading={loading}
                disabled={code.length !== 6}
              />
            </div>
          </>
        )}
      </div>
    </div>
  );
}
