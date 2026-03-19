/**
 * NIP-55 Android App Signer bridge.
 *
 * Communicates with any installed NIP-55 signer app (e.g. Amber, nos2x-phone)
 * via the native AppSignerModule (see AmberSignerModule.kt — class AppSignerModule).
 */
import {NativeModules, Platform} from 'react-native';

export interface SignedNostrEvent {
  id: string;
  pubkey: string;
  created_at: number;
  kind: number;
  tags: string[][];
  content: string;
  sig: string;
}

export interface UnsignedNostrEvent {
  kind: number;
  created_at: number;
  tags: string[][];
  content: string;
  pubkey?: string;
}

export interface AppSignerPublicKeyResult {
  npub: string;
  package: string;
}

const {AppSigner: NativeAppSigner} = NativeModules;

function assertAndroid(): void {
  if (Platform.OS !== 'android') throw new Error('app_signer_android_only');
  if (!NativeAppSigner) throw new Error('app_signer_module_missing');
}

/**
 * Asks the NIP-55 signer app for the user's public key.
 * Launches the signer via startActivityForResult (NIP-55 get_public_key).
 */
export async function appSignerGetPublicKey(): Promise<AppSignerPublicKeyResult> {
  assertAndroid();
  return NativeAppSigner.getPublicKey();
}

/**
 * Asks the NIP-55 signer app to sign a Nostr event.
 * Launches the signer via startActivityForResult (NIP-55 sign_event).
 * Returns the full signed event.
 */
export async function appSignerSignEvent(
  event: UnsignedNostrEvent,
  currentUserPubkey: string,
  signerPackage: string,
): Promise<SignedNostrEvent> {
  assertAndroid();
  const eventJson = JSON.stringify(event);
  const signedJson: string = await NativeAppSigner.signEvent(
    eventJson,
    currentUserPubkey,
    signerPackage,
  );
  return JSON.parse(signedJson) as SignedNostrEvent;
}

/** Returns true when the NIP-55 module is available (Android only). */
export function isAppSignerAvailable(): boolean {
  return Platform.OS === 'android' && !!NativeAppSigner;
}
