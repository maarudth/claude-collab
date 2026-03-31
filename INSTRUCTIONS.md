# Design Collab — AI Instructions

You have access to a live browser that you control. The user sees everything you do in real-time. Treat it like pair-designing with someone looking over your shoulder.
After a user sends a message, prioritize replying with a short acknowledgment answer.

### #1 Rule: Scan First, Screenshot Later

**ALWAYS use `design_scan` before `design_screenshot`.** Scanning is 100x faster, 50x cheaper, and gives you structured text you can reason about. Screenshots are 50K+ tokens of vision input — only use them when you specifically need visual/spatial understanding (layout verification, design critique, canvas/WebGL content).

**Default page-understanding flow:** `design_scan` → reason about the text → act on it. Only screenshot if you *need to see* something visually.
---

## 1. Communication

The user communicates through the **collab chat widget in the browser**, NOT through the terminal.

- **While working:** Messages arrive automatically via the PreToolUse hook — they appear as `[COLLAB] User said: ...` in hook feedback, blocking the current tool call. Use your judgment: if the user is changing direction or asking a question, stop and respond via `design_chat`. If it's minor feedback you can incorporate, acknowledge briefly via `design_chat` and continue your work.
- **While idle:** You MUST have a background listener running. After `design_browse`, a session hook outputs `[COLLAB-SETUP]` instructions — **follow them immediately** by running `listener.cjs` as a background Bash command. This ensures user messages wake you up even when you're not making tool calls.
- **NEVER use `design_chat` with `waitForReply: true`** — it blocks you from receiving hook messages and causes message loss. Always use `waitForReply: false` (the default) and rely on the background listener + hooks to receive replies.
- **Send responses via `design_chat`**, not terminal output. The user is watching the browser.
- **Don't ask questions in the terminal** when the collab is open. Use `design_chat`.

## 2. Voice / TTS

The browser has a **mic button**. The widget sends system messages when it toggles:
- `"Voice mode ON — speak naturally"` → mic is now ON
- `"Voice mode OFF"` → mic is now OFF

**When you see "Voice mode ON":**
- Respond with BOTH `design_voice_tts` (spoken) AND `design_chat` (text). Always send text too.
- Continue using TTS for all responses until you see "Voice mode OFF".

**When you see "Voice mode OFF":**
- **STOP using `design_voice_tts` immediately.** Respond with `design_chat` ONLY.
- Do NOT continue speaking after the mic is turned off — the user explicitly chose to stop voice mode.

**Important:** Track the voice state throughout the session. The last "Voice mode ON/OFF" message you saw determines your current behavior. Don't guess — react to the system messages.

## 3. Session Modes

- **tabs** (default): Multi-tab browsing with iframes. Widget lives in the parent frame. Good for comparing references and multi-site work.
- **single**: Direct page injection, no iframes. Use when working deeply on one page, or when a site blocks iframes.
- **extension**: Uses the Chrome extension in the user's real browser. Real Chrome tabs, no iframes, no cross-origin issues, access to logged-in sessions. Use when the user asks for extension mode or when working with sites that need authentication.

### Extension Mode Setup

Extension mode uses a WebSocket connection with token-based authentication:

1. When you call `design_browse` with `mode: "extension"`, the MCP server starts a WS server and waits ~10 seconds for the extension to connect.
2. **If the extension isn't connected yet**, the tool returns the port and auth token. You must tell the user to open the extension popup and paste the token. Example response: "Open the Design Collab extension popup, enter port 19876, token abc123..., and click Connect."
3. Once the user confirms it's connected, **retry `design_browse`** with the same URL and mode.
4. The token is cached in the extension — the user only needs to do this once per session (until the MCP server restarts).
5. If a cached token from a previous session is stale, the server rejects it and the extension clears it automatically.

## 4. Tools Reference

### Page Understanding & Interaction (preferred — fast, cheap, text-based)
| Tool | Purpose |
|------|---------|
| `design_scan` | **Use this first.** Reads the page as structured text (~200-4K tokens). Modes: `snapshot` (interactive elements with `[ref=eN]` indices), `content` (article/doc as markdown), `full` (both). 100x faster than a screenshot |
| `design_act` | Click, type, select, hover, focus, or clear elements using `[ref=eN]` from scan. **Supports batch mode** via `steps[]` — always batch multiple actions into one call instead of calling act repeatedly (e.g. fill a form: `steps: [{action:"click", ref:"e3"}, {action:"type", ref:"e3", value:"hello"}, {action:"click", ref:"e7"}]`). Use `delay` between steps when the page needs time to react. **Scan data goes stale** — if you see a staleness warning, re-scan before continuing |

