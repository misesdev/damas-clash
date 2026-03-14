import {nostrChallenge, nostrLogin} from '../../api/auth';
import {decodeNsec, fetchNostrProfile, getPubkey, signChallenge} from '../../utils/nostr';
import type {LoginResponse} from '../../types/auth';

export class NostrAuthService {
  /**
   * Authenticates a user via Nostr nsec key.
   * Fetches the challenge and profile in parallel, signs the challenge,
   * then exchanges the signature for a session token.
   */
  static async authenticate(nsec: string): Promise<LoginResponse> {
    const privkey = decodeNsec(nsec);
    const pubkey = getPubkey(privkey);

    const [profile, {challenge}] = await Promise.all([
      fetchNostrProfile(pubkey),
      nostrChallenge(),
    ]);

    // Prefer lud16 (Lightning Address format) over lud06 (LNURL bech32)
    const lightningAddress = profile.lud16 || undefined;

    return nostrLogin({
      pubkey,
      sig: signChallenge(challenge, privkey),
      challenge,
      username: profile.name,
      avatarUrl: profile.picture,
      lightningAddress,
    });
  }
}
