import {RelayPool} from './RelayPool';

const AUTH_RELAYS = [
  'wss://relay.damus.io',
  'wss://nos.lol',
  'wss://relay.nostr.band',
  'wss://relay.primal.net',
  'wss://nostr.mom',
];

let _pool: RelayPool | null = null;
let _connectPromise: Promise<RelayPool> | null = null;

export async function connectAuthRelays(): Promise<RelayPool> {
  if (_pool) return _pool;
  if (!_connectPromise) {
    _connectPromise = (async () => {
      const p = new RelayPool(AUTH_RELAYS, 4000);
      await p.connect();
      _pool = p;
      return p;
    })();
  }
  return _connectPromise;
}

export function disconnectAuthRelays(): void {
  _connectPromise = null;
  if (_pool) {
    _pool.disconnect();
    _pool = null;
  }
}

export function getAuthRelayPool(): RelayPool | null {
  return _pool;
}