### Browsing & Navigation
| Tool | Purpose |
|------|---------|
| `design_browse` | Open a URL. Set `mode` to `tabs`, `single`, or `extension` |
| `design_navigate` | Navigate within the current page (click links, etc.) |
| `design_tabs` | List, switch, close tabs |
| `design_resize` | Set viewport size. Common: mobile (390x844), tablet (768x1024), desktop (1280x800) |

### Visual Capture (use only when you need to *see* the page)
| Tool | Purpose |
|------|---------|
| `design_screenshot` | Capture current viewport. Works with WebGL/canvas. **Only use after scan, or when visual/spatial understanding is required** |
| `design_visual_diff` | Compare before/after screenshots with interactive slider |

### Inspection & Extraction
| Tool | Purpose |
|------|---------|
| `design_selections` | Get elements the user has click-captured |
| `design_extract_styles` | Pull computed styles from any element |
| `design_extract_tokens` | Scan a page's full design system (colors, type, spacing, radii, shadows) |
| `design_extract_component` | Extract an element as portable HTML+CSS |
| `design_evaluate` | Run arbitrary JS in the target page — for **modifying the actual DOM** |

### Design & Building
| Tool | Purpose |
|------|---------|
| `design_preview` | Show HTML/CSS mockups, variations, or examples in a **draggable preview panel**. HTML is sanitized (scripts/iframes stripped) |
| `design_options` | Present A/B design variants. User clicks to apply to the actual page |
| `design_wireframe` | Open blank canvas for wireframing. Has utility classes + snap grid. `gridSize` must be 1-200 |

### Choosing Between design_preview and design_evaluate

**Use `design_preview` when:**
- Showing the user a mockup, concept, or visual example
- Presenting design variations or options
- Displaying HTML/CSS that the user should review before it goes on the page
- Showing audit results, reports, or visual summaries

**Use `design_evaluate` when:**
- Actually modifying the live page DOM (adding elements, changing styles, injecting content)
- Reading page state (querying selectors, checking values)
- Building or editing the real page content

**Rule of thumb:** If it's "look at this" → `design_preview`. If it's "change the page" → `design_evaluate`.

### Inspiration Workflow
| Tool | Purpose |
|------|---------|
| `design_collect` | Capture an element as design inspiration (screenshot + styles + HTML). Max 50 items per session |
| `design_moodboard` | Show all collected items as a visual grid |
| `design_synthesize` | Analyze collections → unified design tokens + component code. Use `clear: true` to free memory after synthesis |

Collection categories: `header`, `nav`, `hero`, `layout`, `colors`, `typography`, `spacing`, `component`, `footer`, `card`, `button`, `form`, `animation`, `other`

### Communication
| Tool | Purpose |
|------|---------|
| `design_chat` | Send a message to the user in the widget. NEVER use `waitForReply: true` — use the background listener instead |
| `design_inbox` | Check for unread messages |
| `design_voice_tts` | Speak to the user (only when mic is active) |
| `design_export_chat` | Export chat history. File path must be under current working directory |

### Auditing
| Tool | Purpose |
|------|---------|
| `design_a11y_audit` | WCAG accessibility check with visual overlays. Caps at 2000 elements for performance |
| `design_responsive_audit` | Test layout across breakpoints, check overflow/tiny-text/small-targets. Widget is auto-hidden during resize and restored after (even on error) |

### Session
| Tool | Purpose |
|------|---------|
| `design_close` | Shut down browser and clean up. Always close cleanly when done |

## 5. Key Workflows

### Element Inspection
1. User enables **click-capture** (crosshair icon in widget)
2. User clicks elements (Ctrl+click for multi-select, click again to deselect)
3. When the user sends a chat message, **selected elements are automatically included** — look for `[COLLAB] Selected elements: [...]` right after the message. No need to call `design_selections` separately.
4. Only call `design_selections` if the user selected elements but hasn't sent a message yet.
5. **Inspector panel** (toggle via hamburger icon) shows live CSS — user can edit values directly
6. User can drag selected elements (click + hold + move 5px)
7. Arrow Up/Down navigates ancestor chain, Esc deselects

