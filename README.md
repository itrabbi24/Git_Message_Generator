<div align="center">

# Git Message Generator By ARG RABBI

Automatic conventional commit messages inside VS Code.

[![Version](https://img.shields.io/badge/version-v0.1.1-blue?style=flat-square)](./CHANGELOG.md)
[![VS Code Marketplace](https://img.shields.io/visual-studio-marketplace/v/argrabbi.git-message-generator-by-arg-rabbi?label=Marketplace&color=0078d7&style=flat-square)](https://marketplace.visualstudio.com/items?itemName=ARGRABBI.git-message-generator-by-arg-rabbi)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg?style=flat-square)](./LICENSE)

[Install from Marketplace](https://marketplace.visualstudio.com/items?itemName=ARGRABBI.git-message-generator-by-arg-rabbi)

</div>

## Overview

This extension analyzes your Git diff and generates a Conventional Commits message in the Source Control input box.

Highlights:
- Fully local: no network calls, no API keys.
- Multi-signal scoring from path, diff content, and metadata.
- Supports `feat`, `fix`, `docs`, `style`, `refactor`, `perf`, `test`, `build`, `ci`, `chore`, `revert`.
- Optional multi-line commit body with per-file context.

## Usage

1. Open a Git repository in VS Code.
2. Stage files (or keep unstaged files if fallback is enabled).
3. Open Source Control.
4. Run `Generate Git Message`.
5. Review and commit.

## Configuration

| Setting | Type | Default | Description |
|---|---|---|---|
| `commitGen.maxHeaderLength` | number | `72` | Maximum commit header length |
| `commitGen.maxAnalyzedLinesPerFile` | number | `1200` | Per-file diff line cap kept in memory for analysis |
| `commitGen.maxContextsPerFile` | number | `12` | Max extracted contexts (function/class names) per file |
| `commitGen.scopeMapping` | object | `{}` | Path prefix to scope mapping |
| `commitGen.typeOverrides` | object | `{}` | Force commit type for matching prefixes |
| `commitGen.showConfidence` | boolean | `true` | Show confidence notification |
| `commitGen.includeWorkingTreeWhenNoStaged` | boolean | `true` | Fallback to unstaged changes |
| `commitGen.includeBody` | boolean | `true` | Include multi-line body |

Example:

```json
{
  "commitGen.scopeMapping": {
    "src/payments/": "payments"
  },
  "commitGen.typeOverrides": {
    "scripts/deploy/": "ci"
  }
}
```

## Development

```bash
npm install
npm run lint
npm run typecheck
npm run test
npm run build
```

Run extension locally:
- Open project in VS Code.
- Press `F5` to launch Extension Development Host.

## CI

GitHub Actions workflow validates:
- lint
- typecheck
- build
- tests
- package check (`vsce package`)

## Project Structure

```text
src/
  analyzer/
  config/
  generator/
  git/
  scorer/
  utils/
  extension.ts
test/
  *.test.ts
```

## License

MIT
