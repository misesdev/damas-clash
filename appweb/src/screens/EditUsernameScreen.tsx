'use client';

import { useTranslation } from 'react-i18next';
import { Button } from '../components/Button';
import { Input } from '../components/Input';
import { useEditUsername } from '../hooks/useEditUsername';
import type { LoginResponse } from '../types/auth';
import '../i18n';

interface Props {
  user: LoginResponse;
  onSaved: (newUsername: string) => void;
  onBack: () => void;
}

export function EditUsernameScreen({ user, onSaved, onBack }: Props) {
  const { t } = useTranslation();
  const { username, setUsername, loading, error, valid, handleSave } = useEditUsername(user, onSaved);

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
          onClick={onBack}
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
          <span style={{ fontSize: 16 }}>←</span> {t('editUsername_back')}
        </button>

        <div style={{ marginBottom: 32 }}>
          <h1 style={{ fontSize: 22, fontWeight: 800, color: 'var(--text)', marginBottom: 4 }}>
            {t('editUsername_title')}
          </h1>
          <p style={{ fontSize: 14, color: 'var(--text-muted)' }}>
            {t('editUsername_subtitle')}
          </p>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <Input
            label={t('editUsername_label')}
            value={username}
            onChange={setUsername}
            autoComplete="username"
            error={error}
          />
          <p style={{ fontSize: 12, color: 'var(--text-faint)', marginTop: -8 }}>
            {t('editUsername_hint')}
          </p>
          <Button label={t('editUsername_save')} onClick={handleSave} loading={loading} disabled={!valid} />
        </div>
      </div>
    </div>
  );
}
