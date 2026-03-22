import {chatDatabase} from './ChatDatabase';
import type {ChatMessage} from '../hooks/useChatScreen';

/**
 * High-level chat cache facade.
 *
 * Delegates all persistence to ChatDatabase and swallows errors so that
 * cache failures never crash the UI.
 */

export async function saveCachedMessages(messages: ChatMessage[]): Promise<void> {
  try {
    await chatDatabase.saveMessages(messages);
  } catch { /* silently ignore storage errors */ }
}

export async function loadCachedMessages(): Promise<ChatMessage[]> {
  try {
    return await chatDatabase.loadMessages();
  } catch {
    return [];
  }
}

export async function markChatViewed(): Promise<void> {
  try {
    await chatDatabase.setLastViewed(new Date().toISOString());
  } catch { /* silently ignore */ }
}

export async function hasUnreadChatMessages(): Promise<boolean> {
  try {
    const [messages, lastViewed] = await Promise.all([
      chatDatabase.loadMessages(),
      chatDatabase.getLastViewed(),
    ]);
    if (messages.length === 0) {return false;}
    if (!lastViewed) {return true;}
    return messages[messages.length - 1].sentAt > lastViewed;
  } catch {
    return false;
  }
}
