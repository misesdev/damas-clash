'use client';

import { Button } from '../components/Button';
import { Input } from '../components/Input';
import { OtpInput } from '../components/OtpInput';
import { useEditEmail } from '../hooks/useEditEmail';
import type { LoginResponse } from '../types/auth';

interface Props {
  user: LoginResponse;
  onSaved: (newEmail: string) => void;
  onBack: () => void;
}

export function EditEmailScreen({ user, onSaved, onBack }: Props) {
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
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: 'var(--bg)' }}>
      {/* Top bar */}
      <header
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          padding: '12px 20px',
          borderBottom: '1px solid var(--border)',
          background: 'var(--surface)',
          flexShrink: 0,
        }}
      >
        <button
          onClick={handleBack}
          style={{
            width: 32,
            height: 32,
            borderRadius: 10,
            background: 'var(--surface2)',
            border: '1px solid var(--border)',
            color: 'var(--text-muted)',
            fontSize: 16,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          ←
        </button>
        <h2 style={{ fontSize: 15, fontWeight: 700, color: 'var(--text)', margin: 0 }}>
          {phase === 'input' ? 'Alterar e-mail' : 'Verificar e-mail'}
        </h2>
      </header>

      {/* Centered form */}
      <div
        style={{
          flex: 1,
          display: 'flex',
          alignItems: 'flex-start',
          justifyContent: 'center',
          padding: '40px 20px',
          overflowY: 'auto',
        }}
      >
        <div style={{ width: '100%', maxWidth: 440, display: 'flex', flexDirection: 'column', gap: 20 }}>
          {phase === 'input' ? (
            <>
              <Input
                label="Novo e-mail"
                value={newEmail}
                onChange={setNewEmail}
                type="email"
                placeholder="novo@email.com"
                autoComplete="email"
                error={error}
              />
              <p style={{ fontSize: 12, color: 'var(--text-faint)', marginTop: -8 }}>
                Um código de verificação será enviado para o novo endereço.
              </p>
              <Button
                label="Enviar código"
                onClick={handleRequestChange}
                loading={loading}
                disabled={!emailValid}
              />
            </>
          ) : (
            <>
              <div
                style={{
                  padding: '16px 20px',
                  background: 'var(--surface)',
                  border: '1px solid var(--border)',
                  borderRadius: 14,
                  fontSize: 13,
                  color: 'var(--text-muted)',
                  lineHeight: 1.5,
                }}
              >
                Código enviado para{' '}
                <span style={{ fontWeight: 600, color: 'var(--text)' }}>{newEmail}</span>
              </div>

              <OtpInput value={code} onChange={setCode} error={!!error} />

              {error && (
                <p style={{ fontSize: 13, color: 'var(--danger)', marginTop: -8 }}>{error}</p>
              )}

              <Button
                label="Confirmar alteração"
                onClick={handleConfirmChange}
                loading={loading}
                disabled={code.length !== 6}
              />
            </>
          )}
        </div>
      </div>
    </div>
  );
}
