# Feature Area Index

> **Purpose:** Quick lookup to find the right context file for a feature area.
> **Protocol:** When user asks about a feature, match keywords below -> read that area file FIRST.

## Area Mapping

| Area | Keywords | File |
|------|----------|------|
| **Extension Relay** | extension, relay, screenshot, message relay, content script, service worker, WebSocket, port, widget communication | [extension-relay.md](./extension-relay.md) |
| **Message Delivery** | message, pending, listener, hooks, cancel, idle, event-hook, stop-hook, cancel-hook, piggyback | [message-delivery.md](./message-delivery.md) |
| **Widget UI** | widget, chat, preview, inspector, voice, TTS, collab-widget, UI buttons, screenshot buttons | [widget-ui.md](./widget-ui.md) |
| **MCP Tools** | tool, scan, browse, act, navigate, screenshot tool, evaluate, extract, preview, options | [mcp-tools.md](./mcp-tools.md) |

## How This Works

### Before Starting Work
1. **Match keywords**: Scan user's question for keywords above
2. **Read AREA file**: Load the matching area file(s) BEFORE exploring code
3. **Skip exploration**: The AREA file tells you where files are - go directly there

### After Completing Work
1. **Update the AREA file** with new files, architecture changes, gotchas, and session references
2. **Keep context fresh** for next time

## Adding New Areas

When a new feature area emerges (touched 3+ sessions), create a new file using the template in the existing area files.
