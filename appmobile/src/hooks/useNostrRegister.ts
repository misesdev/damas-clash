import {useCallback, useRef, useState} from 'react';
import {useTranslation} from 'react-i18next';
import {launchImageLibrary} from 'react-native-image-picker';
import {nostrChallenge, nostrLogin} from '../api/auth';
import {updateAvatar} from '../api/players';
import {NostrPairKey} from '../services/nostr/NostrPairKey';
import {getAuthRelayPool} from '../services/nostr/sharedAuthRelays';
import {saveProtectedNsec} from '../storage/nostrKeys';
import {generateNewKey, getPubkey, publishNostrProfile, signChallenge} from '../utils/nostr';
import type {LoginResponse} from '../types/auth';

export type RegisterStep = 'generating' | 'showKey' | 'profile' | 'registering';

interface LocalAvatar {
  uri: string;
  fileName: string;
  type: string;
}

export function useNostrRegister(onLogin: (data: LoginResponse) => void) {
  const {t} = useTranslation();
  const [step, setStep] = useState<RegisterStep>('generating');
  const [nsec, setNsec] = useState('');
  const [keyCopied, setKeyCopied] = useState(false);
  const [username, setUsername] = useState('');
  const [localAvatar, setLocalAvatar] = useState<LocalAvatar | null>(null);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [error, setError] = useState('');
  const pairKeyRef = useRef<NostrPairKey | null>(null);

  // Called once when the screen mounts — generates the key
  const generateKey = useCallback(async () => {
    try {
      const {pairKey, nsec: newNsec} = generateNewKey();
      pairKeyRef.current = pairKey;
      setNsec(newNsec);
      setStep('showKey');
    } catch {
      setError(t('nostrRegister.errors.generateFailed'));
    }
  }, [t]);

  const handleCopyKey = useCallback(() => {
    setKeyCopied(true);
  }, []);

  const handleContinueToProfile = useCallback(() => {
    setStep('profile');
  }, []);

  const handleAvatarPick = useCallback(() => {
    launchImageLibrary(
      {mediaType: 'photo', quality: 0.8, maxWidth: 800, maxHeight: 800},
      response => {
        if (response.didCancel || response.errorCode) return;
        const asset = response.assets?.[0];
        if (!asset?.uri) return;
        setLocalAvatar({
          uri: asset.uri,
          fileName: asset.fileName ?? 'avatar.jpg',
          type: asset.type ?? 'image/jpeg',
        });
      },
    );
  }, []);

  const handleCreateAccount = useCallback(async () => {
    const pairKey = pairKeyRef.current;
    if (!pairKey || !username.trim()) return;

    setStep('registering');
    setError('');

    try {
      const privkey = pairKey.getPrivateKey();
      const pubkey = getPubkey(privkey);

      // Get challenge and sign it to authenticate
      const {challenge} = await nostrChallenge(pubkey);
      const sig = signChallenge(challenge, privkey);

      // Create account on the server
      const data = await nostrLogin({
        pubkey,
        sig,
        challenge,
        username: username.trim(),
      });

      // Upload avatar if selected (requires token from login)
      let finalAvatarUrl: string | undefined;
      if (localAvatar) {
        try {
          setUploadingAvatar(true);
          finalAvatarUrl = await updateAvatar(
            data.token,
            data.playerId,
            localAvatar.uri,
            localAvatar.fileName,
            localAvatar.type,
          );
        } catch {
          // Best-effort — don't fail registration if avatar upload fails
        } finally {
          setUploadingAvatar(false);
        }
      }

      // Publish kind-0 profile to Nostr relays (best-effort)
      const pool = getAuthRelayPool();
      await publishNostrProfile(
        pairKey,
        username.trim(),
        finalAvatarUrl ?? null,
        pool,
      ).catch(() => {});

      // Save nsec in biometric-protected storage (best-effort)
      await saveProtectedNsec(nsec).catch(() => {});

      onLogin({...data, avatarUrl: finalAvatarUrl ?? data.avatarUrl, nostrNsec: nsec});
    } catch {
      setError(t('nostrRegister.errors.createFailed'));
      setStep('profile');
    }
  }, [username, localAvatar, onLogin, t]);

  return {
    step,
    nsec,
    keyCopied,
    username,
    setUsername,
    localAvatar,
    uploadingAvatar,
    error,
    generateKey,
    handleCopyKey,
    handleContinueToProfile,
    handleAvatarPick,
    handleCreateAccount,
    canContinue: keyCopied,
    canCreate: username.trim().length >= 3,
  };
}
