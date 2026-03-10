# Changelog

All notable changes to this project are documented in this file.

## [Unreleased]

### Added
- Automated unit tests for diff parsing, scoring, scope detection, and message composition.
- GitHub Actions CI workflow for lint, typecheck, build, test, and package validation.
- New performance settings:
  - `commitGen.maxAnalyzedLinesPerFile`
  - `commitGen.maxContextsPerFile`

### Changed
- Scope detection logic extracted into `scopeCore` for better testability.
- `STATUS_VERBS` deduplicated into a single shared utility.
- Diff parsing now caps stored per-file lines and contexts while preserving true addition/deletion totals.

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
