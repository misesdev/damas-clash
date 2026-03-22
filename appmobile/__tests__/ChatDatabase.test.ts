/**
 * ChatDatabase — unit tests for the SQLite data-access layer.
 *
 * The react-native-sqlite-storage module is replaced by the in-memory mock
 * defined in __mocks__/react-native-sqlite-storage.ts. Each test resets the
 * database by calling chatDatabase.close(), which nulls the internal handle so
 * the next operation reopens a fresh empty in-memory instance.
 *
 * Tests cover:
 *  - open() creates the messages and settings tables
 *  - saveMessages() + loadMessages() round-trip (basic)
 *  - loadMessages() returns rows in chronological order (by sentAt)
 *  - loadMessages() returns an empty array when no messages are stored
 *  - saveMessages() persists all optional fields (avatarUrl, editedAt, replyTo)
 *  - saveMessages() persists null optional fields without error
 *  - saveMessages() persists isDeleted flag correctly
 *  - saveMessages() replaces all previous messages on each call (atomic swap)
 *  - saveMessages() caps storage at MAX_MESSAGES (100), keeping the latest
 *  - setLastViewed() + getLastViewed() round-trip
 *  - getLastViewed() returns null when never set
 *  - setLastViewed() updates an existing value
 *  - close() allows the database to be reopened cleanly
 */

import {ChatDatabase} from '../src/storage/ChatDatabase';
import type {ChatMessage} from '../src/hooks/useChatScreen';

// ─── Test fixture builders ────────────────────────────────────────────────────

function makeMessage(overrides: Partial<ChatMessage> & {id: string}): ChatMessage {
  return {
    id: overrides.id,
    playerId: overrides.playerId ?? 'player-1',
    username: overrides.username ?? 'alice',
    avatarUrl: overrides.avatarUrl ?? null,
    text: overrides.text ?? 'Hello',
    sentAt: overrides.sentAt ?? new Date().toISOString(),
    editedAt: overrides.editedAt ?? null,
    isDeleted: overrides.isDeleted ?? false,
    replyTo: overrides.replyTo ?? null,
  };
}

function isoAt(offsetMs: number): string {
  return new Date(Date.now() + offsetMs).toISOString();
}

// ─── Setup ────────────────────────────────────────────────────────────────────

// Use a fresh ChatDatabase instance per describe block so tests are isolated
// from each other and from the app singleton.
let db: ChatDatabase;

beforeEach(async () => {
  db = new ChatDatabase();
  // No explicit open() call — methods open lazily
});

afterEach(async () => {
  await db.close();
});

// ─── Schema ───────────────────────────────────────────────────────────────────

describe('ChatDatabase — schema initialisation', () => {
  it('opens without error and creates tables', async () => {
    await expect(db.open()).resolves.toBeUndefined();
  });

  it('calling open() twice is idempotent', async () => {
    await db.open();
    await expect(db.open()).resolves.toBeUndefined();
  });
});

// ─── Messages ─────────────────────────────────────────────────────────────────

