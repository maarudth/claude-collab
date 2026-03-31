# Widget UI Context

> Last updated: 2026-03-31

## Quick Reference

| File | Purpose |
|------|---------|
| `widget/collab-widget.js` | Main widget — chat UI, message rendering, screenshot buttons/dropdown, preview panel, attachment flow |
| `widget/voice-module.js` | Mic button, speech recognition, voice mode toggle |
| `widget/inspector-panel.js` | Element inspector overlay for design work |
| `widget/iframe-bridge.js` | Cross-frame communication (tabs/single mode, not extension) |
| `widget/tab-manager.js` | Tab bar UI (tabs mode only, not included in extension bundle) |
| `src/widget.ts` | Server-side widget injection (Playwright modes) |
| `extension/build.mjs` | Bundles widget JS files into `extension/dist/widget-bundle.js` |

## Architecture

The widget is vanilla JS (no framework). It's injected into the page either by Playwright (`src/widget.ts`) or by the extension service worker (`handleInjectWidget`). In extension mode, it's bundled as `widget-bundle.js`.

### Key Widget APIs (on `window.__dc`)

- `window.__dc.api.say(text)` — add a system/assistant message to chat
- `window.__dc.api.addMessage(text, role)` — add message with role
- Relay functions: `relayMessage()`, `relayScreenshot()`, `relayCancel()` — communicate through the extension relay chain

### Screenshot UI Flow

1. User clicks camera icon -> dropdown appears (Viewport / Full Page / Selected Element)
2. Each option calls `relayScreenshot(JSON.stringify(opts))` with appropriate options
3. On success (base64 returned), shows preview overlay with Send/Discard buttons
4. On Send, the screenshot is attached to the next message

### Chat Persistence

Chat history, input draft, and preview panel HTML are stored in `localStorage` under keys `dc-chat-history`, `dc-input-draft`, `dc-preview-html`.

## Gotchas

- Widget JS files are concatenated (not bundled/minified) — order matters in `build.mjs`
- `tab-manager.js` is excluded from extension bundle (extension uses real Chrome tabs)
- `iframe-bridge.js` is appended at the end of the bundle but guards itself via `window.name`
- `state._syncing` flag must be set when adding messages from cross-tab sync to prevent echo loops
- `__dc.api.addMessage(text, type)` exposed for service worker cross-tab broadcasts

## Recent Sessions

| Date | Changes |
|------|---------|
| 2026-03-31 | Screenshot fix, follow-tabs toggle, cross-tab chat sync via service worker, addMessage API |
