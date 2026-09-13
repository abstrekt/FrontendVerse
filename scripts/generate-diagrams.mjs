/**
 * Builds a diagram set.
 *
 *   node scripts/generate-diagrams.mjs blind75            # build a whole set
 *   node scripts/generate-diagrams.mjs blind75 graphs     # build one
 *   node scripts/generate-diagrams.mjs                    # build every set
 *
 * Writes an editable `.drawio` into diagrams/<set>/ and a themed, inlined
 * `.svg` into public/diagrams/<set>/.
 *
 * Cell ids are reset before each diagram, so a file's ids depend only on its
 * own `build()` — rebuilding one diagram, one set, or everything all produce
 * byte-identical output. They used to come from a counter shared across the
 * whole run, which meant the diff for "I moved one box" also renumbered every
 * cell in every file built after it.
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

import { document, resetIds } from './lib/drawio-builder.mjs';
import { DIAGRAMS as BLIND75 } from './lib/blind75-diagrams.mjs';
import { DIAGRAMS as SYSDESIGN } from './lib/sysdesign-diagrams.mjs';
import { DIAGRAMS as REACT } from './lib/react-diagrams.mjs';
import { postprocess, findUnmappedColors } from './lib/svg-postprocess.mjs';
import { lintDiagram } from './lib/diagram-lint.mjs';

const SETS = { blind75: BLIND75, sysdesign: SYSDESIGN, react: REACT };

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');

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

function buildSet(setName, only, bin) {
  const DIAGRAMS = SETS[setName];
  const SRC_DIR = join(ROOT, 'diagrams', setName);
  const OUT_DIR = join(ROOT, 'public', 'diagrams', setName);
  const names = only.length ? only : Object.keys(DIAGRAMS);

  for (const name of names) {
    if (!DIAGRAMS[name]) {
      console.error(`✗ unknown diagram "${name}" in set ${setName}. Known: ${Object.keys(DIAGRAMS).join(', ')}`);
      return 1;
    }
  }

  mkdirSync(SRC_DIR, { recursive: true });
  mkdirSync(OUT_DIR, { recursive: true });

  let failed = 0;

  for (const name of names) {
    const { title, build } = DIAGRAMS[name];
    resetIds();
    const { width, height, cells } = build();

    const drawioPath = join(SRC_DIR, `${name}.drawio`);
    const xml = document({ name: title, width, height, cells });
    writeFileSync(drawioPath, xml);

    // Both of these are invisible in the export: a cell past the edge is
    // cropped away and an oversized label is clipped mid-sentence, and the
    // build still reports success.
    const { offCanvas, clipped, overlapping } = lintDiagram(xml, { width, height });
    for (const c of offCanvas) {
      console.error(`✗ ${name}: "${c.label}" is outside the ${width}×${height} canvas (${c.box})`);
    }
    for (const c of clipped) {
      console.warn(`  ⚠ ${name}: "${c.label}" needs ~${c.needed}px, box is ${c.have}px`);
    }
    for (const c of overlapping) {
      console.warn(`  ⚠ ${name}: "${c.a}" overlaps "${c.b}" by ${c.by}px`);
    }
    if (offCanvas.length) {
      failed += 1;
      continue;
    }

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
    // An unmapped colour is a bug, not a note: svg-postprocess could not turn
    // it into a `--dg-*` custom property, so it will not follow the theme.
    if (unmapped.length) failed += 1;
  }

  // The set used to include a stray `test.drawio` from an early experiment.
  const stray = join(SRC_DIR, 'test.drawio');
  if (existsSync(stray)) rmSync(stray);

  return failed;
}

function main() {
  const args = process.argv.slice(2).filter((a) => !a.startsWith('-'));
  const [setName, ...only] = args;

  if (setName && !SETS[setName]) {
    console.error(`✗ unknown set "${setName}". Known: ${Object.keys(SETS).join(', ')}`);
    process.exitCode = 1;
    return;
  }

  const bin = findDrawio();
  if (!bin) {
    console.warn('! draw.io CLI not found — writing .drawio sources only.');
    console.warn(`  Looked in: ${DRAWIO_CANDIDATES.join(', ')}`);
  }

  const sets = setName ? [setName] : Object.keys(SETS);
  let failed = 0;
  for (const s of sets) failed += buildSet(s, setName ? only : [], bin);

  if (failed) process.exitCode = 1;
}

main();
