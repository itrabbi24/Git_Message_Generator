# Changelog

All notable changes to this project will be documented in this file.

## [0.0.3] - 2026-03-10

### Fixed
- **Core bug**: call `repository.status()` before reading changes to fix "No staged changes found" appearing when changes exist
- Added `status()` method to `Repository` type definition

### Added — Detection Engine
- `revert` commit type now recognized (skips auto-generation when git already provides a Revert message)
- Merge commit detection: skips generation when inputBox already has "Merge …" message
- **Layer 1 (file-path)**: Added `kubernetes/`, `k8s/`, `helm/`, `terraform/` → `build`; `__mocks__/`, `__fixtures__/` → `test`; `SECURITY`, `CODE_OF_CONDUCT` → `docs`; `.drone.yml`, `bitbucket-pipelines.yml` → `ci`; `.vue`, `.svelte` source extensions; `turbo.json`, `nx.json` → `build`
- **Layer 2 (diff-content)**: Added 3:1 additions-to-deletions ratio signal → `feat` (0.40); reverse 3:1 ratio (mostly removals) → `chore` (0.35); `interface`, `type`, `enum` declarations detected as `feat`; `instanceof Error` guard → `fix`; Web Worker / `requestIdleCallback` → `perf`; `beforeEach`/`afterAll` → `test`; security patterns (`bcrypt`, `crypto.`) → `fix`
- **Layer 3 (metadata)**: `build` signal (0.80) when all changed files are dependency manifests/lock files; aggregate 3:1 ratio across all files; homogeneous file-set signals (all docs, all tests, all CI, all style, all binary assets)
- **Package.json content inspection**: distinguishes version bumps (`chore`), dependency entry changes (`build`), and script changes (`build`)
- Comment-only diff → `docs` (0.58 confidence)

### Added — Scope Detection
- Auto-detects `deps` scope when all changed files are dependency/lock files → `build(deps): update dependencies`
- Dominant scope (>60% of files) now used for monorepo packages rather than comma-listing
- Extended `MEANINGFUL_DIRS` with 20+ more directory names (features, pages, components, context, handlers, workers, etc.)

### Added — Message Generation
- **Rename similarity-aware descriptions**: ≥95% similarity → `rename X to Y`; 50–94% → `rename and update X to Y`; <50% treated as delete+add
- **Content-aware verb selection**: catch block → `handle`; optional chaining → `guard`; useMemo → `memoize`; dynamic import → `lazy-load`; debounce → `debounce`
- **Status-aware verbs**: A → `add`, M → `update`, D → `remove`, R → `rename`
- **Large commit handling**: >20 files with no scope → `update multiple modules`; >20 files shows split-commit warning
- Function context from `@@` hunk headers used in single-file descriptions for `fix`, `perf`, `refactor`, `feat`

### Added — UX
- Confidence threshold tiers (PDF spec): ≥80% → silent; 50–79% → info notification; <50% → warning notification
- Large commit warning (>20 files) suggests splitting into focused commits

## [0.0.2] - 2026-03-10

- Added fallback generation from unstaged working-tree changes when no staged files exist
- Added `commitGen.includeWorkingTreeWhenNoStaged` setting (default `true`)
- Improved Marketplace metadata and packaging details

## [0.0.1] - 2026-03-10

- Initial public release
- Added VS Code command to generate commit messages from staged Git changes
- Added path-based, diff-based, and metadata-based classification
- Added scope detection and conventional commit formatting
- Added VSIX packaging support and repository documentation
