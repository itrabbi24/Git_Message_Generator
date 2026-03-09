import { CommitType } from "../types";

export const TYPE_PRIORITY: CommitType[] = [
  "test",
  "ci",
  "docs",
  "build",
  "style",
  "perf",
  "fix",
  "refactor",
  "feat",
  "chore"
];

export const FILE_RULES: Array<{ type: CommitType; patterns: RegExp[] }> = [
  {
    type: "test",
    patterns: [
      /\.(test|spec)\.(ts|tsx|js|jsx|mjs|py|go)$/,
      /\/__tests__\//,
      /\/test\//,
      /\/tests\//,
      /\/spec\//,
      /\/cypress\//,
      /\/e2e\//,
      /\.(mock|stub|fake)\./,
      /jest\.config/,
      /vitest\.config/,
      /playwright\.config/
    ]
  },
  {
    type: "ci",
    patterns: [
      /\.github\/workflows\//,
      /\.circleci\//,
      /\.buildkite\//,
      /Jenkinsfile/,
      /\.travis\.yml$/,
      /\.gitlab-ci\.yml$/,
      /codecov\.yml$/,
      /azure-pipelines\.yml$/
    ]
  },
  {
    type: "docs",
    patterns: [
      /\.mdx?$/,
      /\.rst$/,
      /\.adoc$/,
      /^README/i,
      /^CHANGELOG/i,
      /^LICENSE/i,
      /^CONTRIBUTING/i,
      /^docs?\//,
      /^guides?\//
    ]
  },
  {
    type: "build",
    patterns: [
      /webpack\.config/,
      /rollup\.config/,
      /vite\.config/,
      /esbuild\.config/,
      /Dockerfile/,
      /docker-compose/,
      /Makefile$/,
      /^package\.json$/,
      /^package-lock\.json$/,
      /^yarn\.lock$/,
      /^pnpm-lock\.yaml$/,
      /^requirements\.txt$/,
      /^Cargo\.toml$/,
      /^go\.mod$/
    ]
  },
  {
    type: "style",
    patterns: [
      /\.(css|scss|sass|less|styl)$/,
      /\.styled\.(ts|js)$/,
      /\.module\.css$/,
      /postcss\.config/,
      /tailwind\.config/
    ]
  },
  {
    type: "chore",
    patterns: [
      /\.(editorconfig|gitignore|npmrc|nvmrc|prettierrc|eslintrc)/,
      /tsconfig.*\.json$/,
      /\.env/,
      /\.husky\//
    ]
  }
];

export const FIX_PATTERNS: RegExp[] = [
  /^\+.*\?\./,
  /^\+.*!==?\s*(null|undefined)/,
  /^\+.*\?\?\s/,
  /^\+.*try\s*\{/,
  /^\+.*catch\s*\(/,
  /^\+.*\.catch\(/,
  /^\+.*if\s*\(!.*\)\s*(return|throw)/,
  /^\+.*\|\|\s*['"`]/,
  /^\+.*typeof\s+\w+\s*[!=]==?\s*['"]undefined/
];

export const FEAT_PATTERNS: RegExp[] = [
  /^\+\s*(export\s+)?(async\s+)?function\s+\w+/,
  /^\+\s*(export\s+)?(default\s+)?class\s+\w+/,
  /^\+\s*export\s+(default\s+)?(const|function|class)/,
  /^\+.*\.(get|post|put|patch|delete)\s*\(['"]/,
  /^\+.*@(Get|Post|Put|Patch|Delete|Route)\(/,
  /^\+\s*(export\s+)?const\s+[A-Z]\w+.*[:=]\s*(React\.)?FC/
];

export const PERF_PATTERNS: RegExp[] = [
  /^\+.*(useMemo|useCallback|React\.memo)\(/,
  /^\+.*memoize\(/,
  /^\+.*\bcache\b/i,
  /^\+.*(debounce|throttle)\(/,
  /^\+.*React\.lazy\(/,
  /^\+.*import\s*\(\s*['"]/,
  /^\+.*(WeakMap|WeakRef|Map\(\)|Set\(\))/
];

export const BINARY_EXTENSIONS = new Set([
  ".png",
  ".jpg",
  ".jpeg",
  ".gif",
  ".svg",
  ".woff",
  ".woff2",
  ".ttf",
  ".pdf",
  ".sqlite",
  ".ico"
]);

export const MEANINGFUL_DIRS = [
  "api",
  "auth",
  "core",
  "shared",
  "utils",
  "config",
  "models",
  "views",
  "controllers",
  "routes",
  "middleware",
  "hooks",
  "store",
  "services",
  "helpers",
  "types",
  "ui"
];
