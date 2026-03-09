import { getCommitGenConfig } from "../config/configuration";
import { CommitType, Signal } from "../types";
import { FILE_RULES, isDependencyFile, isMigrationFile, isSourceCodeFile } from "../utils/patterns";

function normalizePath(filePath: string): string {
  return filePath.replace(/\\/g, "/");
}

export function classifyByPath(filePath: string): Signal | null {
  const normalized = normalizePath(filePath);
  const config = getCommitGenConfig();

  for (const [prefix, type] of Object.entries(config.typeOverrides)) {
    if (normalized.startsWith(normalizePath(prefix))) {
      return {
        type,
        source: "filepath",
        weight: 0.95,
        reason: `custom override matched ${prefix}`
      };
    }
  }

  if (isDependencyFile(normalized)) {
    return {
      type: "build",
      source: "filepath",
      weight: 0.9,
      reason: "dependency manifest changed"
    };
  }

  if (isMigrationFile(normalized)) {
    return {
      type: "feat",
      source: "filepath",
      weight: 0.75,
      reason: "migration or schema path matched"
    };
  }

  for (const rule of FILE_RULES) {
    if (rule.patterns.some((pattern) => pattern.test(normalized))) {
      return {
        type: rule.type,
        source: "filepath",
        weight: 0.85,
        reason: `${rule.type} path pattern matched`
      };
    }
  }

  if (isSourceCodeFile(normalized)) {
    return {
      type: "feat",
      source: "filepath",
      weight: 0.35,
      reason: "source file changed"
    };
  }

  return null;
}

export function defaultSourceType(): CommitType {
  return "feat";
}
