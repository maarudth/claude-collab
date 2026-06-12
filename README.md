# Claude Collab

**Pair with [Claude Code](https://docs.anthropic.com/en/docs/claude-code) inside the live page.** A shared browser where you and Claude work as peers: you chat through a widget in the page, point at elements by clicking them, and Claude browses, builds, and renders its work right where you're both looking — including in your real Chrome, on any site you're logged into.

![Chatting with Claude in the live page: it mocks up hero color options, applies the pick, and gets asked to commit it](docs/demo.gif)

*One extension-mode session in a real Chrome tab — conversation, live restyle, and "commit it to code" without leaving the page.*

Built as an [MCP server](https://modelcontextprotocol.io/) for Claude Code. Open source, MIT.

## Why

Every browser agent today is one-directional: the agent acts, you watch from a side panel or a terminal. Claude Collab makes the page itself the shared workspace:

- **You point, instead of describing.** Click any element (Ctrl+click for several) and it's attached to your next message — no more "the second button in the nav, no, the other one."
- **You edit live, too.** The inspector panel shows any element's CSS for real-time editing — tweak values, drag elements around the page, walk up the DOM with arrow keys — and your edits ride along to Claude with your next message, so it builds on what you changed.
- **Claude shows, instead of dumping code.** Mockups appear in a draggable in-page panel, A/B variants as clickable options that apply to the real page, collected inspiration as a moodboard.
- **The conversation lives in the browser.** Chat widget in the page, with voice mode if you want it, undo/redo for your inspector edits, a pixel-ruler overlay, in-widget screenshot capture (including draw-a-rectangle), and one-click mobile/tablet/desktop previews of the page. You never alt-tab to a terminal mid-thought. Full tour: [docs/USER-GUIDE.md](docs/USER-GUIDE.md).
- **It works on real sites, not just localhost.** Extension mode connects Claude to your actual Chrome — logged-in dashboards, CMS admin panels, staging environments, any URL.
- **It's Claude Code, not a browser bot.** The agent in your browser has your whole dev environment behind it: it can read a file from your disk and enter it into a CMS, scrape a page and write the analysis into your repo, build a feature and click-test it — in one session. Consumer browser agents are sandboxed away from your code by design; this isn't. And because you watch every action in the page and can interrupt between steps, it's supervised automation, not a bot running loose.

## What Claude can do in the shared browser

- **Understand and operate pages** — read structure as text (fast, cheap), navigate, fill forms, click through flows, map out how a site works
- **Build and edit live** — inject HTML/CSS into the page, wireframe from scratch, preview design options side-by-side, iterate with you watching
- **Inspect anything** — computed styles, full design systems (colors, typography, spacing), extract components as portable HTML+CSS
- **Collect and synthesize inspiration** — save elements from reference sites, review them as a moodboard, merge them into unified design tokens
- **Audit** — WCAG accessibility checks with visual overlays, responsive layout testing across breakpoints, before/after visual diffs
- **Talk to you** — chat in the page, text-to-speech voice mode, your Claude Code permission prompts mirrored into the widget

## Three modes

| Mode | How | Best for |
|------|-----|----------|
| **Tabs** (default) | Playwright browser, multi-tab via iframes | Comparing reference sites, multi-page work |
| **Single** | Playwright browser, direct page injection | Deep work on one page, sites that block iframes |
| **Extension** | Your real Chrome via a Chrome extension | Logged-in sites, real browsing context, any URL |

## Install

Prerequisites: [Node.js](https://nodejs.org/) 18+, [Claude Code](https://docs.anthropic.com/en/docs/claude-code) CLI. Windows, macOS, and Linux.

```bash
git clone https://github.com/maarudth/claude-collab.git
cd claude-collab
npm install
npm run setup        # installs the Claude Code hooks automatically
claude mcp add collab -- npx tsx src/index.ts   # run from the repo directory
```

`npm run setup` configures the four Claude Code hooks (real-time message delivery, cancel support, idle wake-up, permission mirroring) in your global `~/.claude/settings.json`, with a backup of your existing settings. Use `npm run setup -- --project` to install into the current project's `.claude/settings.json` instead, and `npm run setup -- --remove` to uninstall. Re-running is safe — it replaces stale entries, including after moving the repo.

### Extension mode (optional, recommended)

To let Claude work in your real Chrome:

```bash
npm run build:ext
```

Then `chrome://extensions` → enable Developer mode → Load unpacked → select `extension/dist`.

The first `collab_browse` in extension mode prints a one-time auth token; paste it into the extension popup. All traffic stays on `127.0.0.1` and is token-authenticated.

## Quick start

Start Claude Code and say:

```
Use collab to open example.com
```

Modes: `Use collab in single mode to open …` / `Use collab in extension mode to open …`

Or, in extension mode, skip the URL entirely — **"Use collab to join me here"** attaches Claude to whatever page you're already on.

The browser opens with a chat widget in the page — from there, talk to Claude in the widget, not the terminal.

### Example sessions

**Point-and-edit on your app:**
> "Use collab in single mode to open localhost:3000." Then click the hero section and type: "this — make it tighter and darker."

**Join the page you're on:**
> You're already in your CMS admin. "Use collab in extension mode to join me here. Fill the new product form from this spreadsheet."

**Design review:**
> "Use collab to open my-site.com. Run an accessibility audit and show me what you find."

**Build from references:**
> "Use collab to open dribbble.com/shots/popular. I'll click things I like — collect them, then build a landing page from them."

## Tools

26 MCP tools, organized by workflow — complete reference with all parameters in [docs/TOOLS.md](docs/TOOLS.md). Highlights:

| Workflow | Tools |
|---|---|
| Page understanding | `collab_scan` (structured text snapshot, preferred), `collab_act` (click/type/select via refs), `collab_screenshot` |
| Browsing | `collab_browse`, `collab_navigate`, `collab_tabs`, `collab_resize` |
| Live building | `collab_evaluate` (run JS on the page), `collab_preview` (in-page mockup panel), `collab_options` (clickable A/B variants), `collab_wireframe` |
| You pointing at things | `collab_selections` (your click-captured elements) |
| Inspection | `collab_extract_styles`, `collab_extract_tokens`, `collab_extract_component` |
| Inspiration | `collab_collect`, `collab_moodboard`, `collab_synthesize` |
| Auditing | `collab_a11y_audit`, `collab_responsive_audit`, `collab_visual_diff` |
| Communication | `collab_chat`, `collab_voice_tts`, `collab_inbox`, `collab_export_chat` |

How Claude is guided: a compact core protocol ships as MCP server instructions, and a full playbook (`docs/PLAYBOOK.md`) is read on demand — workflows, per-tool gotchas, limits.

## How the real-time loop works

You type in the widget → a hook delivers your message to Claude *between its tool calls* (interrupting its current plan if needed). When Claude is idle, a lightweight background listener wakes it the second you send something. The Cancel button stops Claude after its current step. All of this is set up automatically by `npm run setup` — no manual wiring.

## Extension permissions

The extension requests broad permissions (`<all_urls>`, `tabs`, `scripting`, `debugger`) because it injects the collaboration widget and executes Claude's commands on whatever page you take it to; `debugger` is used only for full-page screenshots. All communication is local (`127.0.0.1`) and authenticated with a per-session token sent as the first WebSocket message (never in the URL).

## Troubleshooting

- **Claude doesn't respond in the widget** — the hooks aren't installed or a stale path is configured. Run `npm run setup` again (it replaces stale entries), then restart your Claude Code session.
- **Claude doesn't notice my messages while idle** — the background listener isn't running. Claude is instructed to keep it alive; nudging it ("restart the listener") fixes it immediately.
- **A site won't load in tabs mode** — it blocks iframes. Say "switch to single mode."
- **Extension won't connect** — check the popup shows the port from Claude's message, re-paste the token. Stale tokens from a previous session clear automatically on rejection.
- **Widget appears in screenshots** — known behavior; Claude accounts for it during precision comparisons.

## Known limitations

- **Cancel** stops Claude after the current step, not mid-execution
- **Wireframe tool** is not yet supported in extension mode
- **Strict-CSP sites** (e.g. linear.app) block scan/evaluate/act in extension mode — the page's Content Security Policy forbids script evaluation. Screenshots, tab control, and chat still work there
- **Voice output** uses Microsoft Edge TTS and needs a microphone for input

## Development

```bash
npm run typecheck    # Type-check TypeScript
npm run build:ext    # Build the Chrome extension
npm start            # Run the MCP server directly
```

## License

[MIT](LICENSE)
