'use client';

import { Button } from '../components/Button';
import { Input } from '../components/Input';
import { ScreenHeader } from '../components/ScreenHeader';
import { useEditUsername } from '../hooks/useEditUsername';
import type { LoginResponse } from '../types/auth';

interface Props {
  user: LoginResponse;
  onSaved: (newUsername: string) => void;
  onBack: () => void;
}

export function EditUsernameScreen({ user, onSaved, onBack }: Props) {
  const { username, setUsername, loading, error, valid, handleSave } = useEditUsername(
    user,
    onSaved,
  );

  return (
    <div className="flex h-full flex-col" style={{ background: 'var(--bg)' }}>
      <ScreenHeader title="Nome de usuário" onBack={onBack} />

      <div className="flex flex-1 flex-col justify-between px-4 py-6">
        <div className="flex flex-col gap-3">
          <Input
            label="Nome de usuário"
            value={username}
            onChange={setUsername}
            autoComplete="username"
            error={error}
          />
          <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
            Mínimo de 3 caracteres.
          </p>
        </div>

        <Button label="Salvar" onClick={handleSave} loading={loading} disabled={!valid} />
      </div>
    </div>
  );
}
