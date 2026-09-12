/**
 * Builds the Blind 75 pattern diagrams.
 *
 *   node scripts/generate-blind75-diagrams.mjs          # build all
 *   node scripts/generate-blind75-diagrams.mjs graphs   # build one
 *
 * Writes an editable `.drawio` into diagrams/blind75/ and a themed, inlined
 * `.svg` into public/diagrams/blind75/.
 *
 * The layout used to come from Mermaid text run through the draw.io CLI's
 * importer. Its auto-layout overlapped nodes, leaked Mermaid syntax into
 * labels, and produced 1600px-wide canvases that scaled to unreadable text in
 * the article column — so positions are now explicit (see
 * lib/blind75-diagrams.mjs) and the CLI is used only to rasterise geometry
 * into SVG.
 *
 * Requires the draw.io desktop CLI. Without it the `.drawio` sources are
 * still written and the SVG step is skipped with a warning, so the repo stays
 * buildable on a machine that does not have it.
 */

import { execFileSync } from 'child_process';
import { writeFileSync, readFileSync, mkdirSync, existsSync, rmSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

import { document } from './lib/drawio-builder.mjs';
import { DIAGRAMS } from './lib/blind75-diagrams.mjs';
import { postprocess, findUnmappedColors } from './lib/svg-postprocess.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const SRC_DIR = join(ROOT, 'diagrams', 'blind75');
const OUT_DIR = join(ROOT, 'public', 'diagrams', 'blind75');

const DRAWIO_CANDIDATES = [
  process.env.DRAWIO_BIN,
  join(process.env.HOME ?? '', '.local/bin/drawio'),
  '/Applications/draw.io.app/Contents/MacOS/draw.io',
  '/usr/bin/drawio',
  '/usr/local/bin/drawio',
].filter(Boolean);

function findDrawio() {
  for (const candidate of DRAWIO_CANDIDATES) {
    if (existsSync(candidate)) return candidate;
  }
  return null;
}

function exportSvg(bin, drawioPath, svgPath) {
  // `--svg-theme light` pins the export to the authoring palette. Without it
  // the CLI emits CSS `light-dark()` pairs keyed to the OS preference, which
  // would ignore the app's own theme toggle — the post-processor swaps in
  // custom properties instead.
  execFileSync(
    bin,
    ['-x', '-f', 'svg', '--svg-theme', 'light', '--disable-gpu', '-o', svgPath, drawioPath],
    { stdio: 'pipe', timeout: 120_000 }
  );
}

function main() {
  const only = process.argv.slice(2).filter((a) => !a.startsWith('-'));
  const names = only.length ? only : Object.keys(DIAGRAMS);

  for (const name of names) {
    if (!DIAGRAMS[name]) {
      console.error(`✗ unknown diagram "${name}". Known: ${Object.keys(DIAGRAMS).join(', ')}`);
      process.exitCode = 1;
      return;
    }
  }

  mkdirSync(SRC_DIR, { recursive: true });
  mkdirSync(OUT_DIR, { recursive: true });

  const bin = findDrawio();
  if (!bin) {
    console.warn('! draw.io CLI not found — writing .drawio sources only.');
    console.warn(`  Looked in: ${DRAWIO_CANDIDATES.join(', ')}`);
  }

  let failed = 0;

  for (const name of names) {
    const { title, build } = DIAGRAMS[name];
    const { width, height, cells } = build();

    const drawioPath = join(SRC_DIR, `${name}.drawio`);
    writeFileSync(drawioPath, document({ name: title, width, height, cells }));

    if (!bin) continue;

    const svgPath = join(OUT_DIR, `${name}.svg`);
    try {
      exportSvg(bin, drawioPath, svgPath);
    } catch (err) {
      console.error(`✗ ${name}: draw.io export failed — ${err.message.split('\n')[0]}`);
      failed += 1;
      continue;
    }

    const raw = readFileSync(svgPath, 'utf8');
    const clean = postprocess(raw, { name: title });
    writeFileSync(svgPath, clean);

    const unmapped = findUnmappedColors(clean);
    const saved = Math.round((1 - clean.length / raw.length) * 100);
    const kb = (clean.length / 1024).toFixed(1);

    console.log(
      `✓ ${name.padEnd(28)} ${String(width).padStart(4)}×${String(height).padEnd(4)}  ${kb.padStart(6)} KB  (−${saved}%)` +
        (unmapped.length ? `  ⚠ unmapped: ${unmapped.join(' ')}` : '')
    );
  }

  // The set used to include a stray `test.drawio` from an early experiment.
  const stray = join(SRC_DIR, 'test.drawio');
  if (existsSync(stray)) rmSync(stray);

  if (failed) process.exitCode = 1;
}

main();
