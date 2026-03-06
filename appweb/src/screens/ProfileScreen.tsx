'use client';

import { useProfileScreen } from '../hooks/useProfileScreen';
import type { LoginResponse } from '../types/auth';

interface Props {
  user: LoginResponse;
  onLogout: () => void;
  onEditUsername: () => void;
  onEditEmail: () => void;
  onAvatarChanged: (url: string) => void;
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
      className="flex w-full items-center justify-between px-4 py-4 transition-colors hover:brightness-110"
    >
      <span
        className="text-sm font-medium"
        style={{ color: danger ? 'var(--danger)' : 'var(--text)' }}
      >
        {label}
      </span>
      <div className="flex items-center gap-2">
        {value && (
          <span className="max-w-[160px] truncate text-sm" style={{ color: 'var(--text-muted)' }}>
            {value}
          </span>
        )}
        {!danger && <span style={{ color: 'var(--text-muted)' }}>›</span>}
      </div>
    </button>
  );
}

function Separator() {
  return <div className="mx-4 h-px" style={{ background: 'var(--border)' }} />;
}

export function ProfileScreen({
  user,
  onLogout,
  onEditUsername,
  onEditEmail,
  onAvatarChanged,
}: Props) {
  const { uploading, fileInputRef, handleLogout, handleAvatarPress, handleFileChange } =
    useProfileScreen(user, onLogout, onAvatarChanged);

  const initials = user.username.slice(0, 2).toUpperCase();

  return (
    <div className="flex h-full flex-col overflow-y-auto">
      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFileChange}
      />

      {/* Profile header */}
      <div className="flex flex-col items-center gap-3 px-6 pt-8 pb-6">
        <button
          onClick={handleAvatarPress}
          disabled={uploading}
          className="relative transition-opacity hover:opacity-80 disabled:opacity-60"
        >
          {user.avatarUrl ? (
            <img
              src={user.avatarUrl}
              alt={user.username}
              className="h-22 w-22 rounded-full object-cover"
              style={{ width: 88, height: 88, borderRadius: 44 }}
            />
          ) : (
            <div
              className="flex items-center justify-center rounded-full text-2xl font-bold text-white"
              style={{ width: 88, height: 88, background: 'var(--surface2)', border: '2px solid var(--border)' }}
            >
              {initials}
            </div>
          )}

          {/* Edit badge */}
          <div
            className="absolute bottom-0 right-0 flex h-7 w-7 items-center justify-center rounded-full text-xs"
            style={{ background: 'var(--surface2)', border: '2px solid var(--bg)' }}
          >
            {uploading ? (
              <span className="inline-block h-3 w-3 animate-spin rounded-full border-2 border-white border-t-transparent" />
            ) : (
              '✎'
            )}
          </div>
        </button>

        <p className="text-lg font-bold text-white">{user.username}</p>
        <p className="text-sm" style={{ color: 'var(--text-muted)' }}>{user.email}</p>
      </div>

      {/* Sections */}
      <div className="flex flex-col gap-4 px-4 pb-8">
        {/* Account section */}
        <div>
          <p className="mb-2 px-1 text-xs font-semibold uppercase tracking-widest"
            style={{ color: 'var(--text-muted)' }}>
            Conta
          </p>
          <div className="rounded-2xl overflow-hidden" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
            <MenuItem label="Nome de usuário" value={user.username} onClick={onEditUsername} />
            <Separator />
            <MenuItem label="E-mail" value={user.email} onClick={onEditEmail} />
          </div>
        </div>

        {/* Logout section */}
        <div>
          <div className="rounded-2xl overflow-hidden" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
            <MenuItem label="Sair" danger onClick={handleLogout} />
          </div>
        </div>

        <p className="text-center text-xs" style={{ color: 'var(--text-muted)' }}>
          Damas · v0.1
        </p>
      </div>
    </div>
  );
}