### Inspiration → Build
1. Browse multiple reference sites in tabs
2. User clicks elements they like → you `design_collect` with category
3. `design_moodboard` to review all collected items
4. `design_synthesize` to extract unified tokens + component code (use `clear: true` to free memory when done)
5. Build the final page using the synthesis output

### Web Browsing & Navigation (scan + act)
1. `design_browse` to open a URL
2. `design_scan` (snapshot) to understand page structure — read the refs
3. `design_act` to interact — **batch multiple actions in one call** via `steps[]` whenever possible (e.g. click nav → click menu item → click submit = one `design_act` with 3 steps)
4. `design_scan` again after page changes to get fresh refs — **act refs go stale after DOM changes**
5. Only `design_screenshot` if you need visual verification

### Design Iteration
1. Show a mockup or concept with `design_preview` for user feedback
2. Once approved, apply to the page with `design_evaluate`
3. `design_scan` to verify structure, or `design_screenshot` only if visual verification needed
4. Critique, identify issues
5. Fix with `design_evaluate`, verify again
6. Repeat until satisfied

## 6. Important Behaviors

- **Re-poll after timeouts** — the user may be busy testing. A timeout does NOT mean they left.
- **Export chat** with `design_export_chat` before context gets long — preserves history.
- **Close cleanly** with `design_close` when done.
- When building pages with `design_evaluate`, scroll and screenshot different sections to verify the full page.

---

## 7. Gotchas & Lessons Learned

> This section is updated over time with real issues encountered during sessions.

### Cross-Origin / Iframe Issues
- Some sites block iframes (X-Frame-Options, CSP). If a site won't load in tabs mode, try `single` mode.
- `design_evaluate` runs inside the iframe in tabs mode. If you need to run JS in the parent frame, switch to single mode.

### Screenshots
- `design_screenshot` captures the visible viewport only. For long pages, scroll and take multiple screenshots.
- `fullPage: true` parameter exists but may not capture content below the browser's scroll limit in iframe mode.

### design_evaluate
- **Before any significant DOM manipulation** (replacing body content, building a full page, etc.), call `design_inbox` first to check for pending user messages. The user may have sent "wait" or "stop" that hasn't reached you yet. This is especially important when you're about to execute a multi-step plan — check between steps.
- In single mode, the widget is automatically detached before eval and re-attached after, so DOM clearing won't destroy it. But be aware the widget briefly disappears during execution.
- When injecting full pages (replacing `document.documentElement.innerHTML`), external fonts loaded via `@import` may take a moment. Screenshot immediately after may miss them.
- Scroll positions set via `window.scrollTo()` inside iframes may not always work as expected. Verify with a screenshot.
- Expression size is capped at 500KB.

### Tabs Mode
- Closing the last tab may leave you in a broken state. Always keep at least one tab open.
- Tab IDs are not reused. After closing tab 3, the next new tab might be tab 9.

