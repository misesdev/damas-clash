/**
 * chatCache — unit tests for the high-level cache facade.
 *
 * chatCache delegates to the ChatDatabase singleton, so this suite tests the
 * full integration: facade → ChatDatabase → in-memory SQLite mock. It also
 * verifies that the facade swallows errors rather than propagating them.
 *
 * Tests cover:
 *  - loadCachedMessages() returns [] when cache is empty
 *  - saveCachedMessages() + loadCachedMessages() round-trip
 *  - saveCachedMessages() replaces previous messages
 *  - hasUnreadChatMessages() returns false when cache is empty
 *  - hasUnreadChatMessages() returns true when no lastViewed is stored
 *  - hasUnreadChatMessages() returns false when latest sentAt <= lastViewed
 *  - hasUnreadChatMessages() returns true when latest sentAt > lastViewed
 *  - markChatViewed() advances lastViewed so subsequent hasUnread returns false
 *  - All functions return gracefully when the database throws (error resilience)
 */

import {
  saveCachedMessages,
  loadCachedMessages,
  markChatViewed,
  hasUnreadChatMessages,
} from '../src/storage/chatCache';
import {chatDatabase} from '../src/storage/ChatDatabase';
import type {ChatMessage} from '../src/hooks/useChatScreen';

// ─── Test fixture builders ────────────────────────────────────────────────────

function makeMessage(id: string, sentAt: string, overrides?: Partial<ChatMessage>): ChatMessage {
  return {
    id,
    playerId: 'player-1',
    username: 'alice',
    avatarUrl: null,
    text: `Message ${id}`,
    sentAt,
    editedAt: null,
    isDeleted: false,
    replyTo: null,
    ...overrides,
  };
}

function isoAt(offsetMs: number): string {
  return new Date(1_700_000_000_000 + offsetMs).toISOString();
}

// ─── Isolation: reset the database singleton before each test ─────────────────

beforeEach(async () => {
  // close() nulls the internal handle → next operation opens a fresh empty db
  await chatDatabase.close();
});

// ─── loadCachedMessages ───────────────────────────────────────────────────────

describe('loadCachedMessages', () => {
  it('returns an empty array when the cache is empty', async () => {
    const result = await loadCachedMessages();
    expect(result).toEqual([]);
  });

  it('returns previously saved messages', async () => {
    const messages = [
      makeMessage('m1', isoAt(0)),
      makeMessage('m2', isoAt(1000)),
    ];
    await saveCachedMessages(messages);
    const loaded = await loadCachedMessages();
    expect(loaded).toHaveLength(2);
    expect(loaded[0].id).toBe('m1');
    expect(loaded[1].id).toBe('m2');
  });

  it('returns messages ordered chronologically', async () => {
    await saveCachedMessages([
      makeMessage('m3', isoAt(2000)),
      makeMessage('m1', isoAt(0)),
      makeMessage('m2', isoAt(1000)),
    ]);
    const loaded = await loadCachedMessages();
    expect(loaded.map(m => m.id)).toEqual(['m1', 'm2', 'm3']);
  });

  it('returns [] when the database throws', async () => {
    jest.spyOn(chatDatabase, 'loadMessages').mockRejectedValueOnce(new Error('db error'));
    const result = await loadCachedMessages();
    expect(result).toEqual([]);
  });
});

// ─── saveCachedMessages ───────────────────────────────────────────────────────

