# MCP Tools Context

> Last updated: 2026-03-31

## Quick Reference

| File | Purpose |
|------|---------|
| `src/index.ts` | Server entry — registers all tools with McpServer |
| `src/transport.ts` | `getTransport()` — all tools go through this to reach the browser |
| `src/tools/browse.ts` | `design_browse` — opens URL, starts transport, injects widget |
| `src/tools/scan.ts` | `design_scan` — reads page as structured text (snapshot/content/full) |
| `src/tools/screenshot.ts` | `design_screenshot` — captures viewport, element, or full page |
| `src/tools/act.ts` | `design_act` — click, type, scroll, etc. via ref indices from scan |
| `src/tools/chat.ts` | `design_chat` — sends message to widget, returns pending user messages |
| `src/tools/preview.ts` | `design_preview` — renders HTML in the widget's preview panel |
| `src/tools/navigate.ts` | `design_navigate` — navigate active tab to URL |
| `src/tools/selections.ts` | `design_selections` — get elements the user has selected in the inspector |
| `src/tools/evaluate.ts` | `design_evaluate` — run JS in the target page |
| `src/tools/voice-tts.ts` | `design_voice_tts` — text-to-speech via edge-tts |

## Architecture

All tools follow the same pattern:
1. Call `getTransport()` to get the active transport
2. Use `t.evalFrame()` / `t.evalWidget()` / `t.screenshot()` etc.
3. Return MCP content blocks (text, image)

`design_browse` is the entry point — it creates the transport and calls `setTransport()`. All other tools fail with "No active transport" if browse hasn't been called.

## Tool Categories

- **Page understanding:** scan, screenshot, selections
- **Page interaction:** act, evaluate, navigate, resize
- **Communication:** chat, inbox, voice-tts
- **Design:** preview, wireframe, moodboard, options, visual-diff
- **Extraction:** extract-component, extract-styles, extract-tokens
- **Audit:** a11y-audit, responsive-audit
- **Session:** browse, close, tabs, collect, export-chat, synthesize

## Gotchas

- `design_scan` should always be preferred over `design_screenshot` (see INSTRUCTIONS.md #1 Rule)
- `design_chat` with `waitForReply: true` is forbidden — causes message loss
- All tools require an active transport — `design_browse` must be called first

## Recent Sessions

| Date | Changes |
|------|---------|
| 2026-03-31 | (reference only — no changes this session) |
