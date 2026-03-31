# Claude Collab

A collaboration tool for [Claude Code](https://docs.anthropic.com/en/docs/claude-code) that gives Claude real-time browser control for UI/UX design work. Chat with Claude through a widget in the browser while it browses, inspects, builds, and iterates on designs — live, in front of you.

Built as an [MCP server](https://modelcontextprotocol.io/) for Claude Code.

## What It Does

Claude Collab opens a browser that both you and Claude can see and interact with. You communicate through a chat widget embedded in the page — no switching between terminal and browser. Claude can:

- **Understand websites** — scan page structure, read content, trace how sites work under the hood. Claude can navigate through pages, fill forms, click buttons, and map out how a site is built — useful for reverse-engineering layouts, understanding CMS structures, or figuring out how a web app flows
- **Browse and inspect** — extract computed styles from any element, pull full design systems (colors, typography, spacing), capture components as portable HTML+CSS
- **Build and edit live** — inject HTML/CSS directly into pages, wireframe from scratch, preview design options side-by-side. Use it to prototype on top of existing sites or build from a blank canvas
- **Insert and manage content** — Claude can type into forms, fill fields, click through admin panels, and interact with CMSs or web apps in your real browser (extension mode). Useful for content entry, testing workflows, or populating pages
- **Collect design inspiration** — save elements from reference sites, generate moodboards, synthesize into unified design systems
- **Run audits** — accessibility (WCAG) checks with visual overlays, responsive layout testing across breakpoints
- **Screenshot and compare** — capture pages, create visual diffs with before/after sliders
- **Talk to you** — voice mode with text-to-speech for hands-free collaboration

## How It Works

You type in the browser widget. Claude responds in the same widget. Everything Claude does — navigating pages, modifying the DOM, taking screenshots — happens in the browser you're both looking at. It's pair-designing.

### Three Modes

| Mode | How | Best for |
|------|-----|----------|
| **Tabs** (default) | Playwright browser, multi-tab via iframes | Comparing reference sites, multi-page work |
| **Single** | Playwright browser, direct page injection | Sites that block iframes |
| **Extension** | Your real Chrome via a Chrome extension | Sites that need login, your real browser with all your extensions |

## Prerequisites

- [Node.js](https://nodejs.org/) 18 or later
- [Claude Code](https://docs.anthropic.com/en/docs/claude-code) CLI installed
- For extension mode: Chrome or Chromium-based browser

## Installation

### 1. Clone and install

```bash
git clone https://github.com/maarudth/claude-collab.git
cd claude-collab
npm install
```

### 2. Configure Claude Code

Add the MCP server to your Claude Code config. Run this in the project directory:

```bash
claude mcp add design-collab -- npx tsx src/index.ts
```

Or manually add to your Claude Code MCP settings:

```json
{
  "mcpServers": {
    "design-collab": {
      "command": "npx",
      "args": ["tsx", "src/index.ts"],
      "cwd": "/path/to/claude-collab"
    }
  }
}
```

### 3. Configure hooks

Claude Collab uses Claude Code hooks for real-time message delivery. Add these to your Claude Code settings (`.claude/settings.json` in your project, or global settings):

```json
{
  "hooks": {
    "PreToolUse": [
      {
        "matcher": "design_*",
        "hooks": [
          {
            "type": "command",
            "command": "node /path/to/claude-collab/scripts/cancel-hook.cjs"
          }
        ]
      }
    ],
    "PostToolUse": [
      {
        "matcher": "design_*",
        "hooks": [
          {
            "type": "command",
            "command": "node /path/to/claude-collab/scripts/event-hook.cjs"
          }
        ]
      }
    ],
    "Stop": [
      {
        "hooks": [
          {
            "type": "command",
            "command": "node /path/to/claude-collab/scripts/stop-hook.cjs"
          }
        ]
      }
    ],
    "SessionStart": [
      {
        "hooks": [
          {
            "type": "command",
            "command": "node /path/to/claude-collab/scripts/session-hook.cjs"
          }
        ]
      }
    ]
  }
}
```

Replace `/path/to/claude-collab` with the actual path where you cloned the repo.

### 4. Extension mode (optional)

If you want to use extension mode (Claude controls your real Chrome browser):

```bash
npm run build:ext
```

Then load the extension in Chrome:
1. Go to `chrome://extensions`
2. Enable "Developer mode"
3. Click "Load unpacked" and select the `extension/dist` folder

## Quick Start

Once configured, start Claude Code and tell it to use the collab with a mode and URL:

```
Use collab to open example.com
```

You need to specify the mode if you don't want the default (tabs):

```
Use collab in single mode to open example.com
```

```
Use collab in extension mode to open my-site.com
```

Claude will open the browser (or connect to your Chrome in extension mode), and a chat widget appears in the page. From there, you communicate through the widget — not the terminal.

### Example workflows

**Design review:**
> "Use collab to open my-site.com. Check the accessibility and suggest improvements."

**Build from reference:**
> "Use collab to open dribbble.com/shots/popular. Collect elements I like, then build a landing page inspired by them."

**Iterate on a page:**
> "Use collab in single mode to open localhost:3000. Let's redesign the hero section together."

**Work on a logged-in site:**
> "Use collab in extension mode to open dashboard.example.com"

## Tools

Claude Collab provides 25+ tools organized by workflow:

### Page Understanding
- `design_scan` — Read page structure as text (fast, cheap — preferred over screenshots)
- `design_act` — Click, type, select, hover elements using scan references
- `design_screenshot` — Capture viewport (use only when visual inspection is needed)

### Browsing
- `design_browse` — Open a URL in a new tab
- `design_navigate` — Navigate within the current page
- `design_tabs` — List, switch, close tabs
- `design_resize` — Set viewport size (mobile, tablet, desktop)

### Inspection
- `design_selections` — Get elements the user has click-captured
- `design_extract_styles` — Pull computed CSS from any element
- `design_extract_tokens` — Scan a full design system (colors, typography, spacing)
- `design_extract_component` — Extract an element as portable HTML+CSS

### Building
- `design_evaluate` — Run JS to modify the live page
- `design_preview` — Show HTML/CSS mockups in a draggable panel
- `design_options` — Present A/B design variants (click to apply)
- `design_wireframe` — Blank canvas with snap grid and wireframe utilities

### Inspiration
- `design_collect` — Save elements as design inspiration
- `design_moodboard` — View all collected items as a visual grid
- `design_synthesize` — Analyze collections into unified design tokens + code

### Auditing
- `design_a11y_audit` — WCAG accessibility check with visual overlays
- `design_responsive_audit` — Test layout across breakpoints

### Communication
- `design_chat` — Send messages to the user in the widget
- `design_voice_tts` — Text-to-speech (when voice mode is active)
- `design_inbox` — Check for unread messages
- `design_export_chat` — Save chat history to file
- `design_visual_diff` — Compare screenshots with interactive slider

## Extension Mode

Extension mode connects Claude to your real Chrome browser instead of a Playwright instance. This means Claude can work with:
- Sites you're logged into
- Your browser extensions and settings
- Pages that block automation

When you call `design_browse` with `mode: "extension"`, Claude starts a local WebSocket server and returns an auth token. Paste this into the extension popup to connect. The token is cached — you only need to do this once per session.

**Extension permissions:** The extension requires broad permissions (`<all_urls>`, `tabs`, `scripting`, `debugger`) because it needs to inject the collaboration widget and execute commands on any page Claude navigates to. The `debugger` permission is used for full-page screenshots. All communication stays local (127.0.0.1) and is authenticated with a per-session token.

### Follow Tabs

When enabled, the widget auto-injects into any tab you switch to. Toggle via the extension popup or the tab-follow button in the widget header. This lets you browse naturally while keeping Claude connected.

## Known Limitations

- **Cancel button** stops Claude after the current step, not mid-execution
- **Wireframe tool** is not yet supported in extension mode
- **Voice mode** requires a microphone and uses Microsoft Edge TTS for speech output

## Development

```bash
npm run typecheck    # Type-check TypeScript
npm run build:ext    # Build Chrome extension
npm start            # Run MCP server directly
```

## License

[MIT](LICENSE)
