'use client';

import { useProfileScreen } from '../hooks/useProfileScreen';
import type { LoginResponse } from '../types/auth';

interface Props {
  user: LoginResponse;
  onLogout: () => void;
  onEditUsername: () => void;
  onEditEmail: () => void;
  onAvatarChanged: (url: string) => void;
  onOpenHistory: () => void;
}

interface MenuItemProps {
  label: string;
  value?: string;
  onClick?: () => void;
  danger?: boolean;
}

function MenuItem({ label, value, onClick, danger }: MenuItemProps) {
  return (
    <button
      onClick={onClick}
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        width: '100%',
        padding: '14px 20px',
        background: 'transparent',
        border: 'none',
        cursor: 'pointer',
        textAlign: 'left',
        transition: 'background 0.12s',
      }}
      onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = 'var(--surface2)'; }}
      onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = 'transparent'; }}
    >
      <span style={{ fontSize: 14, fontWeight: 500, color: danger ? 'var(--danger)' : 'var(--text)' }}>
        {label}
      </span>
      {!danger && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {value && (
            <span
              style={{
                maxWidth: 180,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
                fontSize: 13,
                color: 'var(--text-muted)',
              }}
            >
              {value}
            </span>
          )}
          <span style={{ color: 'var(--text-faint)', fontSize: 16 }}>›</span>
        </div>
      )}
    </button>
  );
}

function Divider() {
  return <div style={{ height: 1, background: 'var(--border)', margin: '0 20px' }} />;
}

function Section({ label, children }: { label?: string; children: React.ReactNode }) {
  return (
    <div>
      {label && (
        <p
          style={{
            fontSize: 11,
            fontWeight: 700,
            color: 'var(--text-faint)',
            textTransform: 'uppercase',
            letterSpacing: '0.1em',
            marginBottom: 8,
            paddingLeft: 4,
          }}
        >
          {label}
        </p>
      )}
      <div
        style={{
          background: 'var(--surface)',
          border: '1px solid var(--border)',
          borderRadius: 16,
          overflow: 'hidden',
        }}
      >
        {children}
      </div>
    </div>
  );
}

export function ProfileScreen({
  user,
  onLogout,
  onEditUsername,
  onEditEmail,
  onAvatarChanged,
  onOpenHistory,
}: Props) {
  const { uploading, stats, fileInputRef, handleLogout, handleDeleteAccount, handleAvatarPress, handleFileChange } =
    useProfileScreen(user, onLogout, onAvatarChanged);

  const initials = user.username.slice(0, 2).toUpperCase();

  return (
    <div style={{ height: '100%', overflowY: 'auto' }}>
      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        style={{ display: 'none' }}
        onChange={handleFileChange}
      />

      {/* Centered container */}
      <div
        style={{
          maxWidth: 480,
          margin: '0 auto',
          padding: '32px 20px 48px',
          display: 'flex',
          flexDirection: 'column',
          gap: 24,
        }}
      >
        {/* ── Avatar section ── */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14 }}>
          {/* Avatar button */}
          <button
            onClick={handleAvatarPress}
            disabled={uploading}
            style={{
              position: 'relative',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              padding: 0,
              opacity: uploading ? 0.6 : 1,
              transition: 'opacity 0.15s',
            }}
          >
            {user.avatarUrl ? (
              <img
                src={user.avatarUrl}
                alt={user.username}
                style={{ width: 90, height: 90, borderRadius: 45, objectFit: 'cover', display: 'block' }}
              />
            ) : (
              <div
                style={{
                  width: 90,
                  height: 90,
                  borderRadius: 45,
                  background: 'var(--surface2)',
                  border: '2px solid var(--border)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 28,
                  fontWeight: 800,
                  color: 'var(--text)',
                }}
              >
                {initials}
              </div>
            )}

            {/* Edit badge */}
            <div
              style={{
                position: 'absolute',
                bottom: 2,
                right: 2,
                width: 26,
                height: 26,
                borderRadius: 13,
                background: 'var(--surface)',
                border: '2px solid var(--bg)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 12,
                color: 'var(--text-muted)',
              }}
            >
              {uploading ? (
                <span
                  style={{
                    display: 'inline-block',
                    width: 10,
                    height: 10,
                    borderRadius: '50%',
                    border: '2px solid currentColor',
                    borderTopColor: 'transparent',
                    animation: 'spin 0.7s linear infinite',
                  }}
                />
              ) : '✎'}
            </div>
          </button>

          <div style={{ textAlign: 'center' }}>
            <p style={{ fontSize: 18, fontWeight: 800, color: 'var(--text)', marginBottom: 4 }}>
              {user.username}
            </p>
            <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>{user.email}</p>
          </div>
        </div>

        {/* ── Stats ── */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr 1fr',
            gap: 10,
          }}
        >
          {[
            { label: 'Partidas', value: stats?.total ?? '—' },
            { label: 'Vitórias', value: stats?.wins ?? '—' },
            { label: 'Derrotas', value: stats?.losses ?? '—' },
          ].map(stat => (
            <div
              key={stat.label}
              style={{
                background: 'var(--surface)',
                border: '1px solid var(--border)',
                borderRadius: 14,
                padding: '14px 10px',
                textAlign: 'center',
              }}
            >
              <p style={{ fontSize: 22, fontWeight: 800, color: 'var(--text)', lineHeight: 1 }}>
                {stat.value}
              </p>
              <p style={{ fontSize: 11, color: 'var(--text-faint)', marginTop: 5, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                {stat.label}
              </p>
            </div>
          ))}
        </div>

        {/* ── Account section ── */}
        <Section label="Conta">
          <MenuItem label="Nome de usuário" value={user.username} onClick={onEditUsername} />
          <Divider />
          <MenuItem label="E-mail" value={user.email} onClick={onEditEmail} />
        </Section>

        {/* ── History section ── */}
        <Section label="Histórico">
          <MenuItem label="Partidas jogadas" onClick={onOpenHistory} />
        </Section>

        {/* ── Legal section ── */}
        <Section label="Jurídico">
          <MenuItem
            label="Termos de Uso"
            onClick={() => window.open('/termos', '_blank', 'noopener,noreferrer')}
          />
          <Divider />
          <MenuItem
            label="Política de Privacidade"
            onClick={() => window.open('/privacidade', '_blank', 'noopener,noreferrer')}
          />
        </Section>

        {/* ── Session section ── */}
        <Section>
          <MenuItem label="Excluir Conta" danger onClick={handleDeleteAccount} />
          <Divider />
          <MenuItem label="Sair" danger onClick={handleLogout} />
        </Section>

        <p style={{ textAlign: 'center', fontSize: 12, color: 'var(--text-faint)' }}>
          Damas · v0.1
        </p>
      </div>
    </div>
  );
}
