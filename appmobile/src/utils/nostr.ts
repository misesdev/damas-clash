import {bech32} from 'bech32';
import {NostrPairKey} from '../services/nostr/NostrPairKey';
import {RelayPool} from '../services/nostr/RelayPool';

export interface NostrProfile {
  name?: string;
  picture?: string;
  lud16?: string;
  lud06?: string;
}

// ---------------------------------------------------------------------------
// Key & signing — delegates to NostrPairKey
// ---------------------------------------------------------------------------

export function decodeNsec(nsec: string): Uint8Array {
  return NostrPairKey.fromNsec(nsec).getPrivateKey();
}

export function getPubkey(privkey: Uint8Array): string {
  return new NostrPairKey(privkey).getPublicKeyHex();
}

export function signChallenge(challenge: string, privkey: Uint8Array): string {
  return new NostrPairKey(privkey).signChallenge(challenge);
}

/**
 * Converts an npub1... bech32 public key to a 64-char lowercase hex string.
 * If the value is already hex (64 hex chars) it is returned as-is, so this
 * function is safe to call regardless of which format the signer returns.
 */
export function npubToHex(pubkey: string): string {
  if (/^[0-9a-fA-F]{64}$/.test(pubkey)) return pubkey.toLowerCase();
  const {prefix, words} = bech32.decode(pubkey);
  if (prefix !== 'npub') throw new Error('not_npub');
  return Array.from(bech32.fromWords(words))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

/**
 * Converts a 64-char hex pubkey to a shortened npub.
 * Example: "npub1ghsdh...sdjyguedf"
 */
export function pubkeyToShortNpub(pubkeyHex: string): string {
  const pubBytes = new Uint8Array(
    pubkeyHex.match(/.{2}/g)!.map(byte => parseInt(byte, 16)),
  );
  const npub = bech32.encode('npub', bech32.toWords(pubBytes));
  return `${npub.slice(0, 12)}...${npub.slice(-8)}`;
}

// ---------------------------------------------------------------------------
// Profile fetching — delegates to RelayPool
// ---------------------------------------------------------------------------

const PROFILE_RELAYS = [
  'wss://nostr.mom',
  'wss://relay.damus.io',
  'wss://nos.lol',
  'wss://nostr.land',
  'wss://relay.snort.social',
  'wss://relay.nostr.band',
  'wss://relay.primal.net',
  'wss://relay.noswhere.com',
  'wss://relay.nostr.bg',
  'wss://nostr.wine',
  'wss://nostr.bitcoiner.social',
  'wss://relay.0xchat.com'
];

export async function fetchNostrProfile(
  pubkey: string,
  relays: string[] = PROFILE_RELAYS,
  timeoutMs = 3000,
): Promise<NostrProfile> {
  const pool = new RelayPool(relays, timeoutMs);
  await pool.connect();
  try {
    const event = await pool.fetchProfile(pubkey);
    if (!event) return {};
    const meta = JSON.parse(event.content) as Record<string, string>;
    return {
      name: meta.name || meta.display_name || meta.displayName,
      picture: meta.picture || meta.image,
      lud16: meta.lud16 || undefined,
      lud06: meta.lud06 || undefined,
    };
  } catch {
    return {};
  } finally {
    pool.disconnect();
  }
}
