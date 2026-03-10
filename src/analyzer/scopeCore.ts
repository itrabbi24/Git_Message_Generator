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

function chooseScope(counts: Map<string, number>): string | null {
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
  if (counts.size <= 3) {
    return sorted.map(([scope]) => scope).sort().join(",");
  }
  return null;
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
    if (normalizedPaths.some((filePath) => filePath.startsWith(normalizePath(prefix)))) {
      return scope.toLowerCase();
    }
  }

  for (const root of ["packages/", "apps/", "libs/", "modules/", "services/"]) {
    const counts = collectScopeCounts(normalizedPaths, (filePath) => {
      if (!filePath.startsWith(root)) {
        return null;
      }
      const scope = filePath.slice(root.length).split("/")[0];
      return scope ? scope.toLowerCase() : null;
    });
    const selected = chooseScope(counts);
    if (selected) {
      return selected;
    }
  }

  const srcCounts = collectScopeCounts(normalizedPaths, (filePath) => {
    if (!filePath.startsWith("src/")) {
      return null;
    }
    const scope = filePath.slice("src/".length).split("/")[0];
    return scope ? scope.toLowerCase() : null;
  });
  const srcScope = chooseScope(srcCounts);
  if (srcScope) {
    return srcScope;
  }

  const componentCounts = collectScopeCounts(normalizedPaths, (filePath) => {
    const match = filePath.match(/^(?:src\/)?components\/([^/]+)\//);
    return match?.[1] ? match[1].toLowerCase() : null;
  });
  const componentScope = chooseScope(componentCounts);
  if (componentScope) {
    return componentScope;
  }

  for (const filePath of normalizedPaths) {
    for (const part of filePath.split("/")) {
      if (MEANINGFUL_DIRS.includes(part.toLowerCase())) {
        return part.toLowerCase();
      }
    }
  }

  return null;
}
