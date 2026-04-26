#!/usr/bin/env node
/**
 * sync-tokens.js
 * Design token sync between src/index.css and a local snapshot (tokens.json).
 *
 * Because Figma's Variables API requires an Organization plan, the Figma side
 * of this sync is handled interactively via Claude + the Figma MCP, which
 * writes updates to tokens.json. This script then applies those to index.css.
 *
 * Commands:
 *   npm run figma:tokens              — diff CSS vs tokens.json snapshot
 *   npm run figma:tokens:apply        — update src/index.css from tokens.json
 *   npm run figma:tokens:export       — write current CSS tokens to tokens.json
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const CSS_FILE = path.join(ROOT, 'src', 'index.css');
const SNAPSHOT_FILE = path.join(ROOT, 'tokens.json');

// ─── Parse :root CSS custom properties ───────────────────────────────────────

function parseCssTokens(css) {
  const block = css.match(/:root\s*\{([^}]+)\}/)?.[1] ?? '';
  const tokens = {};
  for (const line of block.split('\n')) {
    const m = line.match(/\s*(--[^:]+):\s*(.+?);/);
    if (m) tokens[m[1].trim()] = m[2].trim();
  }
  return tokens;
}

// ─── Apply a token map to the :root block in CSS ─────────────────────────────

function applyTokensToCss(css, incoming) {
  let updated = css;
  for (const [key, value] of Object.entries(incoming)) {
    updated = updated.replace(
      new RegExp(`(${key}:\\s*)[^;]+;`),
      `${key}: ${value};`
    );
  }
  return updated;
}

// ─── Main ─────────────────────────────────────────────────────────────────────

const cmd = process.argv[2];

const cssContent = fs.readFileSync(CSS_FILE, 'utf8');
const cssTokens = parseCssTokens(cssContent);

// ── Export: write CSS tokens → tokens.json ────────────────────────────────────
if (cmd === '--export') {
  const out = {
    _comment: 'Generated from src/index.css. Edit values here to sync back via --apply.',
    _updated: new Date().toISOString(),
    tokens: cssTokens,
  };
  fs.writeFileSync(SNAPSHOT_FILE, JSON.stringify(out, null, 2) + '\n');
  console.log(`✅  Exported ${Object.keys(cssTokens).length} tokens to tokens.json`);
  process.exit(0);
}

// ── Load snapshot ─────────────────────────────────────────────────────────────
if (!fs.existsSync(SNAPSHOT_FILE)) {
  console.log('No tokens.json snapshot found. Run with --export to create one from current CSS.');
  process.exit(0);
}

const snapshot = JSON.parse(fs.readFileSync(SNAPSHOT_FILE, 'utf8'));
const snapTokens = snapshot.tokens ?? {};

// ── Diff ──────────────────────────────────────────────────────────────────────
const allKeys = new Set([...Object.keys(cssTokens), ...Object.keys(snapTokens)]);
let inSync = 0;
const onlyInCss = [];
const onlyInSnapshot = [];
const different = [];

for (const key of allKeys) {
  if (key in cssTokens && !(key in snapTokens)) {
    onlyInCss.push(key);
  } else if (key in snapTokens && !(key in cssTokens)) {
    onlyInSnapshot.push(key);
  } else if (cssTokens[key] !== snapTokens[key]) {
    different.push({ key, css: cssTokens[key], snap: snapTokens[key] });
  } else {
    inSync++;
  }
}

// ── Report ────────────────────────────────────────────────────────────────────
const snapDate = snapshot._updated ? ` (snapshot from ${snapshot._updated.slice(0, 10)})` : '';
console.log(`Comparing src/index.css vs tokens.json${snapDate}\n`);
console.log(`✅  In sync: ${inSync} / ${allKeys.size}`);

if (different.length) {
  console.log(`\n⚠️   Values differ — tokens.json wins with --apply:`);
  for (const { key, css, snap } of different) {
    console.log(`   ${key}`);
    console.log(`     CSS:      ${css}`);
    console.log(`     Snapshot: ${snap}`);
  }
}

if (onlyInCss.length) {
  console.log(`\n⬅️   Only in CSS (not in snapshot):`);
  for (const k of onlyInCss) console.log(`   ${k}: ${cssTokens[k]}`);
}

if (onlyInSnapshot.length) {
  console.log(`\n➡️   Only in snapshot — will be added to CSS with --apply:`);
  for (const k of onlyInSnapshot) console.log(`   ${k}: ${snapTokens[k]}`);
}

if (inSync === allKeys.size) {
  console.log('\n🎉  All tokens are in sync!');
  process.exit(0);
}

// ── Apply ─────────────────────────────────────────────────────────────────────
if (cmd === '--apply') {
  const updated = applyTokensToCss(cssContent, snapTokens);
  fs.writeFileSync(CSS_FILE, updated);
  console.log('\n✅  Applied snapshot values to src/index.css');
  console.log('    Run `git diff src/index.css` to review changes.');
} else {
  console.log('\nRun with --apply to update src/index.css from tokens.json.');
}
