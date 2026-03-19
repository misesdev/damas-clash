import {useCallback, useState} from 'react';
import {useTranslation} from 'react-i18next';
import {nostrChallenge, nostrEventLogin} from '../api/auth';
import {appSignerGetPublicKey, appSignerSignEvent} from '../services/nostr/AppSigner';
import {NostrAuthService} from '../services/nostr/NostrAuthService';
import {fetchNostrProfile, npubToHex} from '../utils/nostr';
import type {LoginResponse} from '../types/auth';

type Status = 'idle' | 'loading' | 'signerLoading';

export function useNostrLogin(onLogin: (data: LoginResponse) => void) {
  const {t} = useTranslation();
  const [nsec, setNsec] = useState('');
  const [status, setStatus] = useState<Status>('idle');
  const [error, setError] = useState('');

  const handleLogin = useCallback(async () => {
    setStatus('loading');
    setError('');
    try {
      const data = await NostrAuthService.authenticate(nsec.trim());
      onLogin(data);
    } catch {
      setError(t('nostrLogin.errors.authFailed'));
      setStatus('idle');
    }
  }, [nsec, onLogin, t]);

  const handleSignerLogin = useCallback(async () => {
    setStatus('signerLoading');
    setError('');
    try {
      // Step 1: get the user's public key and signer package name.
      // Signer apps may return the pubkey as npub1... (bech32) instead of hex,
      // so always normalize to the 64-char hex format required by Nostr events.
      const {npub, package: signerPackage} = await appSignerGetPublicKey();
      const pubkey =  npubToHex(npub);
      // Step 2: get a one-time challenge from the API, bound to this pubkey
      const {challenge} = await nostrChallenge(pubkey);
      const unsignedEvent = {
        kind: 22242,
        created_at: Math.floor(Date.now() / 1000),
        tags: [['challenge', challenge]],
        content: 'Damas Clash authentication',
        pubkey
      };

      // Step 3: ask the signer to sign the event.
      // A small delay lets the Activity fully resume before launching a second
      // startActivityForResult, avoiding race conditions on some devices.
      await new Promise<void>(r => setTimeout(r, 400));
      const signedEvent = await appSignerSignEvent(unsignedEvent, pubkey, signerPackage);

      // Step 4: fetch Nostr profile for username/avatar (best-effort)
      const profile = await fetchNostrProfile(pubkey).catch(() => ({}));

      // Step 5: authenticate with our API using the signed event
      const data = await nostrEventLogin({
        event: signedEvent,
        username: (profile as any).name,
        avatarUrl: (profile as any).picture,
        lightningAddress: (profile as any).lud16,
      });
      onLogin(data);
    } catch (e: any) {
      const isAndroidOnly =
        e?.message === 'app_signer_android_only' ||
        e?.message === 'app_signer_module_missing';
      const isUserRejected = e?.code === 'USER_REJECTED';

      const msg = isAndroidOnly
        ? t('nostrLogin.errors.signerNotAvailable')
        : isUserRejected
        ? ''
        : t('nostrLogin.errors.authFailed');

      if (msg) setError(msg);
      setStatus('idle');
    }
  }, [onLogin, t]);

  return {
    nsec,
    setNsec,
    status,
    error,
    handleLogin,
    handleSignerLogin,
    canSubmit: status === 'idle' && nsec.trim().startsWith('nsec1'),
  };
}
