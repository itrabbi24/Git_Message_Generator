import { getCommitGenConfig } from "../config/configuration";
import { MEANINGFUL_DIRS } from "../utils/patterns";

function normalizePath(filePath: string): string {
  return filePath.replace(/\\/g, "/");
}

function collectScopes(filePaths: string[], prefix: string): Set<string> {
  const scopes = new Set<string>();
  for (const filePath of filePaths) {
    const normalized = normalizePath(filePath);
    if (normalized.startsWith(prefix)) {
      const parts = normalized.slice(prefix.length).split("/");
      if (parts[0]) {
        scopes.add(parts[0].toLowerCase());
      }
    }
  }
  return scopes;
}

export function detectScope(filePaths: string[]): string | null {
  const config = getCommitGenConfig();
  const normalizedPaths = filePaths.map(normalizePath);

  for (const [prefix, scope] of Object.entries(config.scopeMapping)) {
    if (normalizedPaths.some((filePath) => filePath.startsWith(normalizePath(prefix)))) {
      return scope.toLowerCase();
    }
  }

  for (const root of ["packages/", "apps/", "libs/", "modules/", "services/"]) {
    const scopes = collectScopes(normalizedPaths, root);
    if (scopes.size === 1) {
      return [...scopes][0];
    }
    if (scopes.size > 1 && scopes.size <= 3) {
      return [...scopes].sort().join(",");
    }
  }

  const srcScopes = collectScopes(normalizedPaths, "src/");
  if (srcScopes.size === 1) {
    return [...srcScopes][0];
  }

  const componentScopes = new Set<string>();
  for (const filePath of normalizedPaths) {
    const match = filePath.match(/^(?:src\/)?components\/([^/]+)\//);
    if (match?.[1]) {
      componentScopes.add(match[1].toLowerCase());
    }
  }
  if (componentScopes.size === 1) {
    return [...componentScopes][0];
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
