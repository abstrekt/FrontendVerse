# Removing the `acceldata-prep` section

This section is **temporary** — interview prep, added 2026-09-12. Delete it once
it has served its purpose. Nothing else depends on it.

## Grep first

```bash
grep -rn "acceldata" src/ scripts/ data/ --include="*.js" --include="*.jsx" --include="*.mjs" --include="*.json"
```

Two identifiers cover everything: the section id `acceldata-prep` and the
variable base `acceldataPrep` / `AcceldataPrep`.

## Files to edit

| File | What to remove |
| --- | --- |
| `src/sections/registry.js` | The `'acceldata-prep'` entry and its comment |
| `src/utils/routes.js` | `'acceldata-prep'` from `LEARNING_SECTIONS` |
| `src/data/datasets.js` | The `'acceldata-prep'` loader in `LEARNING_LOADERS` |
| `src/utils/archive.js` | `EMPTY_ARCHIVED`, `SECTIONS`, `SECTION_LABELS` |
| `src/utils/starred.js` | `EMPTY_STARRED`, `EMPTY_STARRED_FILTER` |
| `src/utils/completed.js` | `EMPTY_COMPLETED` |
| `src/utils/searchIndex.js` | `SECTION_LABELS`, the `acceldataPrep` param of `buildSearchIndex`, and its spread in the returned array |
| `src/components/ArchivedView.jsx` | `SECTION_ITEMS`, the `acceldataPrep = []` prop, and `pools` |
| `scripts/build-data-manifest.mjs` | The `'acceldata-prep'` entry in `SECTIONS` |
| `src/App.jsx` | 20 blocks — see below |

## Files to delete

- `data/acceldata-prep.json`
- This file, last.

## `src/App.jsx` — the 20 blocks

Each is a copy of the corresponding `css` block. In file order:

1. `const [acceldataPrep, setAcceldataPrep] = useState([])`
2. `'acceldata-prep': setAcceldataPrepLearningId` in the `learningSetters` destructure
3. `activeAcceldataPrep` — `filterActive` memo
4. `starredActiveAcceldataPrep` — `filterStarred` memo
5. `orderedStarredActiveAcceldataPrep` — `sortCompletedToEnd` memo
6. `acceldataPrepCompletedCount`
7. `acceldataPrepStarredCount`
8. `acceldataPrep: activeAcceldataPrep` in the `buildSearchIndex` object
9. `activeAcceldataPrep` in that memo's **dependency array**
10. `selectedAcceldataPrep` memo
11. The route-correction `useEffect`
12. `'acceldata-prep': setAcceldataPrep` in the loader `setters` map
13. The `if (section === 'acceldata-prep')` search-navigation branch
14. `handleToggleAcceldataPrepCompleted`
15. `handleAcceldataPrepStarredFilterChange`
16. `handleArchiveAcceldataPrep`
17. The `'acceldata-prep'` entry in `navCounts`
18. `acceldataPrepCompletedCount, activeAcceldataPrep` in the `navCounts` **dependency array**
19. The `activeSection === 'acceldata-prep'` `<LearningsView>` render branch
20. `acceldataPrep={acceldataPrep}` on `<ArchivedView>`, and the
    `activeSection === 'acceldata-prep'` `<LearningsPanel>` branch

Items 9 and 18 are the two that fail silently if missed — stale search results
and stale nav counts, no error.

## Afterwards

```bash
pnpm run build:data-manifest   # rewrites data/counts.json — required, a test asserts it
pnpm test
pnpm build
```

`src/utils/dataManifest.test.js` fails if `data/counts.json` still lists the
section, so the test suite catches a forgotten regen.

## localStorage

Starred/completed/archived ids saved under the `acceldata-prep` key stay in the
browser's localStorage. They are harmless — the reducers read `?.[section] ?? []`
and ignore unknown keys. No cleanup needed.
