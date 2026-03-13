import {useCallback, useEffect, useState} from 'react';
import {getWallet} from '../api/wallet';
import type {LoginResponse} from '../types/auth';
import type {WalletResponse} from '../types/wallet';

export function useWallet(user: LoginResponse) {
  const [wallet, setWallet] = useState<WalletResponse | null>(null);
  const [loading, setLoading] = useState(false);

  const fetchWallet = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getWallet(user.token);
      setWallet(data);
    } catch {
      // silently ignore
    } finally {
      setLoading(false);
    }
  }, [user.token]);

  useEffect(() => {
    fetchWallet();
  }, [fetchWallet]);

  return {wallet, loading, fetchWallet};
}
