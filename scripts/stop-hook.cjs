#!/usr/bin/env node
/**
 * Stop hook — fires when Claude finishes its turn and goes idle.
 *
 * Sets the idle flag on the MCP server via POST /idle, signaling
 * the background listener that it's safe to consume pending messages.
 *
 * Exits 0 (lets Claude stop normally).
 */

const fs = require('fs');
const path = require('path');
const http = require('http');

const PROJECT_ROOT = path.join(__dirname, '..');
const NOTIFY_PORT_FILE = path.join(PROJECT_ROOT, '.notify-port');
const WS_PORT_FILE = path.join(PROJECT_ROOT, '.ws-port');

// Collect candidate ports + tokens
const targets = [];
for (const file of [NOTIFY_PORT_FILE, WS_PORT_FILE]) {
  try {
    const raw = fs.readFileSync(file, 'utf-8').trim();
    const parts = raw.split(':');
    const port = parseInt(parts[0], 10);
    const token = parts.slice(1).join(':');
    if (port > 0) targets.push({ port, token });
  } catch {}
}

if (targets.length === 0) process.exit(0); // No collab session

function tryPort(idx) {
  if (idx >= targets.length) {
    process.exit(0); // All ports failed — nothing to do
  }

  const { port, token } = targets[idx];
  const req = http.request(
    {
      hostname: '127.0.0.1',
      port,
      path: '/idle',
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Length': '0',
      },
      timeout: 2000,
    },
    (res) => {
      // Drain response
      res.on('data', () => {});
      res.on('end', () => {
        console.error(`[stop-hook] Set idle flag on port ${port}`);
        process.exit(0);
      });
    },
  );

  req.on('error', () => tryPort(idx + 1));
  req.on('timeout', () => { req.destroy(); tryPort(idx + 1); });
  req.end();
}

tryPort(0);
