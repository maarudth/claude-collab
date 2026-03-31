import { z } from 'zod';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { getTransport, setTransport, hasTransport, type DesignTransport } from '../transport.js';
import { PlaywrightTransport } from '../playwright-transport.js';
import { ExtensionTransport } from '../extension-transport.js';
import { isExtensionConnected } from '../ws-server.js';

const __dirname_browse = dirname(fileURLToPath(import.meta.url));
const LISTENER_PATH = join(__dirname_browse, '..', '..', 'scripts', 'listener.cjs');

const LISTENER_INSTRUCTIONS = `
⚠️ REQUIRED — Do these steps NOW, before responding to the user:

1. Start the background listener using Bash with run_in_background: true:
   node "${LISTENER_PATH}"
   ↑ Copy this command EXACTLY. Do NOT change the path.

2. Send your first message with design_chat (waitForReply: false).

3. NEVER use waitForReply: true — it blocks message delivery.

4. When the listener completes with a message, respond via design_chat, then start a NEW listener with the same command.
`;

export function registerBrowseTool(server: McpServer): void {
  server.tool(
    'design_browse',
    'Open a URL in a new tab. Each call creates a new tab — use for browsing references while keeping other pages open. The chat widget persists across all tabs.',
    {
      url: z.string().url().describe('The URL to navigate to'),
      mode: z.enum(['tabs', 'single', 'extension']).default('tabs').describe('Session mode: "tabs" (default) uses iframe tabs for multi-page browsing. "single" opens the page directly without iframes. "extension" uses the Chrome extension in the user\'s real browser.'),
    },
    async ({ url, mode: browseMode }) => {
      let t: DesignTransport;

      if (browseMode === 'extension') {
        // Extension mode — use Chrome extension transport
        if (hasTransport() && getTransport().getMode() === 'extension') {
          t = getTransport();
        } else if (isExtensionConnected()) {
          const ext = new ExtensionTransport();
          ext.connectExisting();
          setTransport(ext);
          t = ext;
        } else {
          // Two-phase flow: start WS server → return token → user pastes → extension connects
          const ext = new ExtensionTransport();
          const { port, token } = await ext.initServer();

          // Check if extension connects quickly (already has stored token)
          try {
            await ext.waitForConnection(5000); // 5s grace period
            setTransport(ext);
            t = ext;
          } catch {
            // Extension didn't connect yet — return token for user to paste
            return {
              content: [{
                type: 'text' as const,
                text: [
                  `Extension mode: WS server ready on port ${port}.`,
                  `The extension needs the auth token to connect.`,
                  ``,
                  `AUTH TOKEN: ${token}`,
                  ``,
                  `Tell the user: "I've started the extension server. Please open the Design Collab extension popup in Chrome, paste this auth token, and click Connect. Then I'll continue."`,
                  ``,
                  `After they confirm, call design_browse with mode: "extension" again — it will connect instantly.`,
                ].join('\n'),
              }],
            };
          }
        }
      } else {
        // Playwright mode
        let pw: PlaywrightTransport;
        if (hasTransport() && getTransport().getMode() !== 'extension') {
          pw = getTransport() as PlaywrightTransport;
        } else {
          pw = new PlaywrightTransport();
          setTransport(pw);
        }
        pw.setBrowseMode(browseMode);
        t = pw;
      }

      const { tabId } = await t.browse(url);

      // Extract page info from the target frame
      const info = await t.evalFrame(() => {
        const headings = Array.from(document.querySelectorAll('h1, h2, h3')).map(h => ({
          level: parseInt(h.tagName[1]),
          text: (h.textContent || '').trim().slice(0, 80),
        }));

        const links = Array.from(document.querySelectorAll('a[href]'))
          .slice(0, 30)
          .map(a => ({
            text: (a.textContent || '').trim().slice(0, 50),
            href: (a as HTMLAnchorElement).href,
          }))
          .filter(l => l.text);

        return {
          title: document.title,
          url: location.href,
          headings,
          links,
        };
      });

      return {
        content: [
          { type: 'text' as const, text: JSON.stringify({ ...info, tabId, mode: browseMode }, null, 2) },
          { type: 'text' as const, text: LISTENER_INSTRUCTIONS },
        ],
      };
    },
  );
}
