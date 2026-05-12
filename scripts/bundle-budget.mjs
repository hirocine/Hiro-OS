#!/usr/bin/env node
/**
 * Bundle budget — defensive check against silent regressions.
 *
 * Reads `dist/assets/*.js`, identifies the "always loaded" chunks
 * (entry + named vendor splits) and asserts they stay under set
 * budgets. Lazy page chunks and known-large on-demand chunks
 * (ImportDialog/xlsx, PolicyEditor/tiptap, pdf-* / jspdf,
 * html2canvas, recharts) are ignored — they only load when their
 * page actually renders.
 *
 * Run locally: `node scripts/bundle-budget.mjs`
 * Run in CI:   same, after `npm run build`.
 * Exits non-zero with a readable diff when a budget is broken.
 */

import { readdirSync, readFileSync } from 'node:fs';
import { gzipSync } from 'node:zlib';
import { join } from 'node:path';

const DIST = 'dist/assets';
const INDEX_HTML = 'dist/index.html';

/**
 * The entry is whichever JS file `dist/index.html` actually loads.
 * Several auto-split chunks happen to share the `index-` prefix
 * (e.g. internal recharts/jspdf bundles), so we can't rely on the
 * filename alone.
 */
function resolveEntryFile() {
  const html = readFileSync(INDEX_HTML, 'utf8');
  const match = html.match(/src="\/assets\/(index-[^"]+\.js)"/);
  if (!match) {
    throw new Error('Could not find entry chunk in dist/index.html');
  }
  return match[1];
}

const ENTRY_FILE = resolveEntryFile();

/**
 * Budgets in bytes (gzipped). Pick numbers that are ~15% over the
 * current measured size so normal feature work doesn't trip the
 * check, but a careless `import x from 'huge-lib'` does. Update
 * intentionally when you re-baseline.
 */
const BUDGETS = {
  // The entry chunk that hosts App.tsx + the route table + every
  // eager layout component. Heaviest single piece of always-loaded
  // app code.
  entry: 120_000,
  // Vendor chunks broken out in vite.config.ts. Each one is shared
  // across the whole app and cached separately on deploys, so they
  // can be a bit chunkier — but should still be bounded.
  'react-vendor': 70_000,
  'radix-vendor': 70_000,
  'supabase-vendor': 60_000,
  'query-vendor': 20_000,
  'icons-vendor': 20_000,
  'date-vendor': 15_000,
};

function gzipSize(filePath) {
  return gzipSync(readFileSync(filePath), { level: 9 }).length;
}

function fmt(bytes) {
  return `${(bytes / 1024).toFixed(1)} kB`;
}

function findChunk(files, pattern) {
  return files.find((f) => f.match(pattern));
}

const files = readdirSync(DIST).filter((f) => f.endsWith('.js'));

const checks = [
  // Resolved from dist/index.html so we measure the real entry, not
  // an auto-split chunk that happens to share the `index-` prefix.
  { name: 'entry', pattern: new RegExp(`^${ENTRY_FILE.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`), budget: BUDGETS.entry },
  { name: 'react-vendor', pattern: /^react-vendor-/, budget: BUDGETS['react-vendor'] },
  { name: 'radix-vendor', pattern: /^radix-vendor-/, budget: BUDGETS['radix-vendor'] },
  { name: 'supabase-vendor', pattern: /^supabase-vendor-/, budget: BUDGETS['supabase-vendor'] },
  { name: 'query-vendor', pattern: /^query-vendor-/, budget: BUDGETS['query-vendor'] },
  { name: 'icons-vendor', pattern: /^icons-vendor-/, budget: BUDGETS['icons-vendor'] },
  { name: 'date-vendor', pattern: /^date-vendor-/, budget: BUDGETS['date-vendor'] },
];

const results = [];
let failed = false;

for (const { name, pattern, budget } of checks) {
  const file = findChunk(files, pattern);
  if (!file) {
    results.push({ name, status: 'MISS', message: 'chunk not found — did vite.config split change?' });
    failed = true;
    continue;
  }
  const size = gzipSize(join(DIST, file));
  const over = size > budget;
  if (over) failed = true;
  results.push({
    name,
    status: over ? 'FAIL' : 'OK',
    size,
    budget,
    diff: size - budget,
    file,
  });
}

// Total always-loaded gzipped size — useful trend metric even when
// no individual budget trips. Hard-fail if total > 320 kB gz.
const totalSize = results
  .filter((r) => typeof r.size === 'number')
  .reduce((sum, r) => sum + r.size, 0);
const totalBudget = 320_000;
const totalOver = totalSize > totalBudget;
if (totalOver) failed = true;

// Pretty print
const pad = (s, n) => String(s).padEnd(n);
console.log('\nBundle budget — always-loaded chunks (gzipped):\n');
console.log(`${pad('chunk', 18)}  ${pad('size', 10)}  ${pad('budget', 10)}  status`);
console.log('─'.repeat(58));
for (const r of results) {
  if (r.status === 'MISS') {
    console.log(`${pad(r.name, 18)}  ${pad('?', 10)}  ${pad(fmt(r.budget ?? 0), 10)}  ❌ ${r.message}`);
    continue;
  }
  const icon = r.status === 'OK' ? '✓' : '❌';
  const diffStr = r.status === 'FAIL' ? ` (+${fmt(r.diff)})` : '';
  console.log(`${pad(r.name, 18)}  ${pad(fmt(r.size), 10)}  ${pad(fmt(r.budget), 10)}  ${icon} ${r.status}${diffStr}`);
}
console.log('─'.repeat(58));
const totalIcon = totalOver ? '❌' : '✓';
const totalDiff = totalOver ? ` (+${fmt(totalSize - totalBudget)})` : '';
console.log(`${pad('TOTAL', 18)}  ${pad(fmt(totalSize), 10)}  ${pad(fmt(totalBudget), 10)}  ${totalIcon} ${totalOver ? 'FAIL' : 'OK'}${totalDiff}`);
console.log('');

if (failed) {
  console.error('Bundle budget exceeded. Re-baseline in scripts/bundle-budget.mjs if intentional.');
  process.exit(1);
}
console.log('All budgets within limits.');
