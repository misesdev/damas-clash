/**
 * @deprecated Import from ./AppSigner instead.
 * Kept for backward compatibility only.
 */
export {
  appSignerGetPublicKey as amberGetPublicKey,
  appSignerSignEvent as amberSignEvent,
  isAppSignerAvailable as isAmberAvailable,
} from './AppSigner';
export type {
  SignedNostrEvent,
  UnsignedNostrEvent,
  AppSignerPublicKeyResult as AmberPublicKeyResult,
} from './AppSigner';