describe('ChatDatabase — saveMessages / loadMessages', () => {
  it('returns an empty array when no messages are stored', async () => {
    const result = await db.loadMessages();
    expect(result).toEqual([]);
  });

  it('saves and loads a single message', async () => {
    const msg = makeMessage({id: 'msg-1', text: 'Hello world'});
    await db.saveMessages([msg]);
    const loaded = await db.loadMessages();
    expect(loaded).toHaveLength(1);
    expect(loaded[0]).toMatchObject({id: 'msg-1', text: 'Hello world'});
  });

  it('saves and loads multiple messages', async () => {
    const messages = [
      makeMessage({id: 'msg-1', sentAt: isoAt(-2000)}),
      makeMessage({id: 'msg-2', sentAt: isoAt(-1000)}),
      makeMessage({id: 'msg-3', sentAt: isoAt(0)}),
    ];
    await db.saveMessages(messages);
    const loaded = await db.loadMessages();
    expect(loaded).toHaveLength(3);
  });

  it('returns messages ordered by sentAt ascending', async () => {
    const messages = [
      makeMessage({id: 'msg-c', sentAt: isoAt(0)}),
      makeMessage({id: 'msg-a', sentAt: isoAt(-2000)}),
      makeMessage({id: 'msg-b', sentAt: isoAt(-1000)}),
    ];
    await db.saveMessages(messages);
    const loaded = await db.loadMessages();
    expect(loaded.map(m => m.id)).toEqual(['msg-a', 'msg-b', 'msg-c']);
  });

  it('replaces all previous messages on second save (atomic swap)', async () => {
    await db.saveMessages([makeMessage({id: 'old-1'}), makeMessage({id: 'old-2'})]);
    await db.saveMessages([makeMessage({id: 'new-1'})]);
    const loaded = await db.loadMessages();
    expect(loaded).toHaveLength(1);
    expect(loaded[0].id).toBe('new-1');
  });

  it('caps stored messages at MAX_MESSAGES (100), keeping the latest', async () => {
    const all = Array.from({length: 120}, (_, i) =>
      makeMessage({id: `msg-${i}`, sentAt: isoAt(i * 1000)}),
    );
    await db.saveMessages(all);
    const loaded = await db.loadMessages();
    expect(loaded).toHaveLength(100);
    // The last 100 messages (indices 20-119) must be kept
    expect(loaded[0].id).toBe('msg-20');
    expect(loaded[99].id).toBe('msg-119');
  });

  it('persists optional avatarUrl', async () => {
    const msg = makeMessage({id: 'msg-1', avatarUrl: 'https://cdn.example.com/avatar.jpg'});
    await db.saveMessages([msg]);
    const [loaded] = await db.loadMessages();
    expect(loaded.avatarUrl).toBe('https://cdn.example.com/avatar.jpg');
  });

  it('persists null avatarUrl', async () => {
    const msg = makeMessage({id: 'msg-1', avatarUrl: null});
    await db.saveMessages([msg]);
    const [loaded] = await db.loadMessages();
    expect(loaded.avatarUrl).toBeNull();
  });

  it('persists editedAt when set', async () => {
    const editedAt = new Date().toISOString();
    const msg = makeMessage({id: 'msg-1', editedAt});
    await db.saveMessages([msg]);
    const [loaded] = await db.loadMessages();
    expect(loaded.editedAt).toBe(editedAt);
  });

  it('persists null editedAt', async () => {
    const msg = makeMessage({id: 'msg-1', editedAt: null});
    await db.saveMessages([msg]);
    const [loaded] = await db.loadMessages();
    expect(loaded.editedAt).toBeNull();
  });

  it('persists isDeleted = true correctly', async () => {
    const msg = makeMessage({id: 'msg-1', isDeleted: true, text: ''});
    await db.saveMessages([msg]);
    const [loaded] = await db.loadMessages();
    expect(loaded.isDeleted).toBe(true);
  });

  it('persists isDeleted = false correctly', async () => {
    const msg = makeMessage({id: 'msg-1', isDeleted: false});
    await db.saveMessages([msg]);
    const [loaded] = await db.loadMessages();
    expect(loaded.isDeleted).toBe(false);
  });

  it('persists replyTo block with all fields', async () => {
    const msg = makeMessage({
      id: 'msg-1',
      replyTo: {id: 'orig-msg', username: 'bob', text: 'Original text'},
    });
    await db.saveMessages([msg]);
    const [loaded] = await db.loadMessages();
    expect(loaded.replyTo).toEqual({
      id: 'orig-msg',
      username: 'bob',
      text: 'Original text',
    });
  });

  it('persists null replyTo as null', async () => {
    const msg = makeMessage({id: 'msg-1', replyTo: null});
    await db.saveMessages([msg]);
    const [loaded] = await db.loadMessages();
    expect(loaded.replyTo).toBeNull();
  });

  it('saves an empty array without error', async () => {
    await db.saveMessages([makeMessage({id: 'msg-1'})]);
    await expect(db.saveMessages([])).resolves.toBeUndefined();
    const loaded = await db.loadMessages();
    expect(loaded).toHaveLength(0);
  });
});

// ─── Settings / last-viewed ───────────────────────────────────────────────────

describe('ChatDatabase — setLastViewed / getLastViewed', () => {
  it('returns null when last-viewed has never been set', async () => {
    const result = await db.getLastViewed();
    expect(result).toBeNull();
  });

  it('saves and retrieves a last-viewed timestamp', async () => {
    const ts = new Date().toISOString();
    await db.setLastViewed(ts);
    const result = await db.getLastViewed();
    expect(result).toBe(ts);
  });

  it('updates an existing last-viewed value (upsert)', async () => {
    await db.setLastViewed(isoAt(-5000));
    const updated = isoAt(0);
    await db.setLastViewed(updated);
    const result = await db.getLastViewed();
    expect(result).toBe(updated);
  });
});

// ─── Lifecycle ────────────────────────────────────────────────────────────────

describe('ChatDatabase — close and reopen', () => {
  it('can be used normally after close + reopen', async () => {
    await db.saveMessages([makeMessage({id: 'msg-1'})]);
    await db.close();
    // After close, the next operation reopens a fresh empty database
    const loaded = await db.loadMessages();
    expect(loaded).toHaveLength(0);
  });

  it('close() on an already-closed db is safe', async () => {
    await db.close();
    await expect(db.close()).resolves.toBeUndefined();
  });
});
