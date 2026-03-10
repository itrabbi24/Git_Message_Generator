import { CommitType } from "../types";

export const TYPE_PRIORITY: CommitType[] = [
  "revert",
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

export const SOURCE_CODE_EXTENSIONS = new Set([
  ".ts",
  ".tsx",
  ".js",
  ".jsx",
  ".mjs",
  ".cjs",
  ".py",
  ".go",
  ".java",
  ".cs",
  ".rs",
  ".php",
  ".rb",
  ".swift",
  ".kt",
  ".cpp",
  ".c",
  ".h",
  ".vue",
  ".svelte"
]);

export const DEPENDENCY_FILE_NAMES = new Set([
  "package.json",
  "package-lock.json",
  "yarn.lock",
  "pnpm-lock.yaml",
  "npm-shrinkwrap.json",
  "requirements.txt",
  "requirements-dev.txt",
  "poetry.lock",
  "pyproject.toml",
  "pipfile",
  "pipfile.lock",
  "composer.json",
  "composer.lock",
  "go.mod",
  "go.sum",
  "cargo.toml",
  "cargo.lock",
  "pom.xml",
  "build.gradle",
  "build.gradle.kts",
  "gemfile",
  "gemfile.lock"
]);

export const LOCK_FILE_NAMES = new Set([
  "package-lock.json",
  "yarn.lock",
  "pnpm-lock.yaml",
  "npm-shrinkwrap.json",
  "poetry.lock",
  "pipfile.lock",
  "composer.lock",
  "go.sum",
  "cargo.lock",
  "gemfile.lock"
]);

export const MIGRATION_PATH_PATTERNS: RegExp[] = [
  /\/migrations?\//,
  /\/db\/migrate\//,
  /\/database\/migrations?\//,
  /migration\.[a-z0-9]+$/i,
  /schema\.(sql|prisma|graphql)$/i
];

export const FILE_RULES: Array<{ type: CommitType; patterns: RegExp[] }> = [
  {
    type: "test",
    patterns: [
      /\.(test|spec)\.(ts|tsx|js|jsx|mjs|py|go)$/,
      /(_test)\.(go|py|rs)$/,
      /\.mock\.(ts|tsx|js|jsx)$/,
      /\/__tests__\//,
      /\/test\//,
      /\/tests\//,
      /\/spec\//,
      /\/cypress\//,
      /\/e2e\//,
      /\/__snapshots__\//,
      /\/__mocks__\//,
      /\/__fixtures__\//,
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
      /\.azure-pipelines\//,
      /Jenkinsfile/,
      /\.travis\.yml$/,
      /\.gitlab-ci\.yml$/,
      /codecov\.yml$/,
      /azure-pipelines\.yml$/,
      /\.drone\.yml$/,
      /bitbucket-pipelines\.yml$/
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
      /^SECURITY/i,
      /^CODE_OF_CONDUCT/i,
      /^docs?\//,
      /^guides?\//,
      /^wiki\//,
      /\/docs?\//,
      /\/wiki\//,
      /\/guides?\//
    ]
  },
  {
    type: "build",
    patterns: [
      /webpack\.config/,
      /rollup\.config/,
      /vite\.config/,
      /esbuild\.config/,
      /turbo\.json$/,
      /nx\.json$/,
      /Dockerfile/,
      /docker-compose/,
      /Makefile$/,
      /\.mk$/,
      /\/kubernetes\//,
      /\/k8s\//,
      /\/helm\//,
      /\/terraform\//,
      /\.tf$/,
      /\.tfvars$/,
      /helmfile/,
      /^package\.json$/,
      /^package-lock\.json$/,
      /^yarn\.lock$/,
      /^pnpm-lock\.yaml$/,
      /^requirements\.txt$/,
      /^Cargo\.toml$/,
      /^go\.mod$/,
      /^pom\.xml$/,
      /^build\.gradle(\.kts)?$/,
      /^pyproject\.toml$/,
      /^poetry\.lock$/
    ]
  },
  {
    type: "style",
    patterns: [
      /\.(css|scss|sass|less|styl)$/,
      /\.styled\.(ts|tsx|js|jsx)$/,
      /\.module\.(css|scss|less)$/,
      /postcss\.config/,
      /tailwind\.config/,
      /\.theme\.(ts|js)$/,
      /\/themes?\//,
      /\/styles?\//
    ]
  },
  {
    type: "chore",
    patterns: [
      /\.(editorconfig|gitignore|gitattributes|npmrc|nvmrc|prettierrc|eslintrc)/,
      /tsconfig.*\.json$/,
      /jsconfig.*\.json$/,
      /\.env/,
      /\.husky\//,
      /\.changeset\//,
      /commitlint\.config/,
      /release\.config/,
      /lerna\.json$/,
      /\.babelrc/,
      /babel\.config/
    ]
  }
];

export const FIX_PATTERNS: RegExp[] = [
  /^\+.*\?\./,                                              // Optional chaining
  /^\+.*!==?\s*(null|undefined)/,                          // Null/undefined check
  /^\+.*===?\s*(null|undefined)/,                          // Null/undefined equality
  /^\+.*\?\?\s/,                                           // Nullish coalescing
  /^\+.*try\s*\{/,                                         // Try block added
  /^\+.*catch\s*\(/,                                       // Catch block added
  /^\+.*\.catch\(/,                                        // Promise catch
  /^\+.*if\s*\(!.*\)\s*(return|throw)/,                    // Guard clause
  /^\+.*\|\|\s*['"`]/,                                     // Fallback value
  /^\+.*typeof\s+\w+\s*[!=]==?\s*['"]undefined/,           // Typeof guard
  /^\+.*(validate|sanitize|escape|verify)\b/i,             // Validation
  /^\+.*(retry|backoff|fallback)\b/i,                      // Resilience
  /^\+.*(timeout|abortcontroller|AbortController)\b/i,     // Timeout handling
  /^\+.*(instanceof\s+Error|new\s+\w*Error)/               // Error instance check
];

export const FEAT_PATTERNS: RegExp[] = [
  /^\+\s*(export\s+)?(async\s+)?function\s+\w+/,           // New function
  /^\+\s*(export\s+)?(default\s+)?class\s+\w+/,            // New class
  /^\+\s*export\s+(default\s+)?(const|function|class)/,    // New export
  /^\+.*\.(get|post|put|patch|delete)\s*\(['"]/,            // REST route
  /^\+.*@(Get|Post|Put|Patch|Delete|Route)\(/,             // Decorator route
  /^\+\s*(export\s+)?const\s+[A-Z]\w+.*[:=]\s*(React\.)?FC/, // React component
  /^\+.*(create|register|subscribe|publish)\b/i,           // Creation/registration
  /^\+.*(feature flag|toggle|featureFlag)\b/i,             // Feature flags
  /^\+\s*(export\s+)?interface\s+\w+/,                     // New interface
  /^\+\s*(export\s+)?type\s+\w+\s*=/,                      // New type alias
  /^\+\s*(export\s+)?enum\s+\w+/                           // New enum
];

export const PERF_PATTERNS: RegExp[] = [
  /^\+.*(useMemo|useCallback|React\.memo)\(/,              // React memoization
  /^\+.*memoize\(/,                                        // Generic memoize
  /^\+.*\bcache\b/i,                                       // Caching
  /^\+.*(debounce|throttle)\(/,                            // Rate limiting
  /^\+.*React\.lazy\(/,                                    // Lazy loading
  /^\+.*import\s*\(\s*['"]/,                               // Dynamic import
  /^\+.*(WeakMap|WeakRef|Map\(\)|Set\(\))/,                // Optimized data structures
  /^\+.*(batch|chunk|paginate|virtuali[zs]e)\b/i,          // Batching/pagination
  /^\+.*\.worker\b/i,                                      // Web worker
  /^\+.*requestIdleCallback|requestAnimationFrame/         // Browser scheduling
];

export const REFACTOR_PATTERNS: RegExp[] = [
  /^\+.*\b(extract|rename|restructure|cleanup|simplify)\b/i,
  /^-.*\b(extract|rename|restructure|cleanup|simplify)\b/i
];

export const TEST_PATTERNS: RegExp[] = [
  /^\+.*\b(describe|it|test|expect|assert|beforeEach|afterEach|beforeAll|afterAll)\s*\(/
];

export const SECURITY_PATTERNS: RegExp[] = [
  /^\+.*\b(csrf|xss|sanitize|escape|helmet|rateLimit|authorize|permission)\b/i,
  /^\+.*\b(jwt\.verify|bcrypt|argon2|crypto\.)\b/i
];

export const REVERT_PATTERNS: RegExp[] = [
  /^\+.*This reverts commit/i,    // git revert generated message in code
  /revert\s+["'].+["']/i          // Revert description pattern
];

export const BINARY_EXTENSIONS = new Set([
  ".png",
  ".jpg",
  ".jpeg",
  ".gif",
  ".svg",
  ".ico",
  ".webp",
  ".woff",
  ".woff2",
  ".ttf",
  ".eot",
  ".otf",
  ".pdf",
  ".sqlite",
  ".db",
  ".mp3",
  ".mp4",
  ".wav",
  ".ogg",
  ".zip",
  ".tar",
  ".gz",
  ".rar",
  ".7z"
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
  "ui",
  "lib",
  "common",
  "features",
  "pages",
  "components",
  "layouts",
  "context",
  "reducers",
  "actions",
  "selectors",
  "schemas",
  "validators",
  "formatters",
  "parsers",
  "adapters",
  "clients",
  "providers",
  "repositories",
  "handlers",
  "workers",
  "tasks",
  "jobs",
  "events",
  "notifications"
];

function normalizePath(filePath: string): string {
  return filePath.replace(/\\/g, "/");
}

function lowerFileName(filePath: string): string {
  const normalized = normalizePath(filePath).toLowerCase();
  const parts = normalized.split("/");
  return parts[parts.length - 1];
}

function matchesRuleType(type: CommitType, filePath: string): boolean {
  const normalized = normalizePath(filePath);
  const rule = FILE_RULES.find((entry) => entry.type === type);
  return rule ? rule.patterns.some((pattern) => pattern.test(normalized)) : false;
}

export function isDependencyFile(filePath: string): boolean {
  const fileName = lowerFileName(filePath);
  return DEPENDENCY_FILE_NAMES.has(fileName);
}

export function isLockFile(filePath: string): boolean {
  const fileName = lowerFileName(filePath);
  return LOCK_FILE_NAMES.has(fileName);
}

export function isMigrationFile(filePath: string): boolean {
  const normalized = normalizePath(filePath);
  return MIGRATION_PATH_PATTERNS.some((pattern) => pattern.test(normalized));
}

export function isSourceCodeFile(filePath: string): boolean {
  const normalized = normalizePath(filePath).toLowerCase();
  const dot = normalized.lastIndexOf(".");
  if (dot < 0) {
    return false;
  }
  const ext = normalized.slice(dot);
  return SOURCE_CODE_EXTENSIONS.has(ext);
}

export function isDocsFile(filePath: string): boolean {
  return matchesRuleType("docs", filePath);
}

export function isTestFile(filePath: string): boolean {
  return matchesRuleType("test", filePath);
}

export function isCiFile(filePath: string): boolean {
  return matchesRuleType("ci", filePath);
}

export function isBuildFile(filePath: string): boolean {
  return matchesRuleType("build", filePath);
}

export function isStyleFile(filePath: string): boolean {
  return matchesRuleType("style", filePath);
}

export function isChoreFile(filePath: string): boolean {
  return matchesRuleType("chore", filePath);
}

export function isBinaryFile(filePath: string): boolean {
  const normalized = normalizePath(filePath).toLowerCase();
  const dot = normalized.lastIndexOf(".");
  if (dot < 0) {
    return false;
  }
  return BINARY_EXTENSIONS.has(normalized.slice(dot));
}
