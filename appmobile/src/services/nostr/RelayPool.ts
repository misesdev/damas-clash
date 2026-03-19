import {distinctEvent} from '../../utils/utils';
import type {NostrEvent} from './types/NostrEvent';
import type {NostrFilter} from './types/NostrFilter';

const SUBSCRIPTION_ID = '3da9794398579582309458';

export class RelayPool {
  private readonly relays: string[];
  private sockets: WebSocket[] = [];
  readonly timeout: number;

  constructor(relays: string[], timeout = 3000) {
    if (relays.length === 0) throw new Error('expected at least one relay');
    this.relays = relays;
    this.timeout = timeout;
  }

  // ---------------------------------------------------------------------------
  // Connection
  // ---------------------------------------------------------------------------

  private connectOne(relay: string): Promise<WebSocket | null> {
    return new Promise(resolve => {
      const ws = new WebSocket(relay);

      const cleanup = (result: WebSocket | null) => {
        clearTimeout(timer);
        // Close the socket when we won't use it, preventing resource leaks.
        // Without this, sockets that timeout while still CONNECTING remain
        // open indefinitely and can exhaust the WebSocket connection pool,
        // causing subsequent SignalR connections to fail.
        if (result === null) {
          try { ws.close(); } catch { /* ignore */ }
        }
        resolve(result);
      };

      const timer = setTimeout(() => cleanup(null), this.timeout);

      ws.onopen = () => cleanup(ws);
      ws.onerror = () => cleanup(null);
    });
  }

  async connect(): Promise<void> {
    const results = await Promise.all(this.relays.map(r => this.connectOne(r).catch(() => null)));
    this.sockets = results.filter((ws): ws is WebSocket => ws !== null);
  }

  disconnect(): void {
    for (const ws of this.sockets) {
      try { ws.close(); } catch { /* ignore */ }
    }
    this.sockets = [];
  }

  // ---------------------------------------------------------------------------
  // Fetching
  // ---------------------------------------------------------------------------

  private fetchFromSocket(ws: WebSocket, filter: NostrFilter): Promise<NostrEvent[]> {
    return new Promise(resolve => {
      const collected: NostrEvent[] = [];

      const onMessage = (e: MessageEvent) => {
        try {
          const msg = JSON.parse(e.data as string);
          if (msg[0] === 'EVENT' && msg[1] === SUBSCRIPTION_ID) {
            collected.push(msg[2] as NostrEvent);
          } else if (msg[0] === 'EOSE' && msg[1] === SUBSCRIPTION_ID) {
            finish();
          }
        } catch { /* ignore malformed messages */ }
      };

      const finish = () => {
        clearTimeout(timer);
        ws.removeEventListener('message', onMessage);
        resolve(collected);
      };

      const timer = setTimeout(finish, this.timeout);
      ws.addEventListener('message', onMessage);
      ws.send(JSON.stringify(['REQ', SUBSCRIPTION_ID, filter]));
    });
  }

  async fetchEvents(filter: NostrFilter): Promise<NostrEvent[]> {
    const results = await Promise.all(
      this.sockets.map(ws => this.fetchFromSocket(ws, filter).catch(() => [] as NostrEvent[])),
    );
    return distinctEvent(results.flat());
  }

  async fetchProfile(pubkey: string): Promise<NostrEvent | null> {
    const events = await this.fetchEvents({authors: [pubkey], kinds: [0], limit: 1});
    return events[0] ?? null;
  }
}
