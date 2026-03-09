'use client';

import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { showMessage } from '../components/MessageBox';
import { deleteAccount } from '../api/auth';
import { updateAvatar } from '../api/players';
import { getPlayerStats } from '../api/games';
import type { LoginResponse } from '../types/auth';
import type { PlayerStats } from '../types/game';
import '../i18n';

export function useProfileScreen(
  user: LoginResponse,
  onLogout: () => void,
  onAvatarChanged: (url: string) => void,
) {
  const { t } = useTranslation();
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
      title: t('profile_logoutTitle'),
      message: t('profile_logoutMessage'),
      type: 'confirm',
      actions: [
        { label: t('profile_logoutCancel') },
        { label: t('profile_logoutConfirm'), danger: true, onPress: onLogout },
      ],
    });
  };

  const handleDeleteAccount = () => {
    showMessage({
      title: t('profile_deleteTitle'),
      message: t('profile_deleteMessage'),
      type: 'confirm',
      actions: [
        { label: t('profile_deleteCancel') },
        {
          label: t('profile_deleteConfirm'),
          danger: true,
          onPress: async () => {
            try {
              await deleteAccount(user.token);
              onLogout();
            } catch {
              showMessage({
                title: 'Erro',
                message: t('profile_deleteError'),
                type: 'error',
              });
            }
          },
        },
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
        message: e instanceof Error ? e.message : t('profile_avatarError'),
        type: 'error',
      });
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  return { uploading, stats, fileInputRef, handleLogout, handleDeleteAccount, handleAvatarPress, handleFileChange };
}
