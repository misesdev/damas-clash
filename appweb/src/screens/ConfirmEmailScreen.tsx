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
    <div className="flex min-h-full flex-col items-center justify-center px-6 py-12">
      <div className="w-full max-w-sm">
        {/* Icon */}
        <div className="mb-8 flex justify-center">
          <div
            className="flex h-16 w-16 items-center justify-center rounded-2xl text-3xl"
            style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
          >
            ✉
          </div>
        </div>

        <div className="mb-8 text-center">
          <h2 className="whitespace-pre-line text-2xl font-bold text-white">{heading}</h2>
          <p className="mt-2 text-sm" style={{ color: 'var(--text-muted)' }}>
            Enviamos um código de 6 dígitos para{' '}
            <span className="font-semibold text-white">{email}</span>
          </p>
        </div>

        <div className="flex flex-col gap-4">
          <OtpInput value={code} onChange={setCode} error={!!error} />

          {error && (
            <p className="rounded-xl px-4 py-3 text-sm text-red-400"
              style={{ background: 'rgba(231,76,60,0.1)', border: '1px solid rgba(231,76,60,0.3)' }}>
              {error}
            </p>
          )}

          <Button
            label="Confirmar"
            onClick={handleConfirm}
            loading={loading}
            disabled={code.length !== 6}
          />

          {onResendCode && (
            <div className="flex flex-col items-center gap-2 pt-2">
              {resendSuccess && resendCooldown > 0 && (
                <p className="text-xs text-green-400">Código reenviado ✓</p>
              )}
              <button
                onClick={handleResend}
                disabled={resendCooldown > 0}
                className="text-sm transition-opacity disabled:opacity-40 hover:opacity-80"
                style={{ color: 'var(--text-muted)' }}
              >
                {resendCooldown > 0
                  ? `Reenviar código em ${resendCooldown}s`
                  : 'Não recebeu? Reenviar código'}
              </button>
            </div>
          )}
        </div>

        <div className="mt-8 flex flex-col items-center gap-4">
          <div className="h-px w-full" style={{ background: 'var(--border)' }} />
          <button
            onClick={onNavigateToLogin}
            className="text-sm transition-opacity hover:opacity-80"
            style={{ color: 'var(--text-muted)' }}
          >
            Voltar para o <span className="font-semibold text-white">Login</span>
          </button>
        </div>
      </div>
    </div>
  );
}
