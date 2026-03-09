<div align="center">

# Git Message Generator By ARG RABBI

**Automatic conventional commit messages — right inside VS Code.**

[![VS Code Marketplace](https://img.shields.io/visual-studio-marketplace/v/argrabbi.git-message-generator-by-arg-rabbi?label=Marketplace&color=0078d7&style=flat-square)](https://marketplace.visualstudio.com/items?itemName=ARGRABBI.git-message-generator-by-arg-rabbi)
[![Downloads](https://img.shields.io/visual-studio-marketplace/d/argrabbi.git-message-generator-by-arg-rabbi?style=flat-square&color=brightgreen)](https://marketplace.visualstudio.com/items?itemName=ARGRABBI.git-message-generator-by-arg-rabbi)
[![Rating](https://img.shields.io/visual-studio-marketplace/r/argrabbi.git-message-generator-by-arg-rabbi?style=flat-square&color=yellow)](https://marketplace.visualstudio.com/items?itemName=ARGRABBI.git-message-generator-by-arg-rabbi)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg?style=flat-square)](./LICENSE)
[![GitHub](https://img.shields.io/badge/GitHub-itrabbi24-181717?style=flat-square&logo=github)](https://github.com/itrabbi24/Git_Message_Generator)

Stop writing commit messages from scratch. This extension analyzes your staged Git changes through a three-layer classification engine and instantly places a [Conventional Commits](https://www.conventionalcommits.org/)-formatted message in your Source Control input box.

[Install from Marketplace](https://marketplace.visualstudio.com/items?itemName=ARGRABBI.git-message-generator-by-arg-rabbi) · [View on GitHub](https://github.com/itrabbi24/Git_Message_Generator) · [Report an Issue](https://github.com/itrabbi24/Git_Message_Generator/issues)

</div>

---

## How It Works

The extension runs a weighted, three-layer signal pipeline on every change — no AI, no internet, no API keys.

```
Your Git changes
      │
      ▼
┌─────────────────────────────────────┐
│  Layer 1 · File Path Classification │  src/auth/login.ts → feat
│  Layer 2 · Diff Content Analysis    │  null-check added → fix
│  Layer 3 · Git Metadata Signals     │  all files added → feat
└─────────────────────────────────────┘
      │
      ▼
 Weighted score → Conventional commit type
      │
      ▼
 feat(auth): add login validation  ← placed in your input box
```

Signals are combined using a probabilistic scoring formula. The highest-confidence type wins and a human-readable message is generated in under a second.

---

## Features

| Capability | Detail |
|---|---|
| **11 commit types** | `feat` `fix` `docs` `style` `refactor` `perf` `test` `build` `ci` `chore` `revert` |
| **Auto scope detection** | Inferred from folder structure (`auth`, `api`, `payments`, …) |
| **`build(deps)` scope** | Auto-applied when only dependency or lock files changed |
| **Rename-aware descriptions** | ≥95% similarity → `rename X to Y`; 50–94% → `rename and update X to Y` |
| **Merge/revert skip** | Preserves git-generated messages automatically |
| **Confidence UX tiers** | ≥80% silent · 50–79% info · <50% warning |
| **Large commit warning** | >20 files triggers a split-commit suggestion |
| **Staged + unstaged fallback** | Falls back to working-tree changes if nothing is staged |
| **One-click + shortcut** | Button in Source Control panel · `Ctrl+Shift+G M` |
| **Fully local** | No network calls, no telemetry, no API keys required |

---

## Example Output

```text
feat(auth): add createAccount
fix(api): handle null token response
docs: update installation instructions
perf(ui): memoize expensiveCalculation
refactor(utils): rename formatDate to toISOString
build(deps): update lodash to 4.17.21
ci: add automated testing workflow
chore: update tsconfig strict mode
```

---

## Detection Coverage

### Layer 1 — File Path

| Type | Matched paths |
|---|---|
| `feat` | `src/`, `app/`, `lib/`, `components/`, `pages/`, `routes/`, `api/`, `services/` |
| `fix` | `src/`, `bugfix/`, `hotfix/` branches |
| `docs` | `README.md`, `CHANGELOG.md`, `docs/`, `wiki/`, `*.md`, `*.mdx` |
| `style` | `*.css`, `*.scss`, `*.less`, `*.sass`, `tailwind.config.*`, `.stylelintrc` |
| `test` | `__tests__/`, `__mocks__/`, `__fixtures__/`, `*.test.*`, `*.spec.*`, `cypress/` |
| `build` | `Dockerfile`, `webpack.*`, `vite.config.*`, `kubernetes/`, `k8s/`, `helm/`, `terraform/`, `*.tf` |
| `build(deps)` | `package.json`, `yarn.lock`, `package-lock.json`, `go.mod`, `Pipfile`, `Cargo.toml` |
| `ci` | `.github/workflows/`, `.circleci/`, `.drone.yml`, `bitbucket-pipelines.yml`, `Jenkinsfile` |
| `chore` | `.gitignore`, `tsconfig.json`, `.env*`, `.editorconfig`, `turbo.json`, `nx.json` |
| `perf` | `workers/`, `cache/`, `*.worker.*` |
| `refactor` | File renames, `utils/`, `helpers/`, `shared/`, `common/` |

### Layer 2 — Diff Content

| Signal | Detected pattern |
|---|---|
| `feat` | New `export function/class/component/route`, `interface`/`type`/`enum` declaration |
| `fix` | Optional chaining `?.`, null checks, `instanceof Error`, `try/catch` blocks |
| `perf` | `useMemo`, `useCallback`, `debounce`, `throttle`, `requestIdleCallback`, `.worker` |
| `refactor` | Balanced add/delete ratio, function rename patterns |
| `style` | Whitespace-only changes, formatting-only diffs |
| `docs` | Comment-only changes, JSDoc additions |
| `build` | Dependency entry changes in `package.json` |
| `chore` | Version bump pattern in `package.json` |
| `feat` | 3:1 additions-to-deletions ratio (net new code) |

### Layer 3 — Git Metadata

| Signal | Trigger |
|---|---|
| `feat` | All files have status **Added** |
| `chore` | All files have status **Deleted** |
| `refactor` | Rename detected in diff headers |
| `build(deps)` | All changed files are dependency or lock files |
| High confidence | Homogeneous file set (all test files, all docs, all CI, etc.) |

---

## Installation

### VS Code Marketplace (Recommended)

1. Open VS Code.
2. Press `Ctrl+Shift+X` to open Extensions.
3. Search for **Git Message Generator By ARG RABBI**.
4. Click **Install**.

Or install directly from the [Marketplace page](https://marketplace.visualstudio.com/items?itemName=ARGRABBI.git-message-generator-by-arg-rabbi).

### From VSIX

1. Download the `.vsix` file from [GitHub Releases](https://github.com/itrabbi24/Git_Message_Generator/releases).
2. Open VS Code → Extensions view (`Ctrl+Shift+X`).
3. Click the `···` menu → **Install from VSIX…**
4. Select the downloaded file.

### From Source

```bash
git clone https://github.com/itrabbi24/Git_Message_Generator.git
cd Git_Message_Generator
npm install
npm run build
```

Press `F5` in VS Code to launch the Extension Development Host.

---

## Usage

1. Open a Git repository in VS Code.
2. Make changes and **stage** the files you want to commit.
3. Open the **Source Control** panel (`Ctrl+Shift+G`).
4. Click the **Generate Git Message** button (pencil icon in the panel header).
5. The commit message is written to the input box instantly.
6. Review, edit if needed, and commit normally.

> **Tip:** If nothing is staged, the extension automatically falls back to unstaged working-tree changes — so it always works.

---

## Configuration

Open VS Code Settings (`Ctrl+,`) and search for **Git Message Generator** to find all options.

| Setting | Type | Default | Description |
|---|---|---|---|
| `commitGen.maxHeaderLength` | `number` | `72` | Maximum characters in the generated commit header |
| `commitGen.scopeMapping` | `object` | `{}` | Custom path-prefix → scope mappings |
| `commitGen.typeOverrides` | `object` | `{}` | Force a commit type for matching path prefixes |
| `commitGen.showConfidence` | `boolean` | `true` | Show confidence notification after generation |
| `commitGen.includeWorkingTreeWhenNoStaged` | `boolean` | `true` | Fall back to unstaged changes when nothing is staged |

### Custom Scope Mapping

```json
{
  "commitGen.scopeMapping": {
    "src/payments/": "payments",
    "src/auth/": "auth",
    "src/dashboard/": "dashboard"
  }
}
```

### Type Overrides

```json
{
  "commitGen.typeOverrides": {
    "migrations/": "feat",
    "scripts/deploy/": "ci",
    "scripts/": "chore"
  }
}
```

---

## Keyboard Shortcut

| Shortcut | Action |
|---|---|
| `Ctrl+Shift+G M` | Generate a commit message |

You can rebind this in **File → Preferences → Keyboard Shortcuts** by searching for `Generate Git Message`.

---

## What's New in v0.0.3

- **Fixed** the "No staged changes found" bug — repository state is now refreshed before reading changes
- Added `revert` commit type with merge/revert commit auto-skip
- Rename similarity-aware descriptions using diff `similarity index` headers
- Status-aware verbs: `add` / `update` / `remove` / `rename`
- Content-aware verb selection: `catch` → `handle`, `useMemo` → `memoize`, `import()` → `lazy-load`
- Extended file patterns: Kubernetes, Helm, Terraform, `__mocks__/`, `__fixtures__/`, `.vue`, `.svelte`
- `build(deps)` scope auto-detected for dependency-only commits
- Three-tier confidence UX and large-commit (>20 files) split warning

See the full [CHANGELOG](./CHANGELOG.md) for details.

---

## Project Structure

```text
src/
├── analyzer/
│   ├── diffAnalyzer.ts       # Layer 2: diff content analysis
│   ├── metadataAnalyzer.ts   # Layer 3: git metadata signals
│   └── scopeResolver.ts      # Scope detection from folder structure
├── config/
│   └── config.ts             # Extension settings
├── generator/
│   ├── messageComposer.ts    # Message assembly
│   └── verbSelector.ts       # Verb selection logic
├── git/
│   ├── git.ts                # VS Code Git API types
│   └── gitService.ts         # Git API wrapper
├── scorer/
│   └── scorer.ts             # Weighted signal scoring
├── utils/
│   └── patterns.ts           # All regex patterns and classification rules
├── types.ts                  # Shared TypeScript interfaces
└── extension.ts              # Extension entry point
```

---

## Limitations

- Heuristic-based — not an AI model. The generated message is a strong starting point, not a guarantee.
- Large, mixed commits (many unrelated files) may produce a more generic summary.
- Binary files are classified by path and metadata only (no diff content available).
- Always review the message before committing — one quick read is all it takes.

---

## Contributing

Contributions, issues, and feature requests are welcome.

- [Open an issue](https://github.com/itrabbi24/Git_Message_Generator/issues)
- [Submit a pull request](https://github.com/itrabbi24/Git_Message_Generator/pulls)
- [Read CONTRIBUTING.md](./CONTRIBUTING.md)
- [Code of Conduct](./CODE_OF_CONDUCT.md)

---

## License

Released under the [MIT License](./LICENSE).

---

<div align="center">

Developed by **ARG RABBI** · [itrabbi24.github.io](https://itrabbi24.github.io/) · [GitHub](https://github.com/itrabbi24/Git_Message_Generator) · [Marketplace](https://marketplace.visualstudio.com/items?itemName=ARGRABBI.git-message-generator-by-arg-rabbi)

</div>
