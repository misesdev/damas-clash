import * as Keychain from 'react-native-keychain';
import type {LoginResponse} from '../types/auth';

const SERVICE = 'damas.session';

export async function saveSession(data: LoginResponse): Promise<void> {
  await Keychain.setGenericPassword('session', JSON.stringify(data), {
    service: SERVICE,
    accessible: Keychain.ACCESSIBLE.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
  });
}

export async function loadSession(): Promise<LoginResponse | null> {
  const result = await Keychain.getGenericPassword({service: SERVICE});
  if (!result) return null;
  return JSON.parse(result.password) as LoginResponse;
}

export async function clearSession(): Promise<void> {
  await Keychain.resetGenericPassword({service: SERVICE});
}
