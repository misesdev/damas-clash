import * as Keychain from 'react-native-keychain';

const SERVICE = 'damas.activegame';

export async function saveActiveGameId(gameId: string): Promise<void> {
  await Keychain.setGenericPassword('activegame', gameId, {
    service: SERVICE,
    accessible: Keychain.ACCESSIBLE.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
  });
}

export async function loadActiveGameId(): Promise<string | null> {
  const result = await Keychain.getGenericPassword({service: SERVICE});
  if (!result) {return null;}
  return result.password;
}

export async function clearActiveGameId(): Promise<void> {
  await Keychain.resetGenericPassword({service: SERVICE});
}
