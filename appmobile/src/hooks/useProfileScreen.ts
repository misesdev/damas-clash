import {useCallback, useEffect, useState} from 'react';
import {Clipboard} from 'react-native';
import {useTranslation} from 'react-i18next';
import {launchImageLibrary} from 'react-native-image-picker';
import {showMessage} from '../components/MessageBox';
import {deleteAccount} from '../api/auth';
import {updateAvatar} from '../api/players';
import {getPlayerStats} from '../api/games';
import {hasBiometry, getProtectedNsec} from '../storage/nostrKeys';
import {pubkeyToNpub} from '../utils/nostr';
import type {LoginResponse} from '../types/auth';
import type {PlayerStats} from '../types/game';

export function useProfileScreen(
  user: LoginResponse,
  onLogout: () => void,
  onAvatarChanged: (url: string) => void,
) {
  const {t} = useTranslation();
  const [uploading, setUploading] = useState(false);
  const [stats, setStats] = useState<PlayerStats | null>(null);

  useEffect(() => {
    getPlayerStats(user.token, user.playerId)
      .then(setStats)
      .catch(() => {});
  }, [user.token, user.playerId]);

  const handleLogout = () => {
    showMessage({
      title: t('profile.logoutConfirm.title'),
      message: t('profile.logoutConfirm.message'),
      type: 'confirm',
      actions: [
        {label: t('profile.logoutConfirm.cancel')},
        {label: t('profile.logoutConfirm.confirm'), danger: true, onPress: onLogout},
      ],
    });
  };

  const handleDeleteAccount = () => {
    showMessage({
      title: t('profile.deleteConfirm.title'),
      message: t('profile.deleteConfirm.message'),
      type: 'confirm',
      actions: [
        {label: t('profile.deleteConfirm.cancel')},
        {
          label: t('profile.deleteConfirm.confirm'),
          danger: true,
          onPress: async () => {
            try {
              await deleteAccount(user.token);
              onLogout();
            } catch {
              showMessage({
                title: t('profile.errors.deleteTitle'),
                message: t('profile.errors.deleteMessage'),
                type: 'error',
              });
            }
          },
        },
      ],
    });
  };

  const handleAvatarPress = () => {
    launchImageLibrary(
      {mediaType: 'photo', quality: 0.8, maxWidth: 800, maxHeight: 800},
      async response => {
        if (response.didCancel || response.errorCode) {return;}
        const asset = response.assets?.[0];
        if (!asset?.uri) {return;}

        setUploading(true);
        try {
          const url = await updateAvatar(
            user.token,
            user.playerId,
            asset.uri,
            asset.fileName ?? 'avatar.jpg',
            asset.type ?? 'image/jpeg',
          );
          onAvatarChanged(url);
        } catch (e: any) {
          showMessage({
            title: 'Erro',
            message: e.message ?? 'Não foi possível enviar a imagem.',
            type: 'error',
          });
        } finally {
          setUploading(false);
        }
      },
    );
  };

  const handleCopyNpub = useCallback(() => {
    if (!user.nostrPubKey) return;
    const npub = pubkeyToNpub(user.nostrPubKey);
    Clipboard.setString(npub);
    showMessage({
      title: t('profile.nostr.npubCopiedTitle'),
      message: t('profile.nostr.npubCopiedMessage'),
      type: 'info',
      actions: [{label: t('common.ok')}],
    });
  }, [user.nostrPubKey, t]);

  const handleCopyNsec = useCallback(async () => {
    const nsec = user.nostrNsec;
    if (!nsec) return;

    try {
      const biometricAvailable = await hasBiometry();

      if (biometricAvailable) {
        const protectedNsec = await getProtectedNsec(
          t('profile.nostr.biometricPrompt'),
          t('common.cancel'),
        );
        if (!protectedNsec) return; // User cancelled biometrics — do nothing
        Clipboard.setString(protectedNsec);
      } else {
        // No biometry — copy directly from session
        Clipboard.setString(nsec);
      }

      showMessage({
        title: t('profile.nostr.nsecCopiedTitle'),
        message: t('profile.nostr.nsecCopiedMessage'),
        type: 'info',
        actions: [{label: t('common.ok')}],
      });
    } catch {
      // Biometric prompt dismissed or hardware error — silently ignore
    }
  }, [user.nostrNsec, t]);

  return {
    uploading,
    stats,
    handleLogout,
    handleDeleteAccount,
    handleAvatarPress,
    handleCopyNpub,
    handleCopyNsec,
  };
}