describe('saveCachedMessages', () => {
  it('replaces previous cache contents on each call', async () => {
    await saveCachedMessages([makeMessage('old', isoAt(0))]);
    await saveCachedMessages([makeMessage('new', isoAt(1000))]);
    const loaded = await loadCachedMessages();
    expect(loaded).toHaveLength(1);
    expect(loaded[0].id).toBe('new');
  });

  it('persists a message with all optional fields', async () => {
    const msg = makeMessage('m1', isoAt(0), {
      avatarUrl: 'https://cdn.example.com/a.jpg',
      editedAt: isoAt(500),
      isDeleted: false,
      replyTo: {id: 'original', username: 'bob', text: 'Hi'},
    });
    await saveCachedMessages([msg]);
    const [loaded] = await loadCachedMessages();
    expect(loaded.avatarUrl).toBe('https://cdn.example.com/a.jpg');
    expect(loaded.editedAt).toBe(isoAt(500));
    expect(loaded.replyTo).toEqual({id: 'original', username: 'bob', text: 'Hi'});
  });

  it('persists an isDeleted = true message', async () => {
    await saveCachedMessages([makeMessage('m1', isoAt(0), {isDeleted: true, text: ''})]);
    const [loaded] = await loadCachedMessages();
    expect(loaded.isDeleted).toBe(true);
  });

  it('does not throw when the database throws', async () => {
    jest.spyOn(chatDatabase, 'saveMessages').mockRejectedValueOnce(new Error('disk full'));
    await expect(saveCachedMessages([makeMessage('m1', isoAt(0))])).resolves.toBeUndefined();
  });
});

// ─── hasUnreadChatMessages ────────────────────────────────────────────────────

describe('hasUnreadChatMessages', () => {
  it('returns false when the cache is empty', async () => {
    expect(await hasUnreadChatMessages()).toBe(false);
  });

  it('returns true when messages exist but lastViewed was never set', async () => {
    await saveCachedMessages([makeMessage('m1', isoAt(0))]);
    expect(await hasUnreadChatMessages()).toBe(true);
  });

  it('returns true when latest message sentAt is after lastViewed', async () => {
    await saveCachedMessages([makeMessage('m1', isoAt(2000))]);
    await chatDatabase.setLastViewed(isoAt(1000));
    expect(await hasUnreadChatMessages()).toBe(true);
  });

  it('returns false when latest message sentAt equals lastViewed', async () => {
    const ts = isoAt(0);
    await saveCachedMessages([makeMessage('m1', ts)]);
    await chatDatabase.setLastViewed(ts);
    expect(await hasUnreadChatMessages()).toBe(false);
  });

  it('returns false when latest message sentAt is before lastViewed', async () => {
    await saveCachedMessages([makeMessage('m1', isoAt(0))]);
    await chatDatabase.setLastViewed(isoAt(2000));
    expect(await hasUnreadChatMessages()).toBe(false);
  });

  it('compares against the latest (most recent) message in the cache', async () => {
    // Two messages: only the latest sentAt matters
    await saveCachedMessages([
      makeMessage('m1', isoAt(0)),
      makeMessage('m2', isoAt(3000)),
    ]);
    // lastViewed between the two messages → still unread (newest is after lastViewed)
    await chatDatabase.setLastViewed(isoAt(1000));
    expect(await hasUnreadChatMessages()).toBe(true);
  });

  it('returns false when database throws', async () => {
    jest.spyOn(chatDatabase, 'loadMessages').mockRejectedValueOnce(new Error('io'));
    expect(await hasUnreadChatMessages()).toBe(false);
  });
});

// ─── markChatViewed ───────────────────────────────────────────────────────────

describe('markChatViewed', () => {
  it('marks unread messages as read', async () => {
    await saveCachedMessages([makeMessage('m1', isoAt(-5000))]);
    // Before marking: unread because no lastViewed
    expect(await hasUnreadChatMessages()).toBe(true);
    await markChatViewed();
    // After marking: lastViewed is now (well after isoAt(-5000))
    expect(await hasUnreadChatMessages()).toBe(false);
  });

  it('records a timestamp that is at least as recent as the current time', async () => {
    const before = new Date().toISOString();
    await markChatViewed();
    const stored = await chatDatabase.getLastViewed();
    expect(stored).not.toBeNull();
    expect(stored! >= before).toBe(true);
  });

  it('does not throw when the database throws', async () => {
    jest.spyOn(chatDatabase, 'setLastViewed').mockRejectedValueOnce(new Error('io'));
    await expect(markChatViewed()).resolves.toBeUndefined();
  });

  it('calling markChatViewed twice updates to the latest timestamp', async () => {
    await markChatViewed();
    const first = await chatDatabase.getLastViewed();

    // Small delay to ensure the second timestamp is strictly newer
    await new Promise(r => setTimeout(r, 5));
    await markChatViewed();
    const second = await chatDatabase.getLastViewed();

    expect(second! > first!).toBe(true);
  });
});
