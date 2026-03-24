import 'react-native-get-random-values';
import {schnorr, secp256k1} from '@noble/curves/secp256k1';
import {sha256} from '@noble/hashes/sha2';
import {bytesToHex} from '../../utils/utils';
import {bech32} from 'bech32';

export class NostrPairKey {
  private readonly privkey: Uint8Array;

  constructor(privkey: Uint8Array) {
    this.privkey = privkey;
  }

  static fromNsec(nsec: string): NostrPairKey {
    const {prefix, words} = bech32.decode(nsec);
    if (prefix !== 'nsec') throw new Error('not_nsec');
    return new NostrPairKey(new Uint8Array(bech32.fromWords(words)));
  }

  static validateNsec(nsec: string): boolean {
    try {
      const {prefix} = bech32.decode(nsec);
      return prefix === 'nsec';
    } catch {
      return false;
    }
  }

  /** Returns the x-only 32-byte public key as a Uint8Array. */
  getPublicKey(): Uint8Array {
    return secp256k1.getPublicKey(this.privkey).slice(1);
  }

  /** Returns the x-only public key as a lowercase hex string. */
  getPublicKeyHex(): string {
    return bytesToHex(this.getPublicKey());
  }

  getPrivateKey(): Uint8Array {
    return this.privkey;
  }

  getPrivateKeyHex(): string {
    return bytesToHex(this.privkey);
  }

  /**
   * Signs a challenge using BIP-340 Schnorr.
   * The message is SHA-256(UTF-8(challenge)) — exactly 32 bytes as required.
   */
  signChallenge(challenge: string): string {
    const msgHash = sha256(new TextEncoder().encode(challenge));
    return bytesToHex(schnorr.sign(msgHash, this.privkey));
  }

  /** Generates a cryptographically secure random Nostr key pair. */
  static generateNew(): NostrPairKey {
    const privkey = new Uint8Array(32);
    crypto.getRandomValues(privkey);
    return new NostrPairKey(privkey);
  }

  /** Encodes the private key as an nsec1... bech32 string. */
  toNsec(): string {
    return bech32.encode('nsec', bech32.toWords(this.privkey));
  }

  /**
   * Signs a Nostr event ID (already a 32-byte SHA-256 hash as hex).
   * Does NOT apply sha256 again — the id is already the hash.
   */
  signEventId(idHex: string): string {
    const idBytes = new Uint8Array(idHex.match(/.{2}/g)!.map(b => parseInt(b, 16)));
    return bytesToHex(schnorr.sign(idBytes, this.privkey));
  }
}
