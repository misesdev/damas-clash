import { schnorr, secp256k1 } from '@noble/curves/secp256k1.js';
import { sha256 } from '@noble/hashes/sha2.js';
import { bech32 } from 'bech32';
import { nostrChallenge, nostrLogin } from '../../api/auth';
import type { LoginResponse } from '../../types/auth';

function bytesToHex(bytes: Uint8Array): string {
  return Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join('');
}

export class NostrKey {
  constructor(private readonly privkey: Uint8Array) {}

  static fromNsec(nsec: string): NostrKey {
    const { prefix, words } = bech32.decode(nsec);
    if (prefix !== 'nsec') throw new Error('not_nsec');
    return new NostrKey(new Uint8Array(bech32.fromWords(words)));
  }

  static validateNsec(nsec: string): boolean {
    try {
      const { prefix } = bech32.decode(nsec);
      return prefix === 'nsec';
    } catch {
      return false;
    }
  }

  getPubkeyHex(): string {
    return bytesToHex(secp256k1.getPublicKey(this.privkey).slice(1));
  }

  signChallenge(challenge: string): string {
    const msgHash = sha256(new TextEncoder().encode(challenge));
    return bytesToHex(schnorr.sign(msgHash, this.privkey));
  }
}

export class NostrAuthService {
  static async authenticate(nsec: string): Promise<LoginResponse> {
    const key = NostrKey.fromNsec(nsec.trim());
    const pubkey = key.getPubkeyHex();

    const [profile, { challenge }] = await Promise.all([
      NostrAuthService.fetchProfile(pubkey),
      nostrChallenge(),
    ]);

    return nostrLogin({
      pubkey,
      sig: key.signChallenge(challenge),
      challenge,
      username: profile?.name,
      avatarUrl: profile?.picture,
    });
  }

  private static async fetchProfile(pubkey: string): Promise<{ name?: string; picture?: string }> {
    const RELAYS = [
      'wss://relay.damus.io',
      'wss://nos.lol',
      'wss://relay.snort.social',
      'wss://relay.nostr.band',
    ];

    for (const relay of RELAYS) {
      try {
        const result = await NostrAuthService.fetchFromRelay(relay, pubkey);
        if (result) return result;
      } catch {
        // try next relay
      }
    }
    return {};
  }

  private static fetchFromRelay(relay: string, pubkey: string): Promise<{ name?: string; picture?: string } | null> {
    return new Promise(resolve => {
      const timeout = setTimeout(() => { ws.close(); resolve(null); }, 3000);
      const ws = new WebSocket(relay);

      ws.onopen = () => {
        ws.send(JSON.stringify(['REQ', 'sub1', { authors: [pubkey], kinds: [0], limit: 1 }]));
      };

      ws.onmessage = (e) => {
        try {
          const msg = JSON.parse(e.data as string);
          if (msg[0] === 'EVENT' && msg[1] === 'sub1') {
            const meta = JSON.parse(msg[2].content);
            clearTimeout(timeout);
            ws.close();
            resolve({ name: meta.name || meta.display_name, picture: meta.picture || meta.image });
          } else if (msg[0] === 'EOSE') {
            clearTimeout(timeout);
            ws.close();
            resolve(null);
          }
        } catch {
          clearTimeout(timeout);
          ws.close();
          resolve(null);
        }
      };

      ws.onerror = () => { clearTimeout(timeout); resolve(null); };
    });
  }
}

export function pubkeyToShortNpub(pubkeyHex: string): string {
  const bytes = new Uint8Array(pubkeyHex.match(/.{2}/g)!.map(b => parseInt(b, 16)));
  const npub = bech32.encode('npub', bech32.toWords(bytes));
  return `${npub.slice(0, 12)}...${npub.slice(-8)}`;
}
