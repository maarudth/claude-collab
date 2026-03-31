# Extension Relay Context

> Last updated: 2026-03-31

## Quick Reference

| File | Purpose |
|------|---------|
| `extension/src/service-worker.ts` | Background script — WS client, `handleCommand()` dispatch, `handleScreenshot()`, tab management |
| `extension/src/content-script.ts` | ISOLATED world — relays `__dcRelay` postMessages to service worker via `chrome.runtime.sendMessage` |
| `extension/src/relay-inject.ts` | MAIN world — MessagePort bridge between widget and content script |
| `extension/src/popup.ts` | Extension popup UI — token input, connect/disconnect |
| `src/extension-transport.ts` | Server-side — sends commands over WebSocket, maps request/response by ID |
| `src/ws-server.ts` | WebSocket server — fixed port range (19876+), first-message auth, HTTP endpoints |
| `widget/collab-widget.js` | Widget relay functions: `relayMessage()`, `relayScreenshot()`, `relayCancel()` |
| `extension/build.mjs` | Build script — esbuild for TS, concatenates widget JS into `widget-bundle.js` |

## Architecture

### Message Relay Chain (4 layers)

```
Widget (MAIN world) --[MessagePort]--> relay-inject.ts (MAIN world)
  --[window.postMessage __dcRelay]--> content-script.ts (ISOLATED world)
  --[chrome.runtime.sendMessage]--> service-worker.ts (background)
  --[WebSocket]--> MCP server (Node.js)
```

### Screenshot Flow (widget-initiated)

1. Widget `relayScreenshot(optsJson)` creates `requestId`, registers callback, sends `{action:'screenshot', optsJson, requestId}` through MessagePort
2. relay-inject receives on port1, creates its own `internalId` for the window postMessage round-trip, stores widget's `requestId` as `replyId`
3. relay-inject posts `{__dcRelay, action:'screenshot', requestId: internalId, opts}` to window
4. content-script catches `__dcRelay`, sends `{type:'dc-relay-screenshot', requestId: internalId, opts}` to service worker
5. service-worker captures tab via `chrome.tabs.captureVisibleTab()`, optionally crops with OffscreenCanvas, returns base64
6. Response flows back: service-worker -> content-script -> window postMessage (`__dcScreenshotResult`) -> relay-inject -> port1 postMessage with `replyId` -> widget callback resolves

### MCP-initiated Screenshot Flow

Simpler: `design_screenshot` tool -> `ExtensionTransport.screenshot()` -> WebSocket `{type:'screenshot'}` -> service-worker `handleScreenshot()` -> base64 back over WebSocket.

### WebSocket Auth

- Server generates random 32-byte token on startup, writes `port:token` to `.ws-port` file
- Extension must send `{type:'connected', token:'...'}` as first message within 5s
- Token stored in extension's `chrome.storage.local` for reconnection

## Gotchas

- **RequestId mismatch (fixed 2026-03-31):** Widget and relay-inject each created separate requestIds for screenshots. The widget's callback never matched the relay's response, causing all widget screenshots to timeout. Fix: widget sends its requestId through the port; relay-inject echoes it back while using its own internal ID for the window postMessage round-trip.
- **Port handshake retry:** relay-inject retries port transfer every 50ms until widget ACKs. If the widget isn't injected yet, ports get neutered — each retry creates a fresh MessageChannel.
- **`captureVisibleTab` requires active tab:** Service worker calls `chrome.tabs.update(tabId, {active: true})` + 200ms delay before capture.
- **`sendResponse` async pattern:** The `dc-relay-screenshot` handler in `chrome.runtime.onMessage` must `return true` to keep the `sendResponse` channel open for async work.
- **CDP debugger bar:** Full-page screenshots attach/detach `chrome.debugger` briefly (~200ms). The "debugging" info bar flashes but disappears immediately. Requires `debugger` permission in manifest (prompts user once on install/update).
- **CDP viewport override required:** `captureBeyondViewport` alone repeats the visible area. Must use `Emulation.setDeviceMetricsOverride` to expand viewport to full `cssContentSize` before capture, then `clearDeviceMetricsOverride` to restore.
- **Follow-tabs skips restricted pages:** `chrome://` and `chrome-extension://` URLs can't have scripts injected — the `onActivated` listener skips them.
- **Stale content scripts after extension reload:** Manifest content scripts aren't re-injected into existing pages. All injection paths (follow-tabs, handleInjectWidget, onUpdated) now inject a fresh `content-script.js` via `chrome.scripting.executeScript`. Content script has `__dcContentHandler` guard to avoid duplicate listeners.
- **Active tab tracking on switch-back:** `onActivated` must ALWAYS send `tab-switch` event to the MCP server, even for already-managed tabs. Otherwise Claude responds in the wrong tab.
- **Chat sync echo prevention:** `window.__dc._syncing` flag must be set before calling `addMessage` from `executeScript` broadcasts/hydration. Otherwise the receiving widget re-reports the message → infinite loop.
- **Cleanup must not close user's tabs:** `followedTabs` set tracks which tabs were auto-injected vs created by `design_browse`. Cleanup removes widgets from followed tabs, closes only created tabs.

## Recent Sessions

| Date | Changes |
|------|---------|
| 2026-03-31 | Screenshot requestId fix, CDP full-page screenshot, follow-tabs, cross-tab chat sync, safe cleanup |
