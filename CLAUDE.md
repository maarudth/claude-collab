# Design Collab MCP Server

An MCP server that gives Claude real-time browser control for collaborative UI/UX design. The user communicates through a chat widget in the browser, not the terminal.

## Project Structure

```
src/                    # MCP server (TypeScript, ESM)
  index.ts              # Server entry — registers all tools
  transport.ts          # Transport abstraction (Playwright | Extension)
  playwright-transport.ts
  extension-transport.ts
  ws-server.ts          # WebSocket server for extension communication
  message-store.ts      # Server-side message store (pending/peek/cancel)
  pending-handler.ts    # HTTP endpoints for /pending, /peek, /cancel, /idle
  capture.ts            # Screenshot helpers
  widget.ts             # Widget injection (Playwright mode)
  tools/                # One file per MCP tool (30+ tools)
widget/                 # Browser-side widget (vanilla JS, injected into pages)
  collab-widget.js      # Main chat UI, screenshot buttons, preview panel
  voice-module.js       # Mic/TTS integration
  inspector-panel.js    # Element inspector overlay
  iframe-bridge.js      # Cross-frame communication (tabs/single mode)
  tab-manager.js        # Tab bar UI (tabs mode only)
extension/              # Chrome extension (TypeScript, built via esbuild)
  src/service-worker.ts # Background — WS client, tab management, screenshot capture
  src/content-script.ts # ISOLATED world — relays messages between MAIN world and service worker
  src/relay-inject.ts   # MAIN world — MessageChannel bridge between widget and content script
  src/popup.ts          # Extension popup UI (connect/disconnect)
  dist/                 # Built extension (tracked in git for Chrome loading)
scripts/                # Claude Code hooks
  cancel-hook.cjs       # PreToolUse — intercepts user messages mid-work
  event-hook.cjs        # PostToolUse — delivers queued messages after tool calls
  listener.cjs          # Background polling — wakes Claude when idle
  stop-hook.cjs         # Stop hook — sets idle flag
  session-hook.cjs      # Session start — outputs COLLAB-SETUP instructions
  notify-hook.js        # Permission prompt notifications
```

## Build & Dev

- **MCP server:** No build step — `tsx` runs TypeScript directly. Registered in Claude Code's MCP config.
- **Extension:** `npm run build:ext` (or `node extension/build.mjs`). Bundles TS sources + concatenates widget JS into `extension/dist/`. Load as unpacked extension in Chrome.
- **Type check:** `npm run typecheck`

## Three Transport Modes

| Mode | How it works | When to use |
|------|-------------|-------------|
| **tabs** | Playwright browser, multi-tab via iframes | Default, comparing sites |
| **single** | Playwright browser, direct page injection | Sites that block iframes |
| **extension** | User's real Chrome via WebSocket + extension | Auth sessions, real browser |

## Extension Message Flow

The extension relay chain has 4 layers — messages traverse all of them:

```
Widget (MAIN world)
  ↕ MessagePort (private channel)
relay-inject.ts (MAIN world)
  ↕ window.postMessage (__dcRelay tag)
content-script.ts (ISOLATED world)
  ↕ chrome.runtime.sendMessage
service-worker.ts (background)
  ↕ WebSocket
MCP server (Node.js)
```

**Key invariant:** requestIds must be preserved end-to-end. The widget creates a requestId for callbacks; relay-inject creates a separate internal ID for the window postMessage round-trip but must echo the widget's ID back through the port.

## Extension Features

- **Full-page screenshot:** Uses Chrome Debugger Protocol (`chrome.debugger` API) with `Emulation.setDeviceMetricsOverride` to expand viewport to full content size before capture. Attaches/detaches per-capture — debug bar flashes briefly. Requires `debugger` permission in manifest.
- **Follow tabs:** When enabled, widget auto-injects into any tab the user switches to. Toggle via extension popup ("Follow Tabs" button) or widget header (⇄ button). Setting persists in `chrome.storage.local`. Service worker notifies MCP server of tab switches so `activeTabId` stays current.
- **Cross-tab chat sync:** Service worker is the central hub for chat history. Widget reports user/AI messages via `chat-sync` relay action; service worker broadcasts to all other managed tabs via `chrome.scripting.executeScript`. New tabs hydrate with existing history on injection. `_syncing` flag prevents echo loops.
- **Safe session cleanup:** `design_close` sends `cleanup` command to service worker which removes widgets from followed tabs (user's tabs stay open), closes only originally-created tabs, and resets follow-tabs/chat state.

## Known Limitations

- Cancel button (X) stops Claude after the current step, not mid-execution (architectural limit of hook system)
- Wireframe tool not supported in extension mode
- See AREAS/ for area-specific notes

## Area Context System

See [AREAS/README.md](./AREAS/README.md) for quick lookup by feature area. Read the relevant area file BEFORE exploring code.
