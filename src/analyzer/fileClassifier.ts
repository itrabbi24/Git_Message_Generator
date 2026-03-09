import { getCommitGenConfig } from "../config/configuration";
import { CommitType, Signal } from "../types";
import { FILE_RULES } from "../utils/patterns";

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

  return null;
}

export function defaultSourceType(): CommitType {
  return "feat";
}
