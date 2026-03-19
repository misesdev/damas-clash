import type {NostrProfile} from '../nostr';

export const decodeNsec = jest.fn().mockImplementation((nsec: string) => {
  if (!nsec.startsWith('nsec1')) throw new Error('not_nsec');
  return new Uint8Array(32);
});

export const getPubkey = jest.fn().mockReturnValue('abc123pubkey');

export const npubToHex = jest.fn().mockReturnValue('abc123pubkey');

export const signChallenge = jest.fn().mockReturnValue('mock-sig-hex');

export const fetchNostrProfile = jest
  .fn()
  .mockResolvedValue({name: 'testuser', picture: undefined} satisfies NostrProfile);

export const pubkeyToShortNpub = jest
  .fn()
  .mockReturnValue('npub1abc123...defgh456');
