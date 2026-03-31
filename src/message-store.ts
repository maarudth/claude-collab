/**
 * Server-side message store for user messages pushed from the extension.
 *
 * Replaces evalWidget polling for /pending — messages are stored here
 * when the extension relays them, so /pending can read instantly without
 * a round-trip through the browser.
 */

interface UserMessage {
  text: string;
  selections?: any[];
}

const messages: UserMessage[] = [];
let lastReadIndex = 0;
let cancelRequested = false;
let idleFlag = false;

/** Push a user message (called when extension sends eventType: 'message'). */
export function pushMessage(text: string, selections?: any[]): void {
  const entry: UserMessage = { text };
  if (selections && selections.length > 0) entry.selections = selections;
  messages.push(entry);
}

/** Set the cancel flag (called when extension sends eventType: 'cancel'). */
export function requestCancel(): void {
  cancelRequested = true;
}

/**
 * Read unread messages and advance the cursor.
 * Also clears the idle flag (consuming means Claude is waking up).
 * Returns the unread messages (empty array if none).
 */
export function consumeMessages(): UserMessage[] {
  const unread: UserMessage[] = [];
  for (let i = lastReadIndex; i < messages.length; i++) {
    unread.push(messages[i]);
  }
  if (unread.length > 0) {
    lastReadIndex = messages.length;
    idleFlag = false;
  }
  return unread;
}

/** Set the idle flag (called by Stop hook via POST /idle). */
export function setIdle(): void {
  idleFlag = true;
}

/** Check whether Claude is idle. */
export function isIdle(): boolean {
  return idleFlag;
}

/**
 * Peek at unread messages without advancing the cursor.
 * Also returns and clears the cancel flag.
 */
export function peekAndCheckCancel(): { cancel: boolean; messages: string[] } {
  const wasCancelled = cancelRequested;
  cancelRequested = false;
  const msgs: string[] = [];
  for (let i = lastReadIndex; i < messages.length; i++) {
    msgs.push(messages[i].text);
  }
  return { cancel: wasCancelled, messages: msgs };
}

/**
 * Peek at unread messages without advancing the cursor.
 * Returns full message objects (text + selections).
 */
export function peekMessages(): UserMessage[] {
  const unread: UserMessage[] = [];
  for (let i = lastReadIndex; i < messages.length; i++) {
    unread.push(messages[i]);
  }
  return unread;
}

/** Check if the store has any messages (used to decide whether to use store vs evalWidget). */
export function isActive(): boolean {
  return messages.length > 0;
}

/** Reset the store (call on session close). */
export function reset(): void {
  messages.length = 0;
  lastReadIndex = 0;
  cancelRequested = false;
  idleFlag = false;
}
