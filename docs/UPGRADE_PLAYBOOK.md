# Upgrade Playbook

This is the single source of truth for maintainers. Use this file first for any upgrade.

## 1) Runtime Pipeline

1. Command entrypoint: `src/extension.ts`
2. Git change collection: `src/git/gitService.ts`
3. Analysis pipeline assembly: `src/analyzer/analysisPipeline.ts`
4. Diff parsing + content signals: `src/analyzer/diffAnalyzer.ts`
5. Path-based signal: `src/analyzer/fileClassifier.ts`
6. Metadata-based signal: `src/analyzer/metadataAnalyzer.ts`
7. Score fusion and winner: `src/scorer/commitScorer.ts`
8. Scope inference: `src/analyzer/scopeResolver.ts` -> `src/analyzer/scopeCore.ts`
9. Commit text generation: `src/generator/messageComposer.ts` + `src/generator/verbSelector.ts`

## 2) Data Contracts

Defined in `src/types.ts`:
- `CommitType`: allowed conventional types.
- `Signal`: `{ type, source, weight, reason }`.
- `AnalyzedFile`: normalized per-file analysis unit.
- `GenerationResult`: final `{ message, type, scope, confidence, signals }`.

Rule: keep these types stable first, then update producer/consumer modules.

## 3) Module Responsibilities

### `src/extension.ts`
- Thin orchestration layer only.
- Delegates change analysis to `analysisPipeline.ts`.
- Applies confidence notification logic.
- Emits optional local telemetry (`commitGen.debugTelemetry`) to `CommitGen` Output channel.
- Exposes explain command: `commitGen.explainLast`.

### `src/analyzer/analysisPipeline.ts`
- Normalizes raw Git changes into `AnalyzedFile[]`.
- Handles very large diff fallback using `maxRawDiffChars`.
- Produces parse/truncation metrics for telemetry.

### `src/config/configuration.ts`
- Reads VS Code settings.
- Sanitizes user config:
  - invalid `scopeMapping` entries are dropped
  - invalid `typeOverrides` commit types are dropped
- Exposes defaults and clamps numeric settings.

### `src/analyzer/diffAnalyzer.ts`
- Parses unified diff via `parse-diff`.
- Extracts:
  - added/removed lines
  - function/class contexts
  - similarity for renames
  - content-based signals
- Performance guardrail:
  - stores up to `maxLinesPerFile` lines
  - still preserves true `additions/deletions` counters

### `src/analyzer/fileClassifier.ts`
- Applies path-based signal inference.
- `typeOverrides` has highest path-level priority.

### `src/analyzer/metadataAnalyzer.ts`
- Uses Git status and aggregate file characteristics.
- Adds signals for docs-only/test-only/ci-only/style-only/deps-only sets.

### `src/analyzer/scopeCore.ts`
- Weighted scope inference.
- Priority:
  1. explicit `scopeMapping`
  2. weighted monorepo roots (`packages`, `apps`, etc.)
  3. `src/*` and component heuristics
  4. meaningful directory fallback

### `src/scorer/commitScorer.ts`
- Combines signals with probabilistic formula:
  - `1 - (1 - current) * (1 - weight)`
- Resolves near ties with fixed `TYPE_PRIORITY`.
- Supports profile-aware weighting via `commitGen.profile`.

### `src/generator/messageComposer.ts`
- Builds final description/body/header.
- Handles rename wording by similarity:
  - `>=95`: rename
  - `50-94`: rename and update
  - `<50`: remove old and add new
- Body compaction:
  - max lines
  - max contexts per file
  - overflow summary line
- Message style profile support:
  - `concise`
  - `balanced`
  - `verbose`

### `src/generator/verbSelector.ts`
- Chooses intent-aware verbs from diff semantics (`guard`, `memoize`, `expose`, etc.).

### `src/utils/patterns.ts`
- Central regex/pattern inventory.
- Hotspot file for behavior tuning.

## 4) Settings and Effects

Configured in `package.json` and parsed in `configuration.ts`:
- `commitGen.maxHeaderLength`
- `commitGen.maxAnalyzedLinesPerFile`
- `commitGen.maxContextsPerFile`
- `commitGen.maxRawDiffChars`
- `commitGen.bodyMaxLines`
- `commitGen.bodyMaxContextsPerFile`
- `commitGen.scopeMapping`
- `commitGen.typeOverrides`
- `commitGen.profile`
- `commitGen.messageStyle`
- `commitGen.showConfidence`
- `commitGen.includeWorkingTreeWhenNoStaged`
- `commitGen.includeBody`
- `commitGen.debugTelemetry`

When adding a new setting, always update:
1. `package.json` configuration schema
2. `src/config/configuration.ts`
3. `README.md` settings table
4. tests

## 5) Where To Edit For Common Requests

- Better commit type accuracy:
  - `src/utils/patterns.ts`
  - `src/analyzer/analysisPipeline.ts`
  - `src/analyzer/diffAnalyzer.ts`
  - `src/analyzer/metadataAnalyzer.ts`
- Better scope:
  - `src/analyzer/scopeCore.ts`
- Better wording:
  - `src/generator/verbSelector.ts`
  - `src/generator/messageComposer.ts`
- New setting:
  - `package.json` contributes.configuration
  - `src/config/configuration.ts`
  - `README.md` settings table
  - tests

## 6) Test Coverage Map

Current tests:
- `test/commitScorer.test.ts`
- `test/diffAnalyzer.test.ts`
- `test/messageComposer.test.ts`
- `test/scopeCore.test.ts`
- `test/goldenMessages.test.ts`
- `test/fixtures/golden-messages.json`

What each protects:
- scorer math and tie behavior
- parser extraction and line-cap behavior
- description/body wording rules
- scope weighting and ambiguity behavior
- stable human-readable output from fixture-backed golden cases

## 7) High-Risk Change Areas

1. `patterns.ts`: small regex changes can alter many classifications.
2. `diffAnalyzer.ts`: performance and memory regressions on large diffs.
3. `scopeCore.ts`: scope ambiguity can degrade message quality.
4. `messageComposer.ts`: wording regressions are user-visible immediately.

For these files, require:
- test update
- before/after example in PR notes

## 8) Verification and Release

Before commit:
1. `npm run lint`
2. `npm run typecheck`
3. `npm run test`
4. `npm run build`
5. `npm run package:check`
6. `npm run benchmark` (for performance-sensitive changes)

Before release:
1. Update `CHANGELOG.md`.
2. Confirm README examples match behavior.
3. Verify VSIX contents are clean.
4. Tag and publish.

## 9) Upgrade Entry Checklist

1. Read this file.
2. Open only impacted files from section 3.
3. Update tests first for changed behavior.
4. Implement changes.
5. Run full verification.
