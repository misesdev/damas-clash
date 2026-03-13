'use client';

import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { updateLightningAddress } from '../api/players';
import type { LoginResponse } from '../types/auth';
import '../i18n';

interface Props {
  session: LoginResponse;
  initialAddress: string | null;
  onSaved: (address: string | null) => void;
  onBack: () => void;
}

function isValidFormat(addr: string): boolean {
  const parts = addr.trim().split('@');
  return parts.length === 2 && parts[0].length > 0 && parts[1].includes('.');
}

export function EditLightningAddressScreen({ session, initialAddress, onSaved, onBack }: Props) {
  const { t } = useTranslation();
  const [address, setAddress] = useState(initialAddress ?? '');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSave = async () => {
    const trimmed = address.trim();
    if (trimmed !== '' && !isValidFormat(trimmed)) {
      setError(t('lightning_errorInvalid'));
      return;
    }
    setError('');
    setLoading(true);
    try {
      const profile = await updateLightningAddress(session.token, session.playerId, trimmed || null);
      onSaved(profile.lightningAddress);
    } catch (err: unknown) {
      const code = (err as { message?: string })?.message ?? '';
      const map: Record<string, string> = {
        invalid_format: t('lightning_errorInvalid'),
        unreachable: t('lightning_errorUnreachable'),
        lnurl_error: t('lightning_errorLnurl'),
        not_pay_request: t('lightning_errorNotPay'),
      };
      setError(map[code] ?? t('lightning_errorFailed'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      {/* Header */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        padding: '14px 20px',
        borderBottom: '1px solid var(--border)',
        flexShrink: 0,
      }}>
        <button
          onClick={onBack}
          style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text)', fontSize: 20, lineHeight: 1, padding: '2px 6px' }}
          aria-label="back"
        >
          ‹
        </button>
        <h1 style={{ fontSize: 17, fontWeight: 700, color: 'var(--text)', margin: 0 }}>
          {t('lightning_title')}
        </h1>
      </div>

      {/* Body */}
      <div style={{ flex: 1, overflowY: 'auto' }}>
        <div style={{ maxWidth: 480, margin: '0 auto', padding: '32px 20px 48px', display: 'flex', flexDirection: 'column', gap: 24 }}>

          {/* Icon + heading */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12, paddingBottom: 8 }}>
            <span style={{ fontSize: 48 }}>⚡</span>
            <p style={{ fontSize: 15, color: 'var(--text-muted)', textAlign: 'center', margin: 0, lineHeight: 1.5 }}>
              {t('lightning_hint')}
            </p>
          </div>

          {/* Input */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              {t('lightning_label')}
            </label>
            <input
              type="email"
              value={address}
              onChange={e => setAddress(e.target.value)}
              placeholder={t('lightning_placeholder')}
              autoComplete="off"
              autoCapitalize="none"
              style={{
                width: '100%',
                boxSizing: 'border-box',
                padding: '14px 16px',
                borderRadius: 12,
                border: '1px solid var(--border)',
                background: 'var(--surface2)',
                color: 'var(--text)',
                fontSize: 16,
                outline: 'none',
              }}
              onKeyDown={e => e.key === 'Enter' && handleSave()}
            />
          </div>

          {error && (
            <p style={{ fontSize: 13, color: 'var(--danger)', margin: 0, lineHeight: 1.4 }}>{error}</p>
          )}

          {/* Save button */}
          <button
            onClick={handleSave}
            disabled={loading}
            style={{
              width: '100%',
              padding: '14px 0',
              borderRadius: 12,
              border: 'none',
              background: 'var(--text)',
              color: 'var(--bg)',
              fontSize: 15,
              fontWeight: 700,
              cursor: loading ? 'not-allowed' : 'pointer',
              opacity: loading ? 0.5 : 1,
            }}
          >
            {loading ? t('lightning_saving') : t('lightning_saveButton')}
          </button>

          {/* Clear address */}
          {address.trim() !== '' && (
            <button
              onClick={() => setAddress('')}
              style={{
                background: 'none',
                border: 'none',
                color: 'var(--danger)',
                fontSize: 13,
                cursor: 'pointer',
                textAlign: 'center',
              }}
            >
              {t('lightning_removeButton')}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
