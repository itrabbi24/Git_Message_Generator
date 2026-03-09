# Git Message Generator By ARG RABBI

![Git Message Generator By ARG RABBI](./assets/logo.png)

Generate conventional commit messages inside VS Code from staged Git changes using a rule-based engine built for real projects, including GitHub-hosted repositories cloned locally.

## Overview

`Git Message Generator By ARG RABBI` analyzes staged diffs and suggests a conventional commit message directly in the Source Control input box. Instead of asking the user to choose a commit type manually, the extension combines:

- file-path classification
- diff-content heuristics
- staged Git metadata
- scope detection from folder structure

The goal is to produce a solid first commit message automatically, while still keeping the workflow local, transparent, and fast.

## Features

- Generates commit messages from staged changes
- Supports conventional commit types such as `feat`, `fix`, `docs`, `refactor`, `perf`, `test`, `build`, `ci`, and `chore`
- Reads staged changes through the built-in VS Code Git extension API
- Detects likely scope values from folder structure
- Adds a Source Control action button for one-click generation
- Works with Git repositories, including repositories hosted on GitHub
- Provides configurable scope mapping, type overrides, header length, and confidence display

## Example Output

```text
feat(auth): add login validation
fix(api): handle null token response
docs: update installation instructions
ci: add automated testing workflow
refactor(utils): simplify date formatting
```

## How It Works

The extension uses a three-layer scoring pipeline:

1. File path rules
   Paths like `README.md`, `.github/workflows/test.yml`, `src/auth/login.ts`, or `__tests__/user.test.ts` provide strong structural signals.
2. Diff content analysis
   Added and removed lines are inspected for patterns that suggest a bug fix, new feature, performance improvement, refactor, or style-only change.
3. Metadata analysis
   File status like add, delete, or rename contributes additional signals.

The collected signals are combined with a weighted scoring system and then resolved into a single conventional commit type.

## Installation

### From VSIX

1. Open VS Code.
2. Open the Extensions view.
3. Open the top-right menu.
4. Choose `Install from VSIX...`.
5. Select the generated `.vsix` package from this project.

### From Source

```bash
npm install
npm run build
```

Then press `F5` in VS Code to launch an Extension Development Host.

## Usage

1. Open a Git repository in VS Code.
2. Stage the files you want to commit.
3. Open the Source Control panel.
4. Click `Generate Git Message`.
5. Review the generated commit message in the commit input box.
6. Edit it if needed and commit normally.

## Command

| Command | Title |
|---|---|
| `commitGen.generate` | `Generate Git Message` |

## Configuration

The extension contributes the following settings:

### `commitGen.maxHeaderLength`

- Type: `number`
- Default: `72`
- Controls the maximum generated conventional commit header length.

### `commitGen.scopeMapping`

- Type: `object`
- Default: `{}`
- Maps path prefixes to scopes.

Example:

```json
{
  "commitGen.scopeMapping": {
    "src/payments/": "payments",
    "src/auth/": "auth"
  }
}
```

### `commitGen.typeOverrides`

- Type: `object`
- Default: `{}`
- Forces a conventional commit type for matching paths.

Example:

```json
{
  "commitGen.typeOverrides": {
    "migrations/": "feat",
    "scripts/": "chore"
  }
}
```

### `commitGen.showConfidence`

- Type: `boolean`
- Default: `true`
- Shows a notification with the generated message confidence after generation.

## Detection Examples

### New feature

Staged file:

```diff
+ export function createAccount() {
+   ...
+ }
```

Possible output:

```text
feat(auth): add createAccount
```

### Bug fix

Staged change:

```diff
+ if (!decoded) {
+   throw new Error("Invalid token");
+ }
```

Possible output:

```text
fix(auth): handle invalid token
```

### Documentation update

Staged file:

```diff
- Run npm install
+ Run npm install with Node.js 18 or newer
```

Possible output:

```text
docs: update installation instructions
```

## Project Structure

```text
src/
  analyzer/
  config/
  generator/
  git/
  scorer/
  utils/
assets/
package.json
tsconfig.json
```

## Development

```bash
npm install
npm run build
```

Open the project in VS Code and press `F5`.

### Package the extension

```bash
npm run package
```

## Open Source

This project is intended to be maintained as an open-source VS Code extension. Issues, pull requests, bug reports, and suggestions are welcome.

See:

- [CONTRIBUTING.md](./CONTRIBUTING.md)
- [CHANGELOG.md](./CHANGELOG.md)
- [CODE_OF_CONDUCT.md](./CODE_OF_CONDUCT.md)
- [LICENSE](./LICENSE)

## Limitations

- The generator is heuristic-based, not model-based
- Large mixed commits may produce generic summaries
- Binary files are classified mostly by path and metadata
- The generated message should still be reviewed before committing

## Roadmap

- Better description generation from hunk context
- Support for richer dependency-change detection
- Improved handling for large mixed commits
- Expanded tests and packaging metadata

## License

Released under the MIT License.

## Developer

Developed by `ARG RABBY`  
Website: `https://itrabbi24.github.io/`
