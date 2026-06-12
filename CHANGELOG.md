# Changelog

## 0.8.0 — 2026-06-12

### Onboarding overhaul
- **Automated hook installer**: `npm run setup` configures all Claude Code hooks with correct absolute paths (global or `--project`), backs up your settings, replaces stale entries after repo moves, and supports `--remove`. No more hand-editing settings.json.
- **Fixed the hook configuration itself**: the previously documented config used bare `design_*` matchers (MCP tool names are namespaced `mcp__design-collab__…`) and put the session hook on the wrong event — fresh installs following the old README had silently broken message delivery. The installer ships the tested configuration.
- **Claude actually sees its instructions now**: Claude Code truncates MCP server instructions at 2,048 characters; the previous 20K-character INSTRUCTIONS.md lost 90% of its content, including the entire communication protocol. The core protocol now fits the budget, and the deep reference moved to `docs/PLAYBOOK.md`, which Claude reads on demand (its path is delivered in the `design_browse` result).
- `design_chat` only nags about restarting the background listener when the listener is actually down (was: after every message, causing redundant restarts).

### Positioning
- README rewritten around what the tool is: pair-working with Claude Code inside the live page — shared browser, click-to-point, in-page previews — rather than a design-tool feature list.

### Hardening
- Server-side message store now trims like the widget does (1000 → 500) — no unbounded growth in long extension-mode sessions.
- HTML sanitizer (preview panel) additionally blocks CSS `@import`.
- Extension service worker logs failed chat broadcasts and unmanages dead tabs instead of failing silently.
- Removed misleading `Access-Control-Allow-Origin: *` from the local notify server (nothing browser-side calls it; it binds to 127.0.0.1).
- Added `.gitattributes` (consistent line endings) and ignored `.playwright-mcp/`.

### Fixes
- Widget theme detection no longer reads the misleading wrapper background in tabs/extension mode; defers to iframe-bridge theme reports.
- Light-mode contrast fixes in the inspector panel; opaque panel background when docked.
- Inspector toggle icon stays in sync when the panel is closed from its own button.

## 0.7.0 — initial public release
