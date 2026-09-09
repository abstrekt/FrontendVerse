import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { pattern1 } from './blind75/pattern1_arrays.mjs';
import { pattern2 } from './blind75/pattern2_two_pointers.mjs';
import { pattern3 } from './blind75/pattern3_linked_lists.mjs';
import { pattern4 } from './blind75/pattern4_trees.mjs';
import { pattern5 } from './blind75/pattern5_heaps.mjs';
import { pattern6 } from './blind75/pattern6_dp.mjs';
import { pattern7 } from './blind75/pattern7_intervals.mjs';
import { pattern8 } from './blind75/pattern8_graphs_matrix.mjs';
import { pattern9 } from './blind75/pattern9_bit_manipulation.mjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const allPatterns = [
  ...pattern1,
  ...pattern2,
  ...pattern3,
  ...pattern4,
  ...pattern5,
  ...pattern6,
  ...pattern7,
  ...pattern8,
  ...pattern9,
];

console.log(`Loaded ${allPatterns.length} total Blind 75 learning entries.`);

// 1. Validation: Verify unique IDs
const idSet = new Set();
const duplicateIds = [];
for (const item of allPatterns) {
  if (idSet.has(item.id)) {
    duplicateIds.push(item.id);
  }
  idSet.add(item.id);

  // Check required fields
  if (!item.id || !item.title || !item.pattern || !item.difficulty || !Array.isArray(item.tags) || !item.answer) {
    console.error(`Missing required fields on item:`, item);
    process.exit(1);
  }
}

if (duplicateIds.length > 0) {
  console.error(`ERROR: Duplicate IDs found:`, duplicateIds);
  process.exit(1);
}

// 2. Pattern breakdown stats
const patternCounts = {};
for (const item of allPatterns) {
  patternCounts[item.pattern] = (patternCounts[item.pattern] || 0) + 1;
}

console.log('Pattern breakdown:');
for (const [pat, count] of Object.entries(patternCounts)) {
  console.log(` - ${pat}: ${count} entries`);
}

// 3. Output to data/blind75-learnings.json
const outputPath = path.resolve(__dirname, '../data/blind75-learnings.json');
const payload = {
  learnings: allPatterns,
};

fs.writeFileSync(outputPath, JSON.stringify(payload, null, 2) + '\n', 'utf-8');
console.log(`Successfully written ${allPatterns.length} entries to ${outputPath}`);
