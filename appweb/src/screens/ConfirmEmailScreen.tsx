'use client';

import { Button } from '../components/Button';
import { OtpInput } from '../components/OtpInput';
import { useConfirmEmail } from '../hooks/useConfirmEmail';

interface ConfirmEmailScreenProps {
  email: string;
  onConfirmed: () => void;
  onNavigateToLogin: () => void;
  onSubmitCode?: (code: string) => Promise<void>;
  onResendCode?: () => Promise<void>;
  heading?: string;
}

export function ConfirmEmailScreen({
  email,
  onConfirmed,
  onNavigateToLogin,
  onSubmitCode,
  onResendCode,
  heading = 'Verifique\nseu e-mail',
}: ConfirmEmailScreenProps) {
  const {
    code,
    setCode,
    error,
    loading,
    resendCooldown,
    resendSuccess,
    handleResend,
    handleConfirm,
  } = useConfirmEmail({ email, onConfirmed, onSubmitCode, onResendCode });

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
        {/* Icon */}
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 28 }}>
          <div
            style={{
              width: 60,
              height: 60,
              borderRadius: 16,
              background: 'var(--surface2)',
              border: '1px solid var(--border)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 26,
            }}
          >
            ✉
          </div>
        </div>

        {/* Heading */}
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <h1
            style={{
              fontSize: 22,
              fontWeight: 800,
              color: 'var(--text)',
              marginBottom: 8,
              whiteSpace: 'pre-line',
            }}
          >
            {heading}
          </h1>
          <p style={{ fontSize: 14, color: 'var(--text-muted)', lineHeight: 1.55 }}>
            Enviamos um código de 6 dígitos para{' '}
            <span style={{ fontWeight: 600, color: 'var(--text)' }}>{email}</span>
          </p>
        </div>

        {/* OTP + actions */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
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
                textAlign: 'center',
              }}
            >
              {error}
            </div>
          )}

          <Button
            label="Confirmar"
            onClick={handleConfirm}
            loading={loading}
            disabled={code.length !== 6}
          />

          {onResendCode && (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, paddingTop: 4 }}>
              {resendSuccess && resendCooldown > 0 && (
                <p style={{ fontSize: 12, color: '#4ade80' }}>Código reenviado ✓</p>
              )}
              <button
                onClick={handleResend}
                disabled={resendCooldown > 0}
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: resendCooldown > 0 ? 'default' : 'pointer',
                  fontSize: 13,
                  color: 'var(--text-muted)',
                  opacity: resendCooldown > 0 ? 0.4 : 1,
                }}
              >
                {resendCooldown > 0
                  ? `Reenviar código em ${resendCooldown}s`
                  : 'Não recebeu? Reenviar código'}
              </button>
            </div>
          )}
        </div>

        {/* Divider + back */}
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
            Voltar para o{' '}
            <span style={{ fontWeight: 700, color: 'var(--text)' }}>Login</span>
          </button>
        </div>
      </div>
    </div>
  );
}
