/**
 * Build script for the Design Collab Chrome extension.
 *
 * Uses esbuild to bundle TypeScript sources and copies static files.
 * Also concatenates widget JS files into widget-bundle.js.
 *
 * Usage: node extension/build.mjs
 */

import { build } from 'esbuild';
import { copyFileSync, readFileSync, writeFileSync, mkdirSync, readdirSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const srcDir = join(__dirname, 'src');
const staticDir = join(__dirname, 'static');
const distDir = join(__dirname, 'dist');
const widgetDir = join(__dirname, '..', 'widget');

// Ensure dist directory exists
mkdirSync(distDir, { recursive: true });
mkdirSync(join(distDir, 'icons'), { recursive: true });

console.log('Building Design Collab extension...');

// Bundle TypeScript files
await build({
  entryPoints: [
    join(srcDir, 'service-worker.ts'),
    join(srcDir, 'content-script.ts'),
    join(srcDir, 'relay-inject.ts'),
    join(srcDir, 'popup.ts'),
  ],
  outdir: distDir,
  bundle: true,
  format: 'iife',
  target: 'chrome120',
  minify: false, // Keep readable for debugging
  sourcemap: false,
});

// Copy static files
copyFileSync(join(staticDir, 'manifest.json'), join(distDir, 'manifest.json'));
copyFileSync(join(staticDir, 'popup.html'), join(distDir, 'popup.html'));

// Copy icons if they exist
if (existsSync(join(staticDir, 'icons'))) {
  for (const file of readdirSync(join(staticDir, 'icons'))) {
    copyFileSync(join(staticDir, 'icons', file), join(distDir, 'icons', file));
  }
}

// Build widget bundle — concatenate all widget JS files
const widgetFiles = [
  'collab-widget.js',
  'voice-module.js',
  'inspector-panel.js',
  // Note: tab-manager.js is NOT included — extension uses real Chrome tabs
  // Note: iframe-bridge.js is injected by relay-inject.ts via window.name guard
];

let widgetBundle = '// Design Collab Widget Bundle — auto-generated\n';
for (const file of widgetFiles) {
  const path = join(widgetDir, file);
  if (existsSync(path)) {
    widgetBundle += `\n// === ${file} ===\n`;
    widgetBundle += readFileSync(path, 'utf-8');
    widgetBundle += '\n';
  } else {
    console.warn(`Warning: Widget file not found: ${path}`);
  }
}
writeFileSync(join(distDir, 'widget-bundle.js'), widgetBundle);

// Also copy iframe-bridge as it may be needed
const bridgePath = join(widgetDir, 'iframe-bridge.js');
if (existsSync(bridgePath)) {
  // The bridge is included in the widget bundle since it guards itself
  widgetBundle += `\n// === iframe-bridge.js ===\n`;
  widgetBundle += readFileSync(bridgePath, 'utf-8');
  writeFileSync(join(distDir, 'widget-bundle.js'), widgetBundle);
}

console.log('Build complete! Extension at:', distDir);
console.log('Load as unpacked extension: chrome://extensions → Developer mode → Load unpacked');
