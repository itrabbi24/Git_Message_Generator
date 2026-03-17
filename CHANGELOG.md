# Changelog

All notable changes to this project are documented in this file.

## [Unreleased]

### Added
- TBD

### Changed
- TBD

## [0.2.1] - 2026-03-17

### Changed
- Strip file extensions from filenames in generated commit message headers and body for cleaner, more human-readable output (e.g. `add messageComposer, verbSelector` instead of `add messageComposer.ts, verbSelector.ts`)
- Join multi-area summaries with natural English `and` instead of `+` (e.g. `update src and test modules` instead of `update src+test modules`)
- Improve grouped body overflow suffix from ` +N` to ` (+N more)` for clarity

## [0.2.0] - 2026-03-10

### Added
- Automated unit tests for diff parsing, scoring, scope detection, and message composition.
- GitHub Actions CI workflow for lint, typecheck, build, test, and package validation.
- New performance settings:
  - `commitGen.maxAnalyzedLinesPerFile`
  - `commitGen.maxContextsPerFile`
  - `commitGen.maxRawDiffChars`
- New body controls:
  - `commitGen.bodyMaxLines`
  - `commitGen.bodyMaxContextsPerFile`
- Optional local telemetry setting:
  - `commitGen.debugTelemetry`
- New maintainer guide:
  - `docs/UPGRADE_PLAYBOOK.md`
- Golden output regression harness:
  - `test/goldenMessages.test.ts`
  - `test/fixtures/golden-messages.json`
- Explain command:
  - `commitGen.explainLast`
- Benchmark scripts:
  - `npm run benchmark`
  - `npm run benchmark:ci`
- Automated tag-based release workflow:
  - `.github/workflows/release.yml`
- Release planning workflow and script:
  - `.github/workflows/release-plan.yml`
  - `npm run release:plan`
- New pure generation layer for integration-style testing:
  - `src/core/generationEngine.ts`
- Golden fixture refresh script:
  - `npm run golden:refresh`
  - `scripts/generateGolden.ts`
- Preset command:
  - `commitGen.applyPreset`
- Integration-style generation test:
  - `test/generationEngine.integration.test.ts`
- Profile detection tests:
  - `test/profileWeights.test.ts`

### Changed
- Analysis orchestration moved into `src/analyzer/analysisPipeline.ts` for cleaner layering.
- Scope detection logic extracted into `scopeCore` for better testability.
- `STATUS_VERBS` deduplicated into a single shared utility.
- Diff parsing now caps stored per-file lines and contexts while preserving true addition/deletion totals.
- Scope conflict handling now uses weighted path inference and avoids ambiguous comma scopes.
- Low-similarity renames now use explicit remove/add wording.
- Commit body generation now deduplicates contexts, supports style profiles, and can group larger changes by module.
- Configuration parsing now sanitizes invalid mapping and type override entries.
- Confidence-gated wording now reduces over-specific text for medium/low confidence cases.
- Score combination now clamps invalid weights and rounds to fixed precision for deterministic behavior.
- Multi-scope fallback now summarizes top areas (e.g., `src+docs modules`).
- Added adaptive scoring profile support (`balanced`, `frontend`, `backend`, `infra`).
- Added auto profile detection (`commitGen.autoDetectProfile`) when profile is balanced.
- Added message style profiles (`concise`, `balanced`, `verbose`).
- Expanded golden fixture coverage with additional realistic scenarios.
- Release workflow now enforces benchmark quality gate.

### Removed
- Tracked `.vsix` release artifacts from repository.

## [0.1.1] - 2026-03-10

### Added
- Detailed multi-line commit body output.
- Dynamic filename-based scope fallback for single-file commits.
- Improved content-aware verb selection and rename wording.

### Fixed
- Git status refresh before change detection.
- Better handling of staged vs unstaged fallback behavior.

## [0.1.0] - 2026-03-10

### Added
- Four-layer signal pipeline for commit generation.
- Conventional commit formatting with confidence score.
- Path, diff-content, and metadata-based classification.

## [0.0.4] - 2026-03-10

### Changed
- Heuristic quality and message generation improvements.

## [0.0.3] - 2026-03-10

### Added
- Rename and similarity-aware descriptions.
- Revert handling and merge/revert skip behavior.

### Fixed
- "No staged changes found" false negative issue.

## [0.0.2] - 2026-03-10

### Added
- Fallback generation from working-tree changes.

## [0.0.1] - 2026-03-10

### Added
- Initial release.
