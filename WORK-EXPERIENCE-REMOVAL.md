# Removing the `work-experience-deep-dive` section

This section is **temporary** — interview prep, added 2026-09-12, renamed from
`acceldata-prep` on 2026-09-15. Delete it once it has served its purpose. Nothing else depends on it.

## Grep first

```bash
grep -rn "work-experience\|workExperience" src/ scripts/ data/ --include="*.js" --include="*.jsx" --include="*.mjs" --include="*.json"
```

Two identifiers cover everything: the section id `work-experience-deep-dive`
and the variable base `workExperience` / `WorkExperience`.

## Files to edit

| File | What to remove |
| --- | --- |
| `src/sections/registry.js` | The `'work-experience-deep-dive'` entry and its comment |
| `src/utils/routes.js` | `'work-experience-deep-dive'` from `LEARNING_SECTIONS` |
| `src/data/datasets.js` | The `'work-experience-deep-dive'` loader in `LEARNING_LOADERS` |
| `src/utils/archive.js` | `EMPTY_ARCHIVED`, `SECTIONS`, `SECTION_LABELS` |
| `src/utils/starred.js` | `EMPTY_STARRED`, `EMPTY_STARRED_FILTER` |
| `src/utils/completed.js` | `EMPTY_COMPLETED` |
| `src/utils/searchIndex.js` | `SECTION_LABELS`, the `workExperience` param of `buildSearchIndex`, and its spread in the returned array |
| `src/components/ArchivedView.jsx` | `SECTION_ITEMS`, the `workExperience = []` prop, and `pools` |
| `scripts/build-data-manifest.mjs` | The `'work-experience-deep-dive'` entry in `SECTIONS` |
| `src/App.jsx` | 20 blocks — see below |

## Files to delete

- `data/work-experience-deep-dive.json`
- This file, last.

## `src/App.jsx` — the 20 blocks

Each is a copy of the corresponding `css` block. In file order:

1. `const [workExperience, setWorkExperience] = useState([])`
2. `'work-experience-deep-dive': setWorkExperienceLearningId` in the `learningSetters` destructure
3. `activeWorkExperience` — `filterActive` memo
4. `starredActiveWorkExperience` — `filterStarred` memo
5. `orderedStarredActiveWorkExperience` — `sortCompletedToEnd` memo
6. `workExperienceCompletedCount`
7. `workExperienceStarredCount`
8. `workExperience: activeWorkExperience` in the `buildSearchIndex` object
9. `activeWorkExperience` in that memo's **dependency array**
10. `selectedWorkExperience` memo
11. The route-correction `useEffect`
12. `'work-experience-deep-dive': setWorkExperience` in the loader `setters` map
13. The `if (section === 'work-experience-deep-dive')` search-navigation branch
14. `handleToggleWorkExperienceCompleted`
15. `handleWorkExperienceStarredFilterChange`
16. `handleArchiveWorkExperience`
17. The `'work-experience-deep-dive'` entry in `navCounts`
18. `workExperienceCompletedCount, activeWorkExperience` in the `navCounts` **dependency array**
19. The `activeSection === 'work-experience-deep-dive'` `<LearningsView>` render branch
20. `workExperience={workExperience}` on `<ArchivedView>`, and the
    `activeSection === 'work-experience-deep-dive'` `<LearningsPanel>` branch

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

Starred/completed/archived ids saved under the `work-experience-deep-dive` key stay in the
browser's localStorage. They are harmless — the reducers read `?.[section] ?? []`
and ignore unknown keys. No cleanup needed.
