import { isDependencyFile, isLockFile, MEANINGFUL_DIRS } from "../utils/patterns";

function normalizePath(filePath: string): string {
  return filePath.replace(/\\/g, "/");
}

function collectScopeCounts(filePaths: string[], extractor: (filePath: string) => string | null): Map<string, number> {
  const counts = new Map<string, number>();
  for (const filePath of filePaths) {
    const scope = extractor(filePath);
    if (!scope) {
      continue;
    }
    counts.set(scope, (counts.get(scope) ?? 0) + 1);
  }
  return counts;
}

function chooseScope(counts: Map<string, number>, allowMultiScope = true): string | null {
  if (counts.size === 0) {
    return null;
  }
  if (counts.size === 1) {
    return [...counts.keys()][0];
  }

  const sorted = [...counts.entries()].sort((a, b) => b[1] - a[1]);
  const total = sorted.reduce((sum, [, count]) => sum + count, 0);
  const [topScope, topCount] = sorted[0];

  if (topCount / total >= 0.6) {
    return topScope;
  }
  if (allowMultiScope && counts.size <= 3) {
    return sorted.map(([scope]) => scope).sort().join(",");
  }
  return null;
}

function mergeCounts(target: Map<string, number>, source: Map<string, number>, weight = 1): void {
  for (const [scope, count] of source.entries()) {
    target.set(scope, (target.get(scope) ?? 0) + count * weight);
  }
}

export interface ScopeDetectionOptions {
  scopeMapping?: Record<string, string>;
  isDepsOnly?: boolean;
}

export function detectScopeFromPaths(filePaths: string[], options: ScopeDetectionOptions = {}): string | null {
  const { isDepsOnly = false, scopeMapping = {} } = options;

  if (isDepsOnly && filePaths.length > 0) {
    return "deps";
  }

  if (
    filePaths.length > 0 &&
    filePaths.every((p) => {
      const name = normalizePath(p).split("/").pop()?.toLowerCase() ?? "";
      return isDependencyFile(name) || isLockFile(name);
    })
  ) {
    return "deps";
  }

  const normalizedPaths = filePaths.map(normalizePath);

  for (const [prefix, scope] of Object.entries(scopeMapping)) {
    // Explicit user mapping always wins to keep behavior predictable.
    if (normalizedPaths.some((filePath) => filePath.startsWith(normalizePath(prefix)))) {
      return scope.toLowerCase();
    }
  }

  const weightedCounts = new Map<string, number>();

  // Monorepo package/app scopes are usually strongest ownership signals.
  for (const root of ["packages/", "apps/", "libs/", "modules/", "services/"]) {
    const counts = collectScopeCounts(normalizedPaths, (filePath) => {
      if (!filePath.startsWith(root)) {
        return null;
      }
      const scope = filePath.slice(root.length).split("/")[0];
      return scope ? scope.toLowerCase() : null;
    });
    mergeCounts(weightedCounts, counts, 2);
  }

  const srcCounts = collectScopeCounts(normalizedPaths, (filePath) => {
    if (!filePath.startsWith("src/")) {
      return null;
    }
    const scope = filePath.slice("src/".length).split("/")[0];
    return scope ? scope.toLowerCase() : null;
  });
  mergeCounts(weightedCounts, srcCounts, 1.5);

  const componentCounts = collectScopeCounts(normalizedPaths, (filePath) => {
    const match = filePath.match(/^(?:src\/)?components\/([^/]+)\//);
    return match?.[1] ? match[1].toLowerCase() : null;
  });
  mergeCounts(weightedCounts, componentCounts, 1.5);

  const weightedScope = chooseScope(weightedCounts, false);
  if (weightedScope) {
    return weightedScope;
  }

  // Final fallback: meaningful directory names if weighted inference is inconclusive.
  const meaningfulCounts = new Map<string, number>();
  for (const filePath of normalizedPaths) {
    for (const part of filePath.split("/")) {
      if (MEANINGFUL_DIRS.includes(part.toLowerCase())) {
        const scope = part.toLowerCase();
        meaningfulCounts.set(scope, (meaningfulCounts.get(scope) ?? 0) + 1);
        break;
      }
    }
  }

  return chooseScope(meaningfulCounts, false);
}
