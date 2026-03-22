import SQLite from 'react-native-sqlite-storage';
import type {SQLiteDatabase} from 'react-native-sqlite-storage';
import type {ChatMessage} from '../hooks/useChatScreen';

// Enable promise-based API globally (idempotent)
SQLite.enablePromise(true);

const DB_NAME = 'chat_v1.db';
const MAX_MESSAGES = 100;

// ─── Schema ──────────────────────────────────────────────────────────────────

const SQL_CREATE_MESSAGES = `
  CREATE TABLE IF NOT EXISTS messages (
    id           TEXT PRIMARY KEY,
    playerId     TEXT NOT NULL,
    username     TEXT NOT NULL,
    avatarUrl    TEXT,
    text         TEXT NOT NULL,
    sentAt       TEXT NOT NULL,
    editedAt     TEXT,
    isDeleted    INTEGER NOT NULL DEFAULT 0,
    replyToId    TEXT,
    replyToUsername TEXT,
    replyToText  TEXT
  )
`;

const SQL_CREATE_SETTINGS = `
  CREATE TABLE IF NOT EXISTS settings (
    key   TEXT PRIMARY KEY,
    value TEXT NOT NULL
  )
`;

const LAST_VIEWED_KEY = 'last_viewed_at';

// ─── ChatDatabase ─────────────────────────────────────────────────────────────

/**
 * Data-access object for the local chat SQLite database.
 *
 * Responsibilities:
 *  - Create and migrate the schema on first open
 *  - Persist the last N chat messages (bounded to MAX_MESSAGES)
 *  - Track when the user last viewed the chat (for unread badge)
 *
 * Use the exported singleton `chatDatabase` — do not instantiate directly.
 */
export class ChatDatabase {
  private db: SQLiteDatabase | null = null;

  // ─── Lifecycle ─────────────────────────────────────────────────────────────

  async open(): Promise<void> {
    if (this.db) {return;}
    this.db = await SQLite.openDatabase({name: DB_NAME, location: 'default'});
    await this.db.executeSql(SQL_CREATE_MESSAGES);
    await this.db.executeSql(SQL_CREATE_SETTINGS);
  }

  async close(): Promise<void> {
    if (this.db) {
      await this.db.close();
      this.db = null;
    }
  }

  private async getDb(): Promise<SQLiteDatabase> {
    await this.open();
    return this.db!;
  }

  // ─── Messages ──────────────────────────────────────────────────────────────

  /**
   * Replaces the stored messages with the provided list (bounded to MAX_MESSAGES).
   * Uses a transaction so the delete + inserts are atomic.
   */
  async saveMessages(messages: ChatMessage[]): Promise<void> {
    const db = await this.getDb();
    const toSave = messages.slice(-MAX_MESSAGES);

    await db.transaction(tx => {
      tx.executeSql('DELETE FROM messages');

      for (const msg of toSave) {
        tx.executeSql(
          `INSERT OR REPLACE INTO messages
           (id, playerId, username, avatarUrl, text, sentAt, editedAt,
            isDeleted, replyToId, replyToUsername, replyToText)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            msg.id,
            msg.playerId,
            msg.username,
            msg.avatarUrl ?? null,
            msg.text,
            msg.sentAt,
            msg.editedAt ?? null,
            msg.isDeleted ? 1 : 0,
            msg.replyTo?.id ?? null,
            msg.replyTo?.username ?? null,
            msg.replyTo?.text ?? null,
          ],
        );
      }
    });
  }

  /** Returns all cached messages ordered chronologically. */
  async loadMessages(): Promise<ChatMessage[]> {
    const db = await this.getDb();
    const [result] = await db.executeSql(
      `SELECT id, playerId, username, avatarUrl, text, sentAt, editedAt,
              isDeleted, replyToId, replyToUsername, replyToText
       FROM messages
       ORDER BY sentAt ASC`,
    );

    const messages: ChatMessage[] = [];
    for (let i = 0; i < result.rows.length; i++) {
      const row = result.rows.item(i)!;
      messages.push({
        id: row.id,
        playerId: row.playerId,
        username: row.username,
        avatarUrl: row.avatarUrl ?? null,
        text: row.text,
        sentAt: row.sentAt,
        editedAt: row.editedAt ?? null,
        isDeleted: row.isDeleted === 1,
        replyTo: row.replyToId
          ? {id: row.replyToId, username: row.replyToUsername, text: row.replyToText}
          : null,
      });
    }
    return messages;
  }

  // ─── Last-viewed tracking ──────────────────────────────────────────────────

  /** Stores the current ISO timestamp as the user's last chat view time. */
  async setLastViewed(at: string): Promise<void> {
    const db = await this.getDb();
    await db.executeSql(
      'INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)',
      [LAST_VIEWED_KEY, at],
    );
  }

  /** Returns the stored last-viewed timestamp, or null if never set. */
  async getLastViewed(): Promise<string | null> {
    const db = await this.getDb();
    const [result] = await db.executeSql(
      'SELECT value FROM settings WHERE key = ?',
      [LAST_VIEWED_KEY],
    );
    if (result.rows.length === 0) {return null;}
    return result.rows.item(0)!.value;
  }
}

/** Singleton — shared across the entire app. */
export const chatDatabase = new ChatDatabase();
