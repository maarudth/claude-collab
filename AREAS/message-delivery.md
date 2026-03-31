# Message Delivery Context

> Last updated: 2026-03-31

## Quick Reference

| File | Purpose |
|------|---------|
| `src/message-store.ts` | Server-side store — `pushMessage()`, `requestCancel()`, `peekMessages()`, `consumeMessages()` |
| `src/pending-handler.ts` | HTTP handlers for `/pending`, `/peek`, `/cancel`, `/idle` endpoints |
| `src/extension-transport.ts` | Receives unsolicited `event` messages from extension, stores via `pushMessage()` |
| `scripts/listener.cjs` | Background polling — hits `/peek` and `/idle`, wakes Claude when messages arrive |
| `scripts/cancel-hook.cjs` | PreToolUse hook — hits `/cancel` to check for user messages/cancels mid-work |
| `scripts/event-hook.cjs` | PostToolUse hook — delivers queued messages after tool calls |
| `scripts/stop-hook.cjs` | Stop hook — POST `/idle` to signal Claude is idle |
| `scripts/session-hook.cjs` | Session start — outputs COLLAB-SETUP with listener command |
| `scripts/notify-hook.js` | Permission prompt — POST `/notify` to play sound + show message in widget |
| `src/tools/chat.ts` | `design_chat` tool — sends message to widget, appends pending messages to response |
| `src/tools/inbox.ts` | `design_inbox` tool — consumes pending messages |

## Architecture

### Message Flow: User -> Claude

```
User types in widget -> widget sends via relay chain -> extension-transport receives 'event' message
  -> pushMessage() stores in message-store -> consumed via:
    (a) /pending HTTP endpoint (listener.cjs polls this)
    (b) /peek HTTP endpoint (cancel-hook.cjs checks this)
    (c) /cancel HTTP endpoint (cancel-hook.cjs checks this)
    (d) Piggyback: appended to any tool response
```

### Listener vs Hooks

- **Listener** (`listener.cjs`): Runs as background Bash process. Polls `/peek` every 2s. When messages found AND Claude is idle (`/idle` returns true), outputs them to wake Claude.
- **Cancel hook** (`cancel-hook.cjs`): PreToolUse hook. Checks `/cancel` before each tool call. If user sent a message or cancel, blocks the tool and delivers the message.
- **Event hook** (`event-hook.cjs`): PostToolUse hook. Appends pending messages to tool output so Claude sees them naturally.
- **Stop hook** (`stop-hook.cjs`): Sets idle flag so listener knows when to deliver messages.

### Peek-Defer-Consume Pattern

- **Peek**: Read messages without consuming (non-destructive)
- **Defer**: If a hook peeks messages during a tool call, it defers delivery to the event hook
- **Consume**: Only consume (advance cursor) when actually delivering to Claude

## Gotchas

- **Listener must be started manually** after `design_browse`. The session hook outputs instructions but Claude must run the command.
- **Idle flag ownership:** Only the stop-hook sets idle=true, only the listener consumes while idle. Prevents race conditions.
- **PID file** (`.listener-pid`): Ensures single listener instance. Check/clean if listener seems stuck.

## Recent Sessions

| Date | Changes |
|------|---------|
| 2026-03-31 | (reference only — no changes this session) |