### Pixel Probing (Advanced)
- Load images into a canvas via HTTP server (file:// protocol is blocked). Use `python -m http.server` or similar.
- Pixel values from screenshots include anti-aliasing artifacts. Sample the center of elements, not edges, for true colors.
- Screenshot DPI may be 2x on retina displays — divide pixel coordinates by 2 for CSS values.
- Probe every distinct element separately. Do NOT assume two visually similar colors are the same hex value.

### Performance
- Each MCP tool call is a full round trip. Minimize tool calls:
  - **Use `design_scan` instead of `design_screenshot`** for page understanding — it's text, not a 50K-token image.
  - **Use batch `design_act`** with `steps[]` for multi-step interactions. Filling a form, navigating menus, clicking through a flow — batch it all into one call. Only use single-action mode when you genuinely have one action.
  - For intensive builds, batch operations into single `design_evaluate` calls.
- The collab widget overlay can interfere with screenshots. It appears in captures — be aware when comparing screenshots for precision work.
- Chat messages are capped at 1000 (oldest trimmed automatically) — use `design_export_chat` to preserve long session history.
- Inspiration collection is capped at 50 items — synthesize and clear before collecting more.

### Input Limits
- CSS selectors: max 500 characters
- Chat messages: max 50,000 characters
- Evaluate expressions: max 500,000 characters
- Visual diff base64: max 10MB per image
- Action delays: max 10,000ms
- Wireframe grid size: 1-200px
- Responsive audit viewport: 100-5000px width/height

### Hook Events (PreToolUse Message Interception)
- A `PreToolUse` hook runs before every tool call. It checks for cancel events and pending user messages. If either is found, the tool is **blocked** and you see the message as hook feedback.
- **Cancel:** If the user clicked Cancel, you'll see a clear stop instruction. Stop immediately and respond via `design_chat`.
- **Regular messages:** If the user sent a chat message, you'll see `[COLLAB] User said: ...`. Use your judgment:
  - If the user is changing direction, asking a question, or saying "stop"/"wait" — stop your current plan and respond via `design_chat`.
  - If it's minor feedback you can incorporate (e.g., "make it blue", "also add a border") — acknowledge briefly via `design_chat` and continue your work with the feedback applied.
- Hook events arrive in the gap between tool calls. You are never interrupted mid-action, but you MUST check and react before your next action.

### Extension Mode
- Extension mode uses real Chrome tabs — no iframes, no cross-origin issues.
- The widget is automatically re-injected when pages navigate (with a guard against double-injection).
- `design_wireframe` is not yet supported in extension mode.
- Screenshots may behave differently (viewport capture only, no element-level or full-page capture yet).
- **Authentication:** Each session generates a random auth token (written to `.ws-port`). When `design_browse` can't connect, it returns the port + token — you relay these to the user to paste in the extension popup. The token is cached in `chrome.storage.local` so it's one-time per session.
- The token is sent as the first WebSocket message (not in the URL) to avoid exposure in DevTools/logs.
- Stale tokens from previous sessions are auto-cleared when the server rejects them (close code 4002).
- The `/notify` endpoint requires `Authorization: Bearer <token>` — handled automatically by hook scripts.

### Background Listener (Idle Message Delivery)

**The listener is your ONLY way to hear the user when you're idle.** If no listener is running, the user is talking to a wall. Treat this like breathing — never stop.

**How it works:**
- The listener polls for messages every second using `/peek` (non-consuming).
- When messages are detected, it checks the **idle flag** (set by the Stop hook when Claude finishes a turn).
- If Claude is idle: the listener consumes the message and exits — waking Claude up.
- If Claude is NOT idle: the listener skips — the PostToolUse event-hook will deliver the message between tool calls.
- This means there is **no race condition** between the listener and the event-hook.

**Setup:**
- After `design_browse`, a session hook outputs `[COLLAB-SETUP]`. **Follow it immediately** — run `listener.cjs` as a **background Bash command** (use `run_in_background: true`).
- The exact command path is provided in the `[COLLAB-SETUP]` message — copy it exactly.

**The listener lifecycle — NEVER have more than ONE running:**
1. You start a listener → it polls for messages every 1 second
2. It runs **indefinitely** until it delivers a message (it never times out)
3. When it delivers a message, it prints the message and exits — waking you up
4. You respond via `design_chat`, then **IMMEDIATELY start a new listener**
5. There should only ever be ONE listener running at a time

**When the listener completes with a message — act FAST:**
1. Call `design_chat` to respond — keep it short if you need to think more
2. Start a new background listener in the SAME message (parallel tool call)
3. Speed matters — the user is watching the chat widget waiting for your reply. Every second of delay feels like lag.

**Heartbeat messages:**
- Every 5 minutes the listener logs `[COLLAB-LISTENER] Still listening...` — this is normal, NOT a timeout
- Do NOT restart the listener when you see a heartbeat — it is still running
- Only restart after it exits with an actual user message

**Common mistakes to avoid:**
- Starting multiple listeners "just in case" — causes confusion about which is active
- Restarting on heartbeat messages — the listener is still alive, don't touch it
- Waiting to restart until after you finish some other work — restart FIRST, then do your work
- Using a background Agent instead of background Bash — agents can't get Bash permissions silently

**The listener command is provided dynamically** in `[COLLAB-SETUP]` and `[COLLAB-LISTENER-DOWN]` messages — always copy the path from those messages rather than hardcoding it.

**After `design_close`**, a session hook outputs `[COLLAB-CLEANUP]`. Do NOT start a new listener after the session ends.
