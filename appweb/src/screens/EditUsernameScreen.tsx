'use client';

import { Button } from '../components/Button';
import { Input } from '../components/Input';
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
          onClick={onBack}
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
          Nome de usuário
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
          <Input
            label="Nome de usuário"
            value={username}
            onChange={setUsername}
            autoComplete="username"
            error={error}
          />
          <p style={{ fontSize: 12, color: 'var(--text-faint)', marginTop: -8 }}>
            Mínimo de 3 caracteres.
          </p>
          <Button label="Salvar" onClick={handleSave} loading={loading} disabled={!valid} />
        </div>
      </div>
    </div>
  );
}
