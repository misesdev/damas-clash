import * as Keychain from 'react-native-keychain';

const BIOMETRIC_SERVICE = 'damas.nsec.biometric';

/** Returns true if the device supports biometric (or passcode) authentication. */
export async function hasBiometry(): Promise<boolean> {
  return (await Keychain.getSupportedBiometryType()) !== null;
}

/**
 * Saves the nsec in a biometrically-protected Keychain entry.
 * No-op if biometry is not available on the device.
 */
export async function saveProtectedNsec(nsec: string): Promise<void> {
  const biometryType = await Keychain.getSupportedBiometryType();
  if (!biometryType) return;

  await Keychain.setGenericPassword('nsec', nsec, {
    service: BIOMETRIC_SERVICE,
    accessControl: Keychain.ACCESS_CONTROL.BIOMETRY_ANY_OR_DEVICE_PASSCODE,
    accessible: Keychain.ACCESSIBLE.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
  });
}

/**
 * Retrieves nsec from biometric-protected storage, triggering the biometric
 * prompt if available. Returns null if biometry is unavailable, the entry
 * does not exist, or the user cancels / fails authentication.
 */
export async function getProtectedNsec(
  title: string,
  cancel: string,
): Promise<string | null> {
  try {
    const result = await Keychain.getGenericPassword({
      service: BIOMETRIC_SERVICE,
      authenticationPrompt: {title, cancel},
    });
    return result ? result.password : null;
  } catch {
    return null;
  }
}

export async function clearProtectedNsec(): Promise<void> {
  await Keychain.resetGenericPassword({service: BIOMETRIC_SERVICE});
}
