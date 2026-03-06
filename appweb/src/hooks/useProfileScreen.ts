'use client';

import { useEffect, useRef, useState } from 'react';
import { showMessage } from '../components/MessageBox';
import { updateAvatar } from '../api/players';
import { getPlayerStats } from '../api/games';
import type { LoginResponse } from '../types/auth';
import type { PlayerStats } from '../types/game';

export function useProfileScreen(
  user: LoginResponse,
  onLogout: () => void,
  onAvatarChanged: (url: string) => void,
) {
  const [uploading, setUploading] = useState(false);
  const [stats, setStats] = useState<PlayerStats | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    getPlayerStats(user.token, user.playerId)
      .then(setStats)
      .catch(() => {});
  }, [user.token, user.playerId]);

  const handleLogout = () => {
    showMessage({
      title: 'Encerrar sessão',
      message: 'Deseja sair da sua conta?',
      type: 'confirm',
      actions: [
        { label: 'Cancelar' },
        { label: 'Sair', danger: true, onPress: onLogout },
      ],
    });
  };

  const handleAvatarPress = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const url = await updateAvatar(user.token, user.playerId, file);
      onAvatarChanged(url);
    } catch (e: unknown) {
      showMessage({
        title: 'Erro',
        message: e instanceof Error ? e.message : 'Não foi possível enviar a imagem.',
        type: 'error',
      });
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  return { uploading, stats, fileInputRef, handleLogout, handleAvatarPress, handleFileChange };
}
