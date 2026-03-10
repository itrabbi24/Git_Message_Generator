import { getCommitGenConfig } from "../config/configuration";
import { detectScopeFromPaths } from "./scopeCore";

export function detectScope(filePaths: string[], isDepsOnly = false): string | null {
  const config = getCommitGenConfig();
  return detectScopeFromPaths(filePaths, {
    isDepsOnly,
    scopeMapping: config.scopeMapping
  });
}
