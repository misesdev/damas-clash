'use client';

import { Button } from '../components/Button';
import { Input } from '../components/Input';
import { OtpInput } from '../components/OtpInput';
import { ScreenHeader } from '../components/ScreenHeader';
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
    <div className="flex h-full flex-col" style={{ background: 'var(--bg)' }}>
      <ScreenHeader title="Alterar e-mail" onBack={handleBack} />

      <div className="flex flex-1 flex-col justify-between px-4 py-6">
        {phase === 'input' ? (
          <>
            <div className="flex flex-col gap-3">
              <Input
                label="Novo e-mail"
                value={newEmail}
                onChange={setNewEmail}
                type="email"
                placeholder="novo@email.com"
                autoComplete="email"
              />
              {error && (
                <p className="text-xs" style={{ color: 'var(--danger)' }}>{error}</p>
              )}
              <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                Um código de verificação será enviado para o novo endereço.
              </p>
            </div>

            <Button
              label="Enviar código"
              onClick={handleRequestChange}
              loading={loading}
              disabled={!emailValid}
            />
          </>
        ) : (
          <>
            <div className="flex flex-col gap-4">
              <p className="text-sm text-center" style={{ color: 'var(--text-muted)' }}>
                Digite o código enviado para{' '}
                <span className="font-semibold text-white">{newEmail}</span>
              </p>

              <OtpInput value={code} onChange={setCode} error={!!error} />

              {error && (
                <p className="text-xs text-center" style={{ color: 'var(--danger)' }}>{error}</p>
              )}
            </div>

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
  );
}
